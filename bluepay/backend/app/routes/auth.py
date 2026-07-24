import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from .. import db
from ..models import User, Wallet, Device
from ..config import Config

auth_bp = Blueprint("auth", __name__)


def _random_mac():
    return ":".join("%02X" % random.randint(0, 255) for _ in range(6))


@auth_bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    device_name = (data.get("device_name") or f"{name}'s phone").strip()

    if not name or not email or len(password) < 6:
        return jsonify({"error": "Name, a valid email, and a password of at least 6 characters are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    wallet = Wallet(user_id=user.id, balance=Config.STARTING_BALANCE)
    db.session.add(wallet)

    device = Device(user_id=user.id, device_name=device_name, mac_address=_random_mac())
    db.session.add(device)

    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Incorrect email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})
