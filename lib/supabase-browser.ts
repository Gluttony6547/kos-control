import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function subscribeToRoomChanges(onChange: () => void): (() => void) | null {
  if (!url || !key) return null;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const channel = supabase
    .channel("rooms-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
