import { createClient } from "@/utils/supabase/client";
import type { ClassRow } from "@/lib/mock-data";
import type { RankingRow } from "@/lib/mock-data";

export type RankingAcademicYear = {
  id: string;
  name: string;
  is_current: boolean;
};

export type RankingData = {
  rankingData: RankingRow[];
  classes: ClassRow[];
  academicYears: RankingAcademicYear[];
};

export interface RankingListParams {
  academicYearId?: string;
  period?: "sem1" | "sem2" | "final";
  classId?: string;
  search?: string;
}

type StudentRecord = {
  id: string;
  class_id: string | null;
  profiles: { full_name: string }[];
  classes: {
    id: string;
    name: string;
    grade: number;
    section: string | null;
  }[];
};

type GradeRecord = {
  student_id: string;
  score: number | null;
  semester_id: string;
  class_subjects: { class_id: string }[];
};

type SemesterRecord = { id: string; academic_year_id: string; name: string };

export async function fetchRankings({
  academicYearId,
  period = "sem1",
  classId = "all",
  search = "",
}: RankingListParams = {}): Promise<RankingData> {
  const supabase = createClient();
  const [semestersResult, yearsResult] = await Promise.all([
    supabase.from("semesters").select("id, academic_year_id, name"),
    supabase
      .from("academic_years")
      .select("id, name, is_current")
      .order("is_current", { ascending: false }),
  ]);
  if (semestersResult.error) throw new Error(semestersResult.error.message);
  if (yearsResult.error) throw new Error(yearsResult.error.message);

  const semesters = (semestersResult.data ?? []) as SemesterRecord[];
  const academicYears = (yearsResult.data ?? []) as RankingAcademicYear[];
  const currentYear =
    academicYears.find((year) => year.id === academicYearId) ??
    academicYears.find((year) => year.is_current) ??
    academicYears[0];
  const currentSemesters = semesters.filter(
    (semester) => semester.academic_year_id === currentYear?.id,
  );
  const selectedSemesterIds = currentSemesters
    .filter((semester) =>
      period === "final"
        ? true
        : semester.name.toLowerCase().includes(period.slice(-1)),
    )
    .map((semester) => semester.id);

  const [studentsResult, gradesResult] = await Promise.all([
    (() => {
      let request = supabase
        .from("students")
        .select(
          "id, class_id, profiles(full_name), classes(id, name, grade, section)",
        );
      if (classId !== "all") request = request.eq("class_id", classId);
      if (search.trim()) {
        request = request.or(`full_name.ilike.%${search.trim()}%`, {
          foreignTable: "profiles",
        });
      }
      return request;
    })(),
    (() => {
      let request = supabase
        .from("grades")
        .select("student_id, score, semester_id, class_subjects(class_id)")
        .eq("is_final", true)
        .in("semester_id", selectedSemesterIds);
      if (classId !== "all") {
        request = request.eq("class_subjects.class_id", classId);
      }
      return request;
    })(),
  ]);

  const error = studentsResult.error ?? gradesResult.error;
  if (error) throw new Error(error.message);

  const students = (studentsResult.data ?? []) as StudentRecord[];
  const grades = (gradesResult.data ?? []) as GradeRecord[];

  const classRows = new Map<string, ClassRow>();
  students.forEach((student) => {
    const classRow = student.classes[0];
    if (!classRow) return;
    const existing = classRows.get(classRow.id);
    classRows.set(classRow.id, {
      id: classRow.id,
      name: classRow.name,
      grade: classRow.grade,
      section: classRow.section ?? "",
      studentCount: (existing?.studentCount ?? 0) + 1,
      teacher: existing?.teacher ?? "Unassigned",
    });
  });

  const scores = new Map<
    string,
    { semester1: number[]; semester2: number[] }
  >();
  grades.forEach((grade) => {
    const classId = grade.class_subjects[0]?.class_id;
    if (grade.score === null || !classId) return;
    const semester = semesters.find((item) => item.id === grade.semester_id);
    if (
      !semester ||
      semester.academic_year_id !== currentYear?.id ||
      !selectedSemesterIds.includes(semester.id)
    )
      return;
    const bucket = scores.get(`${grade.student_id}:${classId}`) ?? {
      semester1: [],
      semester2: [],
    };
    if (semester.name.toLowerCase().includes("1"))
      bucket.semester1.push(Number(grade.score));
    if (semester.name.toLowerCase().includes("2"))
      bucket.semester2.push(Number(grade.score));
    scores.set(`${grade.student_id}:${classId}`, bucket);
  });

  const average = (values: number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

  return {
    academicYears,
    classes: [...classRows.values()].sort((a, b) => a.grade - b.grade),
    rankingData: students.flatMap((student) => {
      const classRow = student.classes[0];
      if (!classRow) return [];
      const bucket = scores.get(`${student.id}:${classRow.id}`);
      if (!bucket) return [];
      return [
        {
          studentId: student.id,
          studentName: student.profiles[0]?.full_name ?? "Student",
          classId: classRow.id,
          className: `Grade ${classRow.grade} - ${classRow.section ?? ""}`,
          semester1: average(bucket.semester1),
          semester2: average(bucket.semester2),
        },
      ];
    }),
  };
}
