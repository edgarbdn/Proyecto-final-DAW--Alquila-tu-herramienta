"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Image from "next/image";

type Props = {
  alquiler_id: string;
  destinatario_id: string;
  destinatario_nombre: string;
  destinatario_avatar: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ModalValoracion({
  alquiler_id,
  destinatario_id,
  destinatario_nombre,
  destinatario_avatar,
  onClose,
  onSuccess,
}: Props) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (nota === 0) { setError("Selecciona una puntuación"); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/valoraciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ alquiler_id, destinatario_id, nota, comentario }),
    });

    const data = await res.json();
    if (!res.ok) setError(data.error);
    else onSuccess();
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Dejar valoración">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Dejar valoración</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Destinatario */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#F97316] overflow-hidden flex items-center justify-center text-white font-bold text-lg shrink-0">
            {destinatario_avatar ? (
              <Image src={destinatario_avatar} alt="" width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              destinatario_nombre[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400">Valorando a</p>
            <p className="font-bold text-gray-900">{destinatario_nombre}</p>
          </div>
        </div>

        {/* Estrellas */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Puntuación</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setNota(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
                aria-label={`Puntuar con ${i} estrella${i !== 1 ? "s" : ""}`}
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    i <= (hover || nota) ? "text-yellow-400" : "text-gray-200"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {nota > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][nota]}
            </p>
          )}
        </div>

        {/* Comentario */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Comentario <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder="Cuéntanos tu experiencia..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors resize-none placeholder-gray-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || nota === 0}
          className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar valoración"}
        </button>
      </div>
    </div>
  );
}
