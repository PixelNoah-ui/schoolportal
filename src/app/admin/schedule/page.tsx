"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useCreateSchedule,
  useDeleteSchedule,
  useScheduleCourses,
  useScheduleRooms,
  useSchedules,
  useUpdateSchedule,
} from "@/hooks/use-schedules";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);

function gradeLabelFor(grade: number, section: string | null) {
  return section ? `Grade ${grade} - ${section}` : `Grade ${grade}`;
}

export default function SchedulePage() {
  const { data: courses = [], isLoading: loadingCourses } =
    useScheduleCourses();
  const { data: roomOptions = [] } = useScheduleRooms();
  const { data: schedules = [] } = useSchedules();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedGrade("");
    setSelectedSection("");
    setSelectedCourse("");
    setSelectedDays(["Monday"]);
    setStartTime("08:00");
    setEndTime("09:00");
    setRoom("");
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (slot: (typeof schedules)[number]) => {
    setEditingId(slot.id);
    setSelectedCourse(slot.class_subject_id);
    setSelectedDays([slot.day_of_week]);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setRoom(slot.room ?? "");
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
        new Set(
          courses.map((course) => course.grade).filter((grade) => grade > 0),
        ),
      ).sort((a, b) => a - b),
    [courses],
  );

  const sectionOptions = useMemo(() => {
    if (!selectedGrade) return [];

    const normalizedGrade = Number(selectedGrade);
    return Array.from(
      new Set(
        courses
          .filter((course) => course.grade === normalizedGrade)
          .map((course) => course.section)
          .filter((section): section is string => Boolean(section)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [courses, selectedGrade]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesGrade =
        !selectedGrade || course.grade === Number(selectedGrade);
      const matchesSection =
        !selectedSection || (course.section ?? "") === selectedSection;
      return matchesGrade && matchesSection;
    });
  }, [courses, selectedGrade, selectedSection]);

  const courseGroups = useMemo(() => {
    const groups = new Map<string, typeof courses>();
    for (const course of filteredCourses) {
      const list = groups.get(course.gradeLabel) ?? [];
      list.push(course);
      groups.set(course.gradeLabel, list);
    }
    return [...groups.entries()].sort((a, b) => {
      const gradeA = a[1][0]?.grade ?? 0;
      const gradeB = b[1][0]?.grade ?? 0;
      return gradeA - gradeB || a[0].localeCompare(b[0]);
    });
  }, [filteredCourses]);

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
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const applyQuickSelect = (days: readonly string[]) =>
    setSelectedDays([...days]);

  const handleGradeChange = (value: string | null) => {
    setSelectedGrade(value ?? "");
    setSelectedSection("");
    setSelectedCourse("");
  };

  const handleSectionChange = (value: string | null) => {
    setSelectedSection(value ?? "");
    setSelectedCourse("");
  };

  const handleSubmit = () => {
    setFormError(null);

    if (!selectedCourse) {
      setFormError("Pick a course first.");
      return;
    }
    if (selectedDays.length === 0) {
      setFormError("Select at least one day.");
      return;
    }
    if (startTime >= endTime) {
      setFormError("End time has to be after start time.");
      return;
    }

    const payload = {
      class_subject_id: selectedCourse,
      start_time: startTime,
      end_time: endTime,
      room: room || null,
    };

    if (editingId) {
      updateSchedule.mutate(
        {
          id: editingId,
          payload: {
            ...payload,
            day_of_week: selectedDays[0],
          },
        },
        {
          onSuccess: resetForm,
          onError: (error) => {
            setFormError(
              error instanceof Error
                ? error.message
                : "Unable to update schedule.",
            );
          },
        },
      );
      return;
    }

    const rows = selectedDays.map((day) => ({
      ...payload,
      day_of_week: day,
    }));

    createSchedule.mutate(rows, {
      onSuccess: resetForm,
      onError: (error) => {
        setFormError(
          error instanceof Error ? error.message : "Unable to create schedule.",
        );
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteSchedule.mutate(id, {
      onError: (error) => {
        setFormError(
          error instanceof Error ? error.message : "Unable to delete schedule.",
        );
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
                ? "Update this class slot and save the changes."
                : "Pick the days at once to add the same class slot across the week in one click."}
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select value={selectedGrade} onValueChange={handleGradeChange}>
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select grade" />
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
                  value={room}
                  onValueChange={(value) => setRoom(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No room</SelectItem>
                    {roomOptions.map((roomName) => (
                      <SelectItem key={roomName} value={roomName}>
                        {roomName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sectionOptions.length > 0 ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Section</Label>
                  <Select
                    value={selectedSection}
                    onValueChange={handleSectionChange}
                  >
                    <SelectTrigger className="w-full rounded-none">
                      <SelectValue placeholder="All sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sections</SelectItem>
                      {sectionOptions.map((section) => (
                        <SelectItem key={section} value={section}>
                          Section {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2 sm:col-span-2">
                <Label>Course</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={(value) => setSelectedCourse(value ?? "")}
                  disabled={!selectedGrade && filteredCourses.length === 0}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseGroups.map(([label, items]) => (
                      <SelectGroup key={label}>
                        <SelectLabel>{label}</SelectLabel>
                        {items.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.subjectName} — {course.teacherName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingCourses && filteredCourses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No matching course is available for this grade/section.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Days</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickSelect(WEEKDAYS)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickSelect(WEEKEND)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Weekend
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickSelect(DAYS)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    All days
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([])}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40",
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDays.length === 0
                  ? "No days selected."
                  : editingId
                    ? "This will update the selected slot for one day."
                    : `Will create ${selectedDays.length} schedule ${selectedDays.length === 1 ? "entry" : "entries"}.`}
              </p>
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

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
                disabled={
                  isSaving || !selectedCourse || selectedDays.length === 0
                }
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
          <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-7">
            {DAYS.map((day) => {
              const slots = scheduleByDay.get(day) ?? [];
              return (
                <div key={day} className="flex flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <span className="text-xs font-semibold">{day}</span>
                    <span className="text-xs text-muted-foreground">
                      {slots.length}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    {slots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No classes.
                      </p>
                    ) : (
                      slots.map((slot) => {
                        const classRow = slot.class_subjects?.[0]?.classes?.[0];
                        const subjectName =
                          slot.class_subjects?.[0]?.subjects?.[0]?.name ??
                          "Subject";
                        const label = classRow
                          ? gradeLabelFor(classRow.grade, classRow.section)
                          : "Class";

                        return (
                          <div
                            key={slot.id}
                            className="group relative border p-2.5"
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
