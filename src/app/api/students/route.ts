import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

function usernameBase(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? "student").replace(/[^a-z]/gi, "").toLowerCase();
  const last = (parts.slice(1).join(" ") ?? "")
    .replace(/[^a-z]/gi, "")
    .toLowerCase();

  const base = [first, last ? last.slice(0, 5) : ""]
    .filter(Boolean)
    .join(".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  return (base || "student").slice(0, 14);
}

export async function POST(request: Request) {
  const body = await request.json();
  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const gradeId = String(body.grade_id ?? "").trim();

  if (!fullName || !email || !gradeId)
    return NextResponse.json(
      { error: "Name, email, and grade are required" },
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
    .ilike("username", `${base}%`);
  const usernames = new Set((existing ?? []).map((profile) => profile.username));

  let username = base;
  let suffix = 1;
  while (usernames.has(username)) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  const { data: gradeRecord, error: gradeError } = await admin
    .from("grade_levels")
    .select("id")
    .eq("id", gradeId)
    .maybeSingle();

  if (gradeError) {
    return NextResponse.json({ error: gradeError.message }, { status: 400 });
  }

  if (!gradeRecord) {
    return NextResponse.json(
      { error: "Selected grade was not found" },
      { status: 400 },
    );
  }

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
    role: "student",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .insert({
      id: crypto.randomUUID(),
      profile_id: authData.user.id,
      grade_id: gradeId,
      class_id: body.class_id || null,
      phone: body.phone || null,
      date_of_birth: body.dob || null,
      temporary_password: temporaryPassword,
    })
    .select("id, profile_id, phone, date_of_birth, temporary_password, created_at")
    .single();
  if (studentError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: studentError.message }, { status: 400 });
  }
  return NextResponse.json({
    id: student.id,
    student_number: "",
    className: "Unassigned",
    avgScore: 0,
    joined: "just now",
    dob: body.dob ?? "",
    classId: "",
    profile: {
      id: authData.user.id,
      full_name: fullName,
      username,
      email,
      role: "student",
    },
    temporaryPassword,
  });
}
