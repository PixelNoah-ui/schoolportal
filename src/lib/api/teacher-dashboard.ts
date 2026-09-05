import { createClient } from "@/utils/supabase/client";

export interface TeacherDashboardData {
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
  stats: {
    classesCount: number;
    studentsCount: number;
    subjectsCount: number;
    upcomingScheduleCount: number;
  };
  recentClasses: {
    id: string;
    classId: string;
    subjectName: string;
    className: string;
    gradeLevel: number;
    studentCount: number;
    isHomeroom: boolean;
  }[];
  upcomingSchedule: {
    id: string;
    subject: string;
    className: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

type TeacherDashboardTeacher = {
  id: string;
  profile_id: string;
  profiles: { id: string; full_name: string; email: string }[];
};

type TeacherDashboardClassSubject = {
  id: string;
  class_id: string;
  subject_id: string;
  subjects: { id: string; name: string }[];
  classes:
    | {
        id: string;
        name: string;
        section: string | null;
        grade_levels: { level_number: number }[];
      }
    | {
        id: string;
        name: string;
        section: string | null;
        homeroom_teacher_id?: string | null;
        grade_levels:
          | { level_number: number }[]
          | { level_number: number }
          | null;
      }
    | null;
};

type DashboardClassRelation = {
  id: string;
  name: string;
  section: string | null;
  homeroom_teacher_id?: string | null;
  grade_levels: { level_number: number } | { level_number: number }[] | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : (relation ?? undefined);
}

type TeacherDashboardSchedule = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_subjects: {
    teacher_id: string;
    subjects: { name: string }[];
    classes: {
      name: string;
      section: string | null;
      grade_levels: { level_number: number }[];
    }[];
  }[];
};

/**
 * Fetch teacher dashboard overview data
 */
export async function fetchTeacherDashboard(): Promise<TeacherDashboardData> {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error(`Auth error: ${userError?.message || "User not found"}`);
    }
    console.log("✅ Current user:", user.id);

    // Fetch teacher with profile
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select(
        `
        id,
        profile_id,
        profiles(id, full_name, email)
      `,
      )
      .eq("profile_id", user.id)
      .limit(1);

    if (teacherError) {
      throw new Error(`Teacher fetch error: ${teacherError.message}`);
    }
    if (!teacherData || teacherData.length === 0) {
      console.error("❌ No teacher found. Debugging info:", {
        userId: user.id,
        dataLength: teacherData?.length,
        data: teacherData,
        error: teacherError,
      });
      throw new Error(
        "No teacher record found for this user. Check RLS policies or that the teacher exists in your database.",
      );
    }
    console.log("✅ Teacher data loaded:", teacherData[0].id);

    const teacher = teacherData[0] as TeacherDashboardTeacher;
    const teacherProfile = teacher.profiles?.[0];

    // Fetch class_subjects for this teacher with their classes and subjects
    const { data: classSubjectsData, error: csError } = await supabase
      .from("class_subjects")
      .select(
        `
        id,
        class_id,
        subject_id,
        subjects(id, name),
        classes(id, name, section, homeroom_teacher_id, grade_levels!classes_grade_level_id_fkey(level_number))
      `,
      )
      .eq("teacher_id", teacher.id);

    if (csError) {
      throw new Error(`Class subjects fetch error: ${csError.message}`);
    }
    console.log("✅ Class subjects loaded:", classSubjectsData?.length || 0);

    const classSubjects = (classSubjectsData ||
      []) as unknown as TeacherDashboardClassSubject[];

    // Get unique classes and subjects
    const uniqueClassIds = new Set(classSubjects.map((cs) => cs.class_id));
    const uniqueSubjectIds = new Set(classSubjects.map((cs) => cs.subject_id));

    // Count total students enrolled in teacher's classes
    const { data: studentEnrollments, error: enrollError } = await supabase
      .from("student_enrollments")
      .select("id")
      .in("class_id", Array.from(uniqueClassIds))
      .eq("status", "active");

    if (enrollError) {
      console.warn("⚠️ Student enrollment fetch warning:", enrollError.message);
    } else {
      console.log(
        "✅ Student enrollments loaded:",
        studentEnrollments?.length || 0,
      );
    }

    const totalStudents = (studentEnrollments || []).length;

    // Format recent classes (limit to 6)
    const recentClasses = classSubjects.slice(0, 6).map((cs) => {
      // Supabase may return to-one relations as an object or a one-item array.
      // Normalize both shapes before building the dashboard card.
      const classRow = firstRelation(cs.classes) as
        | DashboardClassRelation
        | undefined;
      const subject = firstRelation(cs.subjects);
      const gradeLevels = firstRelation(classRow?.grade_levels);
      const gradeLevel = gradeLevels?.level_number ?? 0;

      return {
        id: cs.id,
        subjectName: subject?.name ?? "Unknown subject",
        classId: cs.class_id,
        className: classRow
          ? `${gradeLevel || "-"}${classRow.section ?? ""}`
          : "Unknown",
        gradeLevel,
        studentCount: 0,
        isHomeroom: classRow?.homeroom_teacher_id === teacher.id,
      };
    });

    // Fetch upcoming schedules for this teacher
    const { data: schedulesData, error: schedError } = await supabase
      .from("schedules")
      .select(
        `
        id,
        class_subject_id,
        day_of_week,
        start_time,
        end_time,
        class_subjects!inner(
          teacher_id,
          subjects(name),
          classes(name, section, grade_levels!classes_grade_level_id_fkey(level_number))
        )
      `,
      )
      .eq("class_subjects.teacher_id", teacher.id)
      .limit(5);

    if (schedError) {
      console.warn("⚠️ Schedule fetch warning:", schedError.message);
    } else {
      console.log("✅ Schedules loaded:", schedulesData?.length || 0);
    }

    const upcomingSchedule = (schedulesData || []).map((s) => {
      const schedule = s as TeacherDashboardSchedule;
      return {
        id: schedule.id,
        subject: schedule.class_subjects?.[0]?.subjects?.[0]?.name ?? "Unknown",
        className: (() => {
          const classRow = schedule.class_subjects?.[0]?.classes?.[0];
          const grade = classRow?.grade_levels?.[0]?.level_number;
          return classRow
            ? `${grade ?? "-"}${classRow.section ?? ""}`
            : "Unknown";
        })(),
        dayOfWeek: (() => {
          const dayNames = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const day = Number(schedule.day_of_week);
          return Number.isInteger(day)
            ? (dayNames[day] ?? String(schedule.day_of_week))
            : schedule.day_of_week;
        })(),
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      };
    });

    console.log("✅ Dashboard data loaded successfully!");

    return {
      teacher: {
        id: teacher.id,
        fullName: teacherProfile?.full_name ?? "Teacher",
        email: teacherProfile?.email ?? "",
      },
      stats: {
        classesCount: uniqueClassIds.size,
        studentsCount: totalStudents,
        subjectsCount: uniqueSubjectIds.size,
        upcomingScheduleCount: upcomingSchedule.length,
      },
      recentClasses,
      upcomingSchedule,
    };
  } catch (error) {
    console.error("❌ Dashboard fetch error:", error);
    throw error;
  }
}
