import { NextRequest, NextResponse } from "next/server";

const DASHBOARD_PATH = "/dashboard";
const LOGIN_PATH = "/login";

function isSessionValid(request: NextRequest): boolean {
  const token = request.cookies.get("auth_token")?.value;
  const expiresAtRaw = request.cookies.get("auth_expires_at")?.value;

  if (!token || !expiresAtRaw) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Date.now();
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete("auth_token");
  response.cookies.delete("auth_expires_at");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const validSession = isSessionValid(request);

  if (pathname.startsWith(DASHBOARD_PATH) && !validSession) {
    const url = new URL(LOGIN_PATH, request.url);
    const response = NextResponse.redirect(url);
    clearSessionCookies(response);
    return response;
  }

  if (pathname === LOGIN_PATH && validSession) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
