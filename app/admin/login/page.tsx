"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cek background: jika admin sudah login di sesi sebelumnya, arahkan ke dashboard
  useEffect(() => {
    let mounted = true;
    fetch("/api/auth", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (mounted && data.authenticated) {
          router.replace("/admin/dashboard");
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError("Masukkan password admin.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || (response.status === 401 ? "Password tidak sesuai." : "Login gagal. Coba lagi."));
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-shell">
      <form className="admin-card" onSubmit={handleSubmit}>
        <div className="login-top-bar">
          <Link href="/" className="admin-brand">
            ← Kembali ke Website
          </Link>
          <span className="badge-admin">Admin Portal</span>
        </div>

        <p className="eyebrow">DE LUXE KOST AMPEL</p>
        <h1>Masuk ke Panel</h1>
        <p className="login-subtitle">
          Kelola status ketersediaan kamar secara langsung untuk ditampilkan di website publik.
        </p>

        <label className="input-group-label">
          Password Admin
          <div className="password-input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password admin"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Sembunyikan password" : "Lihat password"}
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        {error && (
          <div className="form-error-alert" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button className="button button-dark login-btn" disabled={loading}>
          {loading ? (
            <>
              <span className="btn-spinner" />
              <span>Memeriksa…</span>
            </>
          ) : (
            <>
              <span>Masuk ke Dashboard</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        <p className="login-footer-hint">
          Hanya untuk pengelola De Luxe Kost Ampel.
        </p>
      </form>
    </main>
  );
}
