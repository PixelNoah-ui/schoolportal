export type GradeStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "approved"
  | "invalidated"
  | "excused_absence"
  | "makeup_pending"
  | "makeup_submitted"
  | "makeup_approved"
  | "rejected";

export type AcademicStandingType =
  | "normal"
  | "excused"
  | "withdrawn"
  | "disciplinary"
  | "suspended";

export interface GradeRow {
  id: string;
  student_id: string;
  class_subject_id: string;
  semester_id: string;
  score: number | null;
  status: GradeStatus;
  is_makeup: boolean;
  is_excused: boolean;
  is_cheating_flagged: boolean;
  reason_code?: string | null;
  reviewed_at?: string | null;
  is_final: boolean;
}

export interface StandingRow {
  id: string;
  student_id: string;
  semester_id: string;
  standing_type: AcademicStandingType;
  is_active: boolean;
  reason?: string | null;
}

export interface StudentEnrollmentRow {
  id: string;
  student_id: string;
  class_id: string;
  semester_id: string;
  status: "active" | "withdrawn" | "transferred" | "suspended";
}

export interface ClassSubjectRow {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string | null;
}

export interface SubjectGradeSummary {
  studentId: string;
  studentName: string;
  classId: string;
  semesterId: string;
  score: number;
  standing: StandingRow | null;
  isEligible: boolean;
  rank: number | null;
}

export function getEffectiveScore(grades: GradeRow[]): number | null {
  const valid = grades.filter(
    (grade) =>
      grade.score !== null &&
      grade.is_final &&
      grade.status !== "invalidated" &&
      grade.status !== "rejected" &&
      grade.status !== "pending_review",
  );

  if (valid.length === 0) return null;

  const average =
    valid.reduce((sum, grade) => sum + Number(grade.score ?? 0), 0) /
    valid.length;

  return Number(average.toFixed(2));
}

export function isStudentEligible(
  studentId: string,
  semesterId: string,
  standings: StandingRow[],
): boolean {
  const active = standings.find(
    (standing) =>
      standing.student_id === studentId &&
      standing.semester_id === semesterId &&
      standing.is_active,
  );

  if (!active) return true;

  return !["disciplinary", "withdrawn", "suspended"].includes(
    active.standing_type,
  );
}

export function rankStudents(
  rows: SubjectGradeSummary[],
): SubjectGradeSummary[] {
  const eligible = rows.filter(
    (row) => row.isEligible && row.standing === null,
  );
  const sorted = [...eligible].sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((row, index) => {
    if (row.score !== lastScore) {
      lastRank = index + 1;
      lastScore = row.score;
    }

    return {
      ...row,
      rank: lastRank,
    };
  });
}

export function buildFinalRankingFromGrades({
  students,
  gradesByStudent,
  standings,
}: {
  students: Array<{
    id: string;
    full_name: string;
    class_id: string;
    semester_id: string;
  }>;
  gradesByStudent: Record<string, GradeRow[]>;
  standings: StandingRow[];
}): SubjectGradeSummary[] {
  const rows: SubjectGradeSummary[] = students.map((student) => {
    const allGrades = gradesByStudent[student.id] ?? [];
    const effectiveScore = getEffectiveScore(allGrades);
    const activeStanding = standings.find(
      (standing) =>
        standing.student_id === student.id &&
        standing.semester_id === student.semester_id &&
        standing.is_active,
    );

    const eligible =
      effectiveScore !== null &&
      isStudentEligible(student.id, student.semester_id, standings);

    return {
      studentId: student.id,
      studentName: student.full_name,
      classId: student.class_id,
      semesterId: student.semester_id,
      score: effectiveScore ?? 0,
      standing: activeStanding ?? null,
      isEligible: eligible,
      rank: null,
    };
  });

  const ranked = rankStudents(rows.filter((row) => row.isEligible));
  const rankMap = new Map(ranked.map((row) => [row.studentId, row.rank]));

  return rows.map((row) => ({
    ...row,
    rank: rankMap.get(row.studentId) ?? null,
  }));
}
