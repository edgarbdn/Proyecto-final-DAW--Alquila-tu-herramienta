"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_final: number;
  estado: string;
  created_at: string;
  herramientas: {
    id: string;
    nombre: string;
    fotos: { url: string; es_principal: boolean }[];
    users: { nombre: string; apellidos: string } | null;
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

  useEffect(() => { loadAlquileres(); }, []);

  async function loadAlquileres() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("alquileres")
      .select(`
        id, fecha_inicio, fecha_fin, dias, precio_final, estado, created_at,
        herramientas(
          id, nombre,
          fotos(url, es_principal),
          users!herramientas_vendedor_id_fkey(nombre, apellidos)
        )
      `)
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false });

    if (error) setError("Error al cargar los alquileres");
    else setAlquileres(data ?? []);
    setLoading(false);
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
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
