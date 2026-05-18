"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Foto {
  url: string;
  es_principal: boolean;
}

interface Herramienta {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia_publico: number;
  vendedor: { nombre: string; apellidos: string; ciudad: string | null } | null;
  categoria: { id: string; nombre: string };
  fotos: Foto[];
}

function getFotoPrincipal(fotos: Foto[]) {
  return fotos.find((f) => f.es_principal)?.url ?? fotos[0]?.url ?? null;
}

export default function HerramientasDestacadas() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/herramientas?pagina=1&limite=100")
      .then((r) => r.json())
      .then((data) => {
        const todas = data.herramientas ?? [];
        const aleatorias = todas.sort(() => Math.random() - 0.5).slice(0, 3);
        setHerramientas(aleatorias);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="bg-[#FAFAFA] py-16 px-6">
        <div className="max-w-[1320px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Herramientas disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(3)].map((_, i) => (
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
        </div>
      </section>
    );
  }

  if (herramientas.length === 0) return null;

  return (
    <section className="bg-[#FAFAFA] py-16 px-6">
      <div className="max-w-[1320px] mx-auto">
        {/* Cabecera */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Herramientas disponibles
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Las más recientes cerca de ti
            </p>
          </div>
          <Link
            href="/herramientas"
            className="text-sm font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors whitespace-nowrap"
          >
            Ver todas →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {herramientas.map((h) => {
            const foto = getFotoPrincipal(h.fotos);
            return (
              <Link
                key={h.id}
                href={`/herramientas/${h.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Foto */}
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
                  {/* Badge categoría */}
                  <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {h.categoria.nombre}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{h.nombre}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{h.descripcion}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[#F97316] font-bold text-base">
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
      </div>
    </section>
  );
}
