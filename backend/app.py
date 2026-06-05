import logging
import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.pool import NullPool

from extensions import db
from auth import login_manager
from models import User, Settings
from routes import auth_bp, tasks_bp, sessions_bp, settings_bp, stats_bp

log = logging.getLogger("backend.app")


def create_app(config_overrides: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db_url = os.environ.get("DATABASE_URL", "sqlite:///pomodoro.db")
    # Log the scheme + host (no password) so we can verify the env var
    # is what we expect without leaking secrets into the function logs.
    try:
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        log.info(
            "DATABASE_URL scheme=%s host=%s db=%s query=%s",
            parsed.scheme, parsed.hostname, parsed.path.lstrip("/"),
            parsed.query or "(none)",
        )
    except Exception:
        log.exception("Could not parse DATABASE_URL")

    app.config.update(
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY", "dev-secret-change-in-prod"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL", "sqlite:///pomodoro.db"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        # NullPool: each request opens a fresh DB connection and closes it
        # after. This avoids cross-instance pool exhaustion on serverless
        # hosts (Vercel) and is harmless for local dev. pool_pre_ping
        # transparently reconnects if the server has dropped the socket
        # (matters for Neon auto-suspend).
        SQLALCHEMY_ENGINE_OPTIONS={
            "poolclass": NullPool,
            "pool_pre_ping": True,
        },
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=os.environ.get("FLASK_ENV") == "production",
        REMEMBER_COOKIE_SAMESITE="Lax",
        REMEMBER_COOKIE_HTTPONLY=True,
        REMEMBER_COOKIE_SECURE=os.environ.get("FLASK_ENV") == "production",
        JSON_SORT_KEYS=False,
    )

    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    login_manager.init_app(app)

    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            # Vercel production + preview deployments
            "https://pomodoro-pro-ten.vercel.app",
        ],
    )

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(sessions_bp, url_prefix="/api/sessions")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    register_error_handlers(app)
    register_root_routes(app)

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        if os.environ.get("FLASK_ENV") != "production":
            seed_dev_user()

    return app


def _run_lightweight_migrations() -> None:
    """Apply additive column migrations that `db.create_all` won't perform
    on an existing database. Safe to run on every startup."""
    inspector = db.inspect(db.engine)
    user_cols = {c["name"] for c in inspector.get_columns("users")}
    if "name" not in user_cols:
        db.session.execute(db.text("ALTER TABLE users ADD COLUMN name VARCHAR(100)"))
        db.session.commit()


def seed_dev_user() -> None:
    email = "dev@local.test"
    password = "password"
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.add(Settings(user=user))
        db.session.commit()


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": getattr(e, "description", "Bad request")}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        # Log the full traceback so Vercel function logs show the
        # actual cause (Flask's default propagation to stderr is
        # unreliable on the Vercel Python runtime).
        import logging, traceback
        logging.getLogger("flask.app").error(
            "Unhandled 500: %s\n%s", e, traceback.format_exc()
        )
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        # Catch-all so ANY uncaught exception is logged with traceback
        # (Flask's default 500 handler does this, but Vercel often
        # drops stderr from the WSGI path; this makes it explicit).
        import logging, traceback
        logging.getLogger("flask.app").error(
            "Unhandled exception: %s\n%s", e, traceback.format_exc()
        )
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


def register_root_routes(app: Flask) -> None:
    @app.route("/api/health")
    def health():
        return {"status": "ok"}
