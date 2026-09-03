import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  const authenticated = await isAdmin();
  if (authenticated) {
    redirect("/admin/dashboard");
  } else {
    redirect("/admin/login");
  }
}
