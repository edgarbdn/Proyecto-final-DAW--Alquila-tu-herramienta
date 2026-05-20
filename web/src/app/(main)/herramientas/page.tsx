"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Foto { url: string; es_principal: boolean; }
interface Vendedor { nombre: string; apellidos: string; ciudad: string | null; }
interface Categoria { id: string; nombre: string; }
interface Herramienta {
  id: string; nombre: string; descripcion: string;
  precio_dia: number; precio_dia_publico: number;
  vendedor: Vendedor | null; categoria: Categoria; fotos: Foto[];
}
interface CategoriaFiltro { id: string; nombre: string; }

function CatalogoContent() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const searchParams = useSearchParams();
  const [nombre, setNombre] = useState(searchParams.get("q") ?? searchParams.get("nombre") ?? "");
  const [categoria, setCategoria] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [pagina, setPagina] = useState(1);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then((data) => setCategorias(data.categorias));
    fetch("/api/ciudades").then((r) => r.json()).then((data) => setCiudades(data.ciudades));
  }, []);

  useEffect(() => {
    setNombre(searchParams.get("q") ?? searchParams.get("nombre") ?? "");
  }, [searchParams]);

  useEffect(() => { cargarHerramientas(); }, [pagina, nombre]);

  async function cargarHerramientas() {
    setLoading(true);
    const params = new URLSearchParams();
    if (nombre) params.set("nombre", nombre);
    if (categoria) params.set("categoria", categoria);
    if (ciudad) params.set("ciudad", ciudad);
    if (precioMin) params.set("precio_min", precioMin);
    if (precioMax) params.set("precio_max", precioMax);
    params.set("pagina", pagina.toString());
    const res = await fetch(`/api/herramientas?${params.toString()}`);
    const data = await res.json();
    setHerramientas(data.herramientas ?? []);
    setTotal(data.total ?? 0);
    setTotalPaginas(data.totalPaginas ?? 1);
    setLoading(false);
  }

  function handleBuscar() { setPagina(1); cargarHerramientas(); }

  function handleLimpiar() {
    setNombre(""); setCategoria(""); setCiudad(""); setPrecioMin(""); setPrecioMax("");
    setPagina(1);
    setTimeout(() => cargarHerramientas(), 0);
  }

  function getFotoPrincipal(fotos: Foto[]) {
    return fotos.find((f) => f.es_principal)?.url ?? fotos[0]?.url ?? null;
  }

  const hayFiltros = nombre || categoria || ciudad || precioMin || precioMax;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1320px] mx-auto px-4 py-8">

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Herramientas disponibles</h1>
            {!loading && <p className="text-sm text-gray-500 mt-0.5">{total} resultado{total !== 1 ? "s" : ""}</p>}
          </div>
          <button
            onClick={() => setFiltrosAbiertos((v) => !v)}
            className="sm:hidden inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium px-4 py-2 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filtros {hayFiltros && <span className="w-2 h-2 rounded-full bg-[#F97316]" />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filtros */}
          <aside className={`w-full lg:w-56 shrink-0 ${filtrosAbiertos ? "block" : "hidden"} lg:block`}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold text-gray-900">Filtros</h2>

              {/* Nombre */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Nombre</label>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors bg-white"
                >
                  <option value="">Todas</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Ciudad */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Ciudad</label>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors bg-white"
                >
                  <option value="">Todas</option>
                  {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Precio por día (€)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    min="0"
                    value={precioMin}
                    onChange={(e) => setPrecioMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    min="0"
                    value={precioMax}
                    onChange={(e) => setPrecioMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleBuscar}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Aplicar filtros
                </button>
                {hayFiltros && (
                  <button
                    onClick={handleLimpiar}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Grid herramientas */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : herramientas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <p className="text-gray-400 text-sm mb-3">No se han encontrado herramientas</p>
                {hayFiltros && (
                  <button onClick={handleLimpiar} className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {herramientas.map((h) => {
                    const foto = getFotoPrincipal(h.fotos);
                    return (
                      <Link key={h.id} href={`/herramientas/${h.id}`}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="h-48 bg-gray-100 relative">
                          {foto ? (
                            <Image src={foto} alt={h.nombre} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">
                              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                              </svg>
                            </div>
                          )}
                          <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                            {h.categoria.nombre}
                          </span>
                        </div>
                        <div className="p-4">
                          <h2 className="font-semibold text-gray-900 truncate">{h.nombre}</h2>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{h.descripcion}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[#F97316] font-bold">
                              {h.precio_dia_publico}€<span className="text-xs font-normal text-gray-400">/día</span>
                            </span>
                            {h.vendedor?.ciudad && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                📍 {h.vendedor.ciudad}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:border-[#F97316] hover:text-[#F97316] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      {pagina} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-600 hover:border-[#F97316] hover:text-[#F97316] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FAFAFA]" />}>
      <CatalogoContent />
    </Suspense>
  );
}
