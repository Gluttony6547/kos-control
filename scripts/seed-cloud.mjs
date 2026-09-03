import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const roomsPath = path.join(root, "data", "rooms.json");

if (fs.existsSync(envPath)) {
<<<<<<< HEAD
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL dan SUPABASE_SECRET_KEY wajib diisi di .env.local.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(roomsPath, "utf8"));
const updatedAt = new Date().toISOString();
const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rooms?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(data.rooms.map((room) => ({ ...room, updated_at: updatedAt }))),
});

if (!response.ok) {
  console.error(`Gagal menyimpan data ke Supabase (HTTP ${response.status}):`, await response.text());
  process.exit(1);
}

console.log("Data awal kamar berhasil disimpan ke Supabase.");
=======
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = values.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "room-data";

if (!url || !key) {
  console.error("❌ Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.");
  process.exit(1);
}

const baseUrl = url.replace(/\/$/, "");
const headers = { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" };
const bucketResponse = await fetch(`${baseUrl}/storage/v1/bucket`, {
  method: "POST",
  headers,
  body: JSON.stringify({ id: bucket, name: bucket, public: false }),
});

if (!bucketResponse.ok && bucketResponse.status !== 409) {
  throw new Error(`Gagal membuat bucket Supabase (HTTP ${bucketResponse.status}).`);
}

const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/rooms.json`, {
  method: "POST",
  headers: { ...headers, "x-upsert": "true" },
  body: JSON.stringify(JSON.parse(fs.readFileSync(roomsPath, "utf8"))),
});

if (!response.ok) {
  throw new Error(`Gagal menyimpan rooms.json ke Supabase (HTTP ${response.status}).`);
}

console.log("✅ Data status kamar berhasil disimpan ke Supabase Storage.");
>>>>>>> 539341e4703550588728e707591eb881fd2bb618
