from datetime import datetime

from dateutil import parser as dateparser
from flask import Blueprint, request
from flask_login import login_required, current_user

from extensions import db
from models import PomodoroSession, Task

sessions_bp = Blueprint("sessions", __name__)

VALID_SESSION_TYPES = {"work", "shortBreak", "longBreak"}


@sessions_bp.route("", methods=["GET"])
@login_required
def list_sessions():
    limit = min(int(request.args.get("limit", 100)), 500)
    sessions = (
        PomodoroSession.query.filter_by(user_id=current_user.id)
        .order_by(PomodoroSession.completed_at.desc())
        .limit(limit)
        .all()
    )
    return {"sessions": [s.to_dict() for s in sessions]}


@sessions_bp.route("", methods=["POST"])
@login_required
def log_session():
    data = request.get_json(silent=True) or {}

    session_type = data.get("session_type")
    if session_type not in VALID_SESSION_TYPES:
        return {"error": "session_type must be one of work, shortBreak, longBreak"}, 400

    try:
        duration_seconds = int(data.get("duration_seconds"))
    except (TypeError, ValueError):
        return {"error": "duration_seconds must be an integer"}, 400
    if duration_seconds < 1 or duration_seconds > 3600:
        return {"error": "duration_seconds must be between 1 and 3600"}, 400

    task_id = data.get("task_id")
    task = None
    if task_id is not None:
        try:
            task_id = int(task_id)
        except (TypeError, ValueError):
            return {"error": "task_id must be an integer"}, 400
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        if not task:
            return {"error": "Task not found"}, 404

    completed_at = datetime.utcnow()
    if data.get("completed_at"):
        try:
            completed_at = dateparser.isoparse(data["completed_at"]).replace(tzinfo=None)
        except (ValueError, TypeError):
            return {"error": "completed_at must be an ISO 8601 datetime"}, 400

    session = PomodoroSession(
        user_id=current_user.id,
        task_id=task.id if task else None,
        session_type=session_type,
        duration_seconds=duration_seconds,
        completed_at=completed_at,
    )
    db.session.add(session)

    if task and session_type == "work":
        task.completed_pomodoros = (task.completed_pomodoros or 0) + 1
        if task.estimated_pomodoros and task.completed_pomodoros >= task.estimated_pomodoros:
            task.is_completed = True

    db.session.commit()
    return {"session": session.to_dict()}, 201
