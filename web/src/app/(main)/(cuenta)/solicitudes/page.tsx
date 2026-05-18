"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import ModalValoracion from "@/components/ModalValoracion";

type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_final: number;
  estado: string;
  created_at: string;
  ya_valorado: boolean;
  horarios_recogida: { hora: string } | null;
  herramientas: { id: string; nombre: string; fotos: { url: string; es_principal: boolean }[] } | null;
  users: { id: string; nombre: string; apellidos: string; avatar_url: string | null; ciudad: string | null } | null;
};

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente:  { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pendiente" },
  confirmado: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Confirmado" },
  activo:     { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  label: "Activo" },
  finalizado: { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400",   label: "Finalizado" },
  cancelado:  { bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-500",    label: "Cancelado" },
};

export default function SolicitudesPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [gestionando, setGestionando] = useState<string | null>(null);
  const [modalValoracion, setModalValoracion] = useState<Alquiler | null>(null);
  const [yaValorados, setYaValorados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<string>("todos");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadAlquileres(session.access_token);
      }
    });
  }, []);

  async function loadAlquileres(t: string) {
    setLoading(true);
    const res = await fetch("/api/alquileres/recibidos", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setAlquileres(data.alquileres ?? []);
    else setError(data.error);
    setLoading(false);
  }

  async function handleAccion(alquiler_id: string, estado: "confirmado" | "cancelado") {
    if (!token) return;
    setGestionando(alquiler_id);
    const res = await fetch("/api/alquileres/recibidos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alquiler_id, estado }),
    });
    if (res.ok) {
      setAlquileres((prev) => prev.map((a) => a.id === alquiler_id ? { ...a, estado } : a));
    }
    setGestionando(null);
  }

  const filtrados = filtro === "todos" ? alquileres : alquileres.filter((a) => a.estado === filtro);
  const pendientes = alquileres.filter((a) => a.estado === "pendiente").length;

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes recibidas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {pendientes > 0 ? `${pendientes} solicitud${pendientes !== 1 ? "es" : ""} pendiente${pendientes !== 1 ? "s" : ""}` : "Sin solicitudes pendientes"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {["todos", "pendiente", "confirmado", "cancelado", "finalizado"].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === estado
                ? "bg-[#F97316] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#F97316] hover:text-[#F97316]"
            }`}
          >
            {estado === "todos" ? "Todos" : ESTADO_STYLES[estado]?.label}
            {estado === "pendiente" && pendientes > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5">{pendientes}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">No tienes solicitudes{filtro !== "todos" ? " en este estado" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((a) => {
            const estilo = ESTADO_STYLES[a.estado] ?? ESTADO_STYLES.finalizado;
            const foto = a.herramientas?.fotos?.find((f) => f.es_principal)?.url ?? a.herramientas?.fotos?.[0]?.url;
            return (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                a.estado === "pendiente" ? "border-yellow-300" : "border-gray-100"
              }`}>
                <div className="p-4 flex items-start gap-4">
                  {/* Foto herramienta */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    {foto ? (
                      <Image src={foto} alt={a.herramientas?.nombre ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/herramientas/${a.herramientas?.id}`} className="font-semibold text-gray-900 hover:text-[#F97316] transition-colors truncate">
                        {a.herramientas?.nombre ?? "—"}
                      </Link>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                        {estilo.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      <p className="text-xs text-gray-500">{new Date(a.fecha_inicio).toLocaleDateString("es-ES")} → {new Date(a.fecha_fin).toLocaleDateString("es-ES")} ({a.dias}d)</p>
                      {a.horarios_recogida?.hora && <p className="text-xs text-gray-500">Recogida: <span className="font-semibold">{a.horarios_recogida.hora}</span></p>}
                      <p className="text-xs text-gray-500">Total: <span className="font-semibold text-gray-700">{Number(a.precio_final).toFixed(2)}€</span></p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 shrink-0">
                    {a.estado === "pendiente" && (
                      <>
                        <button onClick={() => handleAccion(a.id, "confirmado")} disabled={gestionando === a.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                          {gestionando === a.id ? "..." : "Confirmar"}
                        </button>
                        <button onClick={() => handleAccion(a.id, "cancelado")} disabled={gestionando === a.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                          {gestionando === a.id ? "..." : "Rechazar"}
                        </button>
                      </>
                    )}
                    {a.estado === "finalizado" && !a.ya_valorado && !yaValorados.has(a.id) && a.users && (
                      <button onClick={() => setModalValoracion(a)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] hover:bg-orange-100 transition-colors shrink-0">
                        Valorar
                      </button>
                    )}
                  </div>
                </div>

                {/* Perfil cliente — destacado en pendientes */}
                {a.users && (
                  <div className={`px-4 py-3 border-t flex items-center gap-3 ${
                    a.estado === "pendiente" ? "bg-yellow-50 border-yellow-100" : "bg-gray-50 border-gray-100"
                  }`}>
                    <Link href={`/usuario/${a.users.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-[#F97316] overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {a.users.avatar_url ? (
                          <Image src={a.users.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          a.users.nombre[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#F97316] hover:underline">{a.users.nombre} {a.users.apellidos}</p>
                        {a.users.ciudad && <p className="text-xs text-gray-400">{a.users.ciudad}</p>}
                      </div>
                    </Link>
                    {a.estado === "pendiente" && (
                      <span className="ml-auto text-xs text-yellow-600 font-medium">Ver perfil antes de confirmar →</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal valoración */}
      {modalValoracion && modalValoracion.users && (
        <ModalValoracion
          alquiler_id={modalValoracion.id}
          destinatario_id={modalValoracion.users.id ?? ""}
          destinatario_nombre={`${modalValoracion.users.nombre} ${modalValoracion.users.apellidos}`}
          destinatario_avatar={modalValoracion.users.avatar_url}
          onClose={() => setModalValoracion(null)}
          onSuccess={() => {
            setYaValorados((prev) => new Set(prev).add(modalValoracion.id));
            setModalValoracion(null);
          }}
        />
      )}
    </div>
  );
}
