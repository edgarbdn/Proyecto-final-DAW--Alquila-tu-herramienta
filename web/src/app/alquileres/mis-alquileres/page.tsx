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
  herramientas: { nombre: string; id: string; vendedor_id: string } | null;
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
  const [valorandoId, setValorandoId] = useState<string | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [valorados, setValorados] = useState<Set<string>>(new Set());

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
        herramientas(id, nombre, vendedor_id)
      `,
      )
      .eq("cliente_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Error al cargar los alquileres");
    } else {
      setAlquileres(data ?? []);

      // Comprobar cuáles ya han sido valorados
      const finalizados = (data ?? [])
        .filter((a) => a.estado === "finalizado")
        .map((a) => a.id);

      if (finalizados.length > 0) {
        const { data: vals } = await supabase
          .from("valoraciones")
          .select("alquiler_id")
          .eq("autor_id", user.id)
          .in("alquiler_id", finalizados);

        if (vals) {
          setValorados(new Set(vals.map((v) => v.alquiler_id)));
        }
      }
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

  async function handleValorar(alquiler: Alquiler) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const vendedorId = (
      alquiler.herramientas as unknown as { vendedor_id: string }
    )?.vendedor_id;

    const res = await fetch("/api/valoraciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        alquiler_id: alquiler.id,
        destinatario_id: vendedorId,
        nota,
        comentario,
      }),
    });

    if (res.ok) {
      setValorados((prev) => new Set([...prev, alquiler.id]));
      setValorandoId(null);
      setNota(5);
      setComentario("");
    } else {
      const data = await res.json();
      setError(data.error);
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

              {a.estado === "finalizado" && !valorados.has(a.id) && (
                <>
                  {valorandoId === a.id ? (
                    <div className="mt-4 border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Valorar al vendedor
                      </p>
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setNota(n)}
                            className={`text-2xl ${n <= nota ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Escribe un comentario (opcional)"
                        className="w-full border rounded p-2 text-sm text-gray-700 mb-3"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValorar(a)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
                        >
                          Enviar valoración
                        </button>
                        <button
                          onClick={() => setValorandoId(null)}
                          className="text-gray-500 text-sm hover:text-gray-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setValorandoId(a.id)}
                      className="mt-3 border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 text-sm font-semibold"
                    >
                      Valorar
                    </button>
                  )}
                </>
              )}

              {a.estado === "finalizado" && valorados.has(a.id) && (
                <p className="mt-3 text-sm text-green-600 font-medium">
                  Gracias por tu valoración!
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
