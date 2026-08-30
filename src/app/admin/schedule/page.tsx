"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScheduleRow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  class_subjects?: {
    classes?: { name: string; grade: number; section: string | null }[];
    subjects?: { name: string }[];
    teachers?: { profiles?: { full_name: string }[] }[];
  }[];
};

export default function SchedulePage() {
  const [courses, setCourses] = useState<Array<{ id: string; label: string }>>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: courseData }, { data: scheduleData }] = await Promise.all([
        supabase
          .from("class_subjects")
          .select("id, classes(name, grade, section), subjects(name), teachers(profiles(full_name))")
          .order("created_at", { ascending: false }),
        supabase
          .from("schedules")
          .select("id, day_of_week, start_time, end_time, room, class_subjects(classes(name, grade, section), subjects(name), teachers(profiles(full_name)))"),
      ]);
      setCourses(
        (courseData ?? []).map((row) => ({
          id: row.id,
          label: `${row.classes?.[0]?.name ?? "Class"} · ${row.subjects?.[0]?.name ?? "Subject"}`,
        })),
      );
      setSchedules((scheduleData ?? []) as ScheduleRow[]);
      if (!selectedCourse && (courseData ?? []).length) setSelectedCourse((courseData ?? [])[0].id);
    };

    void load();
  }, [selectedCourse]);

  const handleCreate = async () => {
    if (!selectedCourse) return;
    const supabase = createClient();
    const { error } = await supabase.from("schedules").insert({
      class_subject_id: selectedCourse,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: room || null,
    });
    if (!error) {
      const { data } = await supabase
        .from("schedules")
        .select("id, day_of_week, start_time, end_time, room, class_subjects(classes(name, grade, section), subjects(name), teachers(profiles(full_name)))");
      setSchedules((data ?? []) as ScheduleRow[]);
      setRoom("");
    }
  };

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
              Add schedule item
            </span>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Course</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={(value) => setSelectedCourse(value ?? "")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day</Label>
                <Select
                  value={dayOfWeek}
                  onValueChange={(value) => setDayOfWeek(value ?? "Monday")}
                >
                  <SelectTrigger className="w-full rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Room A1" className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-none" />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-none" />
              </div>
            </div>

            <div className="flex items-end justify-end">
              <Button className="rounded-none" onClick={handleCreate} disabled={!selectedCourse}>
                <Plus className="size-4" />
                Save schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.length === 0 ? (
            <div className="rounded-none border border-dashed p-6 text-sm text-muted-foreground">
              No schedule entries yet.
            </div>
          ) : (
            schedules.map((slot) => (
              <div key={slot.id} className="rounded-none border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{slot.day_of_week}</p>
                  <CalendarClock className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {slot.class_subjects?.[0]?.classes?.[0]?.name ?? "Class"} · {slot.class_subjects?.[0]?.subjects?.[0]?.name ?? "Subject"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {slot.start_time} – {slot.end_time} · {slot.room ?? "No room"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
