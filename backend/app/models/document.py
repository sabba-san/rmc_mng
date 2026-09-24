"""Document model — secure document vault metadata (files stored outside web root)."""
from datetime import datetime

from app import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    grant_id = db.Column(db.Integer, db.ForeignKey("grants.id"), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    doc_type = db.Column(
        db.Enum("proposal", "receipt", "progress_report", "publication_proof", "other",
                name="doc_types"),
        nullable=False,
    )
    original_filename = db.Column(db.String(300))   # stored for display only
    stored_filename = db.Column(db.String(300), nullable=False)  # UUID-based, non-guessable
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    grant = db.relationship("Grant", back_populates="documents")
    uploader = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "grant_id": self.grant_id,
            "uploader": self.uploader.to_dict() if self.uploader else None,
            "doc_type": self.doc_type,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "created_at": self.created_at.isoformat(),
        }
