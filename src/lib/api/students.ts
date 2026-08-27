// lib/api/students.ts
import { allStudents, type AllStudentRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchStudents(): Promise<AllStudentRow[]> {
  // TODO: swap for `supabase.from("students").select(...)`
  console.log("[API] GET /students");
  return delay(allStudents);
}

export async function createStudent(payload: Record<string, string>) {
  console.log("[API] POST /students", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}

export async function updateStudent(
  id: string,
  payload: Record<string, string>,
) {
  console.log("[API] PATCH /students/" + id, payload);
  return delay({ id, ...payload });
}

export async function deleteStudent(id: string) {
  console.log("[API] DELETE /students/" + id);
  return delay({ id });
}
