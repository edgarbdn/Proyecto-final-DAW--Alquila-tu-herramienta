"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  enlace: string | null;
};

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setToken(session.access_token);
      loadNotificaciones(session.access_token);

      // Suscripción Realtime: escucha nuevas filas en notificaciones del usuario
      channel = supabase
        .channel("notificaciones-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificaciones",
            filter: `usuario_id=eq.${session.user.id}`,
          },
          (payload) => {
            const nueva = payload.new as Notificacion;
            if (!nueva.leida) {
              setNotificaciones((prev) => [nueva, ...prev]);
            }
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotificaciones(t: string) {
    const res = await fetch("/api/notificaciones", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setNotificaciones((data.notificaciones ?? []).filter((n: Notificacion) => !n.leida));
  }

  async function marcarLeida(id: string, enlace: string | null) {
    if (!token) return;
    await fetch(`/api/notificaciones/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    setOpen(false);
    if (enlace) router.push(enlace);
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
        aria-label="Ver notificaciones"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          </div>

          {notificaciones.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No tienes notificaciones
            </p>
          ) : (
            <ul role="list">
              {notificaciones.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => marcarLeida(n.id, n.enlace)}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                      n.leida ? "opacity-60" : "bg-blue-50"
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-800">
                      {n.titulo}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{n.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
