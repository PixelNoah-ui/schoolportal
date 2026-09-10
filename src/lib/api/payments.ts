import { createClient } from "@/utils/supabase/client";
import type { PaymentRow, PaymentStatus } from "@/lib/mock-data";

type PaymentRecord = {
  id: string;
  student_id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentRow["paymentMethod"] | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  note: string | null;
  proof_path: string | null;
  payment_month_allocations: { payment_month: string }[];
};

type PaymentStudentDetails = {
  id: string;
  student_number: string;
  profiles: { full_name: string }[];
  classId: string | null;
  className: string;
};

export type PaymentStudent = {
  id: string;
  student_number?: string | null;
  class_id: string | null;
  full_name: string;
  className: string;
  payments: {
    payment_month: string;
    status: PaymentStatus;
    payment_month_allocations: { payment_month: string }[];
  }[];
};

async function resolveProofUrl(proofPath: string | null) {
  if (!proofPath) {
    return "https://placehold.co/500x900/e3f2fd/1565c0?text=Payment+Receipt";
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(proofPath, 300);
    if (error || !data?.signedUrl) {
      return proofPath;
    }
    return data.signedUrl;
  } catch {
    return proofPath;
  }
}

async function mapPayment(
  payment: PaymentRecord,
  student?: PaymentStudentDetails,
): Promise<PaymentRow> {
  const coveredMonths = payment.payment_month_allocations
    .map((allocation) => allocation.payment_month.slice(0, 7))
    .filter(Boolean);
  const paymentMonth = coveredMonths[0] ?? "";

  return {
    id: payment.id,
    studentId: payment.student_id,
    studentName: student?.profiles[0]?.full_name ?? "Student",
    studentNumber: student?.student_number ?? "",
    classId: student?.classId ?? "",
    className: student?.className ?? "Unassigned",
    amount: Number(payment.amount),
    paymentMonth,
    coveredMonths: coveredMonths.length ? coveredMonths : undefined,
    status: payment.status,
    paymentMethod: payment.payment_method ?? "other",
    submittedAt: payment.submitted_at ?? "",
    screenshotUrl: await resolveProofUrl(payment.proof_path),
    reviewedAt: payment.reviewed_at ?? undefined,
    rejectionReason: payment.rejection_reason ?? undefined,
    note: payment.note ?? undefined,
  };
}

export interface PaymentListParams {
  month?: string;
  classId?: string;
  status?: PaymentStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentListResult {
  payments: PaymentRow[];
  totalPages: number;
  total: number;
}

export async function fetchPayments({
  month,
  classId = "all",
  status = "all",
  search = "",
  page = 1,
  pageSize = 6,
}: PaymentListParams = {}): Promise<PaymentListResult> {
  const supabase = createClient();
  let request = supabase
    .from("payments")
    .select(
      "id, student_id, amount, status, payment_method, submitted_at, reviewed_at, rejection_reason, note, proof_path, payment_month_allocations(payment_month)",
      { count: "exact" },
    )
    .order("submitted_at", { ascending: false });

  if (month && month !== "all") {
    const { data: allocations, error: allocationError } = await supabase
      .from("payment_month_allocations")
      .select("payment_id")
      .eq("payment_month", `${month}-01`);
    if (allocationError) throw new Error(allocationError.message);
    const allocationIds = (allocations ?? []).map((row) => row.payment_id);
    request = allocationIds.length
      ? request.in("id", allocationIds)
      : request.eq("id", "00000000-0000-0000-0000-000000000000");
  }
  if (status !== "all") request = request.eq("status", status);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  const payments = (data as PaymentRecord[] | null) ?? [];
  const studentIds = [
    ...new Set(payments.map((payment) => payment.student_id)),
  ];
  const { data: studentData, error: studentError } = studentIds.length
    ? await supabase
        .from("students")
        .select(
          "id, student_number, profiles!students_profile_id_fkey(full_name)",
        )
        .in("id", studentIds)
    : { data: [], error: null };
  if (studentError) throw new Error(studentError.message);

  const { data: enrollmentData, error: enrollmentError } = studentIds.length
    ? await supabase
        .from("student_enrollments")
        .select("student_id, class_id")
        .in("student_id", studentIds)
        .eq("status", "active")
    : { data: [], error: null };
  if (enrollmentError) throw new Error(enrollmentError.message);

  const classIds = [
    ...new Set((enrollmentData ?? []).map((enrollment) => enrollment.class_id)),
  ];
  const { data: classData, error: classError } = classIds.length
    ? await supabase
        .from("classes")
        .select("id, name, section, grade_level_id")
        .in("id", classIds)
    : { data: [], error: null };
  if (classError) throw new Error(classError.message);

  const gradeLevelIds = [
    ...new Set((classData ?? []).map((classRow) => classRow.grade_level_id)),
  ];
  const { data: gradeLevelData, error: gradeLevelError } = gradeLevelIds.length
    ? await supabase
        .from("grade_levels")
        .select("id, level_number")
        .in("id", gradeLevelIds)
    : { data: [], error: null };
  if (gradeLevelError) throw new Error(gradeLevelError.message);

  const classById = new Map(
    (classData ?? []).map((classRow) => [classRow.id, classRow]),
  );
  const gradeLevelById = new Map(
    (gradeLevelData ?? []).map((gradeLevel) => [gradeLevel.id, gradeLevel]),
  );
  const enrollmentByStudent = new Map(
    (enrollmentData ?? []).map((enrollment) => [
      enrollment.student_id,
      enrollment,
    ]),
  );
  const students = (
    (studentData ?? []) as Array<{
      id: string;
      student_number: string;
      profiles: { full_name: string }[];
    }>
  ).map((student) => {
    const enrollment = enrollmentByStudent.get(student.id);
    const classRow = enrollment
      ? classById.get(enrollment.class_id)
      : undefined;
    const gradeLevel = classRow
      ? gradeLevelById.get(classRow.grade_level_id)
      : undefined;
    return {
      ...student,
      classId: enrollment?.class_id ?? null,
      className: classRow
        ? `Grade ${gradeLevel?.level_number ?? ""} - ${classRow.section}`
        : "Unassigned",
    } satisfies PaymentStudentDetails;
  });
  const studentsById = new Map(
    students.map((student) => [student.id, student]),
  );
  const filteredPayments = payments.filter((payment) => {
    const student = studentsById.get(payment.student_id);
    const matchesClass = classId === "all" || student?.classId === classId;
    const matchesSearch =
      !search.trim() ||
      student?.profiles[0]?.full_name
        ?.toLowerCase()
        .includes(search.trim().toLowerCase()) ||
      student?.student_number
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());
    return matchesClass && matchesSearch;
  });
  const from = Math.max(0, page - 1) * pageSize;
  const pagePayments = filteredPayments.slice(from, from + pageSize);
  const mappedPayments = await Promise.all(
    pagePayments.map((payment) =>
      mapPayment(payment, studentsById.get(payment.student_id)),
    ),
  );

  return {
    payments: mappedPayments,
    total: filteredPayments.length,
    totalPages: Math.max(1, Math.ceil(filteredPayments.length / pageSize)),
  };
}

export function paymentCoversMonth(payment: PaymentRow, month: string) {
  return (
    payment.paymentMonth === month || payment.coveredMonths?.includes(month)
  );
}

export async function fetchPaymentStudents(): Promise<PaymentStudent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, profiles!students_profile_id_fkey(full_name), payments!payments_student_id_fkey(status, payment_month_allocations(payment_month))",
    );
  if (error) throw new Error(error.message);
  const students = (data ?? []) as Array<{
    id: string;
    profiles: { full_name: string }[];
    payments: {
      status: PaymentStatus;
      payment_month_allocations: { payment_month: string }[];
    }[];
  }>;
  const studentIds = students.map((student) => student.id);
  const { data: enrollmentData, error: enrollmentError } = studentIds.length
    ? await supabase
        .from("student_enrollments")
        .select("student_id, class_id")
        .in("student_id", studentIds)
        .eq("status", "active")
    : { data: [], error: null };
  if (enrollmentError) throw new Error(enrollmentError.message);
  const classIds = [
    ...new Set((enrollmentData ?? []).map((enrollment) => enrollment.class_id)),
  ];
  const { data: classData, error: classError } = classIds.length
    ? await supabase
        .from("classes")
        .select("id, name, section")
        .in("id", classIds)
    : { data: [], error: null };
  if (classError) throw new Error(classError.message);
  const enrollmentByStudent = new Map(
    (enrollmentData ?? []).map((enrollment) => [
      enrollment.student_id,
      enrollment,
    ]),
  );
  const classById = new Map(
    (classData ?? []).map((classRow) => [classRow.id, classRow]),
  );

  return students.map((student) => {
    const enrollment = enrollmentByStudent.get(student.id);
    const classRow = enrollment
      ? classById.get(enrollment.class_id)
      : undefined;
    return {
      id: student.id,
      student_number: undefined,
      class_id: enrollment?.class_id ?? null,
      full_name: student.profiles[0]?.full_name ?? "Student",
      className: classRow
        ? `${classRow.name} - ${classRow.section}`
        : "Unassigned",
      payments: student.payments ?? [],
    };
  });
}

export async function updatePaymentStatus(
  id: string,
  status: Extract<PaymentStatus, "approved" | "rejected">,
  rejectionReason?: string,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payments")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectionReason ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id, status };
}
