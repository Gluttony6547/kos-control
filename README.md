# De Luxe Kost Ampel

Website profil kos dan panel admin untuk mengubah status kamar tanpa mengubah desain yang sudah dibuat.

## Fitur

- Halaman publik dengan status lima kamar.
- Panel admin di `/admin` dengan login password.
- Penyimpanan PostgreSQL Supabase melalui server-only secret key.
- Update status disiarkan melalui Supabase Realtime.
- Fallback `data/rooms.json` hanya untuk pengembangan lokal tanpa kredensial server.

## Menjalankan lokal

```bash
npm install
copy .env.local.example .env.local
npm run dev
```

Isi `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, dan kredensial Supabase di `.env.local`.

## Menyiapkan database Supabase

1. Buka Supabase Dashboard → **SQL Editor**.
2. Jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
3. Pastikan tabel `public.rooms` berisi lima baris.
4. Pastikan **Database → Publications → supabase_realtime** mencantumkan `public.rooms`.

Jangan menaruh `SUPABASE_SECRET_KEY` pada variabel `NEXT_PUBLIC_*`.

## Environment variables Vercel

Tambahkan untuk **Production**, **Preview**, dan **Development**:

```text
ADMIN_PASSWORD=<password admin kuat>
ADMIN_SESSION_SECRET=<secret acak minimal 32 karakter>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Setelah menyimpan variables, lakukan redeploy. Password admin adalah nilai `ADMIN_PASSWORD` yang Anda buat sendiri; password tidak disimpan di repository.

## Verifikasi

```bash
npm run lint
npx tsc --noEmit
npm run build
npm test
```

`npm test` membutuhkan build dan menjalankan server lokal pada port `3099`.
