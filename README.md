# 🧾 E-Commerce Payment Authorization & Settlement System

## IS 4880 – Capstone Project  
**Group 10**

---

## 📌 Project Overview

This system simulates a real-world e-commerce payment lifecycle:

- 🛒 Order Creation  
- 🔐 OAuth Token Retrieval  
- 💳 Payment Authorization (Mock Provider)  
- 🗄 Authorization Storage (MySQL)  
- 📊 Order & Payment Dashboard  
- 📦 Warehouse Settlement (Partial + Full)  
- 🧮 Settlement Validation  

> ⚠️ **Important:**  
> This application does NOT process real financial transactions.  
> All payment interactions use mock endpoints for simulation.

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

### 🗄 Data Layer
- MySQL
- mysql2
- dotenv

---

# 📂 Project Structure

```
CapstoneBackend/
│
├── server.js
├── db.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env              (NOT committed)
└── public/
    ├── login_page1.html
    └── order_payment.html
```

---

# ⚙️ Environment Configuration

Create a `.env` file inside `CapstoneBackend/`:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=capstone_payments
PORT=3000
```

---

# 🗄 Database Setup

```sql
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
```

---

## 📌 Stored Fields

Each authorization record includes:

- `order_id`
- `transaction_datetime`
- `authorization_amount`
- `authorization_expiration`
- `authorization_token`
- `payment_status`
- `settlement_status`
- `created_at`

### 🔐 Authorization Token Format

```
OrderId + "_" + returned_token
```

Example:

```
ORD12345_abc987xyz
```

---

# 🔐 Authorization Flow

## 1️⃣ OAuth Token Retrieval

**Endpoint:**
```
POST /oauth/token
```

- Retrieves mock OAuth token  
- If token is missing → authorization fails  

---

## 2️⃣ Payment Authorization

**Endpoint:**
```
POST /authorize
Headers:
Authorization: Bearer <token>
```

Possible responses:

- SUCCESS  
- FAILED_INSUFFICIENT_FUNDS  
- FAILED_INVALID_CARD  
- SYSTEM_ERROR  

---

## 3️⃣ Authorization Persistence

After authorization, the backend stores:

- Order ID  
- Transaction timestamp  
- Authorized amount  
- Authorization expiration  
- Concatenated authorization token  
- Payment status  

---

# 🧮 Settlement Logic

Warehouse users submit settlement requests.

### Validation Rules

```
If settlement_amount > authorization_amount → FAIL
If settlement_amount ≤ authorization_amount → SUCCESS
```

- Partial settlements are supported  
- Settlement status is updated in the database  

---

# 📊 Order Dashboard

Displays:

- Order ID  
- Payment status  
- Authorized amount  
- Authorization timestamp  
- Authorization expiration  
- Settlement status  

## Sorting & Filtering

- Sort by Order ID  
- Sort by payment status  
- Sort by date  
- Sort by amount  
- Filter by status  
- Filter by date range  
- Filter by amount range  
- Optional search by Order ID  

---

# 🚀 Local Development Setup

## Clone Repository

```
git clone https://github.com/Jameslim845/capstone-course.git
cd capstone-course/CapstoneBackend
```

## Install Dependencies

```
npm install
```

## Configure Environment

Create `.env` file with local MySQL credentials.

## Start Server

```
node server.js
```

Application runs at:

```
http://localhost:3000
```

---

# 🔄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/authorize` | OAuth + payment authorization |
| POST | `/api/settle` | Settlement validation |
| GET  | `/api/orders` | Returns order list |

---

# 🔒 Security Considerations

- No hardcoded credentials  
- `.env` excluded from repository  
- Authorization header required  
- Sensitive card data masked in UI  
- Server-side validation prevents overcharge  

---

# 📈 Future Enhancements

- Token expiration enforcement  
- Role-based authentication  
- Refund workflow  
- AWS EC2 deployment  
- CI/CD pipeline  
- Automated test suite  

---

# 📄 License

Educational Use Only – IS 4880 Capstone
