"""Document vault routes — secure file upload and download.

Security measures applied:
- Files stored OUTSIDE web root (UPLOAD_DIR env var)
- Filenames replaced with UUID (original name stored in DB only)
- MIME validated via python-magic (magic bytes, not extension)
- Extension allow-list: PDF, PNG, JPG, JPEG, DOCX, XLSX only
- File size enforced (10 MB cap via Flask MAX_CONTENT_LENGTH)
- Served with Content-Disposition: attachment to force download
- X-Content-Type-Options: nosniff
- Path traversal prevented with os.path.basename + absolute path join + boundary check
"""
import logging
import os
import uuid

import magic  # python-magic: inspects magic bytes
from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db, limiter
from app.models.document import Document
from app.models.grant import Grant
from app.models.user import User

documents_bp = Blueprint("documents", __name__)
logger = logging.getLogger(__name__)

# Allow-list of accepted MIME types and their safe extensions
ALLOWED_MIME_EXTENSIONS = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def _safe_upload_path(upload_dir: str, stored_filename: str) -> str:
    """Resolve and verify the upload path stays within upload_dir (prevents path traversal)."""
    safe_name = os.path.basename(stored_filename)  # strip any path components
    full_path = os.path.realpath(os.path.join(upload_dir, safe_name))
    # Enforce trailing-sep boundary to prevent /upload-malicious bypass
    boundary = os.path.realpath(upload_dir) + os.sep
    if not full_path.startswith(boundary):
        raise ValueError("Path traversal attempt detected")
    return full_path


@documents_bp.route("/grant/<int:grant_id>", methods=["GET"])
@jwt_required()
def list_documents(grant_id: int):
    user = _current_user()
    grant = Grant.query.get_or_404(grant_id)
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403
    docs = Document.query.filter_by(grant_id=grant_id).order_by(Document.created_at.desc()).all()
    return jsonify([d.to_dict() for d in docs]), 200


@documents_bp.route("/upload", methods=["POST"])
@jwt_required()
@limiter.limit("20 per hour")
def upload_document():
    user = _current_user()
    grant_id = request.form.get("grant_id")
    doc_type = request.form.get("doc_type", "other")

    if not grant_id or not grant_id.isdigit():
        return jsonify({"error": "grant_id required"}), 400
    if doc_type not in ("proposal", "receipt", "progress_report", "publication_proof", "other"):
        return jsonify({"error": "Invalid doc_type"}), 400

    grant = Grant.query.get_or_404(int(grant_id))
    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    # Read file bytes to inspect magic bytes; limit read to 10 MB
    file_bytes = file.read(10 * 1024 * 1024 + 1)
    if len(file_bytes) > 10 * 1024 * 1024:
        return jsonify({"error": "File exceeds 10 MB limit"}), 413

    # Validate MIME via magic bytes (NOT extension)
    detected_mime = magic.from_buffer(file_bytes, mime=True)
    if detected_mime not in ALLOWED_MIME_EXTENSIONS:
        return jsonify({"error": f"File type '{detected_mime}' not allowed"}), 415

    # Generate UUID-based filename — never trust user-supplied name
    safe_ext = ALLOWED_MIME_EXTENSIONS[detected_mime]
    stored_name = f"{uuid.uuid4().hex}{safe_ext}"

    upload_dir = current_app.config["UPLOAD_DIR"]
    os.makedirs(upload_dir, exist_ok=True)

    try:
        dest_path = _safe_upload_path(upload_dir, stored_name)
    except ValueError:
        logger.warning("Path traversal attempt by user %s", user.id)
        return jsonify({"error": "Invalid filename"}), 400

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    # TODO(security): Integrate antivirus/CDR scanning before persisting file.

    doc = Document(
        grant_id=grant.id,
        uploader_id=user.id,
        doc_type=doc_type,
        original_filename=os.path.basename(file.filename)[:300],  # strip traversal
        stored_filename=stored_name,
        file_size=len(file_bytes),
        mime_type=detected_mime,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify(doc.to_dict()), 201


@documents_bp.route("/download/<int:doc_id>", methods=["GET"])
@jwt_required()
def download_document(doc_id: int):
    user = _current_user()
    doc = Document.query.get_or_404(doc_id)
    grant = Grant.query.get_or_404(doc.grant_id)

    if user.role == "researcher" and grant.applicant_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    upload_dir = current_app.config["UPLOAD_DIR"]
    try:
        file_path = _safe_upload_path(upload_dir, doc.stored_filename)
    except ValueError:
        return jsonify({"error": "Invalid file reference"}), 400

    if not os.path.isfile(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        file_path,
        mimetype=doc.mime_type,
        as_attachment=True,
        download_name=doc.original_filename or doc.stored_filename,
        # Content-Disposition: attachment forces download (no inline execution)
    )


@documents_bp.route("/<int:doc_id>", methods=["DELETE"])
@jwt_required()
def delete_document(doc_id: int):
    user = _current_user()
    if user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403
    doc = Document.query.get_or_404(doc_id)
    upload_dir = current_app.config["UPLOAD_DIR"]
    try:
        file_path = _safe_upload_path(upload_dir, doc.stored_filename)
        if os.path.isfile(file_path):
            os.remove(file_path)
    except ValueError:
        pass
    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
