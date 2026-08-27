// lib/api/grades.ts
import { gradeRecords, type GradeRecord } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchGrades(): Promise<GradeRecord[]> {
  console.log("[API] GET /grades");
  return delay(gradeRecords);
}
export async function createGrade(payload: Record<string, string>) {
  console.log("[API] POST /grades", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}
export async function updateGrade(id: string, payload: Record<string, string>) {
  console.log("[API] PATCH /grades/" + id, payload);
  return delay({ id, ...payload });
}
export async function deleteGrade(id: string) {
  console.log("[API] DELETE /grades/" + id);
  return delay({ id });
}
