# 🚀 Capstone Project – Local Setup & Demo Guide (SQLite Version)

## ⚠️ IMPORTANT

This project uses SQLite, not MySQL.

* No MySQL required
* No MySQL Workbench required
* No database server required

The database is a local file created automatically by the app.

---

# 🧰 REQUIRED SOFTWARE

## 1. Install Node.js

Download and install:
https://nodejs.org

Verify installation:

node -v
npm -v

---

## 2. Install VS Code

https://code.visualstudio.com/

---

## 3. Install DB Browser for SQLite

https://sqlitebrowser.org/

---

# 📂 STEP 1 — GET THE PROJECT

git clone <your-repo-url>
cd <your-repo-folder>

---

# 📦 STEP 2 — INSTALL DEPENDENCIES

npm install

---

# ⚙️ STEP 3 — CREATE .env FILE

Create a file named .env in the root folder:

PORT=3000
OAUTH_TOKEN_URL=https://capstoneproject.proxy.beeceptor.com/oauth/token
OAUTH_CLIENT_ID=ksuCapstone
OAUTH_CLIENT_SECRET=P@ymentP@ss!
AUTHORIZE_URL=https://capstoneproject.proxy.beeceptor.com/authorize

---

# 🧹 STEP 4 — DATABASE RESET (IMPORTANT)

Because the schema was updated, delete the existing database once:

data/capstone_payments.db

This allows the system to recreate the database with:

* product_id
* product_name
* single authorization_expiration field
* updated settlement fields

---

# ▶️ STEP 5 — START SERVER

node server.js

---

# 🌐 STEP 6 — OPEN APPLICATION

http://localhost:3000/login_page1.html

---

# 🗄 DATABASE LOCATION

data/capstone_payments.db

---

# 👀 VIEW DATABASE

1. Open DB Browser for SQLite
2. Click "Open Database"
3. Open data/capstone_payments.db
4. Go to "Browse Data"
5. Select "authorizations" table
6. Click refresh after transactions

---

# 🧪 DEMO FLOW

## Payment Demo

1. Open login page
2. Log in
3. Select product
4. Complete checkout
5. Submit payment
6. Show confirmation
7. Show database row

---

## Settlement Demo

1. Open warehouse.html
2. Search for order
3. Enter final amount
4. Submit settlement
5. Show updated database row

---

# ✅ SETTLEMENT SCENARIOS

## Full Settlement

* Use AUTHORIZED order
* Enter full amount
* Result: SETTLED_FULL

---

## Partial Settlement

* Use AUTHORIZED order
* Enter smaller amount
* Result: SETTLED_PARTIAL

---

## Invalid Over-Settlement

* Enter amount greater than authorized
* Result: error

---

## Already Settled Order

* Attempt second settlement
* Result: error

---

# 🛠 TROUBLESHOOTING

* npm not working → install Node
* server not starting → check .env file
* DB missing → run server once
* schema incorrect → delete DB and restart
* page not loading → ensure server is running on port 3000
