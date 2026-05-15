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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadHerramientas(session.access_token);
    });
  }, []);

  async function loadHerramientas(token: string) {
    setLoading(true);
    const res = await fetch("/api/admin/herramientas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setHerramientas(data.herramientas ?? []);
    else setError(data.error);
    setLoading(false);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Herramientas</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Precio/día</th>
                <th className="px-4 py-3">Disponible</th>
                <th className="px-4 py-3">Publicada</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-700">
              {herramientas.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{h.nombre}</td>
                  <td className="px-4 py-3">
                    {h.users ? `${h.users.nombre} ${h.users.apellidos}` : "—"}
                  </td>
                  <td className="px-4 py-3">{h.precio_dia}€</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        h.disponible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {h.disponible ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(h.created_at).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
