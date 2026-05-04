"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Foto {
  id: string;
  url: string;
  es_principal: boolean;
  orden: number;
}

interface Vendedor {
  id: string;
  nombre: string;
  apellidos: string;
  ciudad: string | null;
  direccion_publica: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Valoracion {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  autor: { nombre: string; apellidos: string } | null;
}

interface Herramienta {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia: number;
  precio_dia_publico: number;
  disponible: boolean;
  vendedor: Vendedor | null;
  categoria: Categoria;
  fotos: Foto[];
  valoraciones: Valoracion[];
}

export default function DetalleHerramientaPage() {
  const { id } = useParams<{ id: string }>();
  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoActiva, setFotoActiva] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/herramientas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setHerramienta(data);
        setFotoActiva(data.fotos?.[0]?.url ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-8">Cargando...</p>;
  if (!herramienta) return <p className="p-8">Herramienta no encontrada.</p>;

  const mediaNota =
    herramienta.valoraciones.length > 0
      ? (
          herramienta.valoraciones.reduce((acc, v) => acc + v.nota, 0) /
          herramienta.valoraciones.length
        ).toFixed(1)
      : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/herramientas"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <div>
          <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden mb-3">
            {fotoActiva ? (
              <Image
                src={fotoActiva}
                alt={herramienta.nombre}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sin foto
              </div>
            )}
          </div>
          {herramienta.fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {herramienta.fotos.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFotoActiva(f.url)}
                  className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 ${
                    fotoActiva === f.url
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <Image src={f.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-400 mb-1">
            {herramienta.categoria.nombre}
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {herramienta.nombre}
          </h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            {herramienta.precio_dia_publico}€/día
          </p>
          <p className="text-gray-600 mb-6">{herramienta.descripcion}</p>

          {/* Vendedor */}
          {herramienta.vendedor && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-2">Vendedor</h2>
              <p className="text-gray-800">
                {herramienta.vendedor.nombre} {herramienta.vendedor.apellidos}
              </p>
              {herramienta.vendedor.ciudad && (
                <p className="text-sm text-gray-500">
                  {herramienta.vendedor.ciudad}
                </p>
              )}
              {herramienta.vendedor.direccion_publica && (
                <p className="text-sm text-gray-500">
                  {herramienta.vendedor.direccion_publica}
                </p>
              )}
              {mediaNota && (
                <p className="text-sm text-yellow-500 mt-1">
                  ★ {mediaNota} / 5
                </p>
              )}
            </div>
          )}

          {/* Botón alquiler */}
          {herramienta.disponible ? (
            <button
              disabled
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold opacity-50 cursor-not-allowed"
            >
              Alquilar (próximamente)
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              No disponible
            </button>
          )}
        </div>
      </div>

      {/* Valoraciones */}
      {herramienta.valoraciones.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Valoraciones del vendedor</h2>
          <div className="space-y-4">
            {herramienta.valoraciones.map((v) => (
              <div key={v.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-700">
                    {v.autor
                      ? `${v.autor.nombre} ${v.autor.apellidos}`
                      : "Usuario"}
                  </p>
                  <p className="text-yellow-500">
                    {"★".repeat(v.nota)}
                    {"☆".repeat(5 - v.nota)}
                  </p>
                </div>
                {v.comentario && (
                  <p className="text-sm text-gray-600">{v.comentario}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(v.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
