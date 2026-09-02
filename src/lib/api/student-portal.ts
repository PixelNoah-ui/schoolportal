import { createClient } from "@/utils/supabase/client";

export type StudentResult = {
  id: string;
  subject: string;
  className: string;
  semester: string;
  academicYearId: string;
  academicYear: string;
  score: number | null;
  maxScore: number;
  completed: number;
  total: number;
  components: {
    name: string;
    score: number | null;
    maxScore: number;
    status: string;
  }[];
};

export type StudentPayment = {
  id: string;
  amount: number;
  paymentMonth: string;
  status: "pending" | "approved" | "rejected";
  paymentMethod: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
  note: string | null;
};

async function getStudentId(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (error)
    throw new Error(`Could not load student profile: ${error.message}`);
  if (!data) {
    throw new Error(
      "No student record is linked to this account. An administrator must set students.profile_id to your authenticated user ID and apply the student RLS migration.",
    );
  }
  return data.id;
}

export async function fetchStudentResults(
  filters: { academicYearId?: string; semesterId?: string } = {},
) {
  const supabase = createClient();
  const studentId = await getStudentId(supabase);
  let request = supabase
    .from("assessment_results")
    .select(
      "score, status, course_assessments!inner(id, name, max_score, semester_id, semesters!inner(id, name, academic_year_id, academic_years!inner(id, name)), class_subjects!inner(subjects!inner(name), classes!inner(name, grade, section)))",
    )
    .eq("student_id", studentId);
  if (filters.semesterId)
    request = request.eq("course_assessments.semester_id", filters.semesterId);
  if (filters.academicYearId)
    request = request.eq(
      "course_assessments.semesters.academic_year_id",
      filters.academicYearId,
    );
  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const groups = new Map<string, StudentResult>();
  for (const row of (data ?? []) as any[]) {
    const assessment = Array.isArray(row.course_assessments)
      ? row.course_assessments[0]
      : row.course_assessments;
    const semester = Array.isArray(assessment?.semesters)
      ? assessment.semesters[0]
      : assessment?.semesters;
    const subject = Array.isArray(assessment?.class_subjects?.subjects)
      ? assessment.class_subjects.subjects[0]
      : assessment?.class_subjects?.subjects;
    const classRow = Array.isArray(assessment?.class_subjects?.classes)
      ? assessment.class_subjects.classes[0]
      : assessment?.class_subjects?.classes;
    if (!assessment || !semester) continue;
    const key = `${semester.id}:${assessment.class_subjects?.id ?? subject?.name}`;
    const result = groups.get(key) ?? {
      id: key,
      subject: subject?.name ?? "Subject",
      className: classRow
        ? `${classRow.grade}${classRow.section ?? ""}`
        : "Class",
      semester: semester.name,
      academicYearId: semester.academic_year_id,
      academicYear: semester.academic_years?.name ?? "Academic year",
      score: 0,
      maxScore: 0,
      completed: 0,
      total: 0,
      components: [],
    };
    const score = row.score == null ? null : Number(row.score);
    result.score =
      result.score == null || score == null ? null : result.score + score;
    result.maxScore += Number(assessment.max_score);
    result.total += 1;
    if (row.status === "graded") result.completed += 1;
    result.components.push({
      name: assessment.name,
      score,
      maxScore: Number(assessment.max_score),
      status: row.status,
    });
    groups.set(key, result);
  }
  return Array.from(groups.values()).map((result) => ({
    ...result,
    components: result.components.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export async function fetchStudentFilterOptions() {
  const supabase = createClient();
  const studentId = await getStudentId(supabase);
  const { data, error } = await supabase
    .from("assessment_results")
    .select(
      "course_assessments!inner(semester_id, semesters!inner(id, name, academic_year_id, academic_years!inner(id, name)))",
    )
    .eq("student_id", studentId);
  if (error) throw new Error(error.message);
  const years = new Map<string, string>();
  const semesters = new Map<string, { name: string; academicYearId: string }>();
  for (const row of (data ?? []) as any[]) {
    const assessment = Array.isArray(row.course_assessments)
      ? row.course_assessments[0]
      : row.course_assessments;
    const semester = Array.isArray(assessment?.semesters)
      ? assessment.semesters[0]
      : assessment?.semesters;
    if (semester) {
      years.set(semester.academic_years.id, semester.academic_years.name);
      semesters.set(semester.id, {
        name: semester.name,
        academicYearId: semester.academic_year_id,
      });
    }
  }
  return {
    years: Array.from(years, ([id, name]) => ({ id, name })),
    semesters: Array.from(semesters, ([id, value]) => ({ id, ...value })),
  };
}

export async function fetchStudentPayments() {
  const supabase = createClient();
  const studentId = await getStudentId(supabase);
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_month, status, payment_method, submitted_at, rejection_reason, note",
    )
    .eq("student_id", studentId)
    .order("payment_month", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as StudentPayment[]).map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
    paymentMonth: payment.payment_month,
    submittedAt: payment.submitted_at,
  }));
}

export async function submitStudentPayment(input: {
  amount: number;
  paymentMonth: string;
  paymentMethod: string;
  note?: string;
  proof: File;
}) {
  const supabase = createClient();
  const studentId = await getStudentId(supabase);
  const path = `${studentId}/${crypto.randomUUID()}-${input.proof.name}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, input.proof, { upsert: false });
  if (uploadError) throw new Error(uploadError.message);
  const { error } = await supabase
    .from("payments")
    .insert({
      student_id: studentId,
      amount: input.amount,
      payment_month: `${input.paymentMonth}-01`,
      payment_method: input.paymentMethod,
      note: input.note ?? null,
      proof_path: path,
      status: "pending",
    });
  if (error) throw new Error(error.message);
}
