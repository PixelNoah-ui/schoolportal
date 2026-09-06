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

type TeacherRecord = {
  id: string;
  profile_id: string;
  profiles: ProfileRow[] | ProfileRow | null;
};

type ClassRecord = {
  id: string;
  name: string;
  section: string | null;
  academic_year_id: string;
  grade_levels: { level_number: number } | { level_number: number }[] | null;
  homeroom_teacher:
    | { profiles: { full_name: string }[] | { full_name: string } | null }
    | { profiles: { full_name: string }[] | { full_name: string } | null }[]
    | null;
};

type SubjectRecord = { id: string; name: string };

type ClassSubjectRecord = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  semester_id: string;
};

// Replaces GradeRecord. course_assessments carries class_subject_id/semester_id/
// max_score/weight; assessment_results carries the actual student score.
type CourseAssessmentRecord = {
  id: string;
  class_subject_id: string;
  semester_id: string;
  max_score: number;
  weight: number;
};

type AssessmentResultRecord = {
  student_id: string;
  course_assessment_id: string;
  score: number | null;
};

type PaymentRecord = {
  id: string;
  student_id: string;
  amount: number;
  status: PaymentRow["status"];
  payment_method: PaymentRow["paymentMethod"];
  submitted_at: string | null;
  note: string | null;
  payment_month_allocations: { payment_month: string }[];
  students: {
    profiles: Pick<ProfileRow, "full_name">[] | Pick<ProfileRow, "full_name">;
  }[];
};

type AcademicYearRecord = { id: string; name: string; is_current: boolean };
type SemesterRecord = { id: string; academic_year_id: string; name: string };

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

function firstRelation<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : (value ?? undefined);
}

async function query<T>(
  request: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data ?? ([] as T);
}

export async function fetchDashboard(): Promise<DashboardData> {
  const supabase = createClient();

  const years = await query<AcademicYearRecord[]>(
    supabase
      .from("academic_years")
      .select("id, name, is_current")
      .order("is_current", { ascending: false }),
  );
  const currentYear = years.find((year) => year.is_current) ?? years[0];

  const dashboardStudents = await fetchStudents({
    pageSize: 200,
    academicYearId: currentYear?.id,
  });
  const students = dashboardStudents.students;

  const [
    teachers,
    classes,
    subjects,
    classSubjects,
    courseAssessments,
    assessmentResults,
    semesters,
    payments,
  ] = await Promise.all([
    query<TeacherRecord[]>(
      supabase
        .from("teachers")
        .select(
          "id, profile_id, profiles!teachers_profile_id_fkey(id, full_name, username, email, role)",
        ),
    ),
    query<ClassRecord[]>(
      supabase
        .from("classes")
        .select(
          "id, name, section, academic_year_id, grade_levels!classes_grade_level_id_fkey(level_number), homeroom_teacher:teachers!classes_homeroom_teacher_id_fkey(profiles!teachers_profile_id_fkey(full_name))",
        )
        .eq("academic_year_id", currentYear?.id ?? "")
        .order("level_number", { foreignTable: "grade_levels" }),
    ),
    query<SubjectRecord[]>(
      supabase.from("subjects").select("id, name").order("name"),
    ),
    query<ClassSubjectRecord[]>(
      supabase
        .from("class_subjects")
        .select("id, class_id, subject_id, teacher_id, semester_id"),
    ),
    query<CourseAssessmentRecord[]>(
      supabase
        .from("course_assessments")
        .select("id, class_subject_id, semester_id, max_score, weight"),
    ),
    query<AssessmentResultRecord[]>(
      supabase
        .from("assessment_results")
        .select("student_id, course_assessment_id, score")
        .not("score", "is", null),
    ),
    query<SemesterRecord[]>(
      supabase
        .from("semesters")
        .select("id, academic_year_id, name")
        .order("name"),
    ),
    query<PaymentRecord[]>(
      supabase
        .from("payments")
        .select(
          "id, student_id, amount, status, payment_method, submitted_at, note, payment_month_allocations(payment_month), students!payments_student_id_fkey(profiles!students_profile_id_fkey(full_name))",
        )
        .order("created_at", { ascending: false }),
    ),
  ]);

  const classesById = new Map(classes.map((row) => [row.id, row]));
  const teachersById = new Map(teachers.map((row) => [row.id, row.profile_id]));
  const profilesById = new Map(
    teachers
      .map(
        (row) => [row.profile_id, firstRelation(row.profiles) ?? null] as const,
      )
      .filter((entry): entry is [string, ProfileRow] => entry[1] !== null),
  );
  const classSubjectsById = new Map(classSubjects.map((cs) => [cs.id, cs]));
  const courseAssessmentsById = new Map(
    courseAssessments.map((ca) => [ca.id, ca]),
  );

  let currentYearSemesterIds = new Set(
    semesters
      .filter((s) => s.academic_year_id === currentYear?.id)
      .map((s) => s.id),
  );
  if (currentYearSemesterIds.size === 0) {
    currentYearSemesterIds = new Set(semesters.map((s) => s.id));
  }

  // Weighted percentage per subject: sum(score/max_score * weight) / sum(weight) * 100.
  // Accumulate weighted-sum and weight-total per subject in one pass, then divide.
  const subjectWeightedSum = new Map<string, number>();
  const subjectWeightTotal = new Map<string, number>();
  let overallWeightedSum = 0;
  let overallWeightTotal = 0;

  for (const result of assessmentResults) {
    if (result.score === null) continue;

    const courseAssessment = courseAssessmentsById.get(
      result.course_assessment_id,
    );
    if (!courseAssessment) continue;
    if (!currentYearSemesterIds.has(courseAssessment.semester_id)) continue;
    if (!courseAssessment.max_score) continue; // avoid divide-by-zero

    const classSubject = classSubjectsById.get(
      courseAssessment.class_subject_id,
    );
    if (!classSubject) continue;

    const weight = Number(courseAssessment.weight) || 1;
    const percentage =
      (Number(result.score) / Number(courseAssessment.max_score)) * 100;
    const weighted = percentage * weight;

    overallWeightedSum += weighted;
    overallWeightTotal += weight;

    subjectWeightedSum.set(
      classSubject.subject_id,
      (subjectWeightedSum.get(classSubject.subject_id) ?? 0) + weighted,
    );
    subjectWeightTotal.set(
      classSubject.subject_id,
      (subjectWeightTotal.get(classSubject.subject_id) ?? 0) + weight,
    );
  }

  const weightedAverage = (sum: number, weight: number) =>
    weight > 0 ? sum / weight : 0;

  const mappedStudents: AllStudentRow[] = students.map((student) => ({
    ...student,
    temporaryPassword: student.temporaryPassword ?? null,
  }));

  const mappedClasses: ClassRow[] = classes.map((classRow) => ({
    ...classRow,
    grade: firstRelation(classRow.grade_levels)?.level_number ?? 0,
    section: classRow.section ?? "",
    subjects: [],
    studentCount: students.filter((student) => student.classId === classRow.id)
      .length,
    teacher:
      firstRelation(firstRelation(classRow.homeroom_teacher)?.profiles)
        ?.full_name ?? "Unassigned",
  }));

  const mappedSubjects: SubjectRow[] = subjects.map((subject) => {
    const assignment = classSubjects.find(
      (row) =>
        row.subject_id === subject.id &&
        currentYearSemesterIds.has(row.semester_id),
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
    const classGrade = firstRelation(classRow?.grade_levels)?.level_number;

    return {
      id: subject.id,
      name: subject.name,
      className: classRow
        ? `Grade ${classGrade ?? 0} - ${classRow.section ?? ""}`
        : "All classes",
      classId: classRow?.id ?? "",
      teacher,
      avgScore: weightedAverage(
        subjectWeightedSum.get(subject.id) ?? 0,
        subjectWeightTotal.get(subject.id) ?? 0,
      ),
    };
  });

  const currentSemester = currentYear
    ? semesters.find((s) => s.academic_year_id === currentYear.id)
    : undefined;

  const enrollment = new Map<number, number>();
  for (const classRow of mappedClasses) {
    if (classRow.grade > 0) {
      enrollment.set(
        classRow.grade,
        (enrollment.get(classRow.grade) ?? 0) + classRow.studentCount,
      );
    }
  }

  const mappedPayments: PaymentRow[] = payments.map((payment) => {
    const studentRecord = students.find((row) => row.id === payment.student_id);
    const paymentStudent = firstRelation(payment.students);
    const studentProfile = paymentStudent
      ? firstRelation(paymentStudent.profiles)
      : undefined;
    const paymentMonth = payment.payment_month_allocations?.[0]?.payment_month;

    return {
      id: payment.id,
      studentId: payment.student_id,
      studentName: resolveStudentDisplayName(studentProfile, "Unknown student"),
      studentNumber: studentRecord?.student_number ?? "",
      classId: studentRecord?.classId ?? "",
      className: studentRecord?.className ?? "Unassigned",
      amount: Number(payment.amount),
      paymentMonth: paymentMonth ?? "",
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
      avgScore: weightedAverage(overallWeightedSum, overallWeightTotal),
    },
    enrollmentByGrade: [...enrollment.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([grade, count]) => ({ grade: `Grade ${grade}`, count })),
  };
}
