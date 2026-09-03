import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getRooms, isValidRooms, saveRooms, type Room } from "@/lib/rooms";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await getRooms(), {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { rooms?: Room[] };
  try {
    body = await request.json() as { rooms?: Room[] };
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  if (!isValidRooms(body.rooms)) {
    return NextResponse.json({ error: "Data kamar tidak valid" }, { status: 400 });
  }

  try {
    return NextResponse.json(await saveRooms(body.rooms), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[Rooms API] Gagal menyimpan status kamar:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Status kamar belum tersimpan. Periksa konfigurasi Supabase Storage.",
      },
      { status: 503 }
    );
  }
}
