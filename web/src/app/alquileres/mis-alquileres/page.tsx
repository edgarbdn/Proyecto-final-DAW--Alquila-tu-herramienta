"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_final: number;
  estado: string;
  herramientas: { nombre: string; id: string } | null;
};

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-500",
  activo: "bg-blue-100 text-blue-700",
  finalizado: "bg-gray-100 text-gray-500",
};

export default function MisAlquileresPage() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAlquileres();
  }, []);

  async function loadAlquileres() {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("alquileres")
      .select(
        `
        id, fecha_inicio, fecha_fin, dias, precio_final, estado,
        herramientas(id, nombre)
      `,
      )
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Error al cargar los alquileres");
    } else {
      setAlquileres(data ?? []);
    }

    setLoading(false);
  }

  async function handlePagar(alquilerId: string) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch("/api/pagos/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ alquiler_id: alquilerId }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis alquileres</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : alquileres.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes alquileres todavía.</p>
          <Link
            href="/herramientas"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ver herramientas disponibles
          </Link>
        </div>
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
                    {a.herramientas?.nombre ?? "Herramienta"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(a.fecha_inicio).toLocaleDateString("es-ES")} →{" "}
                    {new Date(a.fecha_fin).toLocaleDateString("es-ES")} (
                    {a.dias} días)
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    {a.precio_final}€
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${estadoStyles[a.estado] ?? "bg-gray-100 text-gray-500"}`}
                >
                  {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                </span>
              </div>
              {a.herramientas?.id && (
                <Link
                  href={`/herramientas/${a.herramientas.id}`}
                  className="text-sm text-blue-600 hover:underline mt-3 block"
                >
                  Ver herramienta →
                </Link>
              )}

              {a.estado === "confirmado" && (
                <button
                  onClick={() => handlePagar(a.id)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
                >
                  Pagar ahora
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
