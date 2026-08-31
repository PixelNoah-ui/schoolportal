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
  onEdit?: (values: Record<string, string>) => Promise<unknown> | unknown;
  onDelete?: () => Promise<unknown> | unknown;
  editIsLoading?: boolean;
  deleteIsLoading?: boolean;
}

export function RowActions({
  entityName,
  fields,
  values,
  onEdit,
  onDelete,
  editIsLoading = false,
  deleteIsLoading = false,
}: RowActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canRenderMenu = Boolean(entityName && values && onDelete);
  const canRenderView = Boolean(fields && values && entityName);

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
          {canRenderMenu && (
            <>
              {canRenderView && (
                <DropdownMenuItem onClick={() => setViewOpen(true)}>
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
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
      {canRenderMenu && (
        <>
          {canRenderView && entityName && fields && values && (
            <EntityFormDialog
              mode="view"
              title={entityName}
              fields={fields as FieldConfig[]}
              initialValues={values}
              onSubmit={() => {}}
              open={viewOpen}
              onOpenChange={setViewOpen}
            />
          )}
          {onEdit && entityName && fields && values && (
            <EntityFormDialog
              mode="edit"
              title={`Edit ${entityName}`}
              fields={fields}
              initialValues={values}
              onSubmit={onEdit}
              open={editOpen}
              onOpenChange={setEditOpen}
              isLoading={editIsLoading}
              submitLabel="Save changes"
            />
          )}
          {onDelete && entityName && (
            <ConfirmDeleteDialog
              name={entityName}
              onConfirm={onDelete}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              isLoading={deleteIsLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
