"""RMC System - Flask Application Factory."""
import logging
import os
import secrets

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

# Configure logging — never log credentials or tokens
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def get_secret(env_var: str, file_path: str) -> str:
    """Secure multi-tiered secret resolution: ENV → file → ephemeral random."""
    if os.getenv(env_var):
        return os.getenv(env_var)
    if os.path.exists(file_path):
        return open(file_path).read().strip()
    val = secrets.token_hex(32)
    logger.warning(
        "No %s found. Generated ephemeral secret — NOT suitable for multi-instance prod!",
        env_var,
    )
    return val


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__, static_folder=None)

    # ─── Security: load config from env, never hardcode secrets ───────────────
    app.config["SECRET_KEY"] = get_secret("SECRET_KEY", "secret_key.txt")
    app.config["JWT_SECRET_KEY"] = get_secret("JWT_SECRET_KEY", "jwt_secret.txt")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour
    app.config["JWT_ALGORITHM"] = "HS256"  # hardcoded, never derived from token

    # Database
    db_url = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'rmc.db')}",
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # File uploads — stored OUTSIDE web root, UUID-renamed
    upload_dir = os.path.abspath(
        os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    )
    app.config["UPLOAD_DIR"] = upload_dir
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB hard limit

    # ─── Extensions ───────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    # CORS — allow only trusted origins
    allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # ─── Security headers on every response ───────────────────────────────────
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; object-src 'none';"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

    # ─── Blueprints ───────────────────────────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.grants import grants_bp
    from app.routes.milestones import milestones_bp
    from app.routes.outputs import outputs_bp
    from app.routes.documents import documents_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(grants_bp, url_prefix="/api/grants")
    app.register_blueprint(milestones_bp, url_prefix="/api/milestones")
    app.register_blueprint(outputs_bp, url_prefix="/api/outputs")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    with app.app_context():
        db.create_all()
        _seed_demo_data()

    return app


def _seed_demo_data():
    """Seed initial demo users if DB is empty."""
    from app.models.user import User
    import argon2

    if User.query.count() > 0:
        return

    ph = argon2.PasswordHasher()
    users = [
        User(name="Alice Researcher", email="researcher@uum.edu.my", role="researcher",
             password_hash=ph.hash("Researcher@123"), department="Computer Science"),
        User(name="Bob Admin", email="admin@uum.edu.my", role="admin",
             password_hash=ph.hash("Admin@123"), department="RMC"),
        User(name="Carol Dean", email="dean@uum.edu.my", role="reviewer",
             password_hash=ph.hash("Dean@123"), department="Faculty of Science"),
    ]
    for u in users:
        db.session.add(u)
    db.session.commit()
    logger.info("Demo users seeded.")
