require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const { getAccessToken } = require('./oauthTokenService');
const dbPromise = require('./db');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function mapPaymentStatus(apiData) {
  if (apiData?.Success === true) {
    return 'AUTHORIZED';
  }

  const reason = String(apiData?.Reason || '').toLowerCase();
  const error = String(apiData?.Error || '').toLowerCase();

  if (reason.includes('insufficient')) {
    return 'FAILED_INSUFFICIENT_FUNDS';
  }

  if (reason.includes('incorrect') || reason.includes('invalid')) {
    return 'FAILED_INVALID_CARD';
  }

  if (error || reason.includes('server')) {
    return 'FAILED_SYSTEM_ERROR';
  }

  return 'FAILED';
}

app.get('/api/health', async (req, res) => {
  try {
    await dbPromise;

    res.json({
      ok: true,
      message: 'Server is running',
      databaseType: 'SQLite',
      databaseFile: 'data/capstone_payments.db'
    });
  } catch (err) {
    console.error('Error in /api/health:', err);

    res.status(500).json({
      ok: false,
      message: 'Database not initialized'
    });
  }
});

app.get('/api/authorizations', async (req, res) => {
  try {
    console.log('--- /api/authorizations called ---');
    const db = await dbPromise;

    const rows = await db.all(
      `SELECT *
       FROM authorizations
       ORDER BY id DESC
       LIMIT 50`
    );

    console.log('Fetched rows count:', rows.length);
    res.json({ success: true, rows });
  } catch (err) {
    console.error('Error in /api/authorizations:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching authorizations'
    });
  }
});

app.post('/api/authorize', async (req, res) => {
  try {
    console.log('--- /api/authorize called ---');
    console.log('Request body:', req.body);

    const {
      orderId,
      productId,
      productName,
      amount,
      cardNumber,
      expiryDate,
      zip,
      firstName,
      lastName,
      address,
      cvv
    } = req.body;

    if (!orderId || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'orderId and amount are required'
      });
    }

    if (!productId || !productName) {
      return res.status(400).json({
        success: false,
        message: 'productId and productName are required'
      });
    }

    const requestedAmount = Number(amount);

    if (!Number.isFinite(requestedAmount) || requestedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a valid non-negative number'
      });
    }

    const db = await dbPromise;
    const transactionDate = new Date().toISOString();

    const accessToken = await getAccessToken();

    const [cardMonthRaw, cardYearRaw] = String(expiryDate || '').split('/');
    const cardMonth = cardMonthRaw || '';
    const cardYear = cardYearRaw ? `20${cardYearRaw}` : '';

    const authorizePayload = {
      OrderId: orderId,
      CardDetails: {
        CardNumber: cardNumber,
        CardMonth: cardMonth,
        CardYear: cardYear,
        CCV: cvv || '111'
      },
      RequestedAmount: requestedAmount
    };

    console.log('Authorize payload:', authorizePayload);

    let apiData;

    try {
      const response = await axios.post(
        process.env.AUTHORIZE_URL,
        authorizePayload,
        {
          headers: {
            Authorization: accessToken,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      apiData = response.data;
      console.log('Authorize response:', apiData);
    } catch (err) {
      if (err.response) {
        console.log('Authorize error response:', err.response.data);
        apiData = err.response.data;
      } else {
        throw err;
      }
    }

    const paymentStatus = mapPaymentStatus(apiData);
    const returnedToken = apiData?.AuthorizationToken || 'no_token';
    const returnedAmount = Number(apiData?.AuthorizedAmount ?? 0);

    const finalStoredAmount =
      apiData?.Success === true
        ? (Number.isFinite(returnedAmount) ? returnedAmount : requestedAmount)
        : 0;

    const authorizationExpiration =
      apiData?.TokenExpirationDate !== undefined && apiData?.TokenExpirationDate !== null
        ? String(apiData.TokenExpirationDate)
        : null;

    const concatenatedToken = `${orderId}_${returnedToken}`;

    console.log('About to insert row into authorizations:', {
      orderId,
      productId,
      productName,
      transactionDate,
      authorizationAmount: finalStoredAmount,
      authorizationExpiration,
      authorizationToken: concatenatedToken,
      paymentStatus
    });

    const result = await db.run(
      `INSERT INTO authorizations (
        order_id,
        product_id,
        product_name,
        transaction_datetime,
        authorization_amount,
        authorization_expiration,
        authorization_token,
        payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        productId,
        productName,
        transactionDate,
        finalStoredAmount,
        authorizationExpiration,
        concatenatedToken,
        paymentStatus
      ]
    );

    console.log('Insert result from SQLite:', result);

    return res.json({
      success: true,
      orderId,
      productId,
      productName,
      paymentStatus,
      authorizationAmount: finalStoredAmount,
      authorizationToken: concatenatedToken,
      authorizationExpiration,
      message: apiData?.Reason || apiData?.Error || ''
    });
  } catch (err) {
    console.error('Error in /api/authorize:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/settle', async (req, res) => {
  try {
    console.log('--- /api/settle called ---');
    console.log('Settlement request body:', req.body);

    const { orderId, finalAmount } = req.body;

    if (!orderId || finalAmount === undefined || finalAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'orderId and finalAmount are required'
      });
    }

    const numericFinalAmount = Number(finalAmount);

    if (!Number.isFinite(numericFinalAmount) || numericFinalAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'finalAmount must be a valid non-negative number'
      });
    }

    const db = await dbPromise;

    const authRow = await db.get(
      `SELECT *
       FROM authorizations
       WHERE order_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [orderId]
    );

    if (!authRow) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (authRow.payment_status !== 'AUTHORIZED') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be settled because payment status is ${authRow.payment_status}`
      });
    }

    if (
      authRow.settlement_status === 'SETTLED_FULL' ||
      authRow.settlement_status === 'SETTLED_PARTIAL'
    ) {
      return res.status(400).json({
        success: false,
        message: `Order has already been settled with status ${authRow.settlement_status}`
      });
    }

    const authorizedAmount = Number(authRow.authorization_amount);

    if (numericFinalAmount > authorizedAmount) {
      return res.status(400).json({
        success: false,
        message: `Settlement amount $${numericFinalAmount.toFixed(2)} exceeds authorized amount $${authorizedAmount.toFixed(2)}`
      });
    }

    const settlementStatus =
      numericFinalAmount === authorizedAmount ? 'SETTLED_FULL' : 'SETTLED_PARTIAL';

    const settlementDate = new Date().toISOString();

    const updateResult = await db.run(
      `UPDATE authorizations
       SET settlement_status = ?,
           settlement_amount = ?,
           settlement_datetime = ?
       WHERE id = ?`,
      [
        settlementStatus,
        numericFinalAmount,
        settlementDate,
        authRow.id
      ]
    );

    console.log('Settlement update result:', updateResult);

    return res.json({
      success: true,
      orderId,
      productId: authRow.product_id,
      productName: authRow.product_name,
      authorizedAmount,
      settlementAmount: numericFinalAmount,
      settlementStatus,
      settlementDatetime: settlementDate,
      message:
        settlementStatus === 'SETTLED_FULL'
          ? 'Order settled successfully for the full authorized amount.'
          : 'Order settled successfully for a partial amount.'
    });
  } catch (err) {
    console.error('Error in /api/settle:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await dbPromise;
  console.log(`Backend listening at http://localhost:${PORT}`);
});