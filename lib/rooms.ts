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

const DATA_PATH = path.join(process.cwd(), "data", "rooms.json");
const CLOUD_STORAGE_KEY = "deluxe_kost_rooms";

// Helper untuk membaca dari file lokal
async function getLocalRooms(): Promise<RoomsData> {
  try {
    const fileContent = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("[Local Storage] Gagal membaca rooms.json:", error);
    // Fallback data bawaan jika file tidak ada
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

// Helper untuk menyimpan ke file lokal
async function saveLocalRooms(data: RoomsData): Promise<void> {
  try {
    await fs.writeFile(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch (err) {
    // Pada serverless (seperti Vercel read-only filesystem), penulisan disk lokal akan diabaikan jika cloud aktif
    console.warn("[Local Storage] Catatan: Penyimpanan disk lokal tidak dapat ditulis (wajar pada serverless/Vercel).", err);
  }
}

// ----------------------------------------------------
// Upstash Redis / Vercel KV REST Client (Native Fetch)
// ----------------------------------------------------
function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ""), token };
  }
  return null;
}

async function getUpstashRooms(config: { url: string; token: string }): Promise<RoomsData | null> {
  try {
    const res = await fetch(`${config.url}/get/${CLOUD_STORAGE_KEY}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.result) return null;

    const data: RoomsData = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
    return data;
  } catch (err) {
    console.error("[Upstash Cloud] Error reading data:", err);
    return null;
  }
}

async function saveUpstashRooms(config: { url: string; token: string }, data: RoomsData): Promise<boolean> {
  try {
    const res = await fetch(`${config.url}/set/${CLOUD_STORAGE_KEY}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(data)),
    });
    return res.ok;
  } catch (err) {
    console.error("[Upstash Cloud] Error saving data:", err);
    return false;
  }
}

// ----------------------------------------------------
// Public API: getRooms & saveRooms (Hybrid Adapter)
// ----------------------------------------------------
export async function getRooms(): Promise<RoomsData> {
  const upstash = getUpstashConfig();
  if (upstash) {
    const cloudData = await getUpstashRooms(upstash);
    if (cloudData && Array.isArray(cloudData.rooms) && cloudData.rooms.length > 0) {
      return cloudData;
    }
  }

  // Fallback ke penyimpanan lokal
  return await getLocalRooms();
}

export async function saveRooms(rooms: Room[]): Promise<RoomsData> {
  const data: RoomsData = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    rooms,
  };

  const upstash = getUpstashConfig();
  if (upstash) {
    const savedCloud = await saveUpstashRooms(upstash, data);
    if (savedCloud) {
      // Simpan lokal juga jika memungkinkan
      await saveLocalRooms(data);
      return data;
    }
  }

  // Simpan lokal
  await saveLocalRooms(data);
  return data;
}

export function isCloudConfigured(): boolean {
  return !!getUpstashConfig();
}
