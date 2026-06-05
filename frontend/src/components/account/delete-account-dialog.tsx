import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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
import { useDeleteAccount, getErrorMessage } from "@/hooks/use-auth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
};

export function DeleteAccountDialog({ open, onOpenChange, email }: Props) {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState("");
  const deleteAccount = useDeleteAccount();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await deleteAccount.mutateAsync({ confirmation });
      toast.success("Account deleted");
      onOpenChange(false);
      navigate("/register", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete account"));
    }
  }

  const matches = confirmation === email;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmation("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete account
          </DialogTitle>
          <DialogDescription>
            This will permanently delete your account, tasks, sessions, and
            settings. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Type your email <strong>{email}</strong> below to confirm.
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-email">Email</Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={email}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!matches || deleteAccount.isPending}
            >
              {deleteAccount.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Delete my account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
