import { createClient } from "@/utils/supabase/client";
import type { PaymentRow, PaymentStatus } from "@/lib/mock-data";

type PaymentRecord = {
  id: string;
  student_id: string;
  amount: number;
  payment_month: string;
  status: PaymentStatus;
  payment_method: PaymentRow["paymentMethod"] | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  note: string | null;
  screenshot_url: string | null;
  students: {
    student_number: string | null;
    class_id: string | null;
    profiles: { full_name: string }[];
    classes: { name: string; grade: number; section: string | null }[];
  }[];
  payment_month_allocations: { payment_month: string }[];
};

export type PaymentStudent = {
  id: string;
  student_number: string | null;
  class_id: string | null;
  full_name: string;
  className: string;
  payments: {
    payment_month: string;
    status: PaymentStatus;
    payment_month_allocations: { payment_month: string }[];
  }[];
};

function mapPayment(payment: PaymentRecord): PaymentRow {
  const student = payment.students[0];
  const classRow = student?.classes[0];
  const coveredMonths = payment.payment_month_allocations
    .map((allocation) => allocation.payment_month.slice(0, 7))
    .filter(Boolean);

  return {
    id: payment.id,
    studentId: payment.student_id,
    studentName: student?.profiles[0]?.full_name ?? "Unknown student",
    studentNumber: student?.student_number ?? "",
    classId: student?.class_id ?? "",
    className: classRow
      ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`
      : "Unassigned",
    amount: Number(payment.amount),
    paymentMonth: payment.payment_month.slice(0, 7),
    coveredMonths: coveredMonths.length ? coveredMonths : undefined,
    status: payment.status,
    paymentMethod: payment.payment_method ?? "other",
    submittedAt: payment.submitted_at ?? "",
    screenshotUrl:
      payment.screenshot_url ??
      "https://placehold.co/500x900/e3f2fd/1565c0?text=Payment+Receipt",
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
  pageSize = 10,
}: PaymentListParams = {}): Promise<PaymentListResult> {
  const supabase = createClient();
  let request = supabase
    .from("payments")
    .select(
      "id, student_id, amount, payment_month, status, payment_method, submitted_at, reviewed_at, rejection_reason, note, screenshot_url, students(student_number, class_id, profiles(full_name), classes(name, grade, section)), payment_month_allocations(payment_month)",
      { count: "exact" },
    )
    .order("submitted_at", { ascending: false });

  if (month) {
    const { data: allocations, error: allocationError } = await supabase
      .from("payment_month_allocations")
      .select("payment_id")
      .eq("payment_month", `${month}-01`);
    if (allocationError) throw new Error(allocationError.message);
    const allocationIds = (allocations ?? []).map((row) => row.payment_id);
    request = allocationIds.length
      ? request.or(
          `payment_month.eq.${month}-01,id.in.(${allocationIds.join(",")})`,
        )
      : request.eq("payment_month", `${month}-01`);
  }
  if (classId !== "all") request = request.eq("students.class_id", classId);
  if (status !== "all") request = request.eq("status", status);
  if (search.trim()) {
    request = request.or(
      `full_name.ilike.%${search.trim()}%,student_number.ilike.%${search.trim()}%`,
      { foreignTable: "students" },
    );
  }

  const from = Math.max(0, page - 1) * pageSize;
  const { data, error, count } = await request.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  return {
    payments: (data as PaymentRecord[] | null)?.map(mapPayment) ?? [],
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
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
      "id, student_number, class_id, profiles(full_name), classes(name, grade, section), payments(payment_month, status, payment_month_allocations(payment_month))",
    );
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const student = row as {
      id: string;
      student_number: string | null;
      class_id: string | null;
      profiles: { full_name: string }[];
      classes: { name: string; grade: number; section: string | null }[];
      payments: {
        payment_month: string;
        status: PaymentStatus;
        payment_month_allocations: { payment_month: string }[];
      }[];
    };
    const classRow = student.classes[0];
    return {
      id: student.id,
      student_number: student.student_number,
      class_id: student.class_id,
      full_name: student.profiles[0]?.full_name ?? "Unknown student",
      className: classRow
        ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`
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
