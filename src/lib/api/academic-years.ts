// lib/api/academic-years.ts
import { academicYears, type AcademicYearRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchAcademicYears(): Promise<AcademicYearRow[]> {
  console.log("[API] GET /academic-years");
  return delay(academicYears);
}
export async function createAcademicYear(payload: Record<string, string>) {
  console.log("[API] POST /academic-years", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}
export async function deleteAcademicYear(id: string) {
  console.log("[API] DELETE /academic-years/" + id);
  return delay({ id });
}
