"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type AlquilerDetalle = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_final: number;
  herramientas: {
    nombre: string;
    fotos: { url: string; es_principal: boolean }[];
    users: { nombre: string; apellidos: string; ciudad: string | null } | null;
  } | null;
};

export default function PagoExitoso() {
  const [alquiler, setAlquiler] = useState<AlquilerDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarUltimoAlquiler() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Esperar un momento para que el webhook procese el pago
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch("/api/alquileres/mis-alquileres", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      // Buscar el alquiler más reciente en estado activo
      const activo = (data.alquileres ?? []).find((a: any) => a.estado === "activo");
      setAlquiler(activo ?? null);
      setLoading(false);
    }
    cargarUltimoAlquiler();
  }, []);

  const foto = alquiler?.herramientas?.fotos?.find((f) => f.es_principal)?.url
    ?? alquiler?.herramientas?.fotos?.[0]?.url;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Icono éxito */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago completado!</h1>
          <p className="text-gray-500 text-sm mt-1">Tu alquiler está activo. Ya puedes coordinarte con el propietario.</p>
        </div>

        {/* Tarjeta del alquiler */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ) : alquiler ? (
            <>
              {/* Foto */}
              {foto && (
                <div className="relative w-full h-48">
                  <Image src={foto} alt={alquiler.herramientas?.nombre ?? ""} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow">
                    {alquiler.herramientas?.nombre}
                  </span>
                </div>
              )}

              {/* Detalles */}
              <div className="p-5 space-y-3">
                {!foto && (
                  <h2 className="font-bold text-gray-900 text-lg">{alquiler.herramientas?.nombre}</h2>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Fecha inicio</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(alquiler.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Fecha fin</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(alquiler.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Duración</p>
                    <p className="text-sm font-semibold text-gray-800">{alquiler.dias} día{alquiler.dias !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 mb-0.5">Total pagado</p>
                    <p className="text-sm font-bold text-green-700">{Number(alquiler.precio_final).toFixed(2)} €</p>
                  </div>
                </div>

                {/* Propietario */}
                {alquiler.herramientas?.users && (
                  <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {alquiler.herramientas.users.nombre[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Propietario</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {alquiler.herramientas.users.nombre} {alquiler.herramientas.users.apellidos}
                      </p>
                      {alquiler.herramientas.users.ciudad && (
                        <p className="text-xs text-gray-500">{alquiler.herramientas.users.ciudad}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aviso coordinación */}
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                  <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-xs text-blue-700">Recibirás una notificación con los detalles de recogida. Puedes ver el estado de tu alquiler en cualquier momento.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 text-sm">Tu pago se ha procesado correctamente.</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <Link
            href="/mis-alquileres"
            className="block w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl text-center transition-colors"
          >
            Ver mis alquileres
          </Link>
          <Link
            href="/herramientas"
            className="block w-full bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-center hover:bg-gray-50 transition-colors"
          >
            Seguir explorando herramientas
          </Link>
        </div>

      </div>
    </div>
  );
}
