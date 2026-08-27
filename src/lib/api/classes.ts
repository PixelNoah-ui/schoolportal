// lib/api/classes.ts
import { classes, type ClassRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchClasses(): Promise<ClassRow[]> {
  console.log("[API] GET /classes");
  return delay(classes);
}
export async function createClass(payload: Record<string, string>) {
  console.log("[API] POST /classes", payload);
  return delay({ id: crypto.randomUUID(), ...payload });
}
export async function updateClass(id: string, payload: Record<string, string>) {
  console.log("[API] PATCH /classes/" + id, payload);
  return delay({ id, ...payload });
}
export async function deleteClass(id: string) {
  console.log("[API] DELETE /classes/" + id);
  return delay({ id });
}
