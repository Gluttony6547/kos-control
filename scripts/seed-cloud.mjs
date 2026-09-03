import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const roomsPath = path.join(__dirname, "..", "data", "rooms.json");

if (fs.existsSync(envPath)) {
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
