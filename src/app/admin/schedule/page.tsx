"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateSchedule,
  useDeleteSchedule,
  useScheduleCourses,
  useSchedules,
  useUpdateSchedule,
} from "@/hooks/use-schedules";
import { useToastManager } from "@/components/ui/toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

type DraftSlot = {
  subjectId: string;
  startTime: string;
  endTime: string;
};

function gradeLabelFor(grade: number, section: string | null) {
  return section ? `Grade ${grade} - ${section}` : `Grade ${grade}`;
}

export default function SchedulePage() {
  const { data: courses = [], isLoading: loadingCourses } =
    useScheduleCourses();
  const { data: schedules = [], isLoading: loadingSchedules } = useSchedules();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const toastManager = useToastManager();

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [slotsByDay, setSlotsByDay] = useState<Record<string, DraftSlot[]>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setSlotsByDay({});
    setSelectedGrade("");
    setSelectedSection("");
    setSelectedDays(["Monday"]);
    setActiveDay("Monday");
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (slot: (typeof schedules)[number]) => {
    setEditingId(slot.id);
    setSlotsByDay({
      [slot.day_of_week]: [
        {
          subjectId: slot.class_subject_id,
          startTime: slot.start_time,
          endTime: slot.end_time,
        },
      ],
    });
    setSelectedDays([slot.day_of_week]);
    setActiveDay(slot.day_of_week);
    setFormError(null);
    const matchedCourse = courses.find(
      (course) => course.id === slot.class_subject_id,
    );
    if (matchedCourse) {
      setSelectedGrade(String(matchedCourse.grade));
      setSelectedSection(matchedCourse.section ?? "");
    }
  };

  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(courses.map((course) => course.grade).filter(Boolean)),
      ).sort((a, b) => a - b),
    [courses],
  );

  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          courses
            .filter((course) => course.grade === Number(selectedGrade))
            .map((course) => course.section)
            .filter((section): section is string => Boolean(section)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [courses, selectedGrade],
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          course.grade === Number(selectedGrade) &&
          (course.section ?? "") === selectedSection,
      ),
    [courses, selectedGrade, selectedSection],
  );

  const scheduleByDay = useMemo(() => {
    const map = new Map<string, typeof schedules>(DAYS.map((day) => [day, []]));
    for (const slot of schedules) {
      const list = map.get(slot.day_of_week) ?? [];
      list.push(slot);
      map.set(slot.day_of_week, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [schedules]);

  const toggleDay = (day: string) => {
    setSelectedDays((previous) => {
      if (previous.includes(day)) {
        const next = previous.filter((item) => item !== day);
        if (activeDay === day) setActiveDay(next[0] ?? "");
        return next;
      }
      setActiveDay(day);
      setSlotsByDay((slots) => ({
        ...slots,
        [day]: slots[day] ?? [
          { subjectId: "", startTime: "08:00", endTime: "09:00" },
        ],
      }));
      return [...previous, day];
    });
  };

  const removeDay = (day: string) => {
    setSelectedDays((previous) => previous.filter((item) => item !== day));
    setSlotsByDay((previous) => {
      const next = { ...previous };
      delete next[day];
      return next;
    });
    if (activeDay === day) {
      setActiveDay(selectedDays.find((item) => item !== day) ?? "");
    }
  };

  const applyQuickSelect = (days: readonly string[]) => {
    setSelectedDays([...days]);
    setActiveDay(days[0] ?? "");
    setSlotsByDay((previous) =>
      Object.fromEntries(
        days.map((day) => [
          day,
          previous[day] ?? [
            { subjectId: "", startTime: "08:00", endTime: "09:00" },
          ],
        ]),
      ),
    );
  };

  const updateSlot = (
    day: string,
    index: number,
    patch: Partial<DraftSlot>,
  ) => {
    setSlotsByDay((previous) => ({
      ...previous,
      [day]: (previous[day] ?? []).map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    }));
  };

  const addSlot = (day: string) => {
    setSlotsByDay((previous) => ({
      ...previous,
      [day]: [
        ...(previous[day] ?? []),
        { subjectId: "", startTime: "08:00", endTime: "09:00" },
      ],
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSlotsByDay((previous) => ({
      ...previous,
      [day]: (previous[day] ?? []).filter(
        (_, slotIndex) => slotIndex !== index,
      ),
    }));
  };

  const handleGradeChange = (value: string | null) => {
    setSelectedGrade(value ?? "");
    setSelectedSection("");
    setSlotsByDay({});
  };

  const handleSectionChange = (value: string | null) => {
    const nextSection = value ?? "";
    setSelectedSection(nextSection);
    setSlotsByDay(
      nextSection
        ? {
            [activeDay || "Monday"]: [
              { subjectId: "", startTime: "08:00", endTime: "09:00" },
            ],
          }
        : {},
    );
  };

  const handleSubmit = () => {
    setFormError(null);

    if (selectedDays.length === 0) {
      setFormError("Select at least one day.");
      return;
    }
    const missingDay = selectedDays.find(
      (day) =>
        !(slotsByDay[day] ?? []).length ||
        (slotsByDay[day] ?? []).some((slot) => !slot.subjectId),
    );
    if (missingDay) {
      setFormError(`Select a subject for ${missingDay}.`);
      return;
    }
    const invalidSlot = selectedDays
      .flatMap((day) => slotsByDay[day] ?? [])
      .find((slot) => slot.startTime >= slot.endTime);
    if (invalidSlot) {
      setFormError("Each subject must end after it starts.");
      toastManager.add({
        title: "Invalid schedule time",
        description: "Each subject must be scheduled for at least 30 minutes.",
        type: "error",
      });
      return;
    }
    const shortSlot = selectedDays
      .flatMap((day) => slotsByDay[day] ?? [])
      .find((slot) => {
        const start = slot.startTime.split(":").map(Number);
        const end = slot.endTime.split(":").map(Number);
        return end[0] * 60 + end[1] - (start[0] * 60 + start[1]) < 30;
      });
    if (shortSlot) {
      setFormError("Each subject must be scheduled for at least 30 minutes.");
      toastManager.add({
        title: "Schedule is too short",
        description: "Choose a time range of at least 30 minutes.",
        type: "error",
      });
      return;
    }
    const overlappingDay = selectedDays.find((day) => {
      const daySlots = slotsByDay[day] ?? [];
      return daySlots.some((slot, index) =>
        daySlots.some((otherSlot, otherIndex) => {
          if (index >= otherIndex) return false;
          return (
            slot.startTime < otherSlot.endTime &&
            otherSlot.startTime < slot.endTime
          );
        }),
      );
    });
    if (overlappingDay) {
      const message = `Subjects for ${overlappingDay} cannot overlap for the same class and section.`;
      setFormError(message);
      toastManager.add({
        title: "Overlapping schedule",
        description: message,
        type: "error",
      });
      return;
    }
    const draftSlots = selectedDays.flatMap((day) =>
      (slotsByDay[day] ?? []).map((slot) => ({ day, slot })),
    );
    const existingConflict = draftSlots.find(({ day, slot }) =>
      schedules.some((existing) => {
        if (existing.id === editingId || existing.day_of_week !== day) {
          return false;
        }

        const sameClassSection = filteredCourses.some(
          (course) =>
            course.id === slot.subjectId &&
            course.id === existing.class_subject_id,
        );
        if (!sameClassSection) return false;

        return (
          slot.startTime < existing.end_time &&
          existing.start_time < slot.endTime
        );
      }),
    );
    if (existingConflict) {
      const message = `This subject already has a schedule during that time on ${existingConflict.day}.`;
      setFormError(message);
      toastManager.add({
        title: "Schedule already exists",
        description: message,
        type: "error",
      });
      return;
    }

    if (editingId) {
      const slot = slotsByDay[selectedDays[0]]?.[0];
      if (!slot) return;
      updateSchedule.mutate(
        {
          id: editingId,
          payload: {
            start_time: slot.startTime,
            end_time: slot.endTime,
            class_subject_id: slot.subjectId,
            day_of_week: selectedDays[0],
          },
        },
        {
          onSuccess: () => {
            resetForm();
            toastManager.add({
              title: "Schedule updated",
              description: "The subject schedule was updated successfully.",
              type: "success",
            });
          },
          onError: (error) => {
            const message =
              error instanceof Error
                ? error.message
                : "Unable to update schedule.";
            setFormError(message);
            toastManager.add({
              title: "Could not update schedule",
              description: message,
              type: "error",
            });
          },
        },
      );
      return;
    }

    const rows = selectedDays.flatMap((day) =>
      (slotsByDay[day] ?? []).map((slot) => ({
        class_subject_id: slot.subjectId,
        start_time: slot.startTime,
        end_time: slot.endTime,
        day_of_week: day,
      })),
    );

    createSchedule.mutate(rows, {
      onSuccess: () => {
        resetForm();
        toastManager.add({
          title: "Schedule created",
          description: "The subject schedule was created successfully.",
          type: "success",
        });
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Unable to create schedule.";
        setFormError(message);
        toastManager.add({
          title: "Could not create schedule",
          description: message,
          type: "error",
        });
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteSchedule.mutate(id, {
      onSuccess: () => {
        toastManager.add({
          title: "Schedule removed",
          description: "The schedule entry was removed successfully.",
          type: "success",
        });
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : "Unable to delete schedule.";
        setFormError(message);
        toastManager.add({
          title: "Could not remove schedule",
          description: message,
          type: "error",
        });
      },
    });
  };

  const isSaving = createSchedule.isPending || updateSchedule.isPending;

  return (
    <>
      <SiteHeader title="Schedule" />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="Class timetable" count={schedules.length} />
        </div>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {editingId ? "Edit schedule item" : "Add schedule item"}
            </span>
            <p className="text-sm text-muted-foreground">
              {editingId
                ? "Update this subject slot and save the changes."
                : "Choose a subject for each day, then set its time."}
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={String(grade)}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={selectedSection}
                  onValueChange={handleSectionChange}
                  disabled={!selectedGrade}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Days</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickSelect(DAYS)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    All days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDays([]);
                      setActiveDay("");
                    }}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex shrink-0 items-center border text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (active) setActiveDay(day);
                          else toggleDay(day);
                        }}
                        className="px-3 py-1.5"
                      >
                        {day.slice(0, 3)}
                      </button>
                      {active ? (
                        <button
                          type="button"
                          onClick={() => removeDay(day)}
                          className="border-l border-current/30 px-1.5 py-1.5 hover:bg-black/10"
                          aria-label={`Remove ${day} from schedule selection`}
                        >
                          <X className="size-3" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Subjects</Label>
              {activeDay ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {activeDay}
                  </p>
                  <div className="space-y-2">
                    {(slotsByDay[activeDay] ?? []).map((slot, index) => (
                      <div
                        key={`${activeDay}-${index}`}
                        className="grid gap-2 border p-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
                      >
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:contents">
                          <select
                            value={slot.subjectId}
                            onChange={(event) =>
                              updateSlot(activeDay, index, {
                                subjectId: event.target.value,
                              })
                            }
                            className="col-span-2 h-8 min-w-0 border border-input bg-background px-2 text-xs sm:col-span-1"
                          >
                            <option value="">Select subject</option>
                            {filteredCourses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.subjectName}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(event) =>
                              updateSlot(activeDay, index, {
                                startTime: event.target.value,
                              })
                            }
                            className="h-8 rounded-none text-xs"
                          />
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(event) =>
                              updateSlot(activeDay, index, {
                                endTime: event.target.value,
                              })
                            }
                            className="h-8 rounded-none text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(activeDay, index)}
                          className="size-8 rounded-none text-muted-foreground hover:text-destructive"
                          aria-label="Remove subject schedule slot"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addSlot(activeDay)}
                      className="h-8 rounded-none text-xs"
                      disabled={!selectedGrade || !selectedSection}
                    >
                      <Plus className="size-3.5" />
                      Add another subject
                    </Button>
                  </div>
                </div>
              ) : null}
              {!loadingCourses && filteredCourses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Select a class and section to see assigned subjects.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              ) : null}
              <Button
                type="button"
                className="rounded-none"
                onClick={handleSubmit}
                disabled={isSaving || selectedDays.length === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {editingId ? "Saving..." : "Saving..."}
                  </>
                ) : (
                  <>
                    {editingId ? (
                      <Save className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {editingId ? "Save changes" : "Save schedule"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Weekly overview
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {loadingSchedules
              ? DAYS.map((day) => (
                  <div key={day} className="flex min-h-40 flex-col">
                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                      <Skeleton className="h-3 w-16 rounded-none" />
                      <Skeleton className="h-3 w-4 rounded-none" />
                    </div>
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-14 w-full rounded-none" />
                      <Skeleton className="h-14 w-full rounded-none" />
                    </div>
                  </div>
                ))
              : DAYS.map((day) => {
                  const slots = scheduleByDay.get(day) ?? [];
                  return (
                    <div key={day} className="flex flex-col">
                      <div className="flex items-center justify-between border-b px-4 py-2.5">
                        <span className="text-xs font-semibold">{day}</span>
                        <span className="text-xs text-muted-foreground">
                          {slots.length}
                        </span>
                      </div>
                      <div className="flex min-h-48 flex-1 flex-col gap-3 p-4">
                        {slots.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No classes.
                          </p>
                        ) : (
                          slots.map((slot) => {
                            const classRow =
                              slot.class_subjects?.[0]?.classes?.[0];
                            const subjectName =
                              slot.class_subjects?.[0]?.subjects?.[0]?.name ??
                              "Subject";
                            const label = classRow
                              ? gradeLabelFor(classRow.grade, classRow.section)
                              : "Class";

                            return (
                              <div
                                key={slot.id}
                                className="group relative border p-3"
                              >
                                <div className="absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(slot)}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Edit schedule entry"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(slot.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                    aria-label="Remove schedule entry"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                </div>
                                <p className="pr-10 text-xs font-medium">
                                  {subjectName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {label}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <CalendarClock className="size-3" />
                                  {slot.start_time}–{slot.end_time}
                                  {slot.room ? ` · ${slot.room}` : ""}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
