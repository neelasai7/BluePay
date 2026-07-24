import json
import random
import string
from datetime import datetime
from cryptography.exceptions import InvalidTag
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User, PairingSession, Transaction
from ..crypto_utils import decrypt_payload, key_from_hex

transactions_bp = Blueprint("transactions", __name__)


def _gen_txn_uid():
    return "TXN" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


@transactions_bp.post("/send")
@jwt_required()
def send_payment():
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True)

    session_id = data.get("session_id")
    iv_hex = data.get("iv_hex")
    ciphertext_hex = data.get("ciphertext_hex")

    session = PairingSession.query.get(session_id)
    if not session:
        return jsonify({"error": "Pairing session not found. Pair the devices again."}), 404
    if session.expires_at < datetime.utcnow():
        return jsonify({"error": "Pairing session expired. Pair the devices again."}), 410

    sender_device = session.device_a
    receiver_device = session.device_b
    if sender_device.user_id != user.id:
        return jsonify({"error": "This pairing session does not belong to your device."}), 403

    key = key_from_hex(session.session_key_hex)
    try:
        plaintext = decrypt_payload(key, iv_hex, ciphertext_hex)
    except InvalidTag:
        return jsonify({"error": "Payload authentication failed - the encrypted packet may have been tampered with."}), 400

    payload = json.loads(plaintext.decode("utf-8"))
    amount = round(float(payload["amount"]), 2)

    if amount <= 0:
        return jsonify({"error": "Invalid amount."}), 400

    sender_wallet = sender_device.user.wallet
    receiver_wallet = receiver_device.user.wallet

    if float(sender_wallet.balance) < amount:
        return jsonify({"error": "Insufficient balance."}), 402

    sender_wallet.balance = float(sender_wallet.balance) - amount
    receiver_wallet.balance = float(receiver_wallet.balance) + amount

    txn = Transaction(
        txn_uid=_gen_txn_uid(),
        sender_wallet_id=sender_wallet.id,
        receiver_wallet_id=receiver_wallet.id,
        sender_device_id=sender_device.id,
        receiver_device_id=receiver_device.id,
        amount=amount,
        cipher_preview=ciphertext_hex[:40],
        status="success",
    )
    db.session.add(txn)
    db.session.commit()

    return jsonify({
        "transaction": txn.to_dict(viewer_wallet_id=sender_wallet.id),
        "new_balance": float(sender_wallet.balance),
    }), 201


@transactions_bp.get("")
@jwt_required()
def history():
    user = User.query.get_or_404(int(get_jwt_identity()))
    wallet_id = user.wallet.id
    txns = (
        Transaction.query.filter(
            (Transaction.sender_wallet_id == wallet_id) | (Transaction.receiver_wallet_id == wallet_id)
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )
    return jsonify([t.to_dict(viewer_wallet_id=wallet_id) for t in txns])
