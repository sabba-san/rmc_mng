"""Grant routes — CRUD + status workflow transitions."""
import logging
from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db, limiter
from app.models.grant import Grant
from app.models.user import User

grants_bp = Blueprint("grants", __name__)
logger = logging.getLogger(__name__)

ALLOWED_STATUSES = ("draft", "pending", "under_review", "approved", "rejected", "completed")
ALLOWED_TRANSITIONS = {
    # researcher can submit draft
    "researcher": {"draft": "pending"},
    # admin can move pending → under_review and under_review → approved/rejected
    "admin": {"pending": ["under_review"], "under_review": ["approved", "rejected", "pending"]},
    # reviewer can approve/reject
    "reviewer": {"under_review": ["approved", "rejected"]},
}


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def _require_roles(*roles):
    user = _current_user()
    if not user or user.role not in roles:
        return None, (jsonify({"error": "Forbidden"}), 403)
    return user, None


@grants_bp.route("/", methods=["GET"])
@jwt_required()
@limiter.limit("60 per minute")
def list_grants():
    user = _current_user()
    query = Grant.query
    if user.role == "researcher":
        query = query.filter_by(applicant_id=user.id)

    status = request.args.get("status")
    if status and status in ALLOWED_STATUSES:
        query = query.filter_by(status=status)

    grants = query.order_by(Grant.created_at.desc()).all()
    return jsonify([g.to_dict() for g in grants]), 200


@grants_bp.route("/<int:grant_id>", methods=["GET"])
@jwt_required()
def get_grant(grant_id: int):
    user = _current_user()
    grant = Grant.query.get_or_404(grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(grant.to_dict()), 200


@grants_bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("20 per hour")
def create_grant():
    user, err = _require_roles("researcher")
    if err:
        return err
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()[:300]
    description = str(data.get("description", "")).strip()
    grant_type = str(data.get("grant_type", ""))
    amount = data.get("amount_requested")

    if not title or not grant_type or amount is None:
        return jsonify({"error": "title, grant_type, amount_requested required"}), 400
    if grant_type not in ("internal", "external", "industry"):
        return jsonify({"error": "Invalid grant_type"}), 400
    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    start_date = _parse_date(data.get("start_date"))
    end_date = _parse_date(data.get("end_date"))

    grant = Grant(
        title=title,
        description=description,
        grant_type=grant_type,
        amount_requested=amount,
        status="draft",
        applicant_id=user.id,
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(grant)
    db.session.commit()
    return jsonify(grant.to_dict()), 201


@grants_bp.route("/<int:grant_id>", methods=["PUT"])
@jwt_required()
def update_grant(grant_id: int):
    user = _current_user()
    grant = Grant.query.get_or_404(grant_id)

    if user.role == "researcher":
        if grant.applicant_id != user.id or grant.status != "draft":
            return jsonify({"error": "Can only edit own draft grants"}), 403
        allowed_fields = ["title", "description", "grant_type", "amount_requested", "start_date", "end_date"]
    elif user.role in ("admin", "reviewer"):
        allowed_fields = ["status", "amount_approved", "rejection_reason", "reviewer_id"]
    else:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    for field in allowed_fields:
        if field in data:
            if field in ("start_date", "end_date"):
                setattr(grant, field, _parse_date(data[field]))
            elif field == "status":
                _validate_transition(user, grant, data["status"])
                grant.status = data["status"]
            else:
                setattr(grant, field, data[field])

    db.session.commit()
    return jsonify(grant.to_dict()), 200


@grants_bp.route("/<int:grant_id>/submit", methods=["POST"])
@jwt_required()
def submit_grant(grant_id: int):
    user, err = _require_roles("researcher")
    if err:
        return err
    grant = Grant.query.get_or_404(grant_id)
    if grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    if grant.status != "draft":
        return jsonify({"error": "Only draft grants can be submitted"}), 400
    grant.status = "pending"
    db.session.commit()
    return jsonify(grant.to_dict()), 200


def _validate_transition(user: User, grant: Grant, new_status: str):
    """Raises ValueError if the status transition is not allowed for the user's role."""
    transitions = ALLOWED_TRANSITIONS.get(user.role, {})
    allowed = transitions.get(grant.status, [])
    if isinstance(allowed, str):
        allowed = [allowed]
    if new_status not in allowed:
        raise ValueError(f"Transition from {grant.status} to {new_status} not permitted.")


def _parse_date(val) -> date | None:
    if not val:
        return None
    try:
        return date.fromisoformat(str(val)[:10])
    except ValueError:
        return None
