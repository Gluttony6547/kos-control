import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Room = {
  id: number;
  name: string;
  type: "Besar" | "Kecil";
  status: "kosong" | "penuh";
};

export type RoomsData = { lastUpdated: string; rooms: Room[] };

export function isValidRooms(value: unknown): value is Room[] {
  if (!Array.isArray(value) || value.length !== 5) return false;
  return value.every((room, index) => {
    if (!room || typeof room !== "object") return false;
    const candidate = room as Partial<Room>;
    return candidate.id === index + 1 && candidate.name === `Kamar ${index + 1}` &&
      (candidate.type === "Besar" || candidate.type === "Kecil") &&
      (candidate.status === "kosong" || candidate.status === "penuh");
  });
}

const DATA_PATH = path.join(process.cwd(), "data", "rooms.json");

export class RoomStorageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RoomStorageError";
  }
}

type SupabaseRoom = Room & { updated_at: string };

function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function toPublicRoom(row: SupabaseRoom): Room {
  return { id: row.id, name: row.name, type: row.type, status: row.status };
}

function toRoomsData(rows: SupabaseRoom[]): RoomsData {
  const latest = rows.reduce((value, row) => row.updated_at > value ? row.updated_at : value, "");
  return {
    lastUpdated: (latest || new Date().toISOString()).slice(0, 10),
    rooms: rows.map(toPublicRoom),
  };
}

async function getLocalRooms(): Promise<RoomsData> {
  try {
    return JSON.parse(await fs.readFile(DATA_PATH, "utf8")) as RoomsData;
  } catch (error) {
    console.error("[Local Storage] Gagal membaca rooms.json:", error);
    return {
      lastUpdated: new Date().toISOString().slice(0, 10),
      rooms: [
        { id: 1, name: "Kamar 1", type: "Besar", status: "penuh" },
        { id: 2, name: "Kamar 2", type: "Besar", status: "kosong" },
        { id: 3, name: "Kamar 3", type: "Besar", status: "penuh" },
        { id: 4, name: "Kamar 4", type: "Kecil", status: "penuh" },
        { id: 5, name: "Kamar 5", type: "Kecil", status: "kosong" },
      ],
    };
  }
}

async function saveLocalRooms(data: RoomsData): Promise<void> {
  try {
    await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch (error) {
    console.warn("[Local Storage] Tidak dapat menulis filesystem lokal:", error);
  }
}

export async function getRooms(): Promise<RoomsData> {
  const supabase = getSupabaseServer();
  if (!supabase) return getLocalRooms();
  const { data, error } = await supabase.from("rooms").select("id,name,type,status,updated_at").order("id");
  if (error) {
    console.error("[Supabase] Gagal membaca rooms:", error);
    throw new RoomStorageError("Database Supabase tidak dapat diakses.", 503);
  }
  const rows = (data || []) as SupabaseRoom[];
  if (!isValidRooms(rows.map(toPublicRoom))) {
    throw new RoomStorageError("Data kamar di Supabase tidak valid.", 503);
  }
  return toRoomsData(rows);
}

export async function saveRooms(rooms: Room[]): Promise<RoomsData> {
  const updatedAt = new Date().toISOString();
  const supabase = getSupabaseServer();
  if (!supabase) {
    const local = { lastUpdated: updatedAt.slice(0, 10), rooms };
    await saveLocalRooms(local);
    return local;
  }
  const { data, error } = await supabase.from("rooms")
    .upsert(rooms.map((room) => ({ ...room, updated_at: updatedAt })), { onConflict: "id" })
    .select("id,name,type,status,updated_at").order("id");
  const rows = (data || []) as SupabaseRoom[];
  if (error || !isValidRooms(rows.map(toPublicRoom))) {
    console.error("[Supabase] Gagal menyimpan rooms:", error);
    throw new RoomStorageError("Perubahan kamar belum tersimpan di Supabase.", 503);
  }
  return toRoomsData(rows);
}

export function isCloudConfigured(): boolean {
  return Boolean(getSupabaseServer());
}
