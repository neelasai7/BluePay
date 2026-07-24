from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User, Device, PairingSession
from ..crypto_utils import generate_session_key, key_to_hex

devices_bp = Blueprint("devices", __name__)


@devices_bp.get("/me")
@jwt_required()
def my_devices():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify([d.to_dict() for d in user.devices])


@devices_bp.patch("/me/status")
@jwt_required()
def set_status():
    """Turn this user's device's Bluetooth on/off (makes it discoverable)."""
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True)
    is_active = bool(data.get("is_active"))

    device = user.devices[0] if user.devices else None
    if not device:
        return jsonify({"error": "No device registered for this account."}), 404

    device.is_active = is_active
    device.last_seen = datetime.utcnow() if is_active else device.last_seen
    db.session.commit()
    return jsonify(device.to_dict())


@devices_bp.get("/discover")
@jwt_required()
def discover():
    """List other users' devices that are currently Bluetooth-on and nearby (simulated)."""
    user = User.query.get_or_404(int(get_jwt_identity()))
    my_device_ids = [d.id for d in user.devices]
    window = datetime.utcnow() - timedelta(minutes=current_app.config["DISCOVERY_WINDOW_MINUTES"])

    nearby = (
        Device.query.filter(
            Device.is_active.is_(True),
            Device.last_seen >= window,
            ~Device.id.in_(my_device_ids or [0]),
        )
        .all()
    )
    return jsonify([d.to_dict(include_owner=True) for d in nearby])


@devices_bp.post("/pair")
@jwt_required()
def pair():
    """Establish a shared AES-256 session key between my device and a peer device,
    the way Bluetooth Secure Simple Pairing establishes a shared link key."""
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True)
    peer_mac = data.get("mac_address")

    my_device = user.devices[0] if user.devices else None
    if not my_device:
        return jsonify({"error": "No device registered for this account."}), 404

    peer_device = Device.query.filter_by(mac_address=peer_mac).first()
    if not peer_device or not peer_device.is_active:
        return jsonify({"error": "Peer device is not discoverable."}), 404

    key = generate_session_key()
    session = PairingSession(
        device_a_id=my_device.id,
        device_b_id=peer_device.id,
        session_key_hex=key_to_hex(key),
        expires_at=datetime.utcnow() + timedelta(minutes=current_app.config["PAIRING_SESSION_MINUTES"]),
    )
    db.session.add(session)
    db.session.commit()

    return jsonify(session.to_dict()), 201
