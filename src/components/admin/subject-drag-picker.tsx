"use client";

import { useState, type DragEvent } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: string;
  name: string;
}

export interface SelectedSubject {
  subjectId: string;
  teacherId: string | null;
}

interface SubjectDragPickerProps {
  subjects: Option[];
  teachers: Option[];
  selected: SelectedSubject[];
  onChange: (selected: SelectedSubject[]) => void;
}

export function SubjectDragPicker({
  subjects,
  teachers,
  selected,
  onChange,
}: SubjectDragPickerProps) {
  const [dragOver, setDragOver] = useState(false);

  const selectedIds = new Set(selected.map((s) => s.subjectId));
  const available = subjects.filter((s) => !selectedIds.has(s.id));

  const addSubject = (subjectId: string) => {
    if (selectedIds.has(subjectId)) return;
    onChange([...selected, { subjectId, teacherId: null }]);
  };

  const removeSubject = (subjectId: string) => {
    onChange(selected.filter((s) => s.subjectId !== subjectId));
  };

  const setTeacher = (subjectId: string, teacherId: string | null) => {
    onChange(
      selected.map((s) =>
        s.subjectId === subjectId ? { ...s, teacherId } : s,
      ),
    );
  };

  const handleDragStart = (e: DragEvent, subjectId: string) => {
    e.dataTransfer.setData("text/subject-id", subjectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const subjectId = e.dataTransfer.getData("text/subject-id");
    if (subjectId) addSubject(subjectId);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Available subjects
        </p>
        <div className="h-56 space-y-1.5 overflow-y-auto border bg-muted/20 p-2">
          {available.length === 0 ? (
            <p className="p-3 text-center text-xs text-muted-foreground">
              All subjects added
            </p>
          ) : (
            available.map((subject) => (
              <div
                key={subject.id}
                draggable
                onDragStart={(e) => handleDragStart(e, subject.id)}
                onClick={() => addSubject(subject.id)}
                className="group flex cursor-grab items-center justify-between gap-2 border bg-background px-2.5 py-2 text-sm transition-colors active:cursor-grabbing hover:border-primary"
              >
                <span className="flex items-center gap-2">
                  <GripVertical className="size-3.5 text-muted-foreground" />
                  {subject.name}
                </span>
                <Plus className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned to this class ({selected.length})
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`h-56 space-y-1.5 overflow-y-auto border p-2 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "bg-muted/20"
          }`}
        >
          {selected.length === 0 ? (
            <p className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
              Drag subjects here, or click one on the left
            </p>
          ) : (
            selected.map((item) => {
              const subject = subjects.find((s) => s.id === item.subjectId);
              if (!subject) return null;
              return (
                <div
                  key={item.subjectId}
                  className="space-y-1.5 border bg-background px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSubject(item.subjectId)}
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                      aria-label={`Remove ${subject.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <Select
                    value={item.teacherId ?? ""}
                    onValueChange={(value) =>
                      setTeacher(item.subjectId, value === "" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-7 w-full rounded-none text-xs">
                      <SelectValue placeholder="No teacher yet (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No teacher yet</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
