# BluePay — Bluetooth Peer-to-Peer Payment System

A full-stack major project: two users, each with their own account, wallet,
and simulated Bluetooth device, can discover each other, pair, and transfer
money — with the payment payload encrypted end-to-end with AES-256-GCM.

- **Frontend:** React (Vite)
- **Backend:** Python Flask REST API, JWT authentication
- **Database:** MySQL
- **Security:** AES-256-GCM, encrypted client-side with the browser's Web
  Crypto API and decrypted server-side with Python's `cryptography` library

```
bluepay/
├── backend/          Flask API + MySQL models
│   ├── app/
│   │   ├── routes/   auth, wallet, devices, transactions
│   │   ├── models.py SQLAlchemy models
│   │   ├── crypto_utils.py   AES-256-GCM helpers
│   │   └── config.py
│   ├── database/
│   │   ├── schema.sql   reference SQL schema
│   │   └── seed.py      creates two demo accounts
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
└── frontend/          React app
    └── src/
        ├── pages/       Login, Register, Dashboard, PairAndPay, History
        ├── context/     AuthContext (JWT session)
        └── api.js        axios client
```

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+ (running locally, or update `.env` to point at a remote instance)

## 2. Set up the database

```bash
mysql -u root -p -e "CREATE DATABASE bluepay CHARACTER SET utf8mb4;"
```

You don't need to run `schema.sql` yourself — the Flask app creates all
tables automatically the first time it starts (via SQLAlchemy). `schema.sql`
is kept in `backend/database/` as a reference for your project report / ER
diagram, and works too if you'd rather create the tables manually first.

## 3. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set DB_PASSWORD to your MySQL root password

python run.py
```

The API now runs at `http://localhost:5000`. Check it with:
```bash
curl http://localhost:5000/api/health
```

**Optional — create two demo accounts** so you don't have to register
manually before your first demo run:
```bash
python database/seed.py
```
This creates `rohan@example.com` and `priya@example.com`, both with the
password `password123` and a ₹5,000 starting balance.

## 4. Set up the frontend

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## 5. Demo the full flow

You need **two separate logged-in sessions** to simulate two phones —
easiest way is one normal browser window and one incognito/private window
(or two different browsers).

1. **Window A:** log in as Rohan (or register a new account). On the
   Dashboard, turn Bluetooth on.
2. **Window B:** log in as Priya. Turn Bluetooth on there too.
3. **Window A:** go to **Pair & pay** → **Scan for nearby devices** →
   Priya's device shows up → click **Pair**. This calls the backend, which
   generates a random AES-256 session key shared by both devices, the way
   Bluetooth Secure Simple Pairing establishes a shared link key.
4. Enter an amount and click **Send payment**. The browser encrypts the
   transaction (amount, transaction ID, timestamp) with AES-256-GCM using
   the session key, and only sends the ciphertext to the server. The
   server decrypts it with the same key, verifies the authentication tag,
   checks the sender's balance, and atomically updates both wallets.
5. Check **History** in both windows — each side sees the same
   transaction, labelled "sent" or "received".

## 6. API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create an account, wallet, and device |
| POST | `/api/auth/login` | – | Get a JWT |
| GET | `/api/wallet` | JWT | Current user's balance |
| GET | `/api/devices/me` | JWT | Current user's device(s) |
| PATCH | `/api/devices/me/status` | JWT | Turn Bluetooth on/off (discoverable) |
| GET | `/api/devices/discover` | JWT | List other users' nearby active devices |
| POST | `/api/devices/pair` | JWT | Pair with a peer device, get a session key |
| POST | `/api/transactions/send` | JWT | Submit an encrypted payment |
| GET | `/api/transactions` | JWT | Transaction history (sent + received) |

## 7. Security notes

- Passwords are hashed with Werkzeug's `generate_password_hash` (PBKDF2), never stored in plaintext.
- Every transaction payload is encrypted with AES-256-GCM; the server never sees the plaintext amount until it decrypts it with the session key established at pairing.
- GCM's authentication tag means a tampered ciphertext is rejected outright rather than silently corrupted.
- Session keys are scoped to a single pairing and expire after 10 minutes (see `PAIRING_SESSION_MINUTES` in `config.py`).
- Wallet debit/credit happens in a single database transaction, so a crash mid-transfer cannot leave money debited from one side without crediting the other.

## 8. Known limitations (worth mentioning in your viva)

- This is a browser-based simulation of Bluetooth discovery/pairing (two accounts, "discoverable" flag, distance ignored) rather than a real Bluetooth radio link — a real deployment would replace the discovery/pairing calls with Android `BluetoothAdapter` / BLE GATT calls, while keeping the same AES-256-GCM payload encryption.
- There's no bank/UPI settlement integration — wallet balances are internal to this app's database, not real money.
