import { createClient } from "@/utils/supabase/client";
import type {
  AllStudentRow,
  ClassRow,
  DashboardData,
  PaymentRow,
  Profile,
  SubjectRow,
} from "@/utils/types/dashboard";
import { fetchStudents } from "@/lib/api/students";

type ProfileRow = Pick<
  Profile,
  "id" | "full_name" | "username" | "email" | "role"
>;

type StudentRecord = {
  id: string;
  profile_id: string;
  class_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
  temporary_password: string | null;
  created_at: string;
  profiles: ProfileRow[];
  classes: {
    id: string;
    name: string;
    grade: number;
    section: string | null;
  }[];
};

type TeacherRecord = { id: string; profile_id: string; profiles: ProfileRow[] };

type ClassRecord = {
  id: string;
  name: string;
  grade: number;
  section: string | null;
};

type SubjectRecord = { id: string; name: string };

type ClassSubjectRecord = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
};

type GradeRecord = {
  score: number;
  student_id: string;
  class_subject_id: string;
};

type PaymentRecord = {
  id: string;
  student_id: string;
  amount: number;
  payment_month: string;
  status: PaymentRow["status"];
  payment_method: PaymentRow["paymentMethod"];
  submitted_at: string | null;
  note: string | null;
  students: { profiles: Pick<ProfileRow, "full_name">[] }[];
};

type AcademicYearRecord = {
  id: string;
  name: string;
  is_current: boolean;
};

type SemesterRecord = { academic_year_id: string; name: string };

function resolveStudentDisplayName(
  profile?: Partial<ProfileRow> | null,
  fallback = "Unknown student",
) {
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;

  const username = profile?.username?.trim();
  if (username) return username;

  const email = profile?.email?.trim();
  if (email) return email.split("@")[0] || fallback;

  return fallback;
}

async function query<T>(
  request: PromiseLike<{ data: T | null; error: { message: string } | null }>,
) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? ([] as T);
}

export async function fetchDashboard(): Promise<DashboardData> {
  const supabase = createClient();
  const dashboardStudents = await fetchStudents({ pageSize: 200 });
  const students = dashboardStudents.students;

  const [
    teachers,
    classes,
    subjects,
    classSubjects,
    grades,
    years,
    semesters,
    payments,
  ] = await Promise.all([
    query<TeacherRecord>(
      supabase
        .from("teachers")
        .select(
          "id, profile_id, profiles!teachers_profile_id_fkey(id, full_name, username, email, role)",
        ),
    ),
    query<ClassRecord[]>(
      supabase
        .from("classes")
        .select("id, name, grade, section")
        .order("grade"),
    ),
    query<SubjectRecord[]>(
      supabase.from("subjects").select("id, name").order("name"),
    ),
    query<ClassSubjectRecord[]>(
      supabase
        .from("class_subjects")
        .select("id, class_id, subject_id, teacher_id"),
    ),
    query<GradeRecord[]>(
      supabase.from("grades").select("score, student_id, class_subject_id"),
    ),
    query<AcademicYearRecord[]>(
      supabase
        .from("academic_years")
        .select("id, name, is_current")
        .order("is_current", { ascending: false }),
    ),
    query<SemesterRecord[]>(
      supabase.from("semesters").select("academic_year_id, name").order("name"),
    ),
    query<PaymentRecord[]>(
      supabase
        .from("payments")
        .select(
          "id, student_id, amount, payment_month, status, payment_method, submitted_at, note, students!payments_student_id_fkey(profiles!students_profile_id_fkey(full_name))",
        )
        .order("created_at", { ascending: false }),
    ),
  ]);

  const classesById = new Map(classes.map((row) => [row.id, row]));
  const teachersById = new Map(teachers.map((row) => [row.id, row.profile_id]));
  const profilesById = new Map(
    [
      ...teachers.map(
        (row) => [row.profile_id, row.profiles?.[0] ?? null] as const,
      ),
    ].filter(([, profile]) => profile !== null),
  );

  const scoresBySubject = new Map<string, number[]>();
  grades.forEach((grade) => {
    const classSubject = classSubjects.find(
      (row) => row.id === grade.class_subject_id,
    );
    if (!classSubject) return;
    const scores = scoresBySubject.get(classSubject.subject_id) ?? [];
    scores.push(Number(grade.score));
    scoresBySubject.set(classSubject.subject_id, scores);
  });

  const mappedStudents: AllStudentRow[] = students;

  // NOTE: homeroom teacher isn't joined in the current `classes` select, so
  // this stays "Unassigned" until that relation is added to the query.
  const mappedClasses: ClassRow[] = classes.map((classRow) => ({
    ...classRow,
    section: classRow.section ?? "",
    studentCount: students.filter((student) => student.classId === classRow.id)
      .length,
    teacher: "Unassigned",
  }));

  const mappedSubjects: SubjectRow[] = subjects.map((subject) => {
    const assignment = classSubjects.find(
      (row) => row.subject_id === subject.id,
    );
    const classRow = assignment
      ? classesById.get(assignment.class_id)
      : undefined;
    const teacherProfileId = assignment
      ? teachersById.get(assignment.teacher_id ?? "")
      : undefined;
    const teacher = teacherProfileId
      ? (profilesById.get(teacherProfileId)?.full_name ?? "Assigned teacher")
      : "Unassigned";
    const scores = scoresBySubject.get(subject.id) ?? [];
    return {
      id: subject.id,
      name: subject.name,
      className: classRow
        ? `Grade ${classRow.grade} - ${classRow.section ?? ""}`
        : "All classes",
      classId: classRow?.id ?? "",
      teacher,
      avgScore: scores.length
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : 0,
    };
  });

  const currentYear = years.find((year) => year.is_current) ?? years[0];
  const currentSemester = currentYear
    ? semesters.find((semester) => semester.academic_year_id === currentYear.id)
    : undefined;

  const enrollment = new Map<number, number>();
  mappedClasses.forEach((classRow) =>
    enrollment.set(
      classRow.grade,
      (enrollment.get(classRow.grade) ?? 0) + classRow.studentCount,
    ),
  );

  const scores = grades.map((grade) => Number(grade.score));

  const mappedPayments: PaymentRow[] = payments.map((payment) => {
    const studentRecord = students.find((row) => row.id === payment.student_id);
    const className = studentRecord?.className ?? "Unassigned";
    const studentProfile = payment.students?.[0]?.profiles?.[0];

    return {
      id: payment.id,
      studentId: payment.student_id,
      studentName: resolveStudentDisplayName(studentProfile, "Unknown student"),
      studentNumber: studentRecord?.student_number ?? "",
      classId: studentRecord?.classId ?? "",
      className,
      amount: Number(payment.amount),
      paymentMonth: payment.payment_month,
      status: payment.status,
      paymentMethod: payment.payment_method ?? "other",
      submittedAt: payment.submitted_at ?? "",
      screenshotUrl:
        "https://placehold.co/500x900/e3f2fd/1565c0?text=Payment+Receipt",
      note: payment.note ?? undefined,
    };
  });

  return {
    academicYear: currentYear?.name ?? "No academic year",
    semester: currentSemester?.name ?? "No semester",
    students: mappedStudents,
    classes: mappedClasses,
    subjects: mappedSubjects.sort((a, b) => b.avgScore - a.avgScore),
    payments: mappedPayments,
    stats: {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      avgScore: scores.length
        ? scores.reduce((total, score) => total + score, 0) / scores.length
        : 0,
    },
    enrollmentByGrade: [...enrollment.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([grade, count]) => ({
        grade: `Grade ${grade}`,
        count,
      })),
  };
}
