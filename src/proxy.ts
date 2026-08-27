import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const roleHome: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export async function proxy(request: NextRequest) {
  const { response, user, role } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isAuthPage = ["/login", "/forgotpassword", "/resetpassword"].includes(
    pathname,
  );

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && role && (isAuthPage || pathname === "/")) {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  if (user && !role && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && role) {
    const wrongSection =
      (pathname.startsWith("/admin") && role !== "admin") ||
      (pathname.startsWith("/teacher") && role !== "teacher") ||
      (pathname.startsWith("/student") && role !== "student");

    if (wrongSection) {
      return NextResponse.redirect(new URL(roleHome[role], request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
