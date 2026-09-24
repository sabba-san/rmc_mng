"""User model — stores credentials using Argon2 (memory-hard hashing)."""
from datetime import datetime

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    # Argon2 hash — never plaintext
    password_hash = db.Column(db.String(512), nullable=False)
    role = db.Column(db.Enum("researcher", "admin", "reviewer", name="user_roles"), nullable=False)
    department = db.Column(db.String(150))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    grants = db.relationship("Grant", back_populates="applicant", foreign_keys="Grant.applicant_id")

    def to_dict(self):
        """Never expose password_hash."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
