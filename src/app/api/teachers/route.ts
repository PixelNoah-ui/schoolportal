import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

function usernameBase(fullName: string) {
  return (
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "teacher"
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!fullName || !email)
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 },
    );

  const sessionClient = createServerClient(await cookies());
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 },
    );

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 },
    );
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (adminProfile?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );

  const base = usernameBase(fullName);
  const { data: existing } = await admin
    .from("profiles")
    .select("username")
    .like("username", `${base}%`);
  const usernames = new Set(
    (existing ?? []).map((profile) => profile.username),
  );
  let username = base;
  let suffix = 2;
  while (usernames.has(username)) username = `${base}${suffix++}`;
  const temporaryPassword = `${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}A1!`;

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    });
  if (authError || !authData.user)
    return NextResponse.json(
      { error: authError?.message ?? "Could not create account" },
      { status: 400 },
    );

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    username,
    email,
    role: "teacher",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .insert({
      profile_id: authData.user.id,
      phone: body.phone || null,
      temporary_password: temporaryPassword,
    })
    .select(
      "id, profile_id, phone, temporary_password, created_at, profiles!teachers_profile_id_fkey(id, full_name, username, email, role), class_subjects(subjects(name))",
    )
    .single();
  if (teacherError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: teacherError.message }, { status: 400 });
  }
  return NextResponse.json({
    id: teacher.id,
    teacher_number: "",
    profile: teacher.profiles[0],
    subjects: [],
    classCount: 0,
    phone: teacher.phone ?? "",
    temporaryPassword,
  });
}
