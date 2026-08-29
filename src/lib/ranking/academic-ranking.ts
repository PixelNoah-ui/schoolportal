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

export type RankingPeriod = "sem1" | "sem2" | "final";

export interface AssessmentAttempt {
  id: string;
  studentId: string;
  assessmentId: string;
  attemptNumber: number;
  score: number | null;
  status: GradeStatus;
  reasonCode?: string;
  isMakeup: boolean;
  isExcused: boolean;
  isCheatingFlagged: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  note?: string;
}

export interface AcademicStanding {
  id: string;
  studentId: string;
  semesterId: string;
  standingType: AcademicStandingType;
  reason?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface RankingPolicy {
  id: string;
  semesterId: string;
  requireAllSubjectsComplete: boolean;
  allowMakeupExam: boolean;
  useLatestValidScore: boolean;
  useBestValidScore: boolean;
  zeroForUnexcusedAbsence: boolean;
  excludeDisciplinary: boolean;
  excludeWithdrawn: boolean;
  excludeSuspended: boolean;
  version: number;
}

export interface StudentScoreInput {
  studentId: string;
  studentName: string;
  classId: string;
  score: number;
}

export interface RankedStudent {
  studentId: string;
  studentName: string;
  classId: string;
  score: number;
  rank: number | null;
  standing: AcademicStanding | null;
  isEligible: boolean;
}

export interface SubjectCompletionItem {
  subjectId: string;
  complete: boolean;
}

export const defaultRankingPolicy: RankingPolicy = {
  id: "policy-default",
  semesterId: "semester-current",
  requireAllSubjectsComplete: true,
  allowMakeupExam: true,
  useLatestValidScore: true,
  useBestValidScore: false,
  zeroForUnexcusedAbsence: false,
  excludeDisciplinary: true,
  excludeWithdrawn: true,
  excludeSuspended: true,
  version: 1,
};

export function getEffectiveAssessmentScore(
  attempts: AssessmentAttempt[],
  policy: RankingPolicy,
): number | null {
  if (attempts.length === 0) return null;

  const validAttempts = attempts.filter(
    (attempt) =>
      attempt.score !== null &&
      attempt.status !== "invalidated" &&
      attempt.status !== "rejected" &&
      attempt.status !== "pending_review",
  );

  if (validAttempts.length === 0) {
    return policy.zeroForUnexcusedAbsence ? 0 : null;
  }

  if (policy.useBestValidScore) {
    return Number(
      Math.max(...validAttempts.map((attempt) => attempt.score ?? 0)).toFixed(
        2,
      ),
    );
  }

  if (policy.useLatestValidScore) {
    const latest = [...validAttempts].sort((a, b) => {
      const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bTime - aTime;
    })[0];

    return latest.score !== null ? Number(latest.score.toFixed(2)) : null;
  }

  const average =
    validAttempts.reduce((sum, attempt) => sum + (attempt.score ?? 0), 0) /
    validAttempts.length;

  return Number(average.toFixed(2));
}

export function isStudentEligibleForRanking(
  studentId: string,
  semesterId: string,
  standings: AcademicStanding[],
  policy: RankingPolicy,
): boolean {
  const activeStanding = standings.find(
    (standing) =>
      standing.studentId === studentId &&
      standing.semesterId === semesterId &&
      standing.isActive,
  );

  if (!activeStanding) return true;

  if (
    policy.excludeDisciplinary &&
    activeStanding.standingType === "disciplinary"
  ) {
    return false;
  }

  if (policy.excludeWithdrawn && activeStanding.standingType === "withdrawn") {
    return false;
  }

  if (policy.excludeSuspended && activeStanding.standingType === "suspended") {
    return false;
  }

  return true;
}

export function isClassReadyForRanking(
  subjectCompletion: SubjectCompletionItem[],
  policy: RankingPolicy,
): boolean {
  if (!policy.requireAllSubjectsComplete) return true;
  return subjectCompletion.every((item) => item.complete);
}

export function rankStudents(
  rows: Array<{
    studentId: string;
    studentName: string;
    classId: string;
    score: number;
    standing: AcademicStanding | null;
  }>,
): RankedStudent[] {
  const eligible = rows.filter((row) => row.standing === null);
  const sorted = [...eligible].sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((row, index) => {
    if (row.score !== lastScore) {
      lastRank = index + 1;
      lastScore = row.score;
    }

    return {
      studentId: row.studentId,
      studentName: row.studentName,
      classId: row.classId,
      score: row.score,
      rank: lastRank,
      standing: null,
      isEligible: true,
    };
  });
}

export function buildRankingSnapshot({
  studentScores,
  standings,
  policy,
}: {
  studentScores: StudentScoreInput[];
  standings: AcademicStanding[];
  policy: RankingPolicy;
}): RankedStudent[] {
  const byStudent = new Map<string, StudentScoreInput>();

  for (const item of studentScores) {
    byStudent.set(item.studentId, item);
  }

  const results: RankedStudent[] = studentScores.map((item) => {
    const activeStanding = standings.find(
      (standing) =>
        standing.studentId === item.studentId &&
        standing.semesterId === policy.semesterId &&
        standing.isActive,
    );

    const isEligible = isStudentEligibleForRanking(
      item.studentId,
      policy.semesterId,
      standings,
      policy,
    );

    return {
      studentId: item.studentId,
      studentName: item.studentName,
      classId: item.classId,
      score: item.score,
      rank: null,
      standing: activeStanding ?? null,
      isEligible,
    };
  });

  const eligible = results.filter(
    (row) => row.isEligible && row.standing === null,
  );

  const ranked = rankStudents(
    eligible.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName,
      classId: row.classId,
      score: row.score,
      standing: null,
    })),
  );

  const rankByStudent = new Map(ranked.map((row) => [row.studentId, row.rank]));

  return results.map((row) => ({
    ...row,
    rank: rankByStudent.get(row.studentId) ?? null,
  }));
}

export function createAcademicGradeStatusSummary(
  attempts: AssessmentAttempt[],
) {
  return {
    pendingReview: attempts.filter((a) => a.status === "pending_review").length,
    invalidated: attempts.filter((a) => a.status === "invalidated").length,
    excused: attempts.filter((a) => a.status === "excused_absence").length,
    makeupPending: attempts.filter((a) => a.status === "makeup_pending").length,
    approved: attempts.filter((a) => a.status === "approved").length,
  };
}
