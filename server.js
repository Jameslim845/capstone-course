// server.js
// ==============================
// Main backend server for Capstone project
// ==============================

require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();

// Allow JSON request bodies
app.use(express.json());

// Serve static front-end files from /public
app.use(express.static(path.join(__dirname, 'public')));

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
//    (GET /api/authorizations)
//    This lets us see what is actually in the table
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
//    POST /api/authorize
//    - Called by order_payment.html via fetch()
//    - Simulates authorization (for now)
//    - Inserts a row into MySQL
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
    } = req.body;

    // Basic sanity check: make sure required values exist
    if (!orderId || !amount) {
      console.log('Missing orderId or amount in request');
      return res.status(400).json({
        success: false,
        message: 'orderId and amount are required',
      });
    }

    // For now, simulate a successful authorization
    const paymentStatus = 'AUTHORIZED';
    const transactionDate = new Date();
    const authorizationAmount = Number(amount);
    const authorizationExpiration = null; // will be a real date once you use the real API
    const returnedToken = 'fakeToken123'; // will come from real API later
    const concatenatedToken = `${orderId}_${returnedToken}`; // matches your FR-9 format

    console.log('About to insert row into authorizations:', {
      orderId,
      transactionDate,
      authorizationAmount,
      authorizationExpiration,
      authorizationToken: concatenatedToken,
      paymentStatus,
    });

    // INSERT into MySQL
    const [result] = await db.query(
      `INSERT INTO authorizations
       (order_id, transaction_datetime, authorization_amount, authorization_expiration, authorization_token, payment_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        transactionDate,
        authorizationAmount,
        authorizationExpiration,
        concatenatedToken,
        paymentStatus,
      ]
    );

    console.log('Insert result from MySQL:', result);

    // Respond back to the browser
    return res.json({
      success: true,
      orderId,
      paymentStatus,
      authorizationAmount,
      authorizationToken: concatenatedToken,
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