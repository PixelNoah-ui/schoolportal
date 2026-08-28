// lib/ranking-utils.ts
import {
  academicYears,
  classes,
  gradeSubmissions,
  studentStandings,
  type RankingRow,
  type StudentStanding,
  type SubjectSubmission,
} from "@/lib/mock-data";

export type Period = "sem1" | "sem2" | "final";

export const periodLabel: Record<Period, string> = {
  sem1: "Semester 1",
  sem2: "Semester 2",
  final: "Final (Combined)",
};

export function periodToSemesterNames(period: Period): string[] {
  if (period === "sem1") return ["Semester 1"];
  if (period === "sem2") return ["Semester 2"];
  return ["Semester 1", "Semester 2"];
}

export function scoreFor(row: RankingRow, period: Period) {
  if (period === "sem1") return row.semester1;
  if (period === "sem2") return row.semester2;
  return (row.semester1 + row.semester2) / 2;
}

export const currentAcademicYearRecord =
  academicYears.find((y) => y.is_current) ?? academicYears[0];

export interface Standing {
  eligible: boolean;
  standing?: StudentStanding;
  reason?: string;
  semester?: string;
}

// A student is ineligible for a ranked *position* in a period if they have a
// disciplinary/excused/withdrawn record in any semester that period covers.
// They still appear in listings — just without a rank number.
export function getStanding(studentId: string, period: Period): Standing {
  const semesters = periodToSemesterNames(period);
  const record = studentStandings.find(
    (s) => s.studentId === studentId && semesters.includes(s.semester),
  );
  if (!record) return { eligible: true };
  return {
    eligible: false,
    standing: record.standing,
    reason: record.reason,
    semester: record.semester,
  };
}

export interface RankedRow extends RankingRow {
  score: number;
  rank: number | null;
  standing: Standing;
}

export function rankStudents(rows: RankingRow[], period: Period): RankedRow[] {
  const scored = rows
    .map((r) => ({
      ...r,
      score: scoreFor(r, period),
      standing: getStanding(r.studentId, period),
    }))
    .sort((a, b) => b.score - a.score);

  let rank = 0;
  return scored.map((r) => {
    if (r.standing.eligible) {
      rank += 1;
      return { ...r, rank };
    }
    return { ...r, rank: null };
  });
}

export interface ClassCompletion {
  classId: string;
  submitted: number;
  total: number;
  percent: number;
  status: "complete" | "partial" | "not_started";
  pending: SubjectSubmission[];
}

export function getClassCompletion(
  classId: string,
  period: Period,
): ClassCompletion {
  const semesters = periodToSemesterNames(period);
  const rows = gradeSubmissions.filter(
    (g) => g.classId === classId && semesters.includes(g.semester),
  );
  const submitted = rows.reduce((sum, r) => sum + r.submitted, 0);
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const percent = total === 0 ? 0 : Math.round((submitted / total) * 100);
  const pending = rows.filter((r) => r.status !== "complete");
  const status: ClassCompletion["status"] =
    pending.length === 0 && rows.length > 0
      ? "complete"
      : submitted === 0
        ? "not_started"
        : "partial";
  return { classId, submitted, total, percent, status, pending };
}

export function getOverallCompletion(period: Period) {
  const perClass = classes.map((c) => getClassCompletion(c.id, period));
  const submitted = perClass.reduce((sum, c) => sum + c.submitted, 0);
  const total = perClass.reduce((sum, c) => sum + c.total, 0);
  const percent = total === 0 ? 0 : Math.round((submitted / total) * 100);
  const pendingClasses = perClass.filter((c) => c.status !== "complete");
  return { percent, pendingClasses, isFinal: pendingClasses.length === 0 };
}
