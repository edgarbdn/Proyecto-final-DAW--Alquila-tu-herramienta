"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Herramienta = {
  id: string;
  nombre: string;
  precio_dia: number;
  disponible: boolean;
  created_at: string;
  users: { nombre: string; apellidos: string } | null;
};

export default function AdminHerramientasPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        loadHerramientas(session.access_token);
      }
    });
  }, []);

  async function loadHerramientas(t: string) {
    setLoading(true);
    const res = await fetch("/api/admin/herramientas", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) setHerramientas(data.herramientas ?? []);
    else setError(data.error);
    setLoading(false);
  }

  async function toggleDisponible(h: Herramienta) {
    if (!token) return;
    setToggling(h.id);
    const res = await fetch("/api/admin/herramientas", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ herramienta_id: h.id, disponible: !h.disponible }),
    });
    if (res.ok) {
      setHerramientas((prev) =>
        prev.map((item) =>
          item.id === h.id ? { ...item, disponible: !item.disponible } : item
        )
      );
    }
    setToggling(null);
  }

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Herramientas</h1>
        <p className="text-sm text-gray-500 mt-1">Listado y gestión de herramientas publicadas</p>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio/día</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Publicada</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {herramientas.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{h.nombre}</td>
                    <td className="px-5 py-4 text-gray-500">
                      {h.users ? `${h.users.nombre} ${h.users.apellidos}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-semibold">{h.precio_dia}€</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        h.disponible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${h.disponible ? "bg-green-500" : "bg-red-500"}`} />
                        {h.disponible ? "Activa" : "Bloqueada"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(h.created_at).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleDisponible(h)}
                        disabled={toggling === h.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          h.disponible
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {toggling === h.id
                          ? "..."
                          : h.disponible
                          ? "Bloquear"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {herramientas.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No hay herramientas publicadas</p>
          )}
        </div>
      )}
    </div>
  );
}
