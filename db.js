require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'capstone_payments.db');

async function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      transaction_datetime TEXT NOT NULL,
      authorization_amount REAL NOT NULL,
      authorization_expiration TEXT NULL,
      raw_authorization_expiration TEXT NULL,
      authorization_token TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      settlement_status TEXT DEFAULT 'NOT_SETTLED',
      settlement_amount REAL NULL,
      settlement_datetime TEXT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log(`SQLite database ready at ${dbPath}`);
  return db;
}

module.exports = initDb();
