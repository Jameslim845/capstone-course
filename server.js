// server.js
// ==============================
// Main backend server for Capstone project
// ==============================

require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const axios = require('axios');
const { getAccessToken } = require('./oauthTokenService');

const app = express();

// Allow JSON request bodies
app.use(express.json());

// Serve static front-end files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------
// Helper: Normalize provider date safely for MySQL
// - Returns MySQL DATETIME string if valid
// - Returns null if invalid or missing
// ------------------------------
function normalizeProviderDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;

  const trimmed = dateString.trim();

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/
  );

  if (!match) return null;

  const [, y, m, d, hh, mm, ss] = match;

  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);

  const testDate = new Date(year, month - 1, day, hour, minute, second);

  const isValid =
    testDate.getFullYear() === year &&
    testDate.getMonth() === month - 1 &&
    testDate.getDate() === day &&
    testDate.getHours() === hour &&
    testDate.getMinutes() === minute &&
    testDate.getSeconds() === second;

  if (!isValid) return null;

  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// ------------------------------
// 1) Basic health check
// ------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Server is running',
    dbName: process.env.DB_NAME || 'not set',
  });
});

// ------------------------------
// 2) Helper route for debugging DB contents
// ------------------------------
app.get('/api/authorizations', async (req, res) => {
  try {
    console.log('--- /api/authorizations called ---');

    const [rows] = await db.query(
      'SELECT * FROM authorizations ORDER BY id DESC LIMIT 20'
    );

    console.log('Fetched rows count:', rows.length);
    res.json({ success: true, rows });
  } catch (err) {
    console.error('Error in /api/authorizations:', err);
    res.status(500).json({ success: false, message: 'Error fetching authorizations' });
  }
});

// ------------------------------
// 3) Payment Authorization Route
// ------------------------------
app.post('/api/authorize', async (req, res) => {
  try {
    console.log('--- /api/authorize called ---');

    console.log('DB CONFIG:', {
      host: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
    });

    console.log('Request body:', req.body);

    const {
      orderId,
      amount,
      cardNumber,
      expiryDate,
      zip,
      firstName,
      lastName,
      address,
      cvv
    } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'orderId and amount are required',
      });
    }

    const transactionDate = new Date();
    const requestedAmount = Number(amount);

    // 1) Get OAuth token
    const accessToken = await getAccessToken();

    // 2) Format expiry into month/year
    const [cardMonthRaw, cardYearRaw] = String(expiryDate || '').split('/');
    const cardMonth = cardMonthRaw || '';
    const cardYear = cardYearRaw ? `20${cardYearRaw}` : '';

    // 3) Build Beeceptor request body to match prompt
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

    // 4) Call Beeceptor authorize endpoint
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

    // 5) Distinguish expiration cases
    let expirationStatus = 'MISSING';
    const rawProviderExpiration = apiData?.TokenExpirationDate ?? null;
    const authorizationExpiration = normalizeProviderDate(rawProviderExpiration);

    if (rawProviderExpiration && authorizationExpiration) {
      expirationStatus = 'VALID';
    } else if (rawProviderExpiration && !authorizationExpiration) {
      expirationStatus = 'INVALID';
    } else {
      expirationStatus = 'MISSING';
    }

    // 6) Map provider response
    let paymentStatus = 'FAILED';
    const returnedToken = apiData?.AuthorizationToken || 'no_token';
    const returnedAmount = Number(apiData?.AuthorizedAmount ?? 0);

    if (apiData?.Success === true) {
      paymentStatus = 'AUTHORIZED';
    } else if (apiData?.Reason?.toLowerCase().includes('insufficient')) {
      paymentStatus = 'FAILED_INSUFFICIENT_FUNDS';
    } else if (apiData?.Reason?.toLowerCase().includes('incorrect')) {
      paymentStatus = 'FAILED_INVALID_CARD';
    } else if (apiData?.Error) {
      paymentStatus = 'FAILED_SYSTEM_ERROR';
    }

    const finalStoredAmount =
      apiData?.Success === true
        ? (Number.isFinite(returnedAmount) ? returnedAmount : requestedAmount)
        : 0;

    const concatenatedToken = `${orderId}_${returnedToken}`;

    console.log('About to insert row into authorizations:', {
      orderId,
      transactionDate,
      authorizationAmount: finalStoredAmount,
      authorizationExpiration,
      rawAuthorizationExpiration: rawProviderExpiration,
      expirationStatus,
      authorizationToken: concatenatedToken,
      paymentStatus,
    });

    // 7) Insert into DB
    const [result] = await db.query(
      `INSERT INTO authorizations
       (order_id, transaction_datetime, authorization_amount, authorization_expiration, raw_authorization_expiration, authorization_token, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        transactionDate,
        finalStoredAmount,
        authorizationExpiration,
        rawProviderExpiration,
        concatenatedToken,
        paymentStatus,
      ]
    );

    console.log('Insert result from MySQL:', result);

    return res.json({
      success: true,
      orderId,
      paymentStatus,
      authorizationAmount: finalStoredAmount,
      authorizationToken: concatenatedToken,
      authorizationExpiration,
      rawAuthorizationExpiration: rawProviderExpiration,
      expirationStatus,
      message: apiData?.Reason || apiData?.Error || ''
    });

  } catch (err) {
    console.error('Error in /api/authorize:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ------------------------------
// 4) Warehouse Settlement Route
// ------------------------------
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

    const [rows] = await db.query(
      `SELECT *
       FROM authorizations
       WHERE order_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const authRow = rows[0];

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

    const settlementDate = new Date();

    const [updateResult] = await db.query(
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

// ------------------------------
// 5) Start the server
// ------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});