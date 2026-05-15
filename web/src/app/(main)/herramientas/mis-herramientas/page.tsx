"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

type Herramienta = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia: number;
  disponible: boolean;
  categoria: {
    nombre: string;
  };
  fotos: {
    url: string;
    es_principal: boolean;
  }[];
};

export default function MisHerramientasPage() {
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHerramientas();
  }, []);

  async function loadHerramientas() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("herramientas")
      .select(
        `
        id, nombre, descripcion, precio_dia, disponible,
        categoria:categorias(nombre),
        fotos(url, es_principal)
      `,
      )
      .eq("vendedor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Error al cargar las herramientas");
      return;
    }

    setHerramientas(data ?? []);
  }

  async function toggleDisponible(herramienta: Herramienta) {
    const supabase = createClient();
    const { error } = await supabase
      .from("herramientas")
      .update({ disponible: !herramienta.disponible })
      .eq("id", herramienta.id);

    if (error) {
      setError("Error al actualizar la herramienta");
      return;
    }

    loadHerramientas();
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta herramienta?"))
      return;

    const supabase = createClient();
    const { error } = await supabase.from("herramientas").delete().eq("id", id);

    if (error) {
      setError("Error al eliminar la herramienta");
      return;
    }

    loadHerramientas();
  }

  return (
    <div>
      <h1>Mis herramientas</h1>
      <Link href="/herramientas/nueva">+ Publicar herramienta</Link>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {herramientas.length === 0 ? (
        <p>No tienes herramientas publicadas todavía.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio/día</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {herramientas.map((h) => {
              const fotoPrincipal = h.fotos.find((f) => f.es_principal);
              return (
                <tr key={h.id}>
                  <td>
                    {fotoPrincipal && (
                      <img
                        src={fotoPrincipal.url}
                        alt={h.nombre}
                        width={60}
                        height={60}
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td>{h.nombre}</td>
                  <td>{h.categoria?.nombre}</td>
                  <td>{h.precio_dia}€</td>
                  <td>{h.disponible ? "Disponible" : "No disponible"}</td>
                  <td>
                    <Link href={`/herramientas/${h.id}/editar`}>Editar</Link>
                    <button onClick={() => toggleDisponible(h)}>
                      {h.disponible ? "Desactivar" : "Activar"}
                    </button>
                    <button onClick={() => handleEliminar(h.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
