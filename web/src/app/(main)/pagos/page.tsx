"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Pago = {
  id: string;
  importe: number;
  estado: string;
  metodo: string;
  transaccion_id: string;
  created_at: string;
  alquileres: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
    comision_plataforma: number;
    herramientas: { nombre: string } | null;
  } | null;
};

export default function PagosPage() {
  const [pestana, setPestana] = useState<"pagos" | "ganancias">("pagos");
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [ganancias, setGanancias] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Pagos como cliente
    const resPagos = await fetch("/api/pagos/mis-pagos", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const pagosJson = await resPagos.json();
    const pagosData = pagosJson.pagos ?? [];

    // Ganancias como vendedor
    const resGanancias = await fetch("/api/pagos/ganancias", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const gananciasJson = await resGanancias.json();
    const gananciasData = gananciasJson.ganancias ?? [];

    setPagos((pagosData as unknown as Pago[]) ?? []);
    setGanancias(gananciasData);
    setLoading(false);
  }

  function calcularGanancia(pago: Pago) {
    const comision = pago.alquileres?.comision_plataforma ?? 0.2;
    return (pago.importe * (1 - comision)).toFixed(2);
  }

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const lista = pestana === "pagos" ? pagos : ganancias;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pagos</h1>

      {/* Pestañas */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setPestana("pagos")}
          className={`px-6 py-2 text-sm font-semibold border-b-2 transition-colors ${
            pestana === "pagos"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis pagos
        </button>
        <button
          onClick={() => setPestana("ganancias")}
          className={`px-6 py-2 text-sm font-semibold border-b-2 transition-colors ${
            pestana === "ganancias"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis ganancias
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="text-gray-500">
          {pestana === "pagos"
            ? "No tienes pagos registrados."
            : "No tienes ganancias registradas."}
        </p>
      ) : (
        <div className="space-y-4">
          {lista.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg p-5 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {p.alquileres?.herramientas?.nombre ?? "Herramienta"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.alquileres
                      ? `${formatFecha(p.alquileres.fecha_inicio)} → ${formatFecha(p.alquileres.fecha_fin)} (${p.alquileres.dias} días)`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(p.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ref: {p.transaccion_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {pestana === "pagos"
                      ? `${p.importe}€`
                      : `${calcularGanancia(p)}€`}
                  </p>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
