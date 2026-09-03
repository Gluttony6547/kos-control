import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const roomsPath = path.join(__dirname, "..", "data", "rooms.json");

// Muat .env.local sederhana jika belum ada di process.env
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.log("❌ Belum ada konfigurasi cloud di .env.local.");
  console.log("Pastikan Anda menambahkan:");
  console.log("UPSTASH_REDIS_REST_URL=https://...");
  console.log("UPSTASH_REDIS_REST_TOKEN=...");
  console.log("\nAnda bisa membuat database Redis gratis di: https://upstash.com (Free 10.000 request/hari, tanpa kartu kredit).");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(roomsPath, "utf8"));
console.log("Mengirim data awal kamar ke Cloud Database Upstash Redis...");

const res = await fetch(`${url.replace(/\/$/, "")}/set/deluxe_kost_rooms`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(JSON.stringify(data)),
});

if (res.ok) {
  console.log("✅ Berhasil! Data status kamar telah tersimpan di Cloud Database.");
} else {
  console.error("❌ Gagal menyimpan ke cloud. HTTP Status:", res.status);
  const text = await res.text();
  console.error(text);
}
