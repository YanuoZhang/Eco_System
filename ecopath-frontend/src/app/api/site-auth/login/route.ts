import { NextRequest, NextResponse } from "next/server";
import { generateAuthToken, verifyPassword } from "@/lib/siteAuth";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let password = "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      password = String(body?.password || "");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      password = String(params.get("password") || "");
    } else {
      const body: unknown = await req
        .json()
        .catch(() => ({ password: "" }) as { password?: string });
      if (typeof body === "object" && body !== null && "password" in body) {
        password = String((body as { password?: string }).password || "");
      }
    }

    if (!password || !verifyPassword(password)) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const token = generateAuthToken("site-user");
    const res = NextResponse.json({ success: true });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_HTTPS === "true",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      // Remove domain setting to avoid cookie issues in development
    };

    console.log("Setting cookie with options:", {
      ...cookieOptions,
      token: token.substring(0, 20) + "...",
      env: process.env.NODE_ENV,
      https: process.env.NEXT_PUBLIC_HTTPS,
      domain: process.env.NEXT_PUBLIC_DOMAIN,
    });

    res.cookies.set("site_auth", token, cookieOptions);
    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
