"""Milestone model — progress tracking within a grant."""
from datetime import datetime

from app import db


class Milestone(db.Model):
    __tablename__ = "milestones"

    id = db.Column(db.Integer, primary_key=True)
    grant_id = db.Column(db.Integer, db.ForeignKey("grants.id"), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date)
    status = db.Column(
        db.Enum("pending", "in_progress", "completed", "overdue", name="milestone_statuses"),
        default="pending",
    )
    report_type = db.Column(
        db.Enum("6_month", "12_month", "final", "ad_hoc", name="report_types")
    )
    progress_notes = db.Column(db.Text)
    financial_claim_amount = db.Column(db.Numeric(15, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    grant = db.relationship("Grant", back_populates="milestones")

    def to_dict(self):
        return {
            "id": self.id,
            "grant_id": self.grant_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "report_type": self.report_type,
            "progress_notes": self.progress_notes,
            "financial_claim_amount": float(self.financial_claim_amount) if self.financial_claim_amount else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
