# 🧾 E-Commerce Payment Authorization & Settlement System

## IS 4880 – Capstone Project

Group 10

---

# 📌 Project Overview

This system simulates a real-world e-commerce payment lifecycle from checkout through warehouse settlement.

It demonstrates how modern payment systems:

* securely request authorization
* communicate with external providers
* store transaction data
* validate and process settlements

⚠️ This system uses mock APIs and does NOT process real payments.

---

# 🏗 System Architecture

## 3-Tier Architecture

### 🎨 Presentation Layer

* HTML
* CSS
* Vanilla JavaScript
* Handles UI, validation, and API calls

### ⚙️ Application Layer

* Node.js
* Express
* Handles:

  * OAuth token retrieval
  * Payment authorization logic
  * Settlement validation
  * Database interaction

### 🗄 Data Layer

* SQLite (file-based database)
* Automatically created locally
* Stores all transaction and settlement data

---

# 🔄 Application Flow

## 🛒 Payment Flow

1. User logs in via login_page1.html
2. User selects a product on product_page.html
3. Product data is passed to order_payment.html
4. Checkout generates a fresh order attempt ID
5. User submits payment details
6. Backend:

   * retrieves OAuth token
   * sends authorization request to the mock provider
7. Provider responds with:

   * success OR failure
8. Backend:

   * maps response to system payment status
   * stores record in SQLite
9. Frontend displays the authorization result

---

## 📦 Warehouse Flow

1. User opens warehouse.html
2. Inputs:

   * orderId
   * settlement amount
3. Backend:

   * retrieves the most recent authorization record for that order
   * validates settlement rules
4. If valid:

   * updates settlement fields in database
5. Frontend displays confirmation

---

# 🗄 Database Design

## Location

data/capstone_payments.db

## Table: authorizations

### Key Fields

| Field                    | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| id                       | Internal SQLite row ID                                |
| order_id                 | User-facing order identifier                          |
| product_id               | Product identifier selected during checkout           |
| product_name             | Product name selected during checkout                 |
| transaction_datetime     | Timestamp when authorization was attempted            |
| authorization_amount     | Authorized/requested amount stored for the order      |
| authorization_expiration | Provider expiration string stored exactly as returned |
| authorization_token      | Concatenated order/token value                        |
| payment_status           | AUTHORIZED / FAILED_*                                 |
| settlement_status        | NOT_SETTLED / SETTLED_PARTIAL / SETTLED_FULL          |
| settlement_amount        | Final settled amount                                  |
| settlement_datetime      | Timestamp of settlement                               |

---

# 🧠 Special Logic

## Provider Expiration Handling

The mock provider can return unusual or impossible expiration date values.
This system stores the provider expiration value as a plain string exactly as returned instead of trying to clean or normalize it.

---

## Payment Status Mapping

System maps provider responses to:

* AUTHORIZED
* FAILED_INSUFFICIENT_FUNDS
* FAILED_INVALID_CARD
* FAILED_SYSTEM_ERROR
* FAILED

---

## Settlement Validation Rules

* Cannot settle non-authorized transactions
* Cannot settle more than authorized amount
* Cannot settle an order that has already been settled
* Full settlement = final amount exactly equals authorized amount
* Partial settlement = final amount is less than authorized amount

---

# 🔄 API Endpoints

| Method | Endpoint            | Description                     |
| ------ | ------------------- | ------------------------------- |
| GET    | /api/health         | Health check                    |
| GET    | /api/authorizations | Retrieves recent transactions   |
| POST   | /api/authorize      | Processes payment authorization |
| POST   | /api/settle         | Processes settlement            |

---

# 🚀 Local Setup

See full setup instructions in:

LOCAL_SETUP_AND_DEMO.md

---

# 🧪 Demo Instructions

1. Start server
2. Submit payment
3. Show authorization result
4. Open SQLite database
5. Show inserted row
6. Run warehouse settlement
7. Show updated database row

---

# ⭐ Key Features

* SQLite (no external DB server required)
* OAuth token flow
* External mock API integration
* Realistic payment failure handling
* Settlement validation logic
* Automatic database creation
* Product ID and product name stored with each order
* Sorting and filtering in warehouse UI

---

# 🔒 Notes

* No real financial transactions occur
* Designed for educational use
* Optimized for easy local setup and demo presentation

---

# 📄 License

Educational Use Only – IS 4880 Capstone
