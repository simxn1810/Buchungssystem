import { NextRequest, NextResponse } from "next/server";
import { adminPasswortKorrekt, ADMIN_COOKIE } from "@/lib/admin";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ fehler: "Ungueltige Anfrage." }, { status: 400 });
  }

  if (!adminPasswortKorrekt(String(body.passwort || ""))) {
    return NextResponse.json({ fehler: "Falsches Passwort." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, config.adminPasswort, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
