"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

type Mensaje = {
  id: string;
  contenido: string;
  leido: boolean;
  created_at: string;
  de_usuario_id: string;
  para_usuario_id: string;
  de_usuario: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
  para_usuario: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
};

type Conversacion = {
  herramienta_id: string;
  herramienta: { id: string; nombre: string; fotos: { url: string; es_principal: boolean }[] } | null;
  interlocutor_id: string;
  interlocutor: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
  ultimo_mensaje: string;
  ultimo_mensaje_at: string;
  no_leidos: number;
};

export default function ChatPanel() {
  const [abierto, setAbierto] = useState(false);
  const [vista, setVista] = useState<"lista" | "chat">("lista");
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [convActiva, setConvActiva] = useState<Conversacion | null>(null);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const tokenRef = useRef<string | null>(null);
  const usuarioIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setLoggedIn(true);
      setToken(session.access_token);
      setUsuarioId(session.user.id);
      tokenRef.current = session.access_token;
      usuarioIdRef.current = session.user.id;
      cargarConversaciones(session.access_token);
    });

    supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
      if (!session) {
        setToken(null);
        setUsuarioId(null);
        setConversaciones([]);
        setTotalNoLeidos(0);
        tokenRef.current = null;
        usuarioIdRef.current = null;
      }
    });

    // Escuchar evento para abrir chat desde página de herramienta
    async function handleAbrirChat(e: Event) {
      const { herramienta_id, usuario_id } = (e as CustomEvent).detail;
      const tok = tokenRef.current;
      const uid = usuarioIdRef.current;
      if (!tok || !uid) return;

      // Cargar info del interlocutor y herramienta en paralelo ANTES de mostrar el chat
      const [resU, resH] = await Promise.all([
        fetch(`/api/usuarios/${usuario_id}`),
        fetch(`/api/herramientas/${herramienta_id}`),
      ]);
      const [dataU, dataH] = await Promise.all([resU.json(), resH.json()]);

      setConvActiva({
        herramienta_id,
        herramienta: dataH && !dataH.error ? dataH : null,
        interlocutor_id: usuario_id,
        interlocutor: dataU?.usuario ?? null,
        ultimo_mensaje: "",
        ultimo_mensaje_at: new Date().toISOString(),
        no_leidos: 0,
      });
      setAbierto(true);
      setVista("chat");
      setMensajes([]);

      // Cargar mensajes
      const res = await fetch(
        `/api/mensajes?herramienta_id=${herramienta_id}&con_usuario=${usuario_id}`,
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      const data = await res.json();
      setMensajes(data.mensajes ?? []);

      // Marcar como leídos
      fetch("/api/mensajes/leidos", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
        body: JSON.stringify({ herramienta_id, de_usuario_id: usuario_id }),
      });

      // Realtime
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      }
      const channel = supabase.channel(`chat-panel-${herramienta_id}-${uid}-${Math.random()}`);
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: `herramienta_id=eq.${herramienta_id}` },
        (payload: any) => {
          const nuevo = payload.new as Mensaje;
          if (
            (nuevo.de_usuario_id === uid && nuevo.para_usuario_id === usuario_id) ||
            (nuevo.de_usuario_id === usuario_id && nuevo.para_usuario_id === uid)
          ) {
            setMensajes((prev) => [...prev, nuevo]);
            if (nuevo.para_usuario_id === uid && tokenRef.current) {
              fetch("/api/mensajes/leidos", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json" },
                body: JSON.stringify({ herramienta_id, de_usuario_id: usuario_id }),
              });
            }
          }
        }
      );
      channel.subscribe();
      channelRef.current = channel;
    }

    window.addEventListener("abrirChat", handleAbrirChat);
    return () => window.removeEventListener("abrirChat", handleAbrirChat);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [abierto]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function cargarConversaciones(tok: string) {
    const res = await fetch("/api/mensajes/conversaciones", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    const convs = data.conversaciones ?? [];
    setConversaciones(convs);
    setTotalNoLeidos(convs.reduce((acc: number, c: Conversacion) => acc + c.no_leidos, 0));
  }

  async function abrirConversacion(conv: Conversacion) {
    const tok = tokenRef.current;
    const uid = usuarioIdRef.current;
    if (!tok || !uid) return;

    // Cargar datos del interlocutor ANTES de mostrar el chat
    if (!conv.interlocutor) {
      const resU = await fetch(`/api/usuarios/${conv.interlocutor_id}`);
      const dataU = await resU.json();
      if (dataU?.usuario) {
        conv = { ...conv, interlocutor: dataU.usuario };
      }
    }

    setConvActiva(conv);
    setVista("chat");
    setMensajes([]);

    // Cargar mensajes
    const res = await fetch(
      `/api/mensajes?herramienta_id=${conv.herramienta_id}&con_usuario=${conv.interlocutor_id}`,
      { headers: { Authorization: `Bearer ${tok}` } }
    );
    const data = await res.json();
    setMensajes(data.mensajes ?? []);

    await fetch("/api/mensajes/leidos", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ herramienta_id: conv.herramienta_id, de_usuario_id: conv.interlocutor_id }),
    });

    setConversaciones((prev) =>
      prev.map((c) =>
        c.herramienta_id === conv.herramienta_id && c.interlocutor_id === conv.interlocutor_id
          ? { ...c, no_leidos: 0 }
          : c
      )
    );
    setTotalNoLeidos((prev) => Math.max(0, prev - conv.no_leidos));

    const supabase = createClient();
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase.channel(`chat-conv-${conv.herramienta_id}-${uid}-${Math.random()}`);
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensajes", filter: `herramienta_id=eq.${conv.herramienta_id}` },
      (payload: any) => {
        const nuevo = payload.new as Mensaje;
        if (
          (nuevo.de_usuario_id === uid && nuevo.para_usuario_id === conv.interlocutor_id) ||
          (nuevo.de_usuario_id === conv.interlocutor_id && nuevo.para_usuario_id === uid)
        ) {
          setMensajes((prev) => [...prev, nuevo]);
          if (nuevo.para_usuario_id === uid && tokenRef.current) {
            fetch("/api/mensajes/leidos", {
              method: "PATCH",
              headers: { Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json" },
              body: JSON.stringify({ herramienta_id: conv.herramienta_id, de_usuario_id: conv.interlocutor_id }),
            });
          }
        }
      }
    );
    channel.subscribe();
    channelRef.current = channel;
  }

  async function handleEnviar() {
    const tok = tokenRef.current;
    if (!contenido.trim() || !tok || !convActiva || enviando) return;
    setEnviando(true);
    await fetch("/api/mensajes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        para_usuario_id: convActiva.interlocutor_id,
        herramienta_id: convActiva.herramienta_id,
        contenido,
      }),
    });
    setContenido("");
    setEnviando(false);
    cargarConversaciones(tok);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
  }

  if (!loggedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={panelRef}>

      {/* Panel — se abre hacia arriba */}
      {abierto && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: "520px" }}>

          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            {vista === "chat" && (
              <button onClick={() => setVista("lista")} className="text-gray-400 hover:text-[#F97316] transition-colors mr-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              {vista === "lista" ? (
                <p className="font-bold text-gray-900">Mensajes</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {convActiva?.interlocutor?.avatar_url ? (
                      <Image src={convActiva.interlocutor.avatar_url} alt="Avatar" width={28} height={28} className="object-cover w-full h-full" />
                    ) : convActiva?.interlocutor?.nombre?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {convActiva?.interlocutor ? `${convActiva.interlocutor.nombre} ${convActiva.interlocutor.apellidos}` : "Propietario"}
                    </p>
                    <p className="text-xs text-[#F97316] truncate">{convActiva?.herramienta?.nombre ?? "Herramienta"}</p>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido */}
          {vista === "lista" ? (
            <div className="overflow-y-auto flex-1">
              {conversaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <p className="text-sm text-gray-400">No tienes mensajes todavía</p>
                  <p className="text-xs text-gray-300 mt-1">Contacta con un vendedor desde la página de una herramienta</p>
                </div>
              ) : (
                conversaciones.map((conv) => {
                  const fotoHerramienta = conv.herramienta?.fotos?.find((f) => f.es_principal)?.url ?? conv.herramienta?.fotos?.[0]?.url;
                  return (
                    <button
                      key={`${conv.herramienta_id}-${conv.interlocutor_id}`}
                      onClick={() => abrirConversacion(conv)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      {/* Foto herramienta */}
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                        {fotoHerramienta ? (
                          <Image src={fotoHerramienta} alt={conv.herramienta?.nombre ?? ""} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {conv.interlocutor?.nombre} {conv.interlocutor?.apellidos}
                          </p>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">
                            {new Date(conv.ultimo_mensaje_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-0.5">{conv.herramienta?.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">{conv.ultimo_mensaje}</p>
                      </div>

                      {/* Badge no leídos */}
                      {conv.no_leidos > 0 && (
                        <span className="w-5 h-5 bg-[#F97316] text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                          {conv.no_leidos}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <p className="text-sm text-gray-400">Sé el primero en escribir</p>
                  </div>
                ) : mensajes.map((msg) => {
                  const esMio = msg.de_usuario_id === usuarioIdRef.current;
                  return (
                    <div key={msg.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        esMio ? "bg-[#F97316] text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <p>{msg.contenido}</p>
                        <p className={`text-[10px] mt-0.5 ${esMio ? "text-orange-100" : "text-gray-400"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {esMio && <span className="ml-1">{msg.leido ? "✓✓" : "✓"}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-end gap-2 p-3 border-t border-gray-100 shrink-0">
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  maxLength={1000}
                  className="flex-1 resize-none text-sm text-gray-700 outline-none placeholder-gray-400 bg-gray-50 rounded-xl px-3 py-2 max-h-24 leading-relaxed"
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = "auto";
                    t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
                  }}
                />
                <button
                  onClick={handleEnviar}
                  disabled={!contenido.trim() || enviando}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white p-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  {enviando ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => { setAbierto((v) => !v); if (!abierto) setVista("lista"); }}
        className="relative w-14 h-14 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="Mensajes"
      >
        {abierto ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
        {!abierto && totalNoLeidos > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalNoLeidos > 9 ? "9+" : totalNoLeidos}
          </span>
        )}
      </button>
    </div>
  );
}
