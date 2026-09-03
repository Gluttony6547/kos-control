import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "deluxe_admin";

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "deluxe-kost-default-secret";
}

function token() {
  return crypto.createHmac("sha256", secret()).update("deluxe-admin-session").digest("hex");
}

export function verifyPassword(password: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin";
  if (!password || typeof password !== "string") return false;
  // Constant time comparison
  const inputBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expectedPassword);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE)?.value === token();
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days session
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

