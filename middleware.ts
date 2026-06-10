import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleBasedRoutes: Record<string, string[]> = {
  "/documents/create": ["INITIATOR", "VALIDATOR", "ADMIN"],
  "/documents/pending": ["VALIDATOR", "SIGNER", "REGISTRAR", "ADMIN"],
  "/documents/approval": ["VALIDATOR", "SIGNER"],
  "/incoming/register": ["REGISTRAR", "ADMIN"],
  "/incoming": ["REGISTRAR", "ADMIN", "SIGNER", "VALIDATOR"],
  "/admin": ["ADMIN"],
};

const protectedRoutes = Object.keys(roleBasedRoutes);

function decodeJWTPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path === "/login" || path === "/") return NextResponse.next();

  const sessionCookie =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = decodeJWTPayload(sessionCookie);

  const matchedRoute = protectedRoutes.find((route) =>
    path.startsWith(route)
  );

  if (matchedRoute && user) {
    const allowedRoles = roleBasedRoutes[matchedRoute];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|icon|favicon|manifest).*)"],
};
