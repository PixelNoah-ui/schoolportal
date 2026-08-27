export type UserRole = "admin" | "teacher" | "student";

export function toUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const role = value.trim().toLowerCase();
  return role === "admin" || role === "teacher" || role === "student"
    ? role
    : null;
}
