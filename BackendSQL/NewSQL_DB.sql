CREATE DATABASE IF NOT EXISTS capstone_payments;
USE capstone_payments;

CREATE TABLE IF NOT EXISTS authorizations (
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
USE capstone_payments;

SELECT * FROM authorizations;