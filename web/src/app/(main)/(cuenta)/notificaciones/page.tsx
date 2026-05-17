"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas" | "leidas">("todas");
  const [token, setToken] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadNotificaciones(session.access_token);
      }
    });
  }, []);

  async function loadNotificaciones(t: string) {
    setLoading(true);
    const res = await fetch("/api/notificaciones", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setNotificaciones(data.notificaciones ?? []);
    setLoading(false);
  }

  async function marcarLeida(id: string) {
    if (!token) return;
    await fetch(`/api/notificaciones/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }

  async function marcarTodasLeidas() {
    if (!token) return;
    setMarcandoTodas(true);
    const noLeidas = notificaciones.filter((n) => !n.leida);
    await Promise.all(
      noLeidas.map((n) =>
        fetch(`/api/notificaciones/${n.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setMarcandoTodas(false);
  }

  const filtradas = notificaciones.filter((n) => {
    if (filtro === "no_leidas") return !n.leida;
    if (filtro === "leidas") return n.leida;
    return true;
  });

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">{noLeidas} sin leer</p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            disabled={marcandoTodas}
            className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors disabled:opacity-50"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { value: "todas", label: "Todas" },
          { value: "no_leidas", label: "No leídas" },
          { value: "leidas", label: "Leídas" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value as typeof filtro)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f.value
                ? "bg-[#F97316] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#F97316] hover:text-[#F97316]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No tienes notificaciones{filtro !== "todas" ? " en este filtro" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.leida && marcarLeida(n.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                n.leida
                  ? "border-gray-100 opacity-60"
                  : "border-[#F97316]/30 cursor-pointer hover:border-[#F97316] hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.leida ? "bg-gray-300" : "bg-[#F97316]"}`} />
                  <div>
                    <p className={`font-semibold text-sm ${n.leida ? "text-gray-500" : "text-gray-900"}`}>{n.titulo}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.mensaje}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {new Date(n.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {!n.leida && (
                <p className="text-xs text-[#F97316] mt-2 ml-5">Clic para marcar como leída</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
