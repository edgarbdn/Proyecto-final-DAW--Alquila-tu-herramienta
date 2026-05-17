"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  herramientas: {
    id: string;
    nombre: string;
    fotos: { url: string; es_principal: boolean }[];
    users: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
  } | null;
};

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente:  { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pendiente" },
  confirmado: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Confirmado" },
  activo:     { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  label: "Activo" },
  finalizado: { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400",   label: "Finalizado" },
  cancelado:  { bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-500",    label: "Cancelado" },
};

export default function MisAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const [token, setToken] = useState<string | null>(null);
  const [pagando, setPagando] = useState<string | null>(null);
  const [modalValoracion, setModalValoracion] = useState<Alquiler | null>(null);
  const [yaValorados, setYaValorados] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const pagoEstado = searchParams.get("pago");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadAlquileres();
      }
    });
  }, []);

  async function loadAlquileres() {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/alquileres/mis-alquileres", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (res.ok) setAlquileres(data.alquileres ?? []);
    else setError("Error al cargar los alquileres");
    setLoading(false);
  }

  async function handlePagar(alquiler_id: string) {
    if (!token) return;
    setPagando(alquiler_id);
    const res = await fetch("/api/pagos/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alquiler_id }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { setError(data.error); setPagando(null); }
  }

  const filtrados = filtro === "todos"
    ? alquileres
    : alquileres.filter((a) => a.estado === filtro);

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis alquileres</h1>
        <p className="text-sm text-gray-500 mt-0.5">{alquileres.length} alquiler{alquileres.length !== 1 ? "es" : ""} en total</p>
      </div>

      {/* Mensaje pago */}
      {pagoEstado === "exitoso" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <p className="text-green-700 font-semibold text-sm">✓ Pago completado correctamente. ¡Disfruta del alquiler!</p>
        </div>
      )}
      {pagoEstado === "cancelado" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-red-600 font-semibold text-sm">El pago fue cancelado. Puedes intentarlo de nuevo.</p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {["todos", "pendiente", "confirmado", "activo", "finalizado", "cancelado"].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filtro === estado
                ? "bg-[#F97316] text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#F97316] hover:text-[#F97316]"
            }`}
          >
            {estado === "todos" ? "Todos" : ESTADO_STYLES[estado]?.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">
            {filtro === "todos" ? "No tienes alquileres todavía" : `No tienes alquileres ${ESTADO_STYLES[filtro]?.label.toLowerCase()}s`}
          </p>
          <Link
            href="/herramientas"
            className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Ver herramientas disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((a) => {
            const estilo = ESTADO_STYLES[a.estado] ?? ESTADO_STYLES.finalizado;
            const foto = a.herramientas?.fotos?.find((f) => f.es_principal)?.url ?? a.herramientas?.fotos?.[0]?.url;
            return (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                a.estado === "confirmado" ? "border-blue-300" : "border-gray-100"
              }`}>
                <div className={`p-4 flex items-center gap-4 ${
                  a.estado === "confirmado" ? "bg-blue-50" : ""
                }`}>
                  {/* Foto */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                    {foto ? (
                      <Image src={foto} alt={a.herramientas?.nombre ?? ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/herramientas/${a.herramientas?.id}`}
                      className="font-semibold text-gray-900 truncate hover:text-[#F97316] transition-colors block"
                    >
                      {a.herramientas?.nombre ?? "—"}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.fecha_inicio).toLocaleDateString("es-ES")} → {new Date(a.fecha_fin).toLocaleDateString("es-ES")} · {a.dias}d · {Number(a.precio_final).toFixed(2)}€
                    </p>
                    {a.herramientas?.users && (
                      <p className="text-xs text-gray-400">
                        Propietario: {a.herramientas.users.nombre} {a.herramientas.users.apellidos}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${estilo.bg} ${estilo.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                    {estilo.label}
                  </span>
                </div>

                {/* Botón pagar — solo confirmados */}
                {a.estado === "confirmado" && (
                  <button
                    onClick={() => handlePagar(a.id)}
                    disabled={pagando === a.id}
                    className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {pagando === a.id ? (
                      "Redirigiendo a Stripe..."
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        Completar pago — {Number(a.precio_final).toFixed(2)}€
                      </>
                    )}
                  </button>
                )}

                {/* Botón valorar — solo finalizados y no valorados */}
                {a.estado === "finalizado" && !a.ya_valorado && !yaValorados.has(a.id) && a.herramientas?.users && (
                  <button
                    onClick={() => setModalValoracion(a)}
                    className="w-full border-t border-gray-100 py-2.5 text-sm font-semibold text-[#F97316] hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Valorar a {a.herramientas.users.nombre}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal valoración */}
      {modalValoracion && modalValoracion.herramientas?.users && (
        <ModalValoracion
          alquiler_id={modalValoracion.id}
          destinatario_id={modalValoracion.herramientas.users.id}
          destinatario_nombre={`${modalValoracion.herramientas.users.nombre} ${modalValoracion.herramientas.users.apellidos}`}
          destinatario_avatar={modalValoracion.herramientas.users.avatar_url}
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
