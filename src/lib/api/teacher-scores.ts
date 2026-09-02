import { createClient } from "@/utils/supabase/client";

export interface StudentScoreRow {
  id: string;
  studentId: string;
  studentNumber: string;
  fullName: string;
  score: number | null;
  isFinal: boolean;
}

export interface ScoresListResult {
  scores: StudentScoreRow[];
  className: string;
  subjectName: string;
  semester: string;
  canEdit: boolean;
}

export interface ScoreUpsertInput {
  classSubjectId: string;
  semesterId: string;
  studentId: string;
  score: number;
}

export interface ScoreFinalInput {
  classSubjectId: string;
  semesterId: string;
  isFinal: boolean;
}

type GradeRecord = {
  id: string;
  student_id: string;
  score: number | null;
  is_final: boolean;
};

type StudentRecord = {
  id: string;
  profiles: { full_name: string }[];
};

type ClassSubjectRecord = {
  id: string;
  classes: { name: string }[];
  subjects: { name: string }[];
  semesters: { id: string; name: string }[];
};

/**
 * Fetch scores for a class in a specific semester
 */
export async function fetchClassScores({
  classSubjectId,
  semesterId,
}: {
  classSubjectId: string;
  semesterId: string;
}): Promise<ScoresListResult> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify teacher owns this class_subject
  const { data: classSubject, error: csError } = await supabase
    .from("class_subjects")
    .select("id, teacher_id")
    .eq("id", classSubjectId)
    .single();

  if (csError || !classSubject) throw new Error("Class not found");

  // Get teacher ID
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacher) throw new Error("Teacher not found");

  if (classSubject.teacher_id !== teacher.id) {
    throw new Error("Unauthorized: You do not teach this class");
  }

  // Fetch class, subject, and semester info
  const { data: csDetailData, error: csDetailError } = await supabase
    .from("class_subjects")
    .select("id, classes(name), subjects(name), semesters(id, name)")
    .eq("id", classSubjectId)
    .single();

  if (csDetailError || !csDetailData) throw new Error("Class not found");

  const csDetail = csDetailData as ClassSubjectRecord;

  // Fetch all students in the class
  const { data: studentsData, error: studentsError } = await supabase
    .from("classes")
    .select(
      "students(id, profiles(full_name), grades(id, student_id, score, is_final))",
    )
    .eq("id", classSubject.class_id)
    .single();

  if (studentsError) throw new Error(studentsError.message);

  // Fetch grades for this class_subject and semester
  const { data: gradesData, error: gradesError } = await supabase
    .from("grades")
    .select("id, student_id, score, is_final")
    .eq("class_subject_id", classSubjectId)
    .eq("semester_id", semesterId);

  if (gradesError) throw new Error(gradesError.message);

  const gradesMap = new Map(
    (gradesData as GradeRecord[]).map((g) => [
      g.student_id,
      { score: g.score, isFinal: g.is_final },
    ]),
  );

  // Map students with their scores
  const classData = studentsData as any;
  const scores: StudentScoreRow[] = (classData?.students || []).map(
    (student: any) => {
      const gradeInfo = gradesMap.get(student.id) || {
        score: null,
        isFinal: false,
      };
      return {
        id: student.id,
        studentId: student.id,
        studentNumber: student.id.slice(0, 8).toUpperCase(),
        fullName: student.profiles?.[0]?.full_name ?? "Unknown",
        score: gradeInfo.score,
        isFinal: gradeInfo.isFinal,
      };
    },
  );

  return {
    scores,
    className: csDetail.classes[0]?.name ?? "Unknown Class",
    subjectName: csDetail.subjects[0]?.name ?? "Unknown Subject",
    semester: csDetail.semesters[0]?.name ?? "Unknown Semester",
    canEdit: !scores.some((s) => s.isFinal),
  };
}

/**
 * Upsert (create or update) a single score
 */
export async function upsertScore(input: ScoreUpsertInput) {
  const supabase = createClient();

  // Get current user for permission check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify teacher owns this class_subject
  const { data: classSubject, error: csError } = await supabase
    .from("class_subjects")
    .select("id, teacher_id")
    .eq("id", input.classSubjectId)
    .single();

  if (csError || !classSubject) throw new Error("Class not found");

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacher) throw new Error("Teacher not found");

  if (classSubject.teacher_id !== teacher.id) {
    throw new Error("Unauthorized");
  }

  // Check if grade already exists
  const { data: existing } = await supabase
    .from("grades")
    .select("id")
    .eq("class_subject_id", input.classSubjectId)
    .eq("semester_id", input.semesterId)
    .eq("student_id", input.studentId)
    .maybeSingle();

  if (existing) {
    // Update
    const { error } = await supabase
      .from("grades")
      .update({ score: input.score })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    // Insert
    const { error } = await supabase.from("grades").insert({
      class_subject_id: input.classSubjectId,
      semester_id: input.semesterId,
      student_id: input.studentId,
      score: input.score,
      is_final: false,
    });

    if (error) throw new Error(error.message);
  }
}

/**
 * Bulk upsert multiple scores
 */
export async function upsertScores(inputs: ScoreUpsertInput[]) {
  const supabase = createClient();

  // Get current user for permission check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  if (inputs.length === 0) return;

  // Use the first input to verify teacher
  const classSubjectId = inputs[0].classSubjectId;
  const { data: classSubject, error: csError } = await supabase
    .from("class_subjects")
    .select("id, teacher_id")
    .eq("id", classSubjectId)
    .single();

  if (csError || !classSubject) throw new Error("Class not found");

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacher) throw new Error("Teacher not found");

  if (classSubject.teacher_id !== teacher.id) {
    throw new Error("Unauthorized");
  }

  // Prepare records to upsert
  const recordsToInsert = inputs.map((input) => ({
    class_subject_id: input.classSubjectId,
    semester_id: input.semesterId,
    student_id: input.studentId,
    score: input.score,
    is_final: false,
  }));

  // Use upsert with on_conflict
  const { error } = await supabase.from("grades").upsert(recordsToInsert, {
    onConflict: "class_subject_id,semester_id,student_id",
  });

  if (error) throw new Error(error.message);
}

/**
 * Mark all scores for a class_subject+semester as final (or unfinal)
 */
export async function setScoreFinal(input: ScoreFinalInput) {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Verify teacher owns this class_subject
  const { data: classSubject, error: csError } = await supabase
    .from("class_subjects")
    .select("id, teacher_id")
    .eq("id", input.classSubjectId)
    .single();

  if (csError || !classSubject) throw new Error("Class not found");

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (teacherError || !teacher) throw new Error("Teacher not found");

  if (classSubject.teacher_id !== teacher.id) {
    throw new Error("Unauthorized");
  }

  // Update all grades for this class_subject and semester
  const { error } = await supabase
    .from("grades")
    .update({ is_final: input.isFinal })
    .eq("class_subject_id", input.classSubjectId)
    .eq("semester_id", input.semesterId);

  if (error) throw new Error(error.message);
}
