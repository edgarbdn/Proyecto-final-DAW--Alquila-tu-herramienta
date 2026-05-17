"use client";

import { createClient } from "@/lib/supabase";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full border-2 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 font-semibold py-3 rounded-xl transition-colors duration-200"
    >
      Cerrar sesión
    </button>
  );
}
