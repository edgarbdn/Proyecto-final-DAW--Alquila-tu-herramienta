"use client";

import { createClient } from "@/lib/supabase";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return <button onClick={handleLogout}>Cerrar sesión</button>;
}
