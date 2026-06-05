from flask import Blueprint, request
from flask_login import login_user, logout_user, login_required, current_user

from auth import login_manager
from extensions import db
from models import User, Settings

auth_bp = Blueprint("auth", __name__)


@login_manager.user_loader
def load_user(user_id: str):
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return {"error": "Unauthorized"}, 401


def _validate_credentials(payload):
    if not isinstance(payload, dict):
        return None, ("Invalid request body", 400)

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return None, ("Email and password are required", 400)
    if "@" not in email or len(email) > 255:
        return None, ("Invalid email address", 400)
    if len(password) < 6:
        return None, ("Password must be at least 6 characters", 400)

    return {"email": email, "password": password}, None


@auth_bp.route("/register", methods=["POST"])
def register():
    creds, err = _validate_credentials(request.get_json(silent=True))
    if err:
        return {"error": err[0]}, err[1]

    if User.query.filter_by(email=creds["email"]).first():
        return {"error": "An account with that email already exists"}, 409

    user = User(email=creds["email"])
    user.set_password(creds["password"])
    settings = Settings(user=user)

    db.session.add(user)
    db.session.add(settings)
    db.session.commit()

    login_user(user, remember=True)
    return {"user": user.to_dict()}, 201


@auth_bp.route("/login", methods=["POST"])
def login():
    creds, err = _validate_credentials(request.get_json(silent=True))
    if err:
        return {"error": err[0]}, err[1]

    user = User.query.filter_by(email=creds["email"]).first()
    if not user or not user.check_password(creds["password"]):
        return {"error": "Invalid email or password"}, 401

    login_user(user, remember=True)
    return {"user": user.to_dict()}


@auth_bp.route("/guest", methods=["POST"])
def guest_login():
    """Create-or-retrieve a single shared guest account. The account uses a
    random password so it can only be accessed via this endpoint. Intended
    for users who want to try the app without registering."""
    import secrets

    email = "guest@pomodoro.local"
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(email=email, name="Guest")
        user.set_password(secrets.token_urlsafe(32))
        db.session.add(user)
        db.session.add(Settings(user=user))
        db.session.commit()
    login_user(user, remember=True)
    return {"user": user.to_dict()}


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return {"message": "Logged out"}


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return {"user": current_user.to_dict()}


@auth_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()

    if not name:
        return {"error": "Name is required"}, 400
    if len(name) > 100:
        return {"error": "Name must be 100 characters or fewer"}, 400

    user = User.query.get(int(current_user.get_id()))
    user.name = name
    db.session.commit()
    return {"user": user.to_dict()}


@auth_bp.route("/password", methods=["PUT"])
@login_required
def change_password():
    payload = request.get_json(silent=True) or {}
    current = payload.get("current_password") or ""
    new = payload.get("new_password") or ""

    if not current or not new:
        return {"error": "Current and new password are required"}, 400
    if len(new) < 6:
        return {"error": "New password must be at least 6 characters"}, 400
    if not current_user.check_password(current):
        return {"error": "Current password is incorrect"}, 401

    current_user.set_password(new)
    db.session.commit()
    return {"message": "Password updated"}


@auth_bp.route("/me", methods=["DELETE"])
@login_required
def delete_account():
    payload = request.get_json(silent=True) or {}
    confirmation = (payload.get("confirmation") or "").strip()
    if confirmation != current_user.email:
        return {
            "error": "Confirmation must match your email address"
        }, 400

    # Resolve a fresh, attached User instance for the cascade. The
    # `current_user` proxy becomes detached after `logout_user()`, which
    # would make `db.session.delete` raise on the next line.
    user = User.query.get(int(current_user.get_id()))
    if user is None:
        return {"error": "Account not found"}, 404

    logout_user()
    # Cascade deletes the user's tasks, sessions, and settings via the
    # relationship configuration on the User model.
    db.session.delete(user)
    db.session.commit()
    return {"message": "Account deleted"}
