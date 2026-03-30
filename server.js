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

  // Match YYYY-MM-DDTHH:MM:SS(.sss)?
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

  // Return MySQL DATETIME format
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

    // 5) Map provider response
    let paymentStatus = 'FAILED';
    let returnedToken = apiData?.AuthorizationToken || 'no_token';
    let authorizationExpiration = normalizeProviderDate(apiData?.TokenExpirationDate);
    let returnedAmount = Number(apiData?.AuthorizedAmount ?? 0);

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
      authorizationToken: concatenatedToken,
      paymentStatus,
    });

    // 6) Insert into DB
    const [result] = await db.query(
      `INSERT INTO authorizations
       (order_id, transaction_datetime, authorization_amount, authorization_expiration, authorization_token, payment_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        transactionDate,
        finalStoredAmount,
        authorizationExpiration,
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
// 4) Start the server
// ------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});