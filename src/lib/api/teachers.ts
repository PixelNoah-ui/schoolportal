// lib/api/teachers.ts
import { allTeachers, type TeacherRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchTeachers(): Promise<TeacherRow[]> {
  console.log("[API] GET /teachers");
  return delay(allTeachers);
}

export async function createTeacher(payload: Record<string, string>) {
  console.log("[API] POST /teachers", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}

export async function updateTeacher(
  id: string,
  payload: Record<string, string>,
) {
  console.log("[API] PATCH /teachers/" + id, payload);
  return delay({ id, ...payload });
}

export async function deleteTeacher(id: string) {
  console.log("[API] DELETE /teachers/" + id);
  return delay({ id });
}
