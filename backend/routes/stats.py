from datetime import datetime, timedelta, date

from flask import Blueprint, request
from flask_login import login_required, current_user
from sqlalchemy import func

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


def _local_completed_at():
    """SQL expression: completed_at shifted by the client's UTC offset, so
    date extraction matches the user's local calendar day."""
    offset = _tz_offset()
    if offset == 0:
        return PomodoroSession.completed_at
    return func.datetime(PomodoroSession.completed_at, f"+{offset} minutes")


def _local_now() -> datetime:
    """Naive datetime representing the user's local 'now'."""
    return datetime.utcnow() + timedelta(minutes=_tz_offset())


def _streak(user_id: int) -> int:
    local_completed = _local_completed_at()
    rows = (
        db.session.query(func.date(local_completed).label("d"))
        .filter(
            PomodoroSession.user_id == user_id,
            PomodoroSession.session_type == "work",
        )
        .group_by("d")
        .all()
    )
    days = set()
    for row in rows:
        if row.d is None:
            continue
        try:
            days.add(date.fromisoformat(str(row.d)))
        except ValueError:
            continue
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
    # Range stays in UTC — completed_at is stored in UTC. We just need
    # enough history to cover `days` local days, which is at most `days`
    # UTC days as well (offset only shifts by a few hours at most).
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    base = PomodoroSession.query.filter(
        PomodoroSession.user_id == current_user.id,
        PomodoroSession.completed_at >= start,
    )

    total_pomodoros = base.filter(
        PomodoroSession.session_type == "work"
    ).count()

    total_focus_seconds = (
        db.session.query(func.coalesce(func.sum(PomodoroSession.duration_seconds), 0))
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.session_type == "work",
            PomodoroSession.completed_at >= start,
        )
        .scalar()
    )

    per_type_rows = (
        db.session.query(
            PomodoroSession.session_type,
            func.count(PomodoroSession.id),
        )
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.completed_at >= start,
        )
        .group_by(PomodoroSession.session_type)
        .all()
    )
    by_type = {"work": 0, "shortBreak": 0, "longBreak": 0}
    for session_type, count in per_type_rows:
        by_type[session_type] = count

    local_completed = _local_completed_at()
    per_day_rows = (
        db.session.query(
            func.date(local_completed).label("d"),
            func.count(PomodoroSession.id).label("count"),
            func.coalesce(func.sum(PomodoroSession.duration_seconds), 0).label("seconds"),
        )
        .filter(
            PomodoroSession.user_id == current_user.id,
            PomodoroSession.session_type == "work",
            PomodoroSession.completed_at >= start,
        )
        .group_by("d")
        .all()
    )
    per_day_map = {
        str(row.d): {"count": row.count, "focus_seconds": int(row.seconds)}
        for row in per_day_rows
    }

    per_day = []
    # Use the client's local "today" so the chart always shows the user's
    # current calendar day as the latest bucket, even near midnight UTC.
    today = _local_now().date()
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        key = d.isoformat()
        stats = per_day_map.get(key, {"count": 0, "focus_seconds": 0})
        per_day.append({"date": key, **stats})

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
        "total_focus_seconds": int(total_focus_seconds or 0),
        "current_streak": _streak(current_user.id),
        "by_session_type": by_type,
        "per_day": per_day,
        "top_tasks": [t.to_dict() for t in top_tasks],
    }
