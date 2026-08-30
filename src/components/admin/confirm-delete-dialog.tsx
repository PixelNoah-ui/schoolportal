// components/admin/confirm-delete-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { ReactElement } from "react";

export function ConfirmDeleteDialog({
  name,
  onConfirm,
  trigger,
  open,
  onOpenChange,
  isLoading = false,
}: {
  name: string;
  onConfirm: () => Promise<unknown> | unknown;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}) {
  async function handleConfirm() {
    if (isLoading) return;
    await Promise.resolve(onConfirm());
    onOpenChange?.(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger render={trigger} />
      ) : open === undefined ? (
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
      ) : null}
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This permanently removes {name} from
            your records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
