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

export type PaymentOption = {
  id: string;
  name: string;
  paymentMethod: string;
  accountName: string | null;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  iconUrl: string | null;
};

type StudentGradeQueryRow = {
  score: number | null;
  status: string;
  class_subject_id: string;
  semester_id: string;
  class_subjects:
    | {
        id: string;
        subjects: { name: string } | { name: string }[] | null;
        classes:
          | {
              name: string;
              section: string | null;
              grade_levels:
                | { level_number: number }
                | { level_number: number }[]
                | null;
            }
          | {
              name: string;
              section: string | null;
              grade_levels:
                | { level_number: number }
                | { level_number: number }[]
                | null;
            }[];
      }
    | {
        id: string;
        subjects: { name: string } | { name: string }[] | null;
        classes:
          | {
              name: string;
              section: string | null;
              grade_levels:
                | { level_number: number }
                | { level_number: number }[]
                | null;
            }
          | {
              name: string;
              section: string | null;
              grade_levels:
                | { level_number: number }
                | { level_number: number }[]
                | null;
            }[];
      }[];
  semesters:
    | {
        id: string;
        name: string;
        academic_year_id: string;
        academic_years:
          | { id: string; name: string }
          | { id: string; name: string }[];
      }
    | {
        id: string;
        name: string;
        academic_year_id: string;
        academic_years:
          | { id: string; name: string }
          | { id: string; name: string }[];
      }[];
};

type StudentSemesterQueryRow = Pick<StudentGradeQueryRow, "semesters">;

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

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
    .from("grades")
    .select("score, status, class_subject_id, semester_id")
    .eq("student_id", studentId)
    .not("score", "is", null);
  if (filters.semesterId)
    request = request.eq("semester_id", filters.semesterId);
  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const gradeRows = (data ?? []) as {
    score: number;
    status: string;
    class_subject_id: string;
    semester_id: string;
    component_name?: string;
    max_score?: number;
  }[];
  const { data: assessmentResultRows, error: assessmentResultsError } =
    await supabase
      .from("assessment_results")
      .select("score, status, course_assessment_id")
      .eq("student_id", studentId)
      .not("score", "is", null);
  if (assessmentResultsError) throw new Error(assessmentResultsError.message);

  const assessmentIds = (assessmentResultRows ?? []).map(
    (row) => row.course_assessment_id,
  );
  const { data: assessmentRows, error: assessmentsError } = assessmentIds.length
    ? await supabase
        .from("course_assessments")
        .select("id, name, max_score, class_subject_id, semester_id")
        .in("id", assessmentIds)
    : { data: [], error: null };
  if (assessmentsError) throw new Error(assessmentsError.message);
  const assessmentById = new Map(
    (assessmentRows ?? []).map((assessment) => [assessment.id, assessment]),
  );
  const assessmentGradeRows = (assessmentResultRows ?? []).flatMap((row) => {
    const assessment = assessmentById.get(row.course_assessment_id);
    return assessment
      ? [
          {
            score: Number(row.score),
            status: row.status,
            class_subject_id: assessment.class_subject_id,
            semester_id: assessment.semester_id,
            component_name: assessment.name,
            max_score: Number(assessment.max_score),
          },
        ]
      : [];
  });
  const gradeKeys = new Set(
    gradeRows.map((row) => `${row.class_subject_id}:${row.semester_id}`),
  );
  const allGradeRows = [
    ...gradeRows,
    ...assessmentGradeRows.filter(
      (row) => !gradeKeys.has(`${row.class_subject_id}:${row.semester_id}`),
    ),
  ];
  const semesterIds = [...new Set(allGradeRows.map((row) => row.semester_id))];
  const classSubjectIds = [
    ...new Set(allGradeRows.map((row) => row.class_subject_id)),
  ];
  const [{ data: semesters }, { data: classSubjects }] = await Promise.all([
    semesterIds.length
      ? supabase
          .from("semesters")
          .select("id, name, academic_year_id, academic_years!inner(id, name)")
          .in("id", semesterIds)
      : Promise.resolve({ data: [], error: null }),
    classSubjectIds.length
      ? supabase
          .from("class_subjects")
          .select(
            "id, subjects(name), classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number))",
          )
          .in("id", classSubjectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const semesterById = new Map(
    (semesters ?? []).map((semester) => [semester.id, semester]),
  );
  const classSubjectById = new Map(
    (classSubjects ?? []).map((classSubject) => [
      classSubject.id,
      classSubject,
    ]),
  );

  const groups = new Map<string, StudentResult>();
  for (const row of allGradeRows) {
    const classSubject = classSubjectById.get(row.class_subject_id) as
      | StudentGradeQueryRow["class_subjects"]
      | undefined;
    const semester = semesterById.get(row.semester_id) as
      | StudentGradeQueryRow["semesters"]
      | undefined;
    const subject = firstRelation(classSubject?.subjects);
    const classRow = firstRelation(classSubject?.classes);
    const gradeLevel = firstRelation(classRow?.grade_levels);
    if (!semester) continue;
    const academicYear = firstRelation(semester.academic_years);
    if (
      filters.academicYearId &&
      semester.academic_year_id !== filters.academicYearId
    )
      continue;
    const key = `${semester.id}:${row.class_subject_id}`;
    const result = groups.get(key) ?? {
      id: key,
      subject: subject?.name ?? "Subject",
      className: classRow
        ? `${gradeLevel?.level_number ?? ""}${classRow.section ?? ""}`
        : "Class",
      semester: semester.name,
      academicYearId: semester.academic_year_id,
      academicYear: academicYear?.name ?? "Academic year",
      score: 0,
      maxScore: 0,
      completed: 0,
      total: 0,
      components: [],
    };
    const score = Number(row.score);
    result.score = (result.score ?? 0) + score;
    result.maxScore += row.max_score ?? 100;
    result.total += 1;
    if (row.status === "submitted" || row.status === "active")
      result.completed += 1;
    result.components.push({
      name: row.component_name ?? "Grade",
      score,
      maxScore: row.max_score ?? 100,
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
    .from("grades")
    .select(
      "semester_id, semesters!inner(id, name, academic_year_id, academic_years!inner(id, name))",
    )
    .eq("student_id", studentId)
    .not("score", "is", null);
  if (error) throw new Error(error.message);
  const years = new Map<string, string>();
  const semesters = new Map<string, { name: string; academicYearId: string }>();
  for (const row of (data ?? []) as unknown as StudentSemesterQueryRow[]) {
    const semester = firstRelation(row.semesters);
    const academicYear = firstRelation(semester?.academic_years);
    if (semester && academicYear) {
      years.set(academicYear.id, academicYear.name);
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

export async function fetchPaymentOptions(): Promise<PaymentOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_options")
    .select(
      "id, name, payment_method, account_name, account_number, phone_number, instructions, icon_url",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((option) => ({
    id: option.id,
    name: option.name,
    paymentMethod: option.payment_method,
    accountName: option.account_name,
    accountNumber: option.account_number,
    phoneNumber: option.phone_number,
    instructions: option.instructions,
    iconUrl: option.icon_url,
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
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      student_id: studentId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      note: input.note ?? null,
      proof_path: path,
      status: "pending",
    })
    .select("id")
    .single();
  if (paymentError || !payment) {
    throw new Error(
      paymentError?.message ?? "Could not create payment record.",
    );
  }

  const { error: allocationError } = await supabase
    .from("payment_month_allocations")
    .insert({
      payment_id: payment.id,
      payment_month: `${input.paymentMonth}-01`,
    });
  if (allocationError) throw new Error(allocationError.message);
}
