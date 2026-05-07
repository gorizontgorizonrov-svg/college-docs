import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

const roleBasedRoutes: Record<string, Role[]> = {
  "/applicant": ["APPLICANT"],
  "/applicant/": ["APPLICANT"],
  "/documents": ["APPLICANT"],
  "/documents/": ["APPLICANT"],
  "/moderator": ["MODERATOR", "ADMIN"],
  "/moderator/": ["MODERATOR", "ADMIN"],
  "/moderator/audit-log": ["ADMIN"],
  "/moderator/audit-log/": ["ADMIN"],
  "/internal-docs": ["MODERATOR", "ADMIN"],
  "/internal-docs/": ["MODERATOR", "ADMIN"],
};

const publicRoutes = ["/login", "/register", "/", "/api/auth", "/offline"];

export default auth((req) => {
  const { auth: session, nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!session?.user;
  const userRole = session?.user?.role;

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (!userRole) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        const redirectUrl =
          userRole === "APPLICANT"
            ? "/applicant"
            : "/moderator";
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};