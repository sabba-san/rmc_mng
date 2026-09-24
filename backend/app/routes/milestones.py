"""Milestone routes — progress report and financial claim management."""
from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db, limiter
from app.models.grant import Grant
from app.models.milestone import Milestone
from app.models.user import User

milestones_bp = Blueprint("milestones", __name__)


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def _parse_date(val):
    if not val:
        return None
    try:
        return date.fromisoformat(str(val)[:10])
    except ValueError:
        return None


@milestones_bp.route("/grant/<int:grant_id>", methods=["GET"])
@jwt_required()
def list_milestones(grant_id: int):
    user = _current_user()
    grant = Grant.query.get_or_404(grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    milestones = Milestone.query.filter_by(grant_id=grant_id).order_by(Milestone.due_date).all()
    return jsonify([m.to_dict() for m in milestones]), 200


@milestones_bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("30 per hour")
def create_milestone():
    user = _current_user()
    if user.role not in ("researcher", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    data = request.get_json(silent=True) or {}
    grant_id = data.get("grant_id")
    title = str(data.get("title", "")).strip()[:300]
    if not grant_id or not title:
        return jsonify({"error": "grant_id and title required"}), 400

    grant = Grant.query.get_or_404(grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    report_type = data.get("report_type")
    if report_type and report_type not in ("6_month", "12_month", "final", "ad_hoc"):
        return jsonify({"error": "Invalid report_type"}), 400

    milestone = Milestone(
        grant_id=grant_id,
        title=title,
        description=str(data.get("description", "")).strip(),
        due_date=_parse_date(data.get("due_date")),
        report_type=report_type,
        financial_claim_amount=data.get("financial_claim_amount"),
    )
    db.session.add(milestone)
    db.session.commit()
    return jsonify(milestone.to_dict()), 201


@milestones_bp.route("/<int:ms_id>", methods=["PUT"])
@jwt_required()
def update_milestone(ms_id: int):
    user = _current_user()
    ms = Milestone.query.get_or_404(ms_id)
    grant = Grant.query.get_or_404(ms.grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    allowed = ["title", "description", "due_date", "status", "progress_notes", "financial_claim_amount"]
    valid_statuses = ("pending", "in_progress", "completed", "overdue")

    for field in allowed:
        if field in data:
            if field == "status" and data[field] not in valid_statuses:
                return jsonify({"error": "Invalid status"}), 400
            if field == "due_date":
                setattr(ms, field, _parse_date(data[field]))
            else:
                setattr(ms, field, data[field])

    db.session.commit()
    return jsonify(ms.to_dict()), 200


@milestones_bp.route("/<int:ms_id>", methods=["DELETE"])
@jwt_required()
def delete_milestone(ms_id: int):
    user = _current_user()
    if user.role not in ("admin",):
        return jsonify({"error": "Forbidden"}), 403
    ms = Milestone.query.get_or_404(ms_id)
    db.session.delete(ms)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
