"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type Herramienta = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia: number;
  disponible: boolean;
  categoria: { nombre: string } | { nombre: string }[];
  fotos: { url: string; es_principal: boolean }[];
};

export default function MisHerramientasPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => { loadHerramientas(); }, []);

  async function loadHerramientas() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("herramientas")
      .select("id, nombre, descripcion, precio_dia, disponible, categoria:categorias(nombre), fotos(url, es_principal)")
      .eq("vendedor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) setError("Error al cargar las herramientas");
    else setHerramientas(data ?? []);
    setLoading(false);
  }

  async function toggleDisponible(h: Herramienta) {
    setToggling(h.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("herramientas")
      .update({ disponible: !h.disponible })
      .eq("id", h.id);

    if (error) setError("Error al actualizar la herramienta");
    else setHerramientas((prev) => prev.map((item) => item.id === h.id ? { ...item, disponible: !item.disponible } : item));
    setToggling(null);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta herramienta?")) return;
    setEliminando(id);
    const supabase = createClient();
    const { error } = await supabase.from("herramientas").delete().eq("id", id);
    if (error) setError("Error al eliminar la herramienta");
    else setHerramientas((prev) => prev.filter((h) => h.id !== id));
    setEliminando(null);
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis herramientas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{herramientas.length} herramienta{herramientas.length !== 1 ? "s" : ""} publicada{herramientas.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/herramientas/nueva"
          className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Publicar
        </Link>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : herramientas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Aún no tienes herramientas publicadas</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Publica tu primera herramienta y empieza a ganar dinero con lo que ya tienes en casa.</p>
          <Link
            href="/herramientas/nueva"
            className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Publicar mi primera herramienta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {herramientas.map((h) => {
            const foto = h.fotos.find((f) => f.es_principal)?.url ?? h.fotos[0]?.url;
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {/* Foto */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                  {foto ? (
                    <Image src={foto} alt={h.nombre} fill className="object-cover" />
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
                    href={`/herramientas/${h.id}`}
                    className="block font-semibold text-gray-900 truncate hover:text-[#F97316] transition-colors">
                    {h.nombre}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{Array.isArray(h.categoria) ? h.categoria[0]?.nombre : h.categoria?.nombre} · {h.precio_dia}€/día</p>
                </div>

                {/* Estado */}
                <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                  h.disponible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${h.disponible ? "bg-green-500" : "bg-red-500"}`} />
                  {h.disponible ? "Activa" : "Inactiva"}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/herramientas/${h.id}/editar`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                    </svg>
                    <span className="hidden sm:inline">Editar</span>
                  </Link>
                  <button
                    onClick={() => toggleDisponible(h)}
                    disabled={toggling === h.id}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      h.disponible
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {toggling === h.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : h.disponible ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{toggling === h.id ? "" : h.disponible ? "Desactivar" : "Activar"}</span>
                  </button>
                  <button
                    onClick={() => handleEliminar(h.id)}
                    disabled={eliminando === h.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {eliminando === h.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{eliminando === h.id ? "" : "Eliminar"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
