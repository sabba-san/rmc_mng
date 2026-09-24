"""ResearchOutput model — publications, conferences, patents linked to grants."""
from datetime import datetime

from app import db


class ResearchOutput(db.Model):
    __tablename__ = "research_outputs"

    id = db.Column(db.Integer, primary_key=True)
    grant_id = db.Column(db.Integer, db.ForeignKey("grants.id"), nullable=False)
    researcher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    output_type = db.Column(
        db.Enum("publication", "conference", "patent", "book_chapter", "report",
                name="output_types"),
        nullable=False,
    )
    title = db.Column(db.String(500), nullable=False)
    authors = db.Column(db.String(500))
    journal_or_venue = db.Column(db.String(300))
    publication_date = db.Column(db.Date)
    doi_or_url = db.Column(db.String(500))
    impact_factor = db.Column(db.Float)
    indexing = db.Column(db.String(100))  # e.g. Scopus, ISI, Q1
    status = db.Column(
        db.Enum("draft", "submitted", "accepted", "published", name="output_statuses"),
        default="draft",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    grant = db.relationship("Grant", back_populates="outputs")
    researcher = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "grant_id": self.grant_id,
            "researcher": self.researcher.to_dict() if self.researcher else None,
            "output_type": self.output_type,
            "title": self.title,
            "authors": self.authors,
            "journal_or_venue": self.journal_or_venue,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "doi_or_url": self.doi_or_url,
            "impact_factor": self.impact_factor,
            "indexing": self.indexing,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
