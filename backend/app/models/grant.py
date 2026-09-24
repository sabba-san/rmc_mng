"""Grant model — core funding application entity."""
from datetime import datetime

from app import db


class Grant(db.Model):
    __tablename__ = "grants"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    grant_type = db.Column(
        db.Enum("internal", "external", "industry", name="grant_types"), nullable=False
    )
    amount_requested = db.Column(db.Numeric(15, 2), nullable=False)
    amount_approved = db.Column(db.Numeric(15, 2))
    status = db.Column(
        db.Enum(
            "draft", "pending", "under_review", "approved", "rejected", "completed",
            name="grant_statuses",
        ),
        default="draft",
        nullable=False,
    )
    applicant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = db.relationship("User", back_populates="grants", foreign_keys=[applicant_id])
    reviewer = db.relationship("User", foreign_keys=[reviewer_id])
    milestones = db.relationship("Milestone", back_populates="grant", cascade="all, delete-orphan")
    outputs = db.relationship("ResearchOutput", back_populates="grant", cascade="all, delete-orphan")
    documents = db.relationship("Document", back_populates="grant", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "grant_type": self.grant_type,
            "amount_requested": float(self.amount_requested) if self.amount_requested else None,
            "amount_approved": float(self.amount_approved) if self.amount_approved else None,
            "status": self.status,
            "applicant": self.applicant.to_dict() if self.applicant else None,
            "reviewer": self.reviewer.to_dict() if self.reviewer else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "rejection_reason": self.rejection_reason,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
