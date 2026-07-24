-- BluePay database schema (MySQL 8.0+)
CREATE DATABASE IF NOT EXISTS bluepay CHARACTER SET utf8mb4;
USE bluepay;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  mac_address VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pairing_sessions (
  id VARCHAR(36) PRIMARY KEY,
  device_a_id INT NOT NULL,
  device_b_id INT NOT NULL,
  session_key_hex VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (device_a_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (device_b_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  txn_uid VARCHAR(20) NOT NULL UNIQUE,
  sender_wallet_id INT NOT NULL,
  receiver_wallet_id INT NOT NULL,
  sender_device_id INT NOT NULL,
  receiver_device_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  cipher_preview VARCHAR(64),
  status ENUM('success','failed') NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id),
  FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id),
  FOREIGN KEY (sender_device_id) REFERENCES devices(id),
  FOREIGN KEY (receiver_device_id) REFERENCES devices(id)
);

CREATE INDEX idx_devices_active ON devices (is_active, last_seen);
CREATE INDEX idx_txn_sender ON transactions (sender_wallet_id);
CREATE INDEX idx_txn_receiver ON transactions (receiver_wallet_id);
