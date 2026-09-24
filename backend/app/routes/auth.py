"""Auth routes — login, logout, register, current-user."""
import logging
import re

import argon2
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from app import db, limiter
from app.models.user import User

auth_bp = Blueprint("auth", __name__)
ph = argon2.PasswordHasher()
logger = logging.getLogger(__name__)

# Password strength: min 8 chars, at least one letter and one digit
_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,128}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _bad(msg: str, code: int = 400):
    return jsonify({"error": msg}), code


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()[:150]
    password = str(data.get("password", ""))

    if not email or not password:
        return _bad("Email and password required.")

    user = User.query.filter_by(email=email, is_active=True).first()

    # Always run verify to avoid timing attacks even if user not found
    try:
        if user:
            ph.verify(user.password_hash, password)
        else:
            ph.verify(ph.hash("dummy"), "dummy")  # constant-time dummy verify
            raise argon2.exceptions.VerifyMismatchError
    except (argon2.exceptions.VerifyMismatchError, argon2.exceptions.VerificationError):
        logger.info("Failed login attempt for email (redacted).")
        return _bad("Invalid credentials.", 401)

    token = create_access_token(identity=str(user.id))
    # TODO(security): Consider implementing MFA for admin/reviewer roles.
    return jsonify({"access_token": token, "user": user.to_dict()}), 200


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per hour")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()[:150]
    email = str(data.get("email", "")).strip().lower()[:150]
    password = str(data.get("password", ""))
    department = str(data.get("department", "")).strip()[:150]
    role = str(data.get("role", "researcher"))

    if role not in ("researcher",):  # self-registration only as researcher
        return _bad("Invalid role.", 403)
    if not name or not email or not password:
        return _bad("Name, email, and password are required.")
    if not _EMAIL_RE.match(email):
        return _bad("Invalid email format.")
    if not _PASSWORD_RE.match(password):
        return _bad("Password must be 8–128 chars with at least one letter and one digit.")
    if User.query.filter_by(email=email).first():
        return _bad("Email already registered.", 409)

    user = User(
        name=name,
        email=email,
        password_hash=ph.hash(password),
        role="researcher",
        department=department,
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 201


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200
