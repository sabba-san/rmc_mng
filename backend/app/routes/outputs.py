"""Research Output routes — publication/conference/patent declarations."""
from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db, limiter
from app.models.grant import Grant
from app.models.research_output import ResearchOutput
from app.models.user import User

outputs_bp = Blueprint("outputs", __name__)

VALID_TYPES = ("publication", "conference", "patent", "book_chapter", "report")
VALID_STATUSES = ("draft", "submitted", "accepted", "published")


def _current_user():
    return User.query.get(int(get_jwt_identity()))


@outputs_bp.route("/", methods=["GET"])
@jwt_required()
def list_outputs():
    user = _current_user()
    query = ResearchOutput.query
    if user.role == "researcher":
        query = query.filter_by(researcher_id=user.id)

    output_type = request.args.get("type")
    if output_type and output_type in VALID_TYPES:
        query = query.filter_by(output_type=output_type)

    grant_id = request.args.get("grant_id")
    if grant_id and grant_id.isdigit():
        query = query.filter_by(grant_id=int(grant_id))

    return jsonify([o.to_dict() for o in query.order_by(ResearchOutput.created_at.desc()).all()]), 200


@outputs_bp.route("/", methods=["POST"])
@jwt_required()
@limiter.limit("30 per hour")
def create_output():
    user = _current_user()
    if user.role not in ("researcher", "admin"):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    grant_id = data.get("grant_id")
    title = str(data.get("title", "")).strip()[:500]
    output_type = str(data.get("output_type", ""))

    if not grant_id or not title or output_type not in VALID_TYPES:
        return jsonify({"error": "grant_id, title, and valid output_type required"}), 400

    grant = Grant.query.get_or_404(grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    pub_date = None
    raw_date = data.get("publication_date")
    if raw_date:
        try:
            pub_date = date.fromisoformat(str(raw_date)[:10])
        except ValueError:
            pass

    output = ResearchOutput(
        grant_id=grant_id,
        researcher_id=user.id,
        output_type=output_type,
        title=title,
        authors=str(data.get("authors", "")).strip()[:500],
        journal_or_venue=str(data.get("journal_or_venue", "")).strip()[:300],
        publication_date=pub_date,
        doi_or_url=str(data.get("doi_or_url", "")).strip()[:500],
        impact_factor=data.get("impact_factor"),
        indexing=str(data.get("indexing", "")).strip()[:100],
        status=data.get("status", "draft") if data.get("status") in VALID_STATUSES else "draft",
    )
    db.session.add(output)
    db.session.commit()
    return jsonify(output.to_dict()), 201


@outputs_bp.route("/<int:output_id>", methods=["PUT"])
@jwt_required()
def update_output(output_id: int):
    user = _current_user()
    output = ResearchOutput.query.get_or_404(output_id)
    if user.role == "researcher" and output.researcher_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    for field in ["title", "authors", "journal_or_venue", "doi_or_url", "impact_factor", "indexing"]:
        if field in data:
            setattr(output, field, data[field])
    if "status" in data and data["status"] in VALID_STATUSES:
        output.status = data["status"]

    db.session.commit()
    return jsonify(output.to_dict()), 200


@outputs_bp.route("/<int:output_id>", methods=["DELETE"])
@jwt_required()
def delete_output(output_id: int):
    user = _current_user()
    output = ResearchOutput.query.get_or_404(output_id)
    if user.role == "researcher" and output.researcher_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    if user.role not in ("researcher", "admin"):
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(output)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
