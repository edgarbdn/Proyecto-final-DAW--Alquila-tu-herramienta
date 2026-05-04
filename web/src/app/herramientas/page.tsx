"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Foto {
  url: string;
  es_principal: boolean;
}

interface Vendedor {
  nombre: string;
  apellidos: string;
  ciudad: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Herramienta {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia: number;
  precio_dia_publico: number;
  vendedor: Vendedor | null;
  categoria: Categoria;
  fotos: Foto[];
}

interface CategoriaFiltro {
  id: string;
  nombre: string;
}

export default function CatalogoPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [pagina, setPagina] = useState(1);
  const [ciudades, setCiudades] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((data) => setCategorias(data.categorias));

    fetch("/api/ciudades")
      .then((r) => r.json())
      .then((data) => setCiudades(data.ciudades));
  }, []);

  useEffect(() => {
    cargarHerramientas();
  }, [pagina]);

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

  function handleBuscar() {
    setPagina(1);
    cargarHerramientas();
  }

  function getFotoPrincipal(fotos: Foto[]) {
    return fotos.find((f) => f.es_principal)?.url ?? fotos[0]?.url ?? null;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Catálogo de herramientas</h1>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Precio mín. (€/día)"
          value={precioMin}
          onChange={(e) => setPrecioMin(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Precio máx. (€/día)"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleBuscar}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        Buscar
      </button>

      {/* Resultados */}
      {loading ? (
        <p>Cargando...</p>
      ) : herramientas.length === 0 ? (
        <p>No se han encontrado herramientas.</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {total} herramientas encontradas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {herramientas.map((h) => {
              const foto = getFotoPrincipal(h.fotos);
              return (
                <Link
                  key={h.id}
                  href={`/herramientas/${h.id}`}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div className="h-48 bg-gray-100 relative">
                    {foto ? (
                      <Image
                        src={foto}
                        alt={h.nombre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      {h.categoria.nombre}
                    </p>
                    <h2 className="font-semibold text-gray-800">{h.nombre}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {h.descripcion}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-blue-600 font-bold">
                        {h.precio_dia_publico}€/día
                      </span>
                      {h.vendedor?.ciudad && (
                        <span className="text-xs text-gray-400">
                          {h.vendedor.ciudad}
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
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
