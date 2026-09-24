"""Dashboard routes — aggregated stats for role-based dashboards."""
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app import db
from app.models.grant import Grant
from app.models.milestone import Milestone
from app.models.research_output import ResearchOutput
from app.models.user import User

dashboard_bp = Blueprint("dashboard", __name__)


def _current_user():
    return User.query.get(int(get_jwt_identity()))


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    user = _current_user()

    if user.role == "researcher":
        return _researcher_stats(user)
    elif user.role == "admin":
        return _admin_stats()
    elif user.role == "reviewer":
        return _reviewer_stats()
    return jsonify({"error": "Forbidden"}), 403


def _researcher_stats(user: User):
    grants = Grant.query.filter_by(applicant_id=user.id).all()
    grant_ids = [g.id for g in grants]

    outputs = ResearchOutput.query.filter_by(researcher_id=user.id).count()
    milestones_pending = Milestone.query.filter(
        Milestone.grant_id.in_(grant_ids), Milestone.status == "pending"
    ).count()

    status_counts = {s: 0 for s in ("draft", "pending", "under_review", "approved", "rejected", "completed")}
    for g in grants:
        status_counts[g.status] = status_counts.get(g.status, 0) + 1

    total_approved = sum(
        float(g.amount_approved or 0) for g in grants if g.status in ("approved", "completed")
    )

    return jsonify({
        "role": "researcher",
        "total_grants": len(grants),
        "grant_status_breakdown": status_counts,
        "total_approved_funding": total_approved,
        "total_research_outputs": outputs,
        "pending_milestones": milestones_pending,
        "recent_grants": [g.to_dict() for g in sorted(grants, key=lambda x: x.created_at, reverse=True)[:5]],
    }), 200


def _admin_stats():
    total_grants = Grant.query.count()
    pending = Grant.query.filter_by(status="pending").count()
    under_review = Grant.query.filter_by(status="under_review").count()
    approved = Grant.query.filter_by(status="approved").count()
    total_researchers = User.query.filter_by(role="researcher", is_active=True).count()
    total_outputs = ResearchOutput.query.count()
    total_amount = db.session.query(func.sum(Grant.amount_approved)).filter(
        Grant.status.in_(["approved", "completed"])
    ).scalar() or 0

    output_by_type = db.session.query(
        ResearchOutput.output_type, func.count(ResearchOutput.id)
    ).group_by(ResearchOutput.output_type).all()

    grants_by_type = db.session.query(
        Grant.grant_type, func.count(Grant.id)
    ).group_by(Grant.grant_type).all()

    recent_grants = Grant.query.order_by(Grant.created_at.desc()).limit(8).all()

    return jsonify({
        "role": "admin",
        "total_grants": total_grants,
        "pending_review": pending,
        "under_review": under_review,
        "approved": approved,
        "total_researchers": total_researchers,
        "total_research_outputs": total_outputs,
        "total_approved_funding": float(total_amount),
        "output_by_type": dict(output_by_type),
        "grants_by_type": dict(grants_by_type),
        "recent_grants": [g.to_dict() for g in recent_grants],
    }), 200


def _reviewer_stats():
    pending_review = Grant.query.filter_by(status="under_review").all()
    return jsonify({
        "role": "reviewer",
        "grants_awaiting_review": len(pending_review),
        "recent_submissions": [g.to_dict() for g in pending_review[:10]],
    }), 200
