# 🧾 E-Commerce Payment Authorization System  
## IS 4880 – Capstone Project  
**Group 10**

---

## 📌 Project Overview

This project simulates the core payment lifecycle of a modern e-commerce system using a mock payment provider rather than a real financial processor. The goal is to demonstrate how a customer-facing checkout page can collect order and payment information, validate user input, securely communicate with a backend server, retrieve an OAuth token, submit an authorization request to a mock provider, store the authorization result in a MySQL database, and display the resulting payment status back to the user.

This is **not** a real payment application and does **not** process live credit card transactions. All payment operations are simulated through mock endpoints provided for the capstone project.

At the current stage of the project, the system supports:

- customer login  
- product selection  
- order creation  
- payment submission  
- client-side validation  
- server-side OAuth token retrieval  
- payment authorization using mock provider endpoints  
- authorization result persistence in MySQL  
- display of payment results in the UI  
- viewing stored authorization records through a backend route  

The **warehouse settlement feature** is planned next and is not yet fully implemented.

---

## 🎯 Project Purpose

This system demonstrates:

- how e-commerce payment flows work conceptually  
- frontend ↔ backend communication  
- OAuth token retrieval and usage  
- payment authorization requests  
- provider response handling  
- database persistence  
- server-side proxying  
- defensive backend validation  

---

## ⚠️ Important Notes

- This system uses **mock endpoints only**  
- No real payments are processed  
- Login is simulated (no real authentication system)  
- OAuth here refers to **payment provider authorization**, not user login  

---

# 🏗 System Architecture

## 3-Tier Architecture

### 🎨 Presentation Layer
- HTML  
- CSS  
- Vanilla JavaScript  

### ⚙️ Application Layer
- Node.js  
- Express  
- Axios  
- dotenv  

### 🗄 Data Layer
- MySQL  
- mysql2  

---

# 🔄 System Flow

1. User logs in  
2. User selects product  
3. Product stored in `sessionStorage`  
4. Redirect to payment page  
5. User enters payment details  
6. Frontend validates input  
7. Request sent to `/api/authorize`  
8. Backend retrieves OAuth token  
9. Backend calls mock provider  
10. Provider returns result  
11. Backend maps response  
12. Backend stores result in MySQL  
13. Backend returns response to frontend  
14. UI displays result  

---

# 🔐 Server-Side Proxying

Instead of:

Browser → Payment Provider

We use:

Browser → Backend → Provider

### Benefits:
- protects credentials  
- centralizes logic  
- handles errors safely  
- mirrors real-world architecture  

---

# 📂 Project Structure

CapstoneBackend/
│
├── server.js
├── db.js
├── oauthTokenService.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env (NOT committed)
└── public/
    ├── login_page1.html
    ├── product_page.html
    └── order_payment.html

---

# ⚙️ Environment Configuration

Create `.env`:

DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=capstone_payments
DB_PORT=3306
PORT=3000

OAUTH_TOKEN_URL=https://capstoneproject.proxy.beeceptor.com/oauth/token
OAUTH_CLIENT_ID=ksuCapstone
OAUTH_CLIENT_SECRET=P@ymentP@ss!
AUTHORIZE_URL=https://capstoneproject.proxy.beeceptor.com/authorize

---

# 🗄 MySQL Database Setup

CREATE DATABASE capstone_payments;
USE capstone_payments;

CREATE TABLE authorizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    transaction_datetime DATETIME NOT NULL,
    authorization_amount DECIMAL(10,2) NOT NULL,
    authorization_expiration DATETIME NULL,
    authorization_token VARCHAR(255) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    settlement_status VARCHAR(30) DEFAULT 'NOT_SETTLED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

---

# 🧯 Defensive Validation

The mock provider sometimes returns invalid dates like:

2026-06-31T00:00:00.000

June only has 30 days → invalid.

Solution:
- valid date → store normally  
- invalid date → store NULL  

Frontend displays:

Authorization Expiration: N/A (provider returned invalid date)

---

# 📈 Future Improvements

- warehouse UI  
- settlement API  
- dashboard page  
- better validation  
- AWS deployment  
- automated testing  

---

# 📄 License

Educational Use Only – IS 4880 Capstone Project
