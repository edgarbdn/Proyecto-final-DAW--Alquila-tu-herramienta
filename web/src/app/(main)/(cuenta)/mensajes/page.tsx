"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

type Conversacion = {
  herramienta_id: string;
  herramienta: {
    id: string;
    nombre: string;
    fotos: { url: string; es_principal: boolean }[];
  } | null;
  interlocutor_id: string;
  interlocutor: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
  ultimo_mensaje: string;
  ultimo_mensaje_at: string;
  no_leidos: number;
};

export default function MensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setToken(session.access_token);
      cargarConversaciones(session.access_token);
    });
  }, []);

  async function cargarConversaciones(tok: string) {
    setLoading(true);
    const res = await fetch("/api/mensajes/conversaciones", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setConversaciones(data.conversaciones ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus conversaciones con vendedores y compradores</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : conversaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No tienes conversaciones todavía</p>
          <p className="text-gray-400 text-xs mt-1">Contacta con un vendedor desde la página de una herramienta</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversaciones.map((conv) => {
            const foto = conv.herramienta?.fotos?.find((f) => f.es_principal)?.url ?? conv.herramienta?.fotos?.[0]?.url;
            return (
              <Link
                key={`${conv.herramienta_id}-${conv.interlocutor_id}`}
                href={`/mensajes/${conv.herramienta_id}/${conv.interlocutor_id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#F97316] transition-colors"
              >
                {/* Avatar interlocutor */}
                <div className="w-12 h-12 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                  {conv.interlocutor?.avatar_url ? (
                    <Image src={conv.interlocutor.avatar_url} alt="Avatar" width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    conv.interlocutor?.nombre[0]?.toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-gray-900 truncate">
                      {conv.interlocutor?.nombre} {conv.interlocutor?.apellidos}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(conv.ultimo_mensaje_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.herramienta?.nombre}</p>
                  <p className="text-sm text-gray-400 truncate mt-0.5">{conv.ultimo_mensaje}</p>
                </div>

                {/* Badge no leídos */}
                {conv.no_leidos > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#F97316] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{conv.no_leidos}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
