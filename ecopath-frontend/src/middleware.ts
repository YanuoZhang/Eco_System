import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Logging removed

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
    // Logging removed
    return NextResponse.redirect(url);
  }

  // Basic token presence check only - detailed validation happens in API routes
  // This avoids Node.js API usage in Edge Runtime
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
