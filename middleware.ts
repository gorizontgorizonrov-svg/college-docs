import { auth } from "@/auth";
import { NextResponse } from "next/server";

const roleBasedRoutes: Record<string, string[]> = {
  "/documents/create": ["INITIATOR", "VALIDATOR", "ADMIN"],
  "/documents/pending": ["VALIDATOR", "SIGNER", "REGISTRAR", "ADMIN"],
  "/documents/approval": ["VALIDATOR", "SIGNER"],
  "/incoming/register": ["REGISTRAR", "ADMIN"],
  "/incoming": ["REGISTRAR", "ADMIN", "SIGNER", "VALIDATOR"],
  "/admin": ["ADMIN"],
};
const protectedRoutes = Object.keys(roleBasedRoutes);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (path === "/login" || path === "/") return NextResponse.next();

  const session = req.auth;
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const matchedRoute = protectedRoutes.find((route) =>
    path.startsWith(route)
  );
  if (matchedRoute && session.user) {
    const allowedRoles = roleBasedRoutes[matchedRoute];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|icon|favicon|manifest).*)"],
};