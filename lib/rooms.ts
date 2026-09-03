import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Room = {
  id: number;
  name: string;
  type: "Besar" | "Kecil";
  status: "kosong" | "penuh";
};

export type RoomsData = {
  lastUpdated: string;
  rooms: Room[];
};

export function isValidRooms(value: unknown): value is Room[] {
  if (!Array.isArray(value) || value.length !== 5) return false;
  return value.every((room, index) => {
    if (!room || typeof room !== "object") return false;
    const candidate = room as Partial<Room>;
    return (
      candidate.id === index + 1 &&
      candidate.name === `Kamar ${index + 1}` &&
      (candidate.type === "Besar" || candidate.type === "Kecil") &&
      (candidate.status === "kosong" || candidate.status === "penuh")
    );
  });
}

<<<<<<< HEAD
const DATA_PATH = path.join(process.cwd(), "data", "rooms.json");

=======
>>>>>>> 539341e4703550588728e707591eb881fd2bb618
export class RoomStorageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RoomStorageError";
  }
}

<<<<<<< HEAD
type SupabaseRoom = Room & { updated_at: string };

function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function toRoomsData(rows: SupabaseRoom[]): RoomsData {
  const lastUpdated = rows.reduce((latest, row) => {
    return row.updated_at > latest ? row.updated_at : latest;
  }, "");

  return {
    lastUpdated: lastUpdated ? lastUpdated.slice(0, 10) : new Date().toISOString().slice(0, 10),
    rooms: rows.map(toPublicRoom),
  };
}

function toPublicRoom(row: SupabaseRoom): Room {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
  };
}

async function getLocalRooms(): Promise<RoomsData> {
  try {
    const fileContent = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(fileContent) as RoomsData;
=======
const DATA_PATH = path.join(process.cwd(), "data", "rooms.json");
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "room-data";
const SUPABASE_OBJECT = "rooms.json";

async function getLocalRooms(): Promise<RoomsData> {
  try {
    return JSON.parse(await fs.readFile(DATA_PATH, "utf8")) as RoomsData;
>>>>>>> 539341e4703550588728e707591eb881fd2bb618
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
<<<<<<< HEAD
    console.warn("[Local Storage] Tidak dapat menulis filesystem lokal:", error);
  }
}

export async function getRooms(): Promise<RoomsData> {
  const supabase = getSupabaseServer();
  if (!supabase) return getLocalRooms();

  const { data, error } = await supabase
    .from("rooms")
    .select("id,name,type,status,updated_at")
    .order("id", { ascending: true });

  if (error) {
    console.error("[Supabase] Gagal membaca rooms:", error);
    throw new RoomStorageError("Database Supabase tidak dapat diakses.", 503);
  }
  if (!data || !isValidRooms(data.map(toPublicRoom))) {
    throw new RoomStorageError("Data kamar di Supabase tidak valid.", 503);
  }
  return toRoomsData(data as SupabaseRoom[]);
}

export async function saveRooms(rooms: Room[]): Promise<RoomsData> {
  const updatedAt = new Date().toISOString();
  const data: RoomsData = { lastUpdated: updatedAt.slice(0, 10), rooms };
  const supabase = getSupabaseServer();

  if (!supabase) {
    await saveLocalRooms(data);
    return data;
  }

  const { data: savedRows, error } = await supabase
    .from("rooms")
    .upsert(rooms.map((room) => ({ ...room, updated_at: updatedAt })), { onConflict: "id" })
    .select("id,name,type,status,updated_at")
    .order("id", { ascending: true });

  if (error || !savedRows || !isValidRooms(savedRows.map(toPublicRoom))) {
    console.error("[Supabase] Gagal menyimpan rooms:", error);
    throw new RoomStorageError("Perubahan kamar belum tersimpan di Supabase.", 503);
  }

  return toRoomsData(savedRows as SupabaseRoom[]);
}

export function isCloudConfigured(): boolean {
  return Boolean(getSupabaseServer());
=======
    console.warn("[Local Storage] Penyimpanan lokal tidak tersedia:", error);
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

function headers(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}`, apikey: key };
}

async function getSupabaseRooms(config: { url: string; key: string }): Promise<RoomsData | null> {
  try {
    const response = await fetch(
      `${config.url}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${SUPABASE_OBJECT}`,
      { headers: headers(config.key), cache: "no-store" },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as RoomsData;
    return isValidRooms(data.rooms) ? data : null;
  } catch (error) {
    console.error("[Supabase Storage] Gagal membaca data:", error);
    return null;
  }
}

async function ensureSupabaseBucket(config: { url: string; key: string }): Promise<void> {
  const response = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers(config.key), "Content-Type": "application/json" },
    body: JSON.stringify({ id: SUPABASE_BUCKET, name: SUPABASE_BUCKET, public: false }),
  });
  if (!response.ok && response.status !== 409) {
    throw new RoomStorageError(`Supabase bucket tidak dapat dibuat (HTTP ${response.status}).`, response.status);
  }
}

async function saveSupabaseRooms(config: { url: string; key: string }, data: RoomsData): Promise<void> {
  try {
    await ensureSupabaseBucket(config);
    const response = await fetch(
      `${config.url}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${SUPABASE_OBJECT}`,
      {
        method: "POST",
        headers: {
          ...headers(config.key),
          "Content-Type": "application/json",
          "x-upsert": "true",
        },
        body: JSON.stringify(data),
      },
    );
    if (!response.ok) {
      throw new RoomStorageError(`Supabase menolak penyimpanan data (HTTP ${response.status}).`, response.status);
    }
  } catch (error) {
    if (error instanceof RoomStorageError) throw error;
    console.error("[Supabase Storage] Gagal menyimpan data:", error);
    throw new RoomStorageError("Tidak dapat terhubung ke Supabase Storage.");
  }
}

export async function getRooms(): Promise<RoomsData> {
  const supabase = getSupabaseConfig();
  if (supabase) {
    const cloudData = await getSupabaseRooms(supabase);
    if (cloudData) return cloudData;
  }
  return getLocalRooms();
}

export async function saveRooms(rooms: Room[]): Promise<RoomsData> {
  const data: RoomsData = { lastUpdated: new Date().toISOString().slice(0, 10), rooms };
  const supabase = getSupabaseConfig();
  if (supabase) {
    await saveSupabaseRooms(supabase, data);
    await saveLocalRooms(data);
    return data;
  }
  if (process.env.VERCEL) {
    throw new RoomStorageError(
      "Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel.",
    );
  }
  await saveLocalRooms(data);
  return data;
}

export function isCloudConfigured(): boolean {
  return !!getSupabaseConfig();
>>>>>>> 539341e4703550588728e707591eb881fd2bb618
}
