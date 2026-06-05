import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useChangePassword, getErrorMessage } from "@/hooks/use-auth";

const schema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    new_password: z.string().min(6, "At least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [show, setShow] = useState(false);
  const changePassword = useChangePassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", new_password: "", confirm: "" },
  });

  function reset() {
    form.reset({ current_password: "", new_password: "", confirm: "" });
    setShow(false);
  }

  async function onSubmit(values: FormValues) {
    try {
      await changePassword.mutateAsync({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success("Password updated");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update password"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change password
          </DialogTitle>
          <DialogDescription>
            Use at least 6 characters. You'll stay signed in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <PasswordField
            id="current_password"
            label="Current password"
            show={show}
            onToggleShow={() => setShow((s) => !s)}
            {...form.register("current_password")}
            aria-invalid={!!form.formState.errors.current_password}
          />
          {form.formState.errors.current_password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.current_password.message}
            </p>
          ) : null}

          <PasswordField
            id="new_password"
            label="New password"
            show={show}
            onToggleShow={() => setShow((s) => !s)}
            {...form.register("new_password")}
            aria-invalid={!!form.formState.errors.new_password}
          />
          {form.formState.errors.new_password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.new_password.message}
            </p>
          ) : null}

          <PasswordField
            id="confirm"
            label="Confirm new password"
            show={show}
            onToggleShow={() => setShow((s) => !s)}
            {...form.register("confirm")}
            aria-invalid={!!form.formState.errors.confirm}
          />
          {form.formState.errors.confirm ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirm.message}
            </p>
          ) : null}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Update password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordField({
  id,
  label,
  show,
  onToggleShow,
  ...inputProps
}: {
  id: string;
  label: string;
  show: boolean;
  onToggleShow: () => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="off"
          className="pr-10"
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
