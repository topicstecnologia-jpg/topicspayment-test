import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authCookieName =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "topics_members_session";

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-account"];
const protectedRoutes = ["/dashboard", "/meus-produtos", "/minhas-vendas"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-account",
    "/dashboard/:path*",
    "/meus-produtos/:path*",
    "/minhas-vendas/:path*"
  ]
};
