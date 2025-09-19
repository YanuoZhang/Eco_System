import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/siteAuth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("Middleware check:", { pathname, cookies: req.cookies.getAll() });

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
  console.log("Token check:", { hasToken: !!token, token: token?.substring(0, 20) + "..." });

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/gate";
    url.searchParams.set("next", pathname);
    console.log("Redirecting to gate:", url.toString());
    return NextResponse.redirect(url);
  }

  // Verify token validity
  const isValid = verifyAuthToken(token);
  console.log("Token validation:", { isValid });

  if (!isValid) {
    const url = req.nextUrl.clone();
    url.pathname = "/gate";
    url.searchParams.set("next", pathname);
    console.log("Invalid token, redirecting to gate:", url.toString());
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
