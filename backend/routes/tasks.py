from flask import Blueprint, request
from flask_login import login_required, current_user

from extensions import db
from models import Task

tasks_bp = Blueprint("tasks", __name__)


def _validate_task_payload(data, partial: bool = False):
    if not isinstance(data, dict):
        return None, ("Invalid request body", 400)

    fields = {}

    if not partial or "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return None, ("Title is required", 400)
        if len(title) > 500:
            return None, ("Title must be 500 characters or fewer", 400)
        fields["title"] = title

    if "notes" in data:
        notes = data.get("notes")
        if notes is not None and len(notes) > 5000:
            return None, ("Notes must be 5000 characters or fewer", 400)
        fields["notes"] = notes or None

    if "estimated_pomodoros" in data:
        try:
            est = int(data["estimated_pomodoros"])
        except (TypeError, ValueError):
            return None, ("estimated_pomodoros must be an integer", 400)
        if est < 1 or est > 50:
            return None, ("estimated_pomodoros must be between 1 and 50", 400)
        fields["estimated_pomodoros"] = est

    if "is_completed" in data:
        if not isinstance(data["is_completed"], bool):
            return None, ("is_completed must be a boolean", 400)
        fields["is_completed"] = data["is_completed"]

    return fields, None


@tasks_bp.route("", methods=["GET"])
@login_required
def list_tasks():
    tasks = (
        Task.query.filter_by(user_id=current_user.id)
        .order_by(Task.position.asc(), Task.id.asc())
        .all()
    )
    return {"tasks": [t.to_dict() for t in tasks]}


@tasks_bp.route("", methods=["POST"])
@login_required
def create_task():
    fields, err = _validate_task_payload(request.get_json(silent=True))
    if err:
        return {"error": err[0]}, err[1]

    max_pos = (
        db.session.query(db.func.coalesce(db.func.max(Task.position), 0))
        .filter(Task.user_id == current_user.id)
        .scalar()
    )

    task = Task(
        user_id=current_user.id,
        title=fields["title"],
        notes=fields.get("notes"),
        estimated_pomodoros=fields.get("estimated_pomodoros", 1),
        position=float(max_pos) + 1.0,
    )
    db.session.add(task)
    db.session.commit()
    return {"task": task.to_dict()}, 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id: int):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return {"error": "Task not found"}, 404
    return {"task": task.to_dict()}


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id: int):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return {"error": "Task not found"}, 404

    fields, err = _validate_task_payload(request.get_json(silent=True), partial=True)
    if err:
        return {"error": err[0]}, err[1]

    for key, value in fields.items():
        setattr(task, key, value)

    db.session.commit()
    return {"task": task.to_dict()}


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id: int):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return {"error": "Task not found"}, 404

    db.session.delete(task)
    db.session.commit()
    return {"message": "Task deleted"}


@tasks_bp.route("/reorder", methods=["POST"])
@login_required
def reorder_tasks():
    data = request.get_json(silent=True) or {}
    order = data.get("order")
    if not isinstance(order, list) or not all(isinstance(i, int) for i in order):
        return {"error": "order must be a list of task ids"}, 400

    owned = (
        Task.query.filter(Task.user_id == current_user.id, Task.id.in_(order))
        .all()
        if order
        else []
    )
    owned_ids = {t.id for t in owned}
    if set(order) != owned_ids:
        return {"error": "order must contain exactly the user's task ids"}, 400

    by_id = {t.id: t for t in owned}
    for index, task_id in enumerate(order):
        by_id[task_id].position = float(index)

    db.session.commit()
    return {"tasks": [t.to_dict() for t in
                       Task.query.filter_by(user_id=current_user.id)
                       .order_by(Task.position.asc(), Task.id.asc())
                       .all()]}
