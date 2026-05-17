"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  ciudad: string | null;
  direccion_publica: string | null;
  avatar_url: string | null;
};

type Herramienta = {
  id: string;
  nombre: string;
  precio_dia: number;
  precio_dia_publico: number;
  disponible: boolean;
  categorias: { nombre: string } | null;
  fotos: { url: string; es_principal: boolean }[];
};

type Valoracion = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  autor: { nombre: string; apellidos: string; avatar_url: string | null } | null;
};

function Estrellas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= nota ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PerfilPublicoPage() {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [mediaNota, setMediaNota] = useState<number | null>(null);
  const [totalValoraciones, setTotalValoraciones] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/usuarios/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setUsuario(data.usuario);
        setHerramientas(data.herramientas ?? []);
        setValoraciones(data.valoraciones ?? []);
        setMediaNota(data.mediaNota);
        setTotalValoraciones(data.totalValoraciones);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <main className="max-w-[1320px] mx-auto px-4 py-8 space-y-6">
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </main>
  );

  if (!usuario) return (
    <main className="max-w-[1320px] mx-auto px-4 py-8">
      <p className="text-gray-500">Usuario no encontrado.</p>
    </main>
  );

  return (
    <main className="max-w-[1320px] mx-auto px-4 py-8 space-y-8">

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-[#F97316] overflow-hidden flex items-center justify-center text-white font-bold text-3xl shrink-0">
          {usuario.avatar_url ? (
            <Image src={usuario.avatar_url} alt="" width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            usuario.nombre[0]?.toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{usuario.nombre} {usuario.apellidos}</h1>
          {usuario.ciudad && <p className="text-gray-500 mt-1">📍 {usuario.ciudad}</p>}
          {usuario.direccion_publica && <p className="text-sm text-gray-400 mt-0.5">{usuario.direccion_publica}</p>}

          {/* Puntuación */}
          <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
            {mediaNota ? (
              <>
                <Estrellas nota={Math.round(mediaNota)} />
                <span className="font-bold text-gray-900">{mediaNota}</span>
                <span className="text-sm text-gray-400">({totalValoraciones} valoraci{totalValoraciones !== 1 ? "ones" : "ón"})</span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Sin valoraciones todavía</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex sm:flex-col gap-6 sm:gap-3 text-center shrink-0">
          <div>
            <p className="text-2xl font-bold text-[#F97316]">{herramientas.length}</p>
            <p className="text-xs text-gray-400">Herramienta{herramientas.length !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F97316]">{totalValoraciones}</p>
            <p className="text-xs text-gray-400">Valoraci{totalValoraciones !== 1 ? "ones" : "ón"}</p>
          </div>
        </div>
      </div>

      {/* Herramientas */}
      {herramientas.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Herramientas disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {herramientas.map((h) => {
              const foto = h.fotos.find((f) => f.es_principal)?.url ?? h.fotos[0]?.url;
              return (
                <Link key={h.id} href={`/herramientas/${h.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="h-40 bg-gray-100 relative">
                    {foto ? (
                      <Image src={foto} alt={h.nombre} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                      {(h.categorias as any)?.nombre}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 truncate">{h.nombre}</p>
                    <p className="text-[#F97316] font-bold text-sm mt-1">{h.precio_dia_publico}€<span className="text-xs font-normal text-gray-400">/día</span></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Valoraciones */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Valoraciones
          {mediaNota && <span className="ml-2 text-[#F97316] font-normal text-base">★ {mediaNota}</span>}
        </h2>
        {valoraciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Este usuario aún no tiene valoraciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {valoraciones.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#F97316] overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {v.autor?.avatar_url ? (
                      <Image src={v.autor.avatar_url} alt="" width={32} height={32} className="object-cover w-full h-full" />
                    ) : (
                      v.autor?.nombre[0]?.toUpperCase() ?? "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {v.autor ? `${v.autor.nombre} ${v.autor.apellidos}` : "Usuario"}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                  <Estrellas nota={v.nota} />
                </div>
                {v.comentario && <p className="text-sm text-gray-600 leading-relaxed">{v.comentario}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
