"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  MAPS_EMBED_URL,
  MAPS_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
  getWhatsAppRoomUrl,
  getWhatsAppTypeUrl,
  getWhatsAppUrl,
} from "@/lib/config";

type Room = {
  id: number;
  name: string;
  type: "Besar" | "Kecil";
  status: "kosong" | "penuh";
};

type RoomsPayload = {
  lastUpdated: string;
  rooms: Room[];
};

const INITIAL_ROOMS: RoomsPayload = {
  lastUpdated: "2026-09-02",
  rooms: [
    { id: 1, name: "Kamar 1", type: "Besar", status: "penuh" },
    { id: 2, name: "Kamar 2", type: "Besar", status: "kosong" },
    { id: 3, name: "Kamar 3", type: "Besar", status: "penuh" },
    { id: 4, name: "Kamar 4", type: "Kecil", status: "penuh" },
    { id: 5, name: "Kamar 5", type: "Kecil", status: "kosong" },
  ],
};

function Icon({
  name,
}: {
  name: "arrow" | "menu" | "close" | "check" | "bike" | "wifi" | "shield" | "pin" | "washing" | "map" | "whatsapp";
}) {
  const paths = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    bike: (
      <>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M6 17l4-9h4l4 9M10 8H7M13 8l2 4h-5" />
      </>
    ),
    wifi: (
      <>
        <path d="M4 9a12 12 0 0 1 16 0M7 12a8 8 0 0 1 10 0M10 15a4 4 0 0 1 4 0" />
        <path d="M12 19h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    washing: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="14" r="4" />
        <path d="M8 7h.01M11 7h.01" />
      </>
    ),
    map: (
      <>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </>
    ),
    whatsapp: (
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.775.979-.95 1.18-.175.2-.35.226-.651.076-.3-.15-1.267-.467-2.413-1.489-.892-.796-1.493-1.78-1.668-2.08-.175-.301-.019-.464.131-.613.136-.134.301-.35.451-.525.15-.175.2-.301.301-.501.1-.2.05-.376-.025-.526-.075-.15-.675-1.628-.925-2.23-.243-.586-.49-.506-.675-.515-.175-.009-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.027-1.05 2.504s1.075 2.903 1.225 3.104c.15.2 2.115 3.23 5.123 4.532.716.31 1.275.495 1.71.634.718.228 1.372.196 1.888.119.576-.086 1.78-.727 2.03-1.43.25-.703.25-1.305.175-1.43-.075-.126-.275-.201-.576-.351z" />
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={name === "whatsapp" ? "currentColor" : "none"}
      stroke={name === "whatsapp" ? "none" : "currentColor"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const RULES_DATA = [
  [
    "Administrasi & utilitas",
    [
      "Pelunasan awal dilakukan maksimal H-1 sebelum masa sewa dimulai.",
      "Perpanjangan masa sewa dibayarkan maksimal H-7 sebelum masa sewa habis.",
      "Listrik menggunakan token mandiri per kamar; isi sebelum alarm berbunyi agar tidak bising.",
      "Saklar pompa air berada di depan kamar; segera matikan setelah selesai digunakan.",
    ],
  ],
  [
    "Keamanan & ketenangan",
    [
      "Pintu gerbang dan garasi wajib selalu dikunci rapat setelah keluar/masuk.",
      "Bebas jam malam (akses kunci 24 jam), namun jam tenang berlaku pukul 22.00–06.00.",
      "Hindari musik keras, berbicara gaduh, atau kebisingan yang mengganggu penghuni lain.",
      "Parkirkan sepeda motor rapi di garasi yang tersedia tanpa menghalangi akses keluar.",
    ],
  ],
  [
    "Aturan tamu & pasangan",
    [
      "Tamu dilarang menginap di dalam area kos.",
      "Tamu lawan jenis dilarang masuk ke dalam kamar, kecuali pasangan suami istri sah.",
      "Jaga sopan santun dan privasi antar sesama penghuni kos.",
    ],
  ],
  [
    "Kebersihan & ketertiban kamar",
    [
      "Buang sampah pada tempat yang disediakan; sampah basah/berbau harus segera dibuang keluar.",
      "Dilarang merombak struktur kamar, mengecat dinding, atau memaku tanpa izin pengelola.",
      "Kamar hanya diperuntukkan bagi penyewa terdaftar demi keamanan bersama.",
    ],
  ],
];

const FAQ_DATA = [
  {
    q: "Apakah listrik sudah termasuk dalam biaya bulanan?",
    a: "Listrik menggunakan sistem token pulsa mandiri per kamar, sehingga pengeluaran listrik Anda lebih adil dan terkontrol sesuai pemakaian alat elektronik pribadi.",
  },
  {
    q: "Apakah pasangan suami istri diperbolehkan tinggal?",
    a: "Bisa, bagi pasangan suami istri sah dengan menyertakan fotokopi buku nikah atau KTP beralamat sama saat pendaftaran.",
  },
  {
    q: "Bagaimana sistem parkir kendaraan?",
    a: "Tersedia garasi khusus sepeda motor di lantai dasar yang terlindung dan aman. Saat ini kos belum menyediakan area parkir untuk mobil.",
  },
  {
    q: "Bagaimana cara melakukan survei kamar secara langsung?",
    a: "Silakan hubungi kami melalui tombol WhatsApp untuk membuat janji temu survei agar pengelola dapat menyambut dan mendampingi Anda.",
  },
];

export default function Home() {
  const [data, setData] = useState<RoomsPayload>(INITIAL_ROOMS);
  const [menu, setMenu] = useState(false);
  const [openRule, setOpenRule] = useState<number | null>(0);
  const [showDenahModal, setShowDenahModal] = useState(false);

  // Photo Galleries Switchers
  const besarPhotos = ["/images/kamar-besar/1.jpg", "/images/kamar-besar/2.jpg"];
  const kecilPhotos = [
    "/images/kamar-kecil/1.jpg",
    "/images/kamar-kecil/2.jpg",
    "/images/kamar-kecil/3.jpg",
    "/images/kamar-kecil/4.jpg",
  ];
  const [selectedBesarPhoto, setSelectedBesarPhoto] = useState(0);
  const [selectedKecilPhoto, setSelectedKecilPhoto] = useState(1);

  useEffect(() => {
    fetch("/api/rooms", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((roomsData) => {
        if (roomsData && Array.isArray(roomsData.rooms)) {
          setData(roomsData);
        }
      })
      .catch(() => undefined);
  }, []);

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${data.lastUpdated}T00:00:00`));

  const hasVacancy = data.rooms.some((room) => room.status === "kosong");

  return (
    <main>
      {/* Header */}
      <header className="site-header">
        <a className="brand" href="#beranda" onClick={() => setMenu(false)}>
          <span>DL</span>
          <i>De Luxe Kost</i>
        </a>
        <button
          className="menu-toggle"
          aria-label="Buka navigasi"
          onClick={() => setMenu(!menu)}
        >
          <Icon name={menu ? "close" : "menu"} />
        </button>
        <nav className={menu ? "nav-open" : ""}>
          <a href="#kamar" onClick={() => setMenu(false)}>
            Kamar
          </a>
          <a href="#denah" onClick={() => setMenu(false)}>
            Denah
          </a>
          <a href="#fasilitas" onClick={() => setMenu(false)}>
            Fasilitas
          </a>
          <a href="#lokasi" onClick={() => setMenu(false)}>
            Lokasi
          </a>
          <a href="#aturan" onClick={() => setMenu(false)}>
            Tata Tertib & FAQ
          </a>
          <a href="/admin" onClick={() => setMenu(false)} className="nav-admin-link">
            Panel Admin
          </a>
          <a
            className="nav-cta"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Hubungi Kami
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section id="beranda" className="hero">
        <Image
          src="/images/exterior/2.jpg"
          alt="Bangunan De Luxe Kost Ampel Surabaya"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">AMPEL · SURABAYA PUSAT</p>
          <h1>Tempat pulang yang tenang, di tengah kota.</h1>
          <p>
            Hunian baru dengan akses private lantai 2, AC sejuk, kamar mandi dalam, dan keamanan 24 jam untuk kenyamanan maksimal Anda.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#kamar">
              Lihat kamar tersedia <Icon name="arrow" />
            </a>
            <a
              className="button button-outline-light"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              Survei Sekarang
            </a>
          </div>
        </div>
        <p className="hero-scroll">
          Gulir untuk menjelajah <span />
        </p>
      </section>

      {/* Ketersediaan Kamar */}
      <section id="kamar" className="section rooms-section">
        <div className="section-intro">
          <p className="eyebrow">KETERSEDIAAN REAL-TIME</p>
          <h2>Pilih ruang yang sesuai dengan ritme Anda.</h2>
          <p>
            Seluruh kamar berada di lantai dua dengan akses tangga private, full AC, dan kamar mandi dalam.
          </p>
        </div>

        {/* Live Availability Table */}
        <div className="availability">
          <div className="availability-heading">
            <div>
              <h3>Status Ketersediaan Kamar</h3>
              <p>Pembaruan terakhir: {formattedDate}</p>
            </div>
            <div className="availability-actions">
              <span className="live-dot">Status Terkini</span>
              {hasVacancy && (
                <a
                  className="availability-whatsapp"
                  href={getWhatsAppUrl("Halo Pengelola De Luxe Kost, saya melihat ada kamar kosong di website. Saya ingin menanyakan info lebih lanjut.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp: {WHATSAPP_DISPLAY}
                </a>
              )}
            </div>
          </div>

          <div className="room-list">
            {data.rooms.map((room) => {
              const isKosong = room.status === "kosong";
              return (
                <div className="room-row" key={room.id}>
                  <div className="room-row-info">
                    <b>{room.name}</b>
                    <span>Tipe {room.type}</span>
                  </div>
                  <div className="room-row-right">
                    <span className={`status ${room.status}`}>
                      {isKosong ? "🟢 Kosong" : "🔴 Terisi"}
                    </span>
                    {isKosong && (
                      <a
                        href={getWhatsAppRoomUrl(room.name, room.type)}
                        target="_blank"
                        rel="noreferrer"
                        className="book-room-btn"
                        title={`Pesan ${room.name} via WhatsApp`}
                      >
                        <span>Pesan Kamar Ini</span>
                        <Icon name="arrow" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Types Showcase */}
        <div className="type-grid">
          {/* Tipe Besar */}
          <article className="room-type large">
            <div className="room-copy">
              <p className="eyebrow">TIPE BESAR (KAMAR 1, 2, 3)</p>
              <h3>Lega untuk menjalani hari dengan tenang.</h3>
              <p>
                Kamar berukuran luas dengan sirkulasi udara optimal, cocok untuk Anda yang menginginkan ruang ekstra untuk bekerja dan beristirahat.
              </p>
              <strong>
                Rp 1.500.000 <small>/ bulan</small>
              </strong>
              <a
                href={getWhatsAppTypeUrl("Besar", "Rp 1.500.000")}
                target="_blank"
                rel="noreferrer"
              >
                Tanyakan tipe besar via WhatsApp <Icon name="arrow" />
              </a>
            </div>
            <div className="room-photo-wrap">
              <div className="room-photo-main">
                <Image
                  src={besarPhotos[selectedBesarPhoto]}
                  alt="Interior kamar tipe besar De Luxe Kost"
                  fill
                  sizes="(max-width: 860px) 100vw, 50vw"
                />
              </div>
              <div className="photo-gallery-thumbs">
                {besarPhotos.map((src, idx) => (
                  <button
                    key={src}
                    className={`thumb-btn ${selectedBesarPhoto === idx ? "active" : ""}`}
                    onClick={() => setSelectedBesarPhoto(idx)}
                    aria-label={`Lihat foto ${idx + 1} Tipe Besar`}
                  >
                    <Image src={src} alt="thumbnail" fill sizes="60px" />
                  </button>
                ))}
              </div>
            </div>
          </article>

          {/* Tipe Kecil */}
          <article className="room-type small">
            <div className="room-photo-wrap">
              <div className="room-photo-main">
                <Image
                  src={kecilPhotos[selectedKecilPhoto]}
                  alt="Interior kamar tipe kecil De Luxe Kost"
                  fill
                  sizes="(max-width: 860px) 100vw, 50vw"
                />
              </div>
              <div className="photo-gallery-thumbs">
                {kecilPhotos.map((src, idx) => (
                  <button
                    key={src}
                    className={`thumb-btn ${selectedKecilPhoto === idx ? "active" : ""}`}
                    onClick={() => setSelectedKecilPhoto(idx)}
                    aria-label={`Lihat foto ${idx + 1} Tipe Kecil`}
                  >
                    <Image src={src} alt="thumbnail" fill sizes="60px" />
                  </button>
                ))}
              </div>
            </div>
            <div className="room-copy">
              <p className="eyebrow">TIPE KECIL (KAMAR 4 & 5)</p>
              <h3>Ringkas, pribadi, dan tepat guna.</h3>
              <p>
                Ruang efisien dan privat dengan seluruh fasilitas utama: ranjang nyaman, AC sejuk, dan kamar mandi dalam.
              </p>
              <strong>
                Rp 1.100.000 <small>/ bulan</small>
              </strong>
              <a
                href={getWhatsAppTypeUrl("Kecil", "Rp 1.100.000")}
                target="_blank"
                rel="noreferrer"
              >
                Tanyakan tipe kecil via WhatsApp <Icon name="arrow" />
              </a>
            </div>
          </article>

          {/* Detail Kamar Mandi */}
          <article className="room-detail">
            <div className="room-photo-main" style={{ minHeight: "360px", position: "relative" }}>
              <Image
                src="/images/exterior/4.jpg"
                alt="Fasilitas dan area bersih De Luxe Kost"
                fill
                sizes="(max-width: 860px) 100vw, 50vw"
              />
            </div>
            <div className="room-detail-copy">
              <p className="eyebrow">KENYAMANAN PRIBADI</p>
              <h3>Kamar mandi dalam di setiap kamar.</h3>
              <p>
                Setiap kamar dilengkapi kamar mandi pribadi lengkap dengan kloset duduk, shower, dan ventilasi yang terjaga untuk rutinitas higienis setiap hari.
              </p>
            </div>
          </article>
        </div>

        {/* Denah Kost Interactive Banner */}
        <div id="denah" className="denah-banner">
          <div className="denah-banner-text">
            <p className="eyebrow">LAYOUT BANGUNAN</p>
            <h3>Denah Lantai 2 & Posisi Kamar</h3>
            <p>
              Lihat susunan letak Kamar 1 hingga 5, akses tangga, lorong privasi, dan ventilasi udara alami.
            </p>
          </div>
          <button
            className="button button-dark"
            onClick={() => setShowDenahModal(true)}
          >
            <Icon name="map" />
            <span>Buka Denah Kost</span>
          </button>
        </div>
      </section>

      {/* Modal Denah Kost */}
      {showDenahModal && (
        <div className="modal-overlay" onClick={() => setShowDenahModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Denah Lantai 2 — De Luxe Kost Ampel</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowDenahModal(false)}
                aria-label="Tutup denah"
              >
                &times;
              </button>
            </div>
            <div className="modal-img-wrap">
              <Image
                src="/images/denah/denah-kost.jpg"
                alt="Denah Lantai 2 De Luxe Kost Ampel"
                fill
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Fasilitas */}
      <section id="fasilitas" className="section facilities">
        <div className="section-intro">
          <p className="eyebrow">FASILITAS UTAMA</p>
          <h2>Hal-hal esensial yang membuat tinggal terasa nyaman.</h2>
        </div>
        <div className="facility-grid">
          {[
            [
              "wifi",
              "Wi-Fi Cepat (100 Mbps)",
              "Koneksi internet stabil untuk kebutuhan kerja jarak jauh, belajar, dan hiburan.",
            ],
            [
              "bike",
              "Garasi Khusus Motor",
              "Tempat parkir motor terlindung di dalam bangunan dengan pintu gerbang terkunci.",
            ],
            [
              "washing",
              "Area Jemuran Bersama",
              "Area jemur pakaian bersama yang praktis dengan sirkulasi udara terbuka.",
            ],
            [
              "shield",
              "Keamanan & Akses 24 Jam",
              "Pintu gerbang berkunci mandiri; bebas jam malam dengan tetap menjaga jam tenang.",
            ],
            [
              "pin",
              "Wilayah Bebas Banjir",
              "Kawasan hunian yang tinggi, aman dari risiko genangan air maupun banjir.",
            ],
          ].map(([icon, title, text]) => (
            <article className="facility" key={title}>
              <span>
                <Icon name={icon as "wifi"} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Lokasi */}
      <section id="lokasi" className="location">
        <div className="location-map">
          <iframe
            title="Peta lokasi De Luxe Kost Ampel"
            src={MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="location-copy">
          <p className="eyebrow">LOKASI STRATEGIS</p>
          <h2>Dekat pusat aktivitas, tetap tenang untuk istirahat.</h2>
          <p>
            Berada di kawasan Ampel, Surabaya, dengan kemudahan akses transportasi 24 jam ke fasilitas kesehatan, kuliner, dan pusat kota.
          </p>
          <div className="distances">
            <span>
              <b>± 2 menit</b> Apotek & Supermarket
            </span>
            <span>
              <b>± 3 menit</b> Sentra Kuliner Timur Tengah
            </span>
            <span>
              <b>± 4 menit</b> RS Al-Irsyad Surabaya
            </span>
            <span>
              <b>± 5 menit</b> Wisata Religi Sunan Ampel
            </span>
            <span>
              <b>± 10 menit</b> PT. PAL Indonesia
            </span>
            <span>
              <b>± 15–20 menit</b> Pelabuhan Perak & Stasiun Gubeng/Pasar Turi
            </span>
          </div>
          <a
            className="text-link"
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
          >
            Buka Navigasi di Google Maps <Icon name="arrow" />
          </a>
        </div>
      </section>

      {/* Tata Tertib & FAQ */}
      <section id="aturan" className="section rules">
        <div>
          <div className="section-intro">
            <p className="eyebrow">TATA TERTIB</p>
            <h2>Kenyamanan bersama dimulai dari saling menghargai.</h2>
            <p>
              Ketentuan ringkas untuk menjaga lingkungan tinggal tetap tertib, aman, dan menyenangkan bagi seluruh penghuni.
            </p>
          </div>

          <div className="accordion" style={{ marginTop: "36px" }}>
            {RULES_DATA.map(([title, points], index) => (
              <div className="rule" key={title as string}>
                <button
                  onClick={() => setOpenRule(openRule === index ? null : index)}
                  aria-expanded={openRule === index}
                >
                  <span>0{index + 1}</span>
                  <b>{title as string}</b>
                  <i>{openRule === index ? "−" : "+"}</i>
                </button>
                {openRule === index && (
                  <ul>
                    {(points as string[]).map((point) => (
                      <li key={point}>
                        <Icon name="check" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pertanyaan Umum FAQ */}
        <div className="faq-wrap">
          <p className="eyebrow">TANYA JAWAB</p>
          <h3 className="faq-title">Pertanyaan yang Sering Diajukan (FAQ)</h3>
          <div className="faq-grid">
            {FAQ_DATA.map((item) => (
              <div className="faq-item" key={item.q}>
                <h4>{item.q}</h4>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div>
          <p className="eyebrow">SIAP MENEMPATI?</p>
          <h2>Jadwalkan kunjungan Anda sekarang.</h2>
          <p>
            Hubungi kami untuk memeriksa ketersediaan terkini, berkonsultasi, atau menjadwalkan survei kamar langsung di lokasi.
          </p>
        </div>
        <a
          className="button button-dark"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
        >
          Chat via WhatsApp <Icon name="arrow" />
        </a>
      </section>

      {/* Floating WhatsApp CTA */}
      <a
        className="floating-wa"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        title="Hubungi Pengelola via WhatsApp"
        aria-label="Hubungi Pengelola via WhatsApp"
      >
        <Icon name="whatsapp" />
        <span>Tanya Ketersediaan</span>
      </a>

      {/* Footer */}
      <footer>
        <div className="footer-brand-wrap">
          <a className="brand" href="#beranda">
            <span>DL</span>
            <i>De Luxe Kost</i>
          </a>
          <p>© {new Date().getFullYear()} De Luxe Kost Ampel — Surabaya. Hunian nyaman & tenang.</p>
        </div>
        <div className="footer-admin-wrap">
          <a href="/admin" className="admin-footer-btn" title="Masuk ke panel pengelola">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Panel Admin</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
