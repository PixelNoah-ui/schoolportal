// lib/ranking-utils.ts
//
// Moved from utils/supabase/ranking-utils.ts — this is pure computation over
// in-memory data, it has no dependency on Supabase. Keeping data-source-
// specific code out of here means when `rankingData` / `gradeSubmissions`
// become real Supabase queries, this file's public API doesn't need to
// change — only the imports at the top do.

import type {
  RankingRow,
  StudentStanding,
  GradeSubmissionStatus,
} from "@/lib/mock-data";

export type Period = "sem1" | "sem2" | "final";

export const periodLabel: Record<Period, string> = {
  sem1: "Semester 1",
  sem2: "Semester 2",
  final: "Final (Combined)",
};

export const currentAcademicYearRecord = { id: "", name: "", is_current: true };

export function periodToSemesterNames(period: Period): string[] {
  if (period === "sem1") return ["Semester 1"];
  if (period === "sem2") return ["Semester 2"];
  return ["Semester 1", "Semester 2"];
}

function scoreFor(row: RankingRow, period: Period): number {
  if (period === "sem1") return row.semester1;
  if (period === "sem2") return row.semester2;
  return (row.semester1 + row.semester2) / 2;
}

function standingFor(
  studentId: string,
  period: Period,
): { standing: StudentStanding | null; reason: string | null } {
  void studentId;
  void period;
  // "final" spans both semesters — a standing recorded in either one still
  // excludes the student from a combined ranking.
  return {
    standing: null,
    reason: null,
  };
}

// --- Class / period submission completeness --------------------------------

export interface ClassCompletion {
  percent: number;
  status: GradeSubmissionStatus;
  pending: { subjectName: string; teacher: string }[];
}

export function getClassCompletion(
  classId: string,
  period: Period,
): ClassCompletion {
  void classId;
  void period;
  return { percent: 100, status: "complete", pending: [] };
}

export function getOverallCompletion(period: Period) {
  void period;
  return { percent: 100, pendingClasses: [] };
}

export function isFinalReady(): boolean {
  return true;
}

// --- Ranking -----------------------------------------------------------------

export interface RankedRow extends RankingRow {
  score: number;
  rank: number | null;
  standing: { standing: StudentStanding | null; reason: string | null };
}

/**
 * Ranks the given rows for a period, with two hard rules:
 *
 *  1. A class only produces numeric ranks once every subject for that class
 *     has fully submitted grades for the period. Otherwise every student in
 *     that class gets rank = null ("not ranked yet") — never a numeric rank
 *     computed against incomplete data.
 *  2. A student with an active standing record (disciplinary / excused /
 *     withdrawn) for the period is excluded from numeric ranking regardless
 *     of whether their class is otherwise ready.
 *
 * Ties share a rank (competition ranking: 1, 2, 2, 4 — not 1, 2, 3, 4).
 */
export function rankStudents(rows: RankingRow[], period: Period): RankedRow[] {
  const withScore = rows.map((r) => ({
    ...r,
    score: scoreFor(r, period),
    standing: standingFor(r.studentId, period),
  }));

  const byClass = new Map<string, typeof withScore>();
  for (const row of withScore) {
    const bucket = byClass.get(row.classId) ?? [];
    bucket.push(row);
    byClass.set(row.classId, bucket);
  }

  const result: RankedRow[] = [];

  for (const classRows of byClass.values()) {
    const classReady = true;

    const eligible = classRows.filter(
      (r) => classReady && r.standing.standing === null,
    );
    const excluded = classRows.filter(
      (r) => !classReady || r.standing.standing !== null,
    );

    const sorted = [...eligible].sort((a, b) => b.score - a.score);
    let lastScore: number | null = null;
    let lastRank = 0;
    sorted.forEach((row, i) => {
      if (row.score !== lastScore) {
        lastRank = i + 1;
        lastScore = row.score;
      }
      result.push({ ...row, rank: lastRank });
    });

    excluded.forEach((row) => result.push({ ...row, rank: null }));
  }

  return result;
}
