import { createClient } from "@/utils/supabase/client";

export type AcademicYearRecord = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  status: string | null;
  created_at: string;
  semesters?: { id: string; name: string; status: string | null }[];
};

export type AcademicYearRow = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  status: string;
  createdAt: string;
  semesters: { id: string; name: string; status: string }[];
};

function mapAcademicYear(row: AcademicYearRecord): AcademicYearRow {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: row.is_current,
    status: row.status ?? "draft",
    createdAt: row.created_at,
    semesters: (row.semesters ?? []).map((semester) => ({
      id: semester.id,
      name: semester.name,
      status: semester.status ?? "draft",
    })),
  };
}

function validateAcademicYearDates(
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate || !endDate) {
    throw new Error("Academic year start date and end date are required.");
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error("Academic year end date must be after the start date.");
  }
}

export async function fetchAcademicYears(): Promise<AcademicYearRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("academic_years")
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapAcademicYear(row as AcademicYearRecord));
}

function generateAcademicYearName(
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate || !endDate) return "Academic year";

  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();

  return `${startYear}/${endYear}`;
}

export async function createAcademicYear(payload: Record<string, string>) {
  const supabase = createClient();
  const startDate = payload.start_date || null;
  const endDate = payload.end_date || null;
  validateAcademicYearDates(startDate, endDate);

  const name =
    (payload.name ?? "").trim() || generateAcademicYearName(startDate, endDate);

  const { data: existingYear, error: existingYearError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existingYearError) throw new Error(existingYearError.message);
  if (existingYear) {
    throw new Error(
      `Academic year "${name}" already exists. Delete or edit the existing record before creating it again.`,
    );
  }

  const { data: activeYear, error: activeYearError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (activeYearError) throw new Error(activeYearError.message);

  const { data, error } = await supabase
    .from("academic_years")
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: true,
      status: "active",
    })
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .single();

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("academic_years_name_key")
    ) {
      throw new Error(
        `Academic year "${name}" already exists. Delete or edit the existing record before creating it again.`,
      );
    }
    throw new Error(error.message);
  }

  if (activeYear && activeYear.id !== data.id) {
    const { error: deactivateError } = await supabase
      .from("academic_years")
      .update({ is_current: false, status: "draft" })
      .eq("id", activeYear.id);

    if (deactivateError) throw new Error(deactivateError.message);
  }

  const academicYear = data as AcademicYearRecord;
  const semestersInput = payload.semesters ? JSON.parse(payload.semesters) : [];

  if (Array.isArray(semestersInput) && semestersInput.length > 0) {
    const rows = semestersInput.map(
      (semester: Record<string, string>, index: number) => ({
        academic_year_id: academicYear.id,
        name: semester.name,
        ordinal: index + 1,
        start_date: semester.start_date ?? startDate,
        end_date: semester.end_date ?? endDate,
        status: "draft",
      }),
    );

    const { error: semesterError } = await supabase
      .from("semesters")
      .insert(rows);

    if (semesterError) {
      await supabase.from("academic_years").delete().eq("id", academicYear.id);
      throw new Error(semesterError.message);
    }
  }

  return mapAcademicYear({
    ...academicYear,
    semesters: [],
  });
}

export async function updateAcademicYear(
  id: string,
  payload: Record<string, string>,
) {
  const supabase = createClient();
  const name = payload.name?.trim();
  if (!name) throw new Error("Academic year name is required.");

  const startDate = payload.start_date || null;
  const endDate = payload.end_date || null;
  validateAcademicYearDates(startDate, endDate);

  const nextStatus = payload.status || undefined;
  const shouldActivate =
    payload.is_current === "true" || nextStatus === "active";

  if (shouldActivate) {
    const { data: activeYear, error: activeYearError } = await supabase
      .from("academic_years")
      .select("id")
      .eq("is_current", true)
      .neq("id", id)
      .maybeSingle();

    if (activeYearError) throw new Error(activeYearError.message);
    if (activeYear) {
      const { error: resetError } = await supabase
        .from("academic_years")
        .update({ is_current: false, status: "draft" })
        .eq("id", activeYear.id);

      if (resetError) throw new Error(resetError.message);
    }
  }

  const { data, error } = await supabase
    .from("academic_years")
    .update({
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: shouldActivate,
      status: nextStatus ?? (shouldActivate ? "active" : "draft"),
    })
    .eq("id", id)
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapAcademicYear(data as AcademicYearRecord);
}

export async function activateAcademicYear(id: string) {
  const supabase = createClient();

  const { data: currentYear, error: yearError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (yearError) throw new Error(yearError.message);

  if (currentYear && currentYear.id !== id) {
    const { error: resetError } = await supabase
      .from("academic_years")
      .update({ is_current: false, status: "draft" })
      .eq("id", currentYear.id);

    if (resetError) throw new Error(resetError.message);
  }

  const { data, error } = await supabase
    .from("academic_years")
    .update({
      is_current: true,
      status: "active",
    })
    .eq("id", id)
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapAcademicYear(data as AcademicYearRecord);
}

export async function completeAcademicYear(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("academic_years")
    .update({
      is_current: false,
      status: "completed",
    })
    .eq("id", id)
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapAcademicYear(data as AcademicYearRecord);
}

export async function deleteAcademicYear(id: string) {
  const supabase = createClient();

  const [
    { data: semesters, error: semesterQueryError },
    { data: classes, error: classQueryError },
  ] = await Promise.all([
    supabase.from("semesters").select("id").eq("academic_year_id", id),
    supabase.from("classes").select("id").eq("academic_year_id", id),
  ]);

  if (semesterQueryError) throw new Error(semesterQueryError.message);
  if (classQueryError) throw new Error(classQueryError.message);

  const semesterIds = (semesters ?? []).map((semester) => semester.id);
  const classIds = (classes ?? []).map((classRow) => classRow.id);

  if (semesterIds.length) {
    const { error: semesterGradeError } = await supabase
      .from("grades")
      .delete()
      .in("semester_id", semesterIds);
    if (semesterGradeError) throw new Error(semesterGradeError.message);

    const { error: semesterAttendanceError } = await supabase
      .from("attendance_sessions")
      .delete()
      .in("semester_id", semesterIds);
    if (semesterAttendanceError) {
      throw new Error(semesterAttendanceError.message);
    }

    const { error: semesterEnrollmentError } = await supabase
      .from("student_enrollments")
      .delete()
      .in("semester_id", semesterIds);
    if (semesterEnrollmentError) {
      throw new Error(semesterEnrollmentError.message);
    }
  }

  if (classIds.length) {
    const { data: classSubjects, error: classSubjectQueryError } =
      await supabase
        .from("class_subjects")
        .select("id")
        .in("class_id", classIds);
    if (classSubjectQueryError) throw new Error(classSubjectQueryError.message);

    const classSubjectIds = (classSubjects ?? []).map(
      (classSubject) => classSubject.id,
    );

    if (classSubjectIds.length) {
      const { error: assessmentError } = await supabase
        .from("course_assessments")
        .delete()
        .in("class_subject_id", classSubjectIds);
      if (assessmentError) throw new Error(assessmentError.message);

      const { error: gradeError } = await supabase
        .from("grades")
        .delete()
        .in("class_subject_id", classSubjectIds);
      if (gradeError) throw new Error(gradeError.message);

      const { error: classSubjectError } = await supabase
        .from("class_subjects")
        .delete()
        .in("id", classSubjectIds);
      if (classSubjectError) throw new Error(classSubjectError.message);
    }

    const { error: attendanceError } = await supabase
      .from("attendance_sessions")
      .delete()
      .in("class_id", classIds);
    if (attendanceError) throw new Error(attendanceError.message);

    const { error: enrollmentError } = await supabase
      .from("student_enrollments")
      .delete()
      .in("class_id", classIds);
    if (enrollmentError) throw new Error(enrollmentError.message);

    const { error: classError } = await supabase
      .from("classes")
      .delete()
      .in("id", classIds);
    if (classError) throw new Error(classError.message);
  }

  if (semesterIds.length) {
    const { error: semesterError } = await supabase
      .from("semesters")
      .delete()
      .in("id", semesterIds);
    if (semesterError) throw new Error(semesterError.message);
  }

  const { error } = await supabase.from("academic_years").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
