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

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente:  { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pendiente" },
  confirmado: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Confirmado" },
  activo:     { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  label: "Activo" },
  finalizado: { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400",   label: "Finalizado" },
  cancelado:  { bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-500",    label: "Cancelado" },
};

export default function AdminAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alquileres</h1>
        <p className="text-sm text-gray-500 mt-1">Listado de todos los alquileres de la plataforma</p>
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Herramienta</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fechas</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Días</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alquileres.map((a) => {
                  const estilo = ESTADO_STYLES[a.estado] ?? ESTADO_STYLES.finalizado;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">{a.herramientas?.nombre ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {a.users ? `${a.users.nombre} ${a.users.apellidos}` : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(a.fecha_inicio).toLocaleDateString("es-ES")} → {new Date(a.fecha_fin).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{a.dias}d</td>
                      <td className="px-5 py-4 font-bold text-gray-900">{Number(a.precio_final).toFixed(2)}€</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${estilo.bg} ${estilo.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                          {estilo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {alquileres.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No hay alquileres registrados</p>
          )}
        </div>
      )}
    </div>
  );
}
