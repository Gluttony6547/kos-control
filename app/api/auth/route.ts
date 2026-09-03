import { NextResponse } from "next/server";
import { clearAdminSession, isAdmin, setAdminSession, verifyPassword } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdmin() });
}

export async function POST(request: Request) {
  let password: string | undefined;
  try {
    const body = await request.json() as { password?: string };
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "Password tidak sesuai." }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}

