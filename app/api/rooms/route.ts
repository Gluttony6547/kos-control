import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getRooms, saveRooms, type Room } from "@/lib/rooms";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(await getRooms(), { headers: { "Cache-Control": "no-store" } }); }
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { rooms?: Room[] };
  if (!Array.isArray(body.rooms) || body.rooms.length !== 5 || body.rooms.some((room) => !["kosong", "penuh"].includes(room.status))) return NextResponse.json({ error: "Data kamar tidak valid" }, { status: 400 });
  return NextResponse.json(await saveRooms(body.rooms));
}
