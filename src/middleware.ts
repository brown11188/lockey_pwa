import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function redirectTo(req: NextRequest, path: string): NextResponse {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0] ??
    req.nextUrl.protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host;
  return NextResponse.redirect(new URL(`${proto}://${host}${BASE_PATH}${path}`));
}

export async function middleware(req: NextRequest) {
  const isHttps =
    req.headers.get("x-forwarded-proto")?.split(",")[0] === "https" ||
    process.env.AUTH_URL?.startsWith("https://") === true;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps,
    cookieName: isHttps
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
    salt: isHttps
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  }).catch(() => null);

  const pathname = req.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/reset-password");
  const isAdminPage = pathname.startsWith("/admin");

  if (isAuthPage && token) return redirectTo(req, "/gallery");
  if (!isAuthPage && !token) return redirectTo(req, "/login");
  if (isAdminPage && token && (token as { role?: string }).role !== "admin") {
    return redirectTo(req, "/gallery");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
