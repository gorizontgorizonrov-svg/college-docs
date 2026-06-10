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
  const user = req.auth?.user;

  if (!user && path !== "/login" && path !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (user) {
    const matchedRoute = protectedRoutes.find((route) => path.startsWith(route));
    if (matchedRoute) {
      const allowedRoles = roleBasedRoutes[matchedRoute];
      if (!allowedRoles.includes(user.role as string)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|icon|favicon|manifest).*)"],
};
