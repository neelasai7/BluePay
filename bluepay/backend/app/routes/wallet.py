from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User

wallet_bp = Blueprint("wallet", __name__)


@wallet_bp.get("")
@jwt_required()
def get_wallet():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify(user.wallet.to_dict())
