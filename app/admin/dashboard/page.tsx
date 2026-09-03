"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subscribeToRoomChanges } from "@/lib/supabase-browser";

export type Room = {
  id: number;
  name: string;
  type: "Besar" | "Kecil";
  status: "kosong" | "penuh";
};

type Payload = {
  rooms: Room[];
  lastUpdated: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [originalData, setOriginalData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "kosong" | "penuh">("all");

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const authRes = await fetch("/api/auth", { cache: "no-store" });
        const authData = await authRes.json().catch(() => ({}));

        if (!active) return;
        if (!authRes.ok || !authData.authenticated) {
          router.replace("/admin/login");
          return;
        }

        const roomsRes = await fetch("/api/rooms", { cache: "no-store" });
        if (!roomsRes.ok) throw new Error("Gagal mengambil data kamar.");

        const roomsData: Payload = await roomsRes.json();
        if (active) {
          setData(roomsData);
          setOriginalData(roomsData);
          setLoading(false);
        }
      } catch {
        if (active) {
          router.replace("/admin/login");
        }
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [router]);

  // Check if there are unsaved changes
  const isDirty = useMemo(() => {
    if (!data || !originalData) return false;
    return JSON.stringify(data.rooms) !== JSON.stringify(originalData.rooms);
  }, [data, originalData]);

  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    let active = true;
    const refreshRooms = async () => {
      if (isDirtyRef.current) return;
      const response = await fetch("/api/rooms", { cache: "no-store" });
      if (!response.ok || !active) return;
      const roomsData: Payload = await response.json();
      if (Array.isArray(roomsData.rooms)) {
        setData(roomsData);
        setOriginalData(roomsData);
      }
    };
    const unsubscribe = subscribeToRoomChanges(refreshRooms);
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, kosong: 0, penuh: 0 };
    const kosong = data.rooms.filter((r) => r.status === "kosong").length;
    const penuh = data.rooms.filter((r) => r.status === "penuh").length;
    return { total: data.rooms.length, kosong, penuh };
  }, [data]);

  function toggleStatus(id: number) {
    if (!data) return;
    setData((curr) => {
      if (!curr) return curr;
      return {
        ...curr,
        rooms: curr.rooms.map((room) =>
          room.id === id
            ? { ...room, status: room.status === "kosong" ? "penuh" : "kosong" }
            : room
        ),
      };
    });
  }

  function resetChanges() {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
  }

  async function handleSave() {
    if (!data || saving) return;
    setSaving(true);
    setToast(null);

    try {
      const response = await fetch("/api/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: data.rooms }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menyimpan perubahan.");
      }

      const updatedData: Payload = await response.json();
      if (!updatedData || !Array.isArray(updatedData.rooms) || updatedData.rooms.length !== data.rooms.length) {
        throw new Error("Respons data kamar tidak valid.");
      }
      setData(updatedData);
      setOriginalData(updatedData);
      setToast({
        type: "success",
        message: "Perubahan berhasil disimpan dan langsung tampil di website!",
      });
      setTimeout(() => setToast(null), 4000);
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan perubahan. Coba beberapa saat lagi.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const filteredRooms = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.rooms;
    return data.rooms.filter((r) => r.status === filter);
  }, [data, filter]);

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="admin-card auth-loading-card">
          <div className="auth-spinner" />
          <p>Memuat dashboard admin…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-card dashboard-card">
        {/* Header Bar */}
        <header className="dash-header">
          <div>
            <div className="dash-nav-links">
              <Link href="/" target="_blank" className="dash-preview-link">
                <span>Lihat Website</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            </div>
            <p className="eyebrow">PANEL PENGELOLA</p>
            <h1>Status Ketersediaan Kamar</h1>
            <p className="dash-date">
              Terakhir diperbarui:{" "}
              <b>
                {data?.lastUpdated
                  ? new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(`${data.lastUpdated}T00:00:00`))
                  : "-"}
              </b>
            </p>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Keluar dari sesi admin">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar</span>
          </button>
        </header>

        {/* Stats Grid */}
        <div className="dash-stats">
          <div className="stat-card">
            <span className="stat-label">Total Kamar</span>
            <strong className="stat-num">{stats.total}</strong>
            <span className="stat-desc">Kamar lantai 2</span>
          </div>
          <div className="stat-card stat-card-kosong">
            <span className="stat-label">Kamar Kosong</span>
            <strong className="stat-num">{stats.kosong}</strong>
            <span className="stat-desc">Siap disewakan</span>
          </div>
          <div className="stat-card stat-card-penuh">
            <span className="stat-label">Kamar Terisi</span>
            <strong className="stat-num">{stats.penuh}</strong>
            <span className="stat-desc">Sudah ada penyewa</span>
          </div>
        </div>

        {/* Unsaved Changes Banner */}
        {isDirty && (
          <div className="unsaved-alert">
            <div className="unsaved-text">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Ada perubahan status kamar yang belum disimpan!</span>
            </div>
            <div className="unsaved-actions">
              <button className="button-text" onClick={resetChanges} disabled={saving}>
                Batal
              </button>
              <button className="button button-dark btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Sekarang"}
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`dash-toast dash-toast-${toast.type}`}>
            {toast.type === "success" ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Room Table Controls */}
        <div className="dash-table-header">
          <h2>Daftar Kamar</h2>
          <div className="dash-filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Semua ({stats.total})
            </button>
            <button
              className={`filter-btn ${filter === "kosong" ? "active" : ""}`}
              onClick={() => setFilter("kosong")}
            >
              Kosong ({stats.kosong})
            </button>
            <button
              className={`filter-btn ${filter === "penuh" ? "active" : ""}`}
              onClick={() => setFilter("penuh")}
            >
              Penuh ({stats.penuh})
            </button>
          </div>
        </div>

        {/* Room List */}
        <div className="admin-rooms">
          {filteredRooms.map((room) => {
            const isKosong = room.status === "kosong";
            return (
              <div key={room.id} className={`admin-room-item ${isKosong ? "is-vacant" : "is-occupied"}`}>
                <div className="room-info">
                  <div className="room-title-row">
                    <b>{room.name}</b>
                    <span className="room-type-tag">Tipe {room.type}</span>
                    <span className="room-price">
                      {room.type === "Besar" ? "Rp 1.500.000/bln" : "Rp 1.100.000/bln"}
                    </span>
                  </div>
                  <span className="room-meta">
                    Fasilitas: AC, Kamar Mandi Dalam, Kasur, Lemari
                  </span>
                </div>

                <div className="room-action-wrap">
                  <span className={`status-pill ${room.status}`}>
                    {isKosong ? "🟢 Kosong" : "🔴 Terisi"}
                  </span>
                  <button
                    onClick={() => toggleStatus(room.id)}
                    className={`toggle-switch ${isKosong ? "active" : ""}`}
                    aria-label={`Ubah status ${room.name} menjadi ${isKosong ? "penuh" : "kosong"}`}
                    title="Klik untuk mengubah status kamar"
                  >
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                    <span className="toggle-label-text">
                      {isKosong ? "Set Terisi" : "Set Kosong"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="dash-footer-bar">
          <p className="footer-note">
            Perubahan status akan langsung memperbarui status ketersediaan pada halaman depan website.
          </p>
          <div className="dash-footer-buttons">
            {isDirty && (
              <button className="button-text" onClick={resetChanges} disabled={saving}>
                Batal
              </button>
            )}
            <button
              className="button button-dark save-btn"
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              {saving ? (
                <>
                  <span className="btn-spinner" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>{isDirty ? "Simpan Perubahan" : "Tersimpan"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
