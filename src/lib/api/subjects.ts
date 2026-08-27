// lib/api/subjects.ts
import { allSubjects, type SubjectRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchSubjects(): Promise<SubjectRow[]> {
  console.log("[API] GET /subjects");
  return delay(allSubjects);
}
export async function createSubject(payload: Record<string, string>) {
  console.log("[API] POST /subjects", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}
export async function updateSubject(
  id: string,
  payload: Record<string, string>,
) {
  console.log("[API] PATCH /subjects/" + id, payload);
  return delay({ id, ...payload });
}
export async function deleteSubject(id: string) {
  console.log("[API] DELETE /subjects/" + id);
  return delay({ id });
}
