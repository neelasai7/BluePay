import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    wallet = db.relationship("Wallet", backref="user", uselist=False, cascade="all, delete-orphan")
    devices = db.relationship("Device", backref="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}


class Wallet(db.Model):
    __tablename__ = "wallets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    balance = db.Column(db.Numeric(12, 2), nullable=False, default=5000.00)

    def to_dict(self):
        return {"id": self.id, "balance": float(self.balance)}


class Device(db.Model):
    __tablename__ = "devices"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    mac_address = db.Column(db.String(20), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    last_seen = db.Column(db.DateTime, nullable=True)

    def to_dict(self, include_owner=False):
        data = {
            "id": self.id,
            "device_name": self.device_name,
            "mac_address": self.mac_address,
            "is_active": self.is_active,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
        }
        if include_owner:
            data["owner_name"] = self.user.name
        return data


class PairingSession(db.Model):
    __tablename__ = "pairing_sessions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_a_id = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=False)
    device_b_id = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=False)
    session_key_hex = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    device_a = db.relationship("Device", foreign_keys=[device_a_id])
    device_b = db.relationship("Device", foreign_keys=[device_b_id])

    def to_dict(self):
        return {
            "session_id": self.id,
            "session_key_hex": self.session_key_hex,
            "peer_device": self.device_b.to_dict(include_owner=True),
            "expires_at": self.expires_at.isoformat(),
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    txn_uid = db.Column(db.String(20), unique=True, nullable=False)
    sender_wallet_id = db.Column(db.Integer, db.ForeignKey("wallets.id"), nullable=False)
    receiver_wallet_id = db.Column(db.Integer, db.ForeignKey("wallets.id"), nullable=False)
    sender_device_id = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=False)
    receiver_device_id = db.Column(db.Integer, db.ForeignKey("devices.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    cipher_preview = db.Column(db.String(64))
    status = db.Column(db.String(10), default="success")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender_device = db.relationship("Device", foreign_keys=[sender_device_id])
    receiver_device = db.relationship("Device", foreign_keys=[receiver_device_id])

    def to_dict(self, viewer_wallet_id=None):
        direction = None
        if viewer_wallet_id is not None:
            direction = "sent" if viewer_wallet_id == self.sender_wallet_id else "received"
        return {
            "txn_uid": self.txn_uid,
            "amount": float(self.amount),
            "status": self.status,
            "cipher_preview": self.cipher_preview,
            "created_at": self.created_at.isoformat(),
            "sender_device": self.sender_device.device_name,
            "receiver_device": self.receiver_device.device_name,
            "direction": direction,
        }
