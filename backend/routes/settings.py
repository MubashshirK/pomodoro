from flask import Blueprint, request
from flask_login import login_required, current_user

from extensions import db
from models import Settings

settings_bp = Blueprint("settings", __name__)

VALID_THEMES = {"light", "dark", "system"}
INT_FIELDS = {
    "work_duration": (1, 180),
    "short_break_duration": (1, 60),
    "long_break_duration": (1, 120),
    "cycles_until_long_break": (2, 8),
    "volume": (0, 100),
}
BOOL_FIELDS = {"auto_start", "sound_enabled", "notifications_enabled"}


def _get_or_create_settings() -> Settings:
    s = Settings.query.filter_by(user_id=current_user.id).first()
    if not s:
        s = Settings(user_id=current_user.id)
        db.session.add(s)
        db.session.commit()
    return s


def _apply_updates(settings: Settings, data: dict, partial: bool):
    for field, (lo, hi) in INT_FIELDS.items():
        if field in data:
            try:
                value = int(data[field])
            except (TypeError, ValueError):
                return f"{field} must be an integer"
            if value < lo or value > hi:
                return f"{field} must be between {lo} and {hi}"
            setattr(settings, field, value)
        elif not partial and field not in data:
            return f"{field} is required"

    for field in BOOL_FIELDS:
        if field in data:
            value = data[field]
            if not isinstance(value, bool):
                return f"{field} must be a boolean"
            setattr(settings, field, value)

    if "theme" in data:
        if data["theme"] not in VALID_THEMES:
            return "theme must be one of light, dark, system"
        settings.theme = data["theme"]

    return None


@settings_bp.route("", methods=["GET"])
@login_required
def get_settings():
    s = _get_or_create_settings()
    return {"settings": s.to_dict()}


@settings_bp.route("", methods=["PUT"])
@login_required
def put_settings():
    s = _get_or_create_settings()
    err = _apply_updates(s, request.get_json(silent=True) or {}, partial=True)
    if err:
        return {"error": err}, 400
    db.session.commit()
    return {"settings": s.to_dict()}
