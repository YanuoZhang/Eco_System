import { NextRequest, NextResponse } from "next/server";
import { updatePassword, verifyAuthToken, verifyPassword } from "@/lib/siteAuth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("site_auth")?.value;
    if (!verifyAuthToken(token)) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let current = "";
    let next = "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      current = String(body?.current || "");
      next = String(body?.next || "");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      current = String(params.get("current") || "");
      next = String(params.get("next") || "");
    }

    if (!current || !next || !verifyPassword(current)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    updatePassword(next);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
