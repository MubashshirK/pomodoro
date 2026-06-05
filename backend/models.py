from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    tasks = db.relationship(
        "Task",
        backref="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    sessions = db.relationship(
        "PomodoroSession",
        backref="user",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    settings = db.relationship(
        "Settings",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    title = db.Column(db.String(500), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    estimated_pomodoros = db.Column(db.Integer, default=1, nullable=False)
    completed_pomodoros = db.Column(db.Integer, default=0, nullable=False)
    is_completed = db.Column(db.Boolean, default=False, nullable=False, index=True)
    position = db.Column(db.Float, default=0.0, nullable=False, index=True)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    sessions = db.relationship(
        "PomodoroSession", backref="task", lazy="dynamic"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "notes": self.notes,
            "estimated_pomodoros": self.estimated_pomodoros,
            "completed_pomodoros": self.completed_pomodoros,
            "is_completed": self.is_completed,
            "position": self.position,
            "created_at": self.created_at.isoformat() + "Z",
            "updated_at": self.updated_at.isoformat() + "Z",
        }


class PomodoroSession(db.Model):
    __tablename__ = "pomodoro_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    task_id = db.Column(
        db.Integer, db.ForeignKey("tasks.id"), nullable=True, index=True
    )
    session_type = db.Column(db.String(20), nullable=False)
    duration_seconds = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "task_id": self.task_id,
            "session_type": self.session_type,
            "duration_seconds": self.duration_seconds,
            "completed_at": self.completed_at.isoformat() + "Z",
        }


class Settings(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    work_duration = db.Column(db.Integer, default=25, nullable=False)
    short_break_duration = db.Column(db.Integer, default=5, nullable=False)
    long_break_duration = db.Column(db.Integer, default=15, nullable=False)
    cycles_until_long_break = db.Column(db.Integer, default=4, nullable=False)
    auto_start = db.Column(db.Boolean, default=False, nullable=False)
    sound_enabled = db.Column(db.Boolean, default=True, nullable=False)
    volume = db.Column(db.Integer, default=80, nullable=False)
    theme = db.Column(db.String(20), default="system", nullable=False)
    notifications_enabled = db.Column(db.Boolean, default=True, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "work_duration": self.work_duration,
            "short_break_duration": self.short_break_duration,
            "long_break_duration": self.long_break_duration,
            "cycles_until_long_break": self.cycles_until_long_break,
            "auto_start": self.auto_start,
            "sound_enabled": self.sound_enabled,
            "volume": self.volume,
            "theme": self.theme,
            "notifications_enabled": self.notifications_enabled,
            "updated_at": self.updated_at.isoformat() + "Z",
        }
