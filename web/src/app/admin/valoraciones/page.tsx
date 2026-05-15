"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Valoracion = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  autor: { nombre: string; apellidos: string } | null;
  destinatario: { nombre: string; apellidos: string } | null;
  alquileres: { herramientas: { nombre: string } | null } | null;
};

function Estrellas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= nota ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminValoracionesPage() {
  const [valoraciones, setValoraciones] = useState<Valoracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadValoraciones(session.access_token);
      }
    });
  }, []);

  async function loadValoraciones(t: string) {
    setLoading(true);
    const res = await fetch("/api/admin/valoraciones", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setValoraciones(data.valoraciones ?? []);
    else setError(data.error);
    setLoading(false);
  }

  async function handleEliminar(id: string) {
    if (!token) return;
    setEliminando(id);
    const res = await fetch("/api/admin/valoraciones", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setValoraciones((prev) => prev.filter((v) => v.id !== id));
    }
    setEliminando(null);
  }

  const mediaNotas = valoraciones.length
    ? (valoraciones.reduce((sum, v) => sum + v.nota, 0) / valoraciones.length).toFixed(1)
    : "—";

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Valoraciones</h1>
        <p className="text-sm text-gray-500 mt-1">Reseñas entre usuarios de la plataforma</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total valoraciones", value: valoraciones.length, color: "text-gray-900" },
          { label: "Nota media", value: mediaNotas, color: "text-yellow-500" },
          { label: "Valoraciones 5★", value: valoraciones.filter((v) => v.nota === 5).length, color: "text-green-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Autor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Destinatario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Herramienta</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nota</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comentario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {valoraciones.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {v.autor ? `${v.autor.nombre} ${v.autor.apellidos}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {v.destinatario ? `${v.destinatario.nombre} ${v.destinatario.apellidos}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {v.alquileres?.herramientas?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Estrellas nota={v.nota} />
                    </td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs truncate">
                      {v.comentario ?? <span className="text-gray-300 italic">Sin comentario</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(v.created_at).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleEliminar(v.id)}
                        disabled={eliminando === v.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {eliminando === v.id ? "..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {valoraciones.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No hay valoraciones registradas</p>
          )}
        </div>
      )}
    </div>
  );
}
