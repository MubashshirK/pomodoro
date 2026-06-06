import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDndMonitor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem } from "@/components/tasks/task-item";
import type { Task } from "@/types";

type Props = {
  tasks: Task[];
  onReorder: (newOrder: number[]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<unknown> | unknown;
  onToggleComplete: (task: Task, next: boolean) => void;
  deletingId?: number | null;
  draggingEnabled: boolean;
};

function DragStateTracker({ onChange }: { onChange: (dragging: boolean) => void }) {
  useDndMonitor({
    onDragStart: () => onChange(true),
    onDragEnd: () => onChange(false),
    onDragCancel: () => onChange(false),
  });
  return null;
}

export function TaskList({
  tasks,
  onReorder,
  onEdit,
  onDelete,
  onToggleComplete,
  deletingId,
  draggingEnabled,
}: Props) {
  const [isAnyDragging, setIsAnyDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(tasks, oldIndex, newIndex);
    onReorder(next.map((t) => t.id));
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <DragStateTracker onChange={setIsAnyDragging} />
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskItem
                task={task}
                draggable={draggingEnabled}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                deleting={deletingId === task.id}
                isAnyDragging={isAnyDragging}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
