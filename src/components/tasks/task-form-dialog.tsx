import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500, "Title is too long"),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
  estimated_pomodoros: z
    .number({ message: "Must be a number" })
    .int("Whole number")
    .min(1, "At least 1")
    .max(50, "At most 50"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSubmit: (values: { title: string; notes: string | null; estimated_pomodoros: number }) => Promise<unknown> | unknown;
  submitting?: boolean;
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  submitting,
}: Props) {
  const isEdit = Boolean(task);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? "",
      notes: task?.notes ?? "",
      estimated_pomodoros: task?.estimated_pomodoros ?? 1,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        notes: task?.notes ?? "",
        estimated_pomodoros: task?.estimated_pomodoros ?? 1,
      });
    }
  }, [open, task, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      notes: values.notes && values.notes.length > 0 ? values.notes : null,
      estimated_pomodoros: values.estimated_pomodoros,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the task details below."
              : "Add a task to focus on during your pomodoros."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="What are you working on?"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add any context or links"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimated_pomodoros">Estimated pomodoros</Label>
            <Input
              id="estimated_pomodoros"
              type="number"
              min={1}
              max={50}
              aria-invalid={!!errors.estimated_pomodoros}
              {...register("estimated_pomodoros", { valueAsNumber: true })}
            />
            {errors.estimated_pomodoros && (
              <p className="text-xs text-destructive">
                {errors.estimated_pomodoros.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
