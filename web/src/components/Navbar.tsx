"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [nombre, setNombre] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const { data } = await supabase
        .from("users")
        .select("nombre")
        .eq("id", user.id)
        .single();
      if (data) setNombre(data.nombre);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
        if (!session) setNombre(null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-blue-600 text-lg">
        Alquila tu herramienta
      </Link>

      <div className="flex items-center gap-4">
        {loggedIn ? (
          <>
            <Link
              href="/herramientas"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Herramientas
            </Link>
            <Link
              href="/herramientas/nueva"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Publicar
            </Link>
            <Link
              href="/alquileres/solicitudes"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Solicitudes
            </Link>
            <Link
              href="/alquileres/mis-alquileres"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Mis alquileres
            </Link>
            <Link
              href="/pagos"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Pagos
            </Link>
            <NotificationBell />
            <Link
              href="/perfil"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {nombre ?? "Perfil"}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Salir
            </button>
          </>
        ) : (
          <>
            <Link
              href="/herramientas"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Herramientas
            </Link>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
