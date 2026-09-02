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
    subjectName: string;
    className: string;
    studentCount: number;
    semester: string;
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
  classes: { id: string; name: string }[];
};

type TeacherDashboardSchedule = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_subjects: {
    teacher_id: string;
    subjects: { name: string }[];
    classes: { name: string }[];
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
        classes(id, name)
      `,
      )
      .eq("teacher_id", teacher.id);

    if (csError) {
      throw new Error(`Class subjects fetch error: ${csError.message}`);
    }
    console.log("✅ Class subjects loaded:", classSubjectsData?.length || 0);

    const classSubjects = (classSubjectsData ||
      []) as TeacherDashboardClassSubject[];

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
    const recentClasses = classSubjects.slice(0, 6).map((cs) => ({
      id: cs.id,
      subjectName: cs.subjects?.[0]?.name ?? "Unknown",
      className: cs.classes?.[0]?.name ?? "Unknown",
      studentCount: 0, // Will calculate per class if needed
      semester: "Current",
    }));

    // Fetch current semester for display
    const { data: currentSemester, error: semError } = await supabase
      .from("semesters")
      .select("name")
      .eq("status", "active")
      .single();

    if (semError) {
      console.warn("⚠️ Semester fetch warning:", semError.message);
    } else if (currentSemester) {
      console.log("✅ Semester loaded:", currentSemester.name);
      recentClasses.forEach((rc) => {
        rc.semester = currentSemester.name;
      });
    }

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
        class_subjects(
          teacher_id,
          subjects(name),
          classes(name)
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
        className:
          schedule.class_subjects?.[0]?.classes?.[0]?.name ?? "Unknown",
        dayOfWeek: schedule.day_of_week,
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
