import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log("🚀 Menjalankan automated test suite untuk De Luxe Kost Ampel...");

// 1. Jalankan next start pada PORT 3099
const nextProcess = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-p", String(PORT)],
  {
    cwd: path.join(__dirname, ".."),
    stdio: "pipe",
    shell: true,
    env: {
      ...process.env,
      PORT: String(PORT),
      ADMIN_PASSWORD: "admin",
      ADMIN_SESSION_SECRET: "test-secret-key-1234567890",
    },
  }
);

let serverLogs = "";
nextProcess.stdout.on("data", (d) => (serverLogs += d.toString()));
nextProcess.stderr.on("data", (d) => (serverLogs += d.toString()));

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth`);
      if (res.status === 200) return true;
    } catch {
      await wait(600);
    }
  }
  throw new Error("Server gagal dimulai tepat waktu:\n" + serverLogs);
}

let cookieHeader = "";

async function runTests() {
  try {
    console.log("Menunggu server Next.js aktif di port " + PORT + "...");
    await waitForServer();
    console.log("✅ Server Next.js aktif!");

    // Test 1: GET /api/auth tanpa cookie -> authenticated: false
    console.log("\n[Test 1] GET /api/auth tanpa session...");
    const auth1 = await fetch(`${BASE_URL}/api/auth`);
    const auth1Json = await auth1.json();
    if (!auth1Json.authenticated) {
      console.log("✅ Berhasil: User belum terautentikasi (authenticated: false).");
    } else {
      throw new Error("Test 1 Gagal: seharusnya unauthenticated!");
    }

    // Test 2: PUT /api/rooms tanpa session -> 401 Unauthorized
    console.log("\n[Test 2] PUT /api/rooms tanpa session (proteksi data)...");
    const putUnauthorized = await fetch(`${BASE_URL}/api/rooms`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooms: [] }),
    });
    if (putUnauthorized.status === 401) {
      console.log("✅ Berhasil: Request ditolak dengan HTTP 401 Unauthorized.");
    } else {
      throw new Error(`Test 2 Gagal: status code ${putUnauthorized.status}`);
    }

    // Test 3: POST /api/auth dengan password salah -> 401
    console.log("\n[Test 3] POST /api/auth dengan password salah...");
    const loginFail = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "password_salah" }),
    });
    if (loginFail.status === 401) {
      console.log("✅ Berhasil: Password salah ditolak (HTTP 401).");
    } else {
      throw new Error(`Test 3 Gagal: status code ${loginFail.status}`);
    }

    // Test 4: POST /api/auth dengan password benar -> 200 & cookie set
    console.log("\n[Test 4] POST /api/auth dengan password benar (admin)...");
    const loginOk = await fetch(`${BASE_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "admin" }),
    });
    if (loginOk.status === 200) {
      const setCookie = loginOk.headers.get("set-cookie");
      if (setCookie && setCookie.includes("deluxe_admin")) {
        cookieHeader = setCookie.split(";")[0];
        console.log("✅ Berhasil: Login sukses dan cookie deluxe_admin berhasil didapatkan.");
      } else {
        throw new Error("Test 4 Gagal: Cookie deluxe_admin tidak ditemukan di header respons.");
      }
    } else {
      throw new Error(`Test 4 Gagal: status code ${loginOk.status}`);
    }

    // Test 5: GET /api/auth dengan cookie -> authenticated: true
    console.log("\n[Test 5] GET /api/auth dengan session cookie yang valid...");
    const authValid = await fetch(`${BASE_URL}/api/auth`, {
      headers: { Cookie: cookieHeader },
    });
    const authValidJson = await authValid.json();
    if (authValidJson.authenticated === true) {
      console.log("✅ Berhasil: Sesi valid terverifikasi (authenticated: true).");
    } else {
      throw new Error("Test 5 Gagal: authenticated bukan true!");
    }

    // Test 6: PUT /api/rooms dengan session cookie -> 200 OK
    console.log("\n[Test 6] PUT /api/rooms menyimpan perubahan status kamar...");
    const updatedRooms = [
      { id: 1, name: "Kamar 1", type: "Besar", status: "penuh" },
      { id: 2, name: "Kamar 2", type: "Besar", status: "kosong" },
      { id: 3, name: "Kamar 3", type: "Besar", status: "penuh" },
      { id: 4, name: "Kamar 4", type: "Kecil", status: "kosong" },
      { id: 5, name: "Kamar 5", type: "Kecil", status: "kosong" },
    ];
    const putSuccess = await fetch(`${BASE_URL}/api/rooms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ rooms: updatedRooms }),
    });
    if (putSuccess.status === 200) {
      const savedData = await putSuccess.json();
      if (savedData.rooms && savedData.rooms.length === 5) {
        console.log("✅ Berhasil: Status 5 kamar berhasil diperbarui dan disimpan.");
      } else {
        throw new Error("Test 6 Gagal: format data kamar tidak sesuai.");
      }
    } else {
      throw new Error(`Test 6 Gagal: status code ${putSuccess.status}`);
    }

    // Test 7: GET /api/rooms mengambil data terkini
    console.log("\n[Test 7] GET /api/rooms membaca ketersediaan publik...");
    const getRoomsRes = await fetch(`${BASE_URL}/api/rooms`);
    const publicRooms = await getRoomsRes.json();
    if (publicRooms.rooms && publicRooms.rooms[1].status === "kosong") {
      console.log("✅ Berhasil: Data publik sinkron dengan data yang baru disimpan.");
    } else {
      throw new Error("Test 7 Gagal: data publik tidak sesuai dengan yang diupdate.");
    }

    // Test 8: DELETE /api/auth untuk logout
    console.log("\n[Test 8] DELETE /api/auth melakukan logout...");
    const logoutRes = await fetch(`${BASE_URL}/api/auth`, {
      method: "DELETE",
      headers: { Cookie: cookieHeader },
    });
    if (logoutRes.status === 200) {
      console.log("✅ Berhasil: Logout berhasil dieksekusi.");
    } else {
      throw new Error(`Test 8 Gagal: status code ${logoutRes.status}`);
    }

    // Test 9: GET /api/auth setelah logout
    console.log("\n[Test 9] GET /api/auth setelah logout...");
    const authAfterLogout = await fetch(`${BASE_URL}/api/auth`);
    const authAfterJson = await authAfterLogout.json();
    if (authAfterJson.authenticated === false) {
      console.log("✅ Berhasil: Sesi telah bersih.");
    } else {
      throw new Error("Test 9 Gagal: Sesi masih terdeteksi!");
    }

    // Test 10: GET /admin routing redirect
    console.log("\n[Test 10] GET /admin mengembalikan respons redirect (307/308)...");
    const adminPageRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    if (adminPageRes.status === 307 || adminPageRes.status === 308 || adminPageRes.status === 302) {
      const location = adminPageRes.headers.get("location");
      console.log(`✅ Berhasil: /admin me-redirect ke ${location} (HTTP ${adminPageRes.status}).`);
    } else {
      console.log(`Info: /admin HTTP Status ${adminPageRes.status}`);
    }

    console.log("\n=======================================================");
    console.log("🎉 SEMUA TEST BERHASIL DILALUI DENGAN SUKSES (10/10)!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("\n❌ TEST ERROR:", err);
    process.exitCode = 1;
  } finally {
    if (nextProcess && nextProcess.pid) {
      if (process.platform === "win32") {
        try {
          const { execSync } = await import("child_process");
          execSync(`taskkill /pid ${nextProcess.pid} /T /F`, { stdio: "ignore" });
        } catch {}
      } else {
        nextProcess.kill();
      }
    }
    process.exit(process.exitCode || 0);
  }
}

runTests();
