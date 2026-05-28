"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Mensaje = {
  id: string;
  contenido: string;
  leido: boolean;
  created_at: string;
  de_usuario_id: string;
  para_usuario_id: string;
  de_usuario: { id: string; nombre: string; apellidos: string; avatar_url: string | null } | null;
};

type Herramienta = {
  id: string;
  nombre: string;
  fotos: { url: string; es_principal: boolean }[];
};

export default function ConversacionPage() {
  const { herramienta_id, usuario_id } = useParams<{ herramienta_id: string; usuario_id: string }>();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [interlocutor, setInterlocutor] = useState<{ nombre: string; apellidos: string; avatar_url: string | null } | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setToken(session.access_token);
      setUsuarioId(session.user.id);
      await cargarMensajes(session.access_token);

      // Marcar como leídos
      await fetch("/api/mensajes/leidos", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ herramienta_id, de_usuario_id: usuario_id }),
      });

      // Realtime
      channel = supabase.channel(`chat-${herramienta_id}-${session.user.id}-${Math.random()}`);
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `herramienta_id=eq.${herramienta_id}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje;
          // Solo añadir si es de esta conversación
          if (
            (nuevo.de_usuario_id === session.user.id && nuevo.para_usuario_id === usuario_id) ||
            (nuevo.de_usuario_id === usuario_id && nuevo.para_usuario_id === session.user.id)
          ) {
            setMensajes((prev) => [...prev, nuevo]);
            // Marcar como leído si lo recibimos nosotros
            if (nuevo.para_usuario_id === session.user.id) {
              fetch("/api/mensajes/leidos", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ herramienta_id, de_usuario_id: usuario_id }),
              });
            }
          }
        }
      );
      channel.subscribe();
    }

    init();
    return () => { if (channel) { channel.unsubscribe(); supabase.removeChannel(channel); } };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  async function cargarMensajes(tok: string) {
    setLoading(true);
    const res = await fetch(`/api/mensajes?herramienta_id=${herramienta_id}&con_usuario=${usuario_id}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    const data = await res.json();
    setMensajes(data.mensajes ?? []);

    // Cargar info herramienta e interlocutor
    const resH = await fetch(`/api/herramientas/${herramienta_id}`);
    const dataH = await resH.json();
    setHerramienta(dataH ?? null);

    // Interlocutor viene en el primer mensaje
    if (data.mensajes?.length > 0) {
      const msg = data.mensajes[0];
      const inter = msg.de_usuario_id === usuario_id ? msg.de_usuario : msg.para_usuario;
      setInterlocutor(inter);
    }

    setLoading(false);
  }

  async function handleEnviar() {
    if (!contenido.trim() || !token || enviando) return;
    setEnviando(true);
    await fetch("/api/mensajes", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ para_usuario_id: usuario_id, herramienta_id, contenido }),
    });
    setContenido("");
    setEnviando(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }

  const fotoPrincipal = herramienta?.fotos?.find((f) => f.es_principal)?.url ?? herramienta?.fotos?.[0]?.url;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Cabecera */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 shrink-0">
        <Link href="/mensajes" className="text-gray-400 hover:text-[#F97316] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>

        {interlocutor && (
          <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
            {interlocutor.avatar_url ? (
              <Image src={interlocutor.avatar_url} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
            ) : (
              interlocutor.nombre[0]?.toUpperCase()
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {interlocutor && (
            <p className="font-semibold text-gray-900 truncate">{interlocutor.nombre} {interlocutor.apellidos}</p>
          )}
          {herramienta && (
            <Link href={`/herramientas/${herramienta_id}`} className="text-xs text-[#F97316] hover:underline truncate block">
              {herramienta.nombre}
            </Link>
          )}
        </div>

        {fotoPrincipal && (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <Image src={fotoPrincipal} alt="Herramienta" fill className="object-cover" />
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="h-12 w-48 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400 text-sm">No hay mensajes todavía</p>
              <p className="text-gray-400 text-xs mt-1">Sé el primero en escribir</p>
            </div>
          </div>
        ) : (
          mensajes.map((msg) => {
            const esMio = msg.de_usuario_id === usuarioId;
            return (
              <div key={msg.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  esMio
                    ? "bg-[#F97316] text-white rounded-br-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                }`}>
                  <p>{msg.contenido}</p>
                  <p className={`text-xs mt-1 ${esMio ? "text-orange-100" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    {esMio && (
                      <span className="ml-1">{msg.leido ? "✓✓" : "✓"}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input mensaje */}
      <div className="flex items-end gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mt-4 shrink-0">
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={1}
          maxLength={1000}
          className="flex-1 resize-none text-sm text-gray-700 outline-none placeholder-gray-400 max-h-32 leading-relaxed"
          style={{ height: "auto" }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = `${t.scrollHeight}px`;
          }}
        />
        <button
          onClick={handleEnviar}
          disabled={!contenido.trim() || enviando}
          className="bg-[#F97316] hover:bg-[#EA580C] text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          {enviando ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
