"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Pago = {
  id: string;
  importe: number;
  estado: string;
  metodo: string | null;
  transaccion_id: string | null;
  created_at: string;
  alquileres: {
    id: string;
    precio_final: number;
    dias: number;
    herramientas: { nombre: string } | null;
    users: { nombre: string; apellidos: string } | null;
  } | null;
};

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente:   { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pendiente" },
  completado:  { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  label: "Completado" },
  fallido:     { bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-500",    label: "Fallido" },
  reembolsado: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", label: "Reembolsado" },
};

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadPagos(session.access_token);
    });
  }, []);

  async function loadPagos(token: string) {
    setLoading(true);
    const res = await fetch("/api/admin/pagos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setPagos(data.pagos ?? []);
    else setError(data.error);
    setLoading(false);
  }

  const totalCompletado = pagos
    .filter((p) => p.estado === "completado")
    .reduce((sum, p) => sum + Number(p.importe), 0);

  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de todos los pagos procesados</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total pagos", value: pagos.length, color: "text-gray-900" },
          { label: "Completados", value: pagos.filter((p) => p.estado === "completado").length, color: "text-green-600" },
          { label: "Pendientes", value: pagos.filter((p) => p.estado === "pendiente").length, color: "text-yellow-600" },
          { label: "Volumen total", value: `${totalCompletado.toFixed(2)}€`, color: "text-[#F97316]" },
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Importe</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map((p) => {
                  const estilo = ESTADO_STYLES[p.estado] ?? ESTADO_STYLES.pendiente;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {p.alquileres?.herramientas?.nombre ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {p.alquileres?.users
                          ? `${p.alquileres.users.nombre} ${p.alquileres.users.apellidos}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {Number(p.importe).toFixed(2)}€
                      </td>
                      <td className="px-5 py-4 text-gray-500 capitalize">
                        {p.metodo ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${estilo.bg} ${estilo.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estilo.dot}`} />
                          {estilo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(p.created_at).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-12">No hay pagos registrados</p>
          )}
        </div>
      )}
    </div>
  );
}
