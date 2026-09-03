/**
 * Konfigurasi kontak & lokasi De Luxe Kost Ampel.
 * Ubah nomor di sini jika nomor pengelola berubah.
 * Format WA: angka internasional tanpa tanda + atau spasi (contoh: 6281234567890).
 */
export const WHATSAPP_NUMBER = "6280000000000";
export const WHATSAPP_DISPLAY = "+62 800-0000-0000";

export function getWhatsAppUrl(message?: string): string {
  if (!message) {
    const defaultMsg = encodeURIComponent(
      "Halo Pengelola De Luxe Kost Ampel, saya ingin menanyakan info ketersediaan kamar dan jadwal survei lokasi."
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${defaultMsg}`;
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppRoomUrl(roomName: string, roomType: string): string {
  const message = `Halo Pengelola De Luxe Kost Ampel, saya melihat di website bahwa ${roomName} (${roomType}) sedang kosong. Apakah saya bisa menjadwalkan survei / booking kamar ini?`;
  return getWhatsAppUrl(message);
}

export function getWhatsAppTypeUrl(type: "Besar" | "Kecil", price: string): string {
  const message = `Halo Pengelola De Luxe Kost Ampel, saya berminat dengan Kamar Tipe ${type} (${price}/bulan). Mohon informasi ketersediaan dan detailnya.`;
  return getWhatsAppUrl(message);
}

export const WHATSAPP_URL = getWhatsAppUrl();
export const MAPS_URL = "https://maps.app.goo.gl/NGjMNn99Qe835QKg8";
export const MAPS_EMBED_URL = "https://www.google.com/maps?q=-7.2281099,112.7414796&z=16&output=embed";
