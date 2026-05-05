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
  cliente: { nombre: string; apellidos: string } | null;
  herramientas: { nombre: string } | null;
};

export default function SolicitudesPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
      if (session?.user) loadSolicitudes();
    });
  }, []);

  async function loadSolicitudes() {
    setLoading(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/alquileres/solicitudes", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      setError("Error al cargar las solicitudes");
    } else {
      setAlquileres(data.alquileres ?? []);
    }

    setLoading(false);
  }

  async function handleAccion(id: string, estado: "confirmado" | "cancelado") {
    if (!token) return;

    const res = await fetch(`/api/alquileres/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    // Recargar
    setAlquileres((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Solicitudes de alquiler
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : alquileres.length === 0 ? (
        <p className="text-gray-500">No tienes solicitudes pendientes.</p>
      ) : (
        <div className="space-y-4">
          {alquileres.map((a) => (
            <div
              key={a.id}
              className="border rounded-lg p-5 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {a.herramientas?.nombre}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliente:{" "}
                    {a.cliente
                      ? `${a.cliente.nombre} ${a.cliente.apellidos}`
                      : "Desconocido"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(a.fecha_inicio).toLocaleDateString("es-ES")} →{" "}
                    {new Date(a.fecha_fin).toLocaleDateString("es-ES")} (
                    {a.dias} días)
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    {a.precio_final}€
                  </p>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleAccion(a.id, "confirmado")}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-semibold"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleAccion(a.id, "cancelado")}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
