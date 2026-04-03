# 🧾 E-Commerce Payment Authorization & Settlement System

## IS 4880 – Capstone Project  
**Group 10**

---

# 📌 Project Overview

This system simulates a real-world e-commerce payment lifecycle from checkout through warehouse settlement.

It demonstrates how modern payment systems:
- securely request authorization
- communicate with external providers
- store transaction data
- validate and process settlements

⚠️ This system uses **mock APIs** and does NOT process real payments.

---

# 🏗 System Architecture

## 3-Tier Architecture

### 🎨 Presentation Layer
- HTML
- CSS
- Vanilla JavaScript
- Handles UI, validation, and API calls

### ⚙️ Application Layer
- Node.js
- Express
- Handles:
  - OAuth token retrieval
  - Payment authorization logic
  - Settlement validation
  - Database interaction

### 🗄 Data Layer
- SQLite (file-based database)
- Automatically created locally
- Stores all transaction and settlement data

---

# 🔄 Application Flow

## 🛒 Payment Flow

1. User logs in via `login_page1.html`
2. User selects a product on `product_page.html`
3. Order data is passed to `order_payment.html`
4. User submits payment details
5. Backend:
   - retrieves OAuth token
   - sends authorization request to provider
6. Provider responds with:
   - success OR failure
7. Backend:
   - maps response to system status
   - stores record in database
8. Frontend displays result

---

## 📦 Warehouse Flow

1. User opens `warehouse.html`
2. Inputs:
   - orderId
   - settlement amount
3. Backend:
   - retrieves authorization record
   - validates settlement rules
4. If valid:
   - updates settlement fields in database
5. Frontend displays confirmation

---

# 🗄 Database Design

## Location
```
data/capstone_payments.db
```

## Table: `authorizations`

### Key Fields

| Field | Purpose |
|------|--------|
| order_id | Unique transaction identifier |
| authorization_amount | Approved amount |
| payment_status | AUTHORIZED / FAILED_* |
| authorization_expiration | Clean valid date |
| raw_authorization_expiration | Original provider value |
| settlement_status | NOT_SETTLED / PARTIAL / FULL |
| settlement_amount | Final settled amount |
| settlement_datetime | Timestamp of settlement |

---

## 🧠 Special Logic

### Raw vs Clean Expiration
- Provider may return invalid dates
- System stores:
  - raw value (for accuracy)
  - cleaned value (for database compatibility)

---

### Payment Status Mapping
System maps provider responses to:
- AUTHORIZED
- FAILED_INSUFFICIENT_FUNDS
- FAILED_INVALID_CARD
- FAILED_SYSTEM_ERROR

---

### Settlement Validation Rules

- Cannot settle non-authorized transactions
- Cannot settle more than authorized amount
- Cannot settle already-settled orders

---

# 🔄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/authorize | Processes payment |
| GET | /api/authorizations | Retrieves recent transactions |
| POST | /api/settle | Processes settlement |

---

# 🚀 Local Setup

👉 See full setup instructions:

```
LOCAL_SETUP_AND_DEMO.md
```

---

# 🧪 Demo Instructions

1. Start server
2. Submit payment
3. Show result
4. Open SQLite database
5. Show inserted row
6. Run warehouse settlement
7. Show updated database row

---

# ⭐ Key Features

- SQLite (no external DB required)
- OAuth token simulation
- External API integration (mock provider)
- Realistic payment failure handling
- Settlement validation logic
- Automatic database creation
- Clean frontend/backend separation

---

# 🔒 Notes

- No real financial transactions occur
- Designed for educational use
- Optimized for easy local setup

---

# 📄 License

Educational Use Only – IS 4880 Capstone
