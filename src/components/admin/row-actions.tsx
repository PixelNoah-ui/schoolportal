// components/admin/row-actions.tsx — replaces the old dropdown version
"use client";

import { useState } from "react";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityFormDialog, type FieldConfig } from "./entity-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

interface RowActionsProps {
  entityName?: string;
  fields?: FieldConfig[];
  values?: Record<string, string>;
  onEdit?: (values: Record<string, string>) => void;
  onDelete?: () => void;
}

export function RowActions({
  entityName,
  fields,
  values,
  onEdit,
  onDelete,
}: RowActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none"
              aria-label={`Actions for ${entityName ?? "item"}`}
            >
              <MoreVertical className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent
          align="end"
          side="bottom"
          className="min-w-32 rounded-none"
        >
          {entityName && fields && values && onEdit && onDelete && (
            <>
              <DropdownMenuItem onClick={() => setViewOpen(true)}>
                <Eye className="size-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {entityName && fields && values && onEdit && onDelete && (
        <>
          <EntityFormDialog
            mode="view"
            title={entityName}
            fields={fields}
            initialValues={values}
            onSubmit={() => {}}
            open={viewOpen}
            onOpenChange={setViewOpen}
          />
          <EntityFormDialog
            mode="edit"
            title={`Edit ${entityName}`}
            fields={fields}
            initialValues={values}
            onSubmit={onEdit}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <ConfirmDeleteDialog
            name={entityName}
            onConfirm={onDelete}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </div>
  );
}
