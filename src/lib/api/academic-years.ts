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

export async function createAcademicYear(payload: Record<string, string>) {
  const supabase = createClient();
  const name = payload.name?.trim();
  if (!name) throw new Error("Academic year name is required.");

  const startDate = payload.start_date || null;
  const endDate = payload.end_date || null;
  validateAcademicYearDates(startDate, endDate);

  const { data: activeYear, error: activeYearError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_current", true)
    .maybeSingle();

  if (activeYearError) throw new Error(activeYearError.message);

  if (payload.is_current === "true" && activeYear) {
    throw new Error("Only one academic year can be active at a time.");
  }

  const { data, error } = await supabase
    .from("academic_years")
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: Boolean(payload.is_current === "true"),
      status: payload.is_current === "true" ? "active" : "draft",
    })
    .select(
      "id, name, start_date, end_date, is_current, status, created_at, semesters(id, name, status)",
    )
    .single();

  if (error) throw new Error(error.message);

  const academicYear = data as AcademicYearRecord;
  const semestersInput = payload.semesters
    ? JSON.parse(payload.semesters)
    : [];

  if (Array.isArray(semestersInput) && semestersInput.length > 0) {
    const rows = semestersInput.map((semester: Record<string, string>) => ({
      academic_year_id: academicYear.id,
      name: semester.name,
      start_date: semester.start_date ?? null,
      end_date: semester.end_date ?? null,
      status: "grading_open",
    }));

    const { error: semesterError } = await supabase
      .from("semesters")
      .insert(rows);

    if (semesterError) throw new Error(semesterError.message);
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
  const shouldActivate = payload.is_current === "true" || nextStatus === "active";

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

  const [{ data: semesters }, { data: classes }] = await Promise.all([
    supabase.from("semesters").select("id").eq("academic_year_id", id),
    supabase.from("classes").select("id").eq("academic_year_id", id),
  ]);

  if ((semesters ?? []).length > 0 || (classes ?? []).length > 0) {
    throw new Error(
      "Cannot delete this academic year because it contains semester or class records.",
    );
  }

  const { error } = await supabase.from("academic_years").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
