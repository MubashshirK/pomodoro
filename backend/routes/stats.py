from datetime import datetime, timedelta, date

from flask import Blueprint, request
from flask_login import login_required, current_user

from extensions import db
from models import PomodoroSession, Task

stats_bp = Blueprint("stats", __name__)

PERIOD_DAYS = {"day": 1, "week": 7, "month": 30}


def _parse_period(value: str | None) -> str:
    if value in PERIOD_DAYS:
        return value
    return "week"


def _tz_offset() -> int:
    """Client-supplied UTC offset in minutes (e.g. 330 for UTC+5:30).
    Falls back to 0 (UTC) if not provided or invalid."""
    raw = request.args.get("tz_offset")
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def _local_now() -> datetime:
    """Naive datetime representing the user's local 'now'."""
    return datetime.utcnow() + timedelta(minutes=_tz_offset())


def _work_days(user_id: int) -> set:
    """Distinct local calendar days on which the user completed at least one
    work session. Computed in Python for portability across SQLite / Postgres
    — the previous SQL used a SQLite-only `datetime()` modifier string."""
    offset = _tz_offset()
    rows = (
        db.session.query(PomodoroSession.completed_at)
        .filter(
            PomodoroSession.user_id == user_id,
            PomodoroSession.session_type == "work",
        )
        .all()
    )
    days: set = set()
    for (completed_at,) in rows:
        local_d = (completed_at + timedelta(minutes=offset)).date()
        days.add(local_d)
    return days


def _streak(user_id: int) -> int:
    days = _work_days(user_id)
    if not days:
        return 0
    today = _local_now().date()
    current = today
    if current not in days:
        current = today - timedelta(days=1)
        if current not in days:
            return 0
    streak = 0
    while current in days:
        streak += 1
        current -= timedelta(days=1)
    return streak


@stats_bp.route("", methods=["GET"])
@login_required
def get_stats():
    period = _parse_period(request.args.get("period"))
    days = PERIOD_DAYS[period]
    offset = _tz_offset()
    # Range stays in UTC — completed_at is stored in UTC. We just need
    # enough history to cover `days` local days, which is at most `days`
    # UTC days as well (offset only shifts by a few hours at most).
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    rows = (
        db.session.query(
            PomodoroSession.completed_at,
            PomodoroSession.session_type,
            PomodoroSession.duration_seconds,
        )
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.completed_at >= start,
        )
        .all()
    )

    by_type = {"work": 0, "shortBreak": 0, "longBreak": 0}
    per_day_map: dict = {}
    total_pomodoros = 0
    total_focus_seconds = 0

    for completed_at, session_type, duration in rows:
        by_type[session_type] = by_type.get(session_type, 0) + 1
        if session_type == "work":
            local_d = (completed_at + timedelta(minutes=offset)).date()
            key = local_d.isoformat()
            total_pomodoros += 1
            total_focus_seconds += duration
            bucket = per_day_map.setdefault(key, {"count": 0, "focus_seconds": 0})
            bucket["count"] += 1
            bucket["focus_seconds"] += duration

    per_day = []
    # Use the client's local "today" so the chart always shows the user's
    # current calendar day as the latest bucket, even near midnight UTC.
    today = _local_now().date()
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        bucket = per_day_map.get(key, {"count": 0, "focus_seconds": 0})
        per_day.append({"date": key, **bucket})

    top_tasks = (
        Task.query.filter(
            Task.user_id == current_user.id,
            Task.completed_pomodoros > 0,
        )
        .order_by(Task.completed_pomodoros.desc(), Task.id.asc())
        .limit(5)
        .all()
    )

    return {
        "period": period,
        "range_start": start.isoformat() + "Z",
        "range_end": now.isoformat() + "Z",
        "total_pomodoros": total_pomodoros,
        "total_focus_seconds": total_focus_seconds,
        "current_streak": _streak(current_user.id),
        "by_session_type": by_type,
        "per_day": per_day,
        "top_tasks": [t.to_dict() for t in top_tasks],
    }
