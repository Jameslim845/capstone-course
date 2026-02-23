🧾 E-Commerce Payment Authorization & Settlement System

IS 4880 – Capstone Project
Group 10

📌 Overview

This project implements a simulated e-commerce payment workflow including:

Order creation

OAuth token retrieval

Payment authorization via mock provider

Authorization persistence in MySQL

Order status dashboard

Warehouse settlement (partial + full)

Settlement validation against authorized amount

⚠️ Note: This system does not process real financial transactions. All authorization logic uses mock endpoints for educational simulation.

🏗 Architecture
3-Tier Architecture
🖥 Presentation Layer

HTML

CSS

Vanilla JavaScript

⚙️ Application Layer

Node.js

Express.js

🗄 Data Layer

MySQL

mysql2 driver

Environment-based configuration via dotenv

📂 Project Structure
CapstoneBackend/
│
├── server.js                # Express application entry point
├── db.js                    # MySQL connection pool
├── package.json
├── package-lock.json
├── .gitignore
├── .env                     # Environment config (NOT committed)
└── public/
    ├── login_page1.html
    └── order_payment.html
⚙️ Environment Configuration

Create a .env file inside CapstoneBackend/:

DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=capstone_payments
PORT=3000

The application loads these values at runtime using dotenv.

🗄 Database Schema

Run the following SQL:

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
📊 Stored Fields

Each authorization stores:

order_id

transaction_datetime

authorization_amount

authorization_expiration

authorization_token

payment_status

settlement_status

created_at

🔐 Authorization Token Format

Tokens are stored as:

OrderId + "_" + returned_token

Example:

ORD12345_abc987xyz
🔐 Authorization Flow
Step 1 – OAuth Token Retrieval
POST /oauth/token

If no token is returned → authorization fails.

Step 2 – Payment Authorization
POST /authorize
Headers:
    Authorization: Bearer <token>

Possible responses:

SUCCESS

FAILED_INSUFFICIENT_FUNDS

FAILED_INVALID_CARD

SYSTEM_ERROR

Step 3 – Authorization Persistence

The backend stores:

OrderId

Transaction DateTime

Authorized Amount

Authorization Expiration

Concatenated Authorization Token

Payment Status

🧮 Settlement Logic

Warehouse UI allows settlement submission.

Rules
If settlement_amount > authorization_amount → FAIL
If settlement_amount ≤ authorization_amount → SUCCESS

Partial settlements are supported.

Settlement updates settlement_status.

🖥 Order Dashboard

Displays:

OrderId

Payment Status

Authorized Amount

Authorization Timestamp

Authorization Expiration

Settlement Status

Supports

Sort by OrderId

Sort by Payment Status

Sort by Date

Sort by Amount

Filter by Status

Filter by Date Range

Filter by Amount Range

Optional text search by OrderId

🚀 Local Development Setup
1️⃣ Clone the Repository
git clone https://github.com/Jameslim845/capstone-course.git
cd capstone-course/CapstoneBackend
2️⃣ Install Dependencies
npm install
3️⃣ Configure .env

Add your local MySQL credentials.

4️⃣ Start the Server
node server.js

Server runs at:

http://localhost:3000
🔄 Backend API Endpoints
Method	Endpoint	Description
POST	/api/authorize	Handles OAuth + payment authorization
POST	/api/settle	Handles settlement validation
GET	/api/orders	Returns order list for dashboard
🧪 Testing
Manual Test Cases

Expired card → blocked client-side

Missing OAuth token → authorization fails

Insufficient funds → FAILED_INSUFFICIENT_FUNDS

Over-settlement → rejected

Partial settlement → accepted

Verify Database
SELECT * FROM authorizations;
🔒 Security Considerations

No hardcoded credentials

.env excluded via .gitignore

Authorization header required

Client-side validation prevents malformed input

Sensitive data masked in UI

Server-side settlement validation prevents overcharge

🧰 Dependencies

express

mysql2

dotenv

📈 Future Enhancements

Token expiration enforcement

Full role-based authentication

Refund workflow

AWS EC2 deployment

CI/CD via GitHub Actions

Automated unit + integration tests

📄 License

Educational use only – IS 4880 Capstone Project
