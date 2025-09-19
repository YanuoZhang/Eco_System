import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow public routes: gate page and auth APIs, Next assets
  if (
    pathname.startsWith("/api/site-auth/") ||
    pathname.startsWith("/gate") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("site_auth")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/gate";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // token presence only; verification happens server-side on API endpoints.
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
