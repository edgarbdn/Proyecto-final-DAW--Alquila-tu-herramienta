"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_final: number;
  estado: string;
  created_at: string;
  herramientas: { nombre: string } | null;
  users: { nombre: string; apellidos: string } | null;
};

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-500",
  activo: "bg-blue-100 text-blue-700",
  finalizado: "bg-gray-100 text-gray-500",
};

export default function AdminAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadAlquileres(session.access_token);
    });
  }, []);

  async function loadAlquileres(token: string) {
    setLoading(true);
    const res = await fetch("/api/admin/alquileres", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setAlquileres(data.alquileres ?? []);
    else setError(data.error);
    setLoading(false);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Alquileres</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Herramienta</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Días</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-700">
              {alquileres.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{a.herramientas?.nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    {a.users ? `${a.users.nombre} ${a.users.apellidos}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(a.fecha_inicio).toLocaleDateString("es-ES")} →{" "}
                    {new Date(a.fecha_fin).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3">{a.dias}</td>
                  <td className="px-4 py-3 font-semibold">{a.precio_final}€</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        estadoStyles[a.estado] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                    </span>
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
