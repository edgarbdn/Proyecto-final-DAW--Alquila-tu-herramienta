"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Conversacion = {
  herramienta_id: string;
  herramienta: { id: string; nombre: string } | null;
  usuario1_id: string;
  usuario1: { id: string; nombre: string; apellidos: string } | null;
  usuario2_id: string;
  usuario2: { id: string; nombre: string; apellidos: string } | null;
  ultimo_mensaje: string;
  ultimo_mensaje_at: string;
  total_mensajes: number;
};

type Mensaje = {
  id: string;
  contenido: string;
  leido: boolean;
  created_at: string;
  de_usuario_id: string;
  de_usuario: { id: string; nombre: string; apellidos: string } | null;
};

export default function AdminMensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [convActiva, setConvActiva] = useState<Conversacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

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
    const res = await fetch("/api/admin/mensajes", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setConversaciones(data.conversaciones ?? []);
    setLoading(false);
  }

  async function abrirConversacion(conv: Conversacion) {
    if (!token) return;
    setConvActiva(conv);
    setLoadingMensajes(true);
    const res = await fetch(
      `/api/admin/mensajes?herramienta_id=${conv.herramienta_id}&usuario1=${conv.usuario1_id}&usuario2=${conv.usuario2_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setMensajes(data.mensajes ?? []);
    setLoadingMensajes(false);
  }

  const filtradas = conversaciones.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.herramienta?.nombre.toLowerCase().includes(q) ||
      `${c.usuario1?.nombre} ${c.usuario1?.apellidos}`.toLowerCase().includes(q) ||
      `${c.usuario2?.nombre} ${c.usuario2?.apellidos}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Moderación de conversaciones entre usuarios</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">

        {/* Lista conversaciones */}
        <div className="w-96 shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por usuario o herramienta..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F97316] transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtradas.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">No hay conversaciones</p>
              </div>
            ) : (
              filtradas.map((conv) => {
                const key = `${conv.herramienta_id}-${conv.usuario1_id}-${conv.usuario2_id}`;
                const activa = convActiva?.herramienta_id === conv.herramienta_id &&
                  convActiva?.usuario1_id === conv.usuario1_id;
                return (
                  <button
                    key={key}
                    onClick={() => abrirConversacion(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activa ? "bg-orange-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[#F97316] truncate">{conv.herramienta?.nombre}</p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {new Date(conv.ultimo_mensaje_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {conv.usuario1?.nombre} {conv.usuario1?.apellidos}
                      <span className="text-gray-400 font-normal"> — </span>
                      {conv.usuario2?.nombre} {conv.usuario2?.apellidos}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-400 truncate">{conv.ultimo_mensaje}</p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{conv.total_mensajes} msg</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversación */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {!convActiva ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <p className="text-sm text-gray-400">Selecciona una conversación para verla</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cabecera */}
              <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {convActiva.usuario1?.nombre} {convActiva.usuario1?.apellidos}
                      <span className="text-gray-400 font-normal mx-2">↔</span>
                      {convActiva.usuario2?.nombre} {convActiva.usuario2?.apellidos}
                    </p>
                    <p className="text-sm text-[#F97316]">{convActiva.herramienta?.nombre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {mensajes.length} mensajes
                    </span>
                    <span className="text-xs bg-orange-50 text-[#F97316] px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Solo lectura
                    </span>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingMensajes ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className="h-10 w-48 bg-gray-100 rounded-2xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  mensajes.map((msg) => {
                    const esUsuario1 = msg.de_usuario_id === convActiva.usuario1_id;
                    return (
                      <div key={msg.id} className={`flex gap-3 ${esUsuario1 ? "justify-start" : "justify-end"}`}>
                        {esUsuario1 && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 mt-1">
                            {convActiva.usuario1?.nombre[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[65%] ${esUsuario1 ? "" : "items-end"} flex flex-col gap-1`}>
                          <p className="text-[10px] text-gray-400 font-medium px-1">
                            {msg.de_usuario?.nombre} {msg.de_usuario?.apellidos}
                          </p>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            esUsuario1
                              ? "bg-blue-50 text-gray-800 rounded-bl-sm"
                              : "bg-orange-50 text-gray-800 rounded-br-sm"
                          }`}>
                            <p>{msg.contenido}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 px-1">
                            {new Date(msg.created_at).toLocaleString("es-ES", {
                              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                            })}
                            {msg.leido && <span className="ml-1 text-green-500">✓ Leído</span>}
                          </p>
                        </div>
                        {!esUsuario1 && (
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[#F97316] text-xs font-bold shrink-0 mt-1">
                            {convActiva.usuario2?.nombre[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Aviso solo lectura */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 shrink-0">
                <p className="text-xs text-gray-400 text-center">
                  Vista de moderación — solo lectura. Los mensajes no pueden ser modificados desde el panel de administración.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
