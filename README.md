# De Luxe Kost Ampel — Website & Panel Admin

Website profil hunian dan panel manajemen ketersediaan kamar untuk **De Luxe Kost Ampel, Surabaya**.

---

## 🌟 Fitur Utama

1. **Halaman Publik**:
   - Status ketersediaan kamar real-time (Kamar 1–5).
   - Tombol **"Pesan Kamar Ini"** langsung membuka percakapan WhatsApp dengan pesan template otomatis per kamar.
   - Showcase Tipe Besar (Rp 1.500.000/bln) dan Tipe Kecil (Rp 1.100.000/bln) dilengkapi switcher galeri foto interior asli.
   - **Modal Denah Interaktif**: Pengunjung dapat melihat denah arsitektur lantai 2 (`Denah Kost.jpg`).
   - Informasi lokasi strategis & jarak tempuh + Google Maps interaktif.
   - Tata tertib sewa (Accordion) dan FAQ (Pertanyaan yang Sering Diajukan).
   - Floating WhatsApp button di sudut kanan bawah layar.

2. **Panel Admin Modern (`/admin`)**:
   - URL `/admin` otomatis mengarahkan ke dashboard jika sudah login, atau ke halaman login jika belum.
   - Fitur intip password (*show/hide toggle*) dan proteksi keamanan timing-safe.
   - **Kartu Statistik Ringkas**: Menampilkan jumlah Total Kamar, Kamar Kosong (siap sewa), dan Kamar Terisi.
   - **Peringatan Perubahan Belum Disimpan (*Unsaved Changes Banner*)**: Mencegah kehilangan data jika switch diubah tapi lupa disimpan.
   - Tombol filter kamar (Semua, Kosong, Penuh) dan tombol batal / reset perubahan.
   - Toast alert konfirmasi saat data berhasil tersimpan.

3. **Cloud Storage Adapter (Siap Publish)**:
   - Mendukung penyimpanan **Cloud Database Upstash Redis / Vercel KV** (100% gratis tanpa kartu kredit).
   - Otomatis menggunakan Cloud jika variabel `.env` diisi, dan tetap menggunakan file lokal `data/rooms.json` saat dijalankan offline/lokal.
   - Pada Vercel, konfigurasi cloud wajib diisi agar perubahan status kamar persisten di semua instance. Jika penyimpanan cloud gagal, panel akan menampilkan error dan tidak mengklaim perubahan berhasil.

---

## 🚀 Cara Menjalankan Secara Lokal

1. Salin file contoh environment:
   ```bash
   cp .env.local.example .env.local
   ```
2. Sesuaikan password admin di `.env.local` (default: `ADMIN_PASSWORD=admin`).
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka di browser:
   - Website Publik: `http://localhost:3000`
   - Panel Admin: `http://localhost:3000/admin` (atau `/admin/login`)

---

## 🧪 Menjalankan Automated Testing

Proyek ini telah dilengkapi test suite otomatis (10 pengujian):
```bash
npm test
```
Pengujian mencakup:
- Proteksi akses tanpa login (HTTP 401 Unauthorized).
- Validasi kesalahan password.
- Pembuatan cookie sesi aman (`deluxe_admin`).
- Verifikasi pembacaan & penyimpanan data kamar.
- Revalidasi data publik setelah diperbarui admin.
- Proses logout dan pembersihan sesi.
- Server-side redirect route `/admin`.

---

## ☁️ Panduan Deploy ke Vercel (Produksi)

Ketika Anda siap mempublikasikan website ke internet:

### 1. Buat Database Cloud Gratis (Upstash Redis)
1. Kunjungi [https://upstash.com](https://upstash.com) dan daftar akun gratis.
2. Klik **Create Database** (pilih Serverless Redis, lokasi terdekat misal Singapore).
3. Di halaman detail database, scroll ke bagian **REST API**.
4. Salin:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Pindahkan Data Awal ke Cloud
Jalankan perintah ini di komputer lokal (pastikan kedua variabel di atas sudah ada di `.env.local`):
```bash
node scripts/seed-cloud.mjs
```

### 3. Deploy ke Vercel
1. Upload folder proyek ke GitHub / GitLab.
2. Di dashboard [Vercel](https://vercel.com), klik **New Project** lalu impor repositori ini.
3. Tambahkan **Environment Variables** berikut di pengaturan Vercel:
   - `ADMIN_PASSWORD`: Password panel admin Anda.
   - `ADMIN_SESSION_SECRET`: Kunci acak rahasia.
   - `UPSTASH_REDIS_REST_URL`: URL **REST API** dari detail database Upstash (bukan URL halaman console).
   - `UPSTASH_REDIS_REST_TOKEN`: Token REST API dengan akses tulis (jangan gunakan read-only token).

   Pastikan nama dan nilainya sama persis dengan yang diberikan Upstash. Setelah mengubah environment variable, lakukan redeploy agar konfigurasi aktif.
4. Klik **Deploy**! Website dan panel admin langsung aktif dengan status kamar yang tersimpan aman di cloud.
