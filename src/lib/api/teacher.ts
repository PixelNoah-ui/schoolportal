import type { Profile } from "@/lib/mock-data";
import { createClient } from "@/utils/supabase/client";

export interface TeacherProfile extends Profile {
  phone?: string;
  bio?: string;
  department?: string;
  qualifications?: string;
}

type TeacherRecord = {
  id: string;
  profile_id: string;
  phone: string | null;
  bio: string | null;
  department: string | null;
  qualifications: string | null;
  profiles: Profile[];
};

function mapTeacher(teacher: TeacherRecord): TeacherProfile {
  const profile = teacher.profiles[0];
  return {
    ...profile,
    phone: teacher.phone ?? undefined,
    bio: teacher.bio ?? undefined,
    department: teacher.department ?? undefined,
    qualifications: teacher.qualifications ?? undefined,
  };
}

/**
 * Fetch the current authenticated teacher's profile
 */
export async function fetchCurrentTeacher(): Promise<TeacherProfile> {
  const supabase = createClient();

  // Get current user's auth info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Fetch teacher record by profile_id
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, profile_id, phone, bio, department, qualifications, profiles!teachers_profile_id_fkey(id, full_name, username, email, role)",
    )
    .eq("profile_id", user.id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Teacher profile not found");

  return mapTeacher(data as TeacherRecord);
}

/**
 * Update current teacher's profile information
 */
export async function updateCurrentTeacherProfile(
  payload: Partial<TeacherProfile>,
) {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  // Update teacher record
  const { error } = await supabase
    .from("teachers")
    .update({
      phone: payload.phone ?? undefined,
      bio: payload.bio ?? undefined,
      department: payload.department ?? undefined,
      qualifications: payload.qualifications ?? undefined,
    })
    .eq("profile_id", user.id);

  if (error) throw new Error(error.message);

  // Return updated profile
  return fetchCurrentTeacher();
}
