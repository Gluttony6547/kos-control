import { promises as fs } from "fs";
import path from "path";

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

export class RoomStorageError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RoomStorageError";
  }
}

const DATA_PATH = path.join(process.cwd(), "data", "rooms.json");
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "room-data";
const SUPABASE_OBJECT = "rooms.json";

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
}
