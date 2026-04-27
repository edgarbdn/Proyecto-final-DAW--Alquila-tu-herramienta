"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  activo: boolean;
};

const ICONOS_DISPONIBLES = [
  "Wrench",
  "Hammer",
  "Drill",
  "Scissors",
  "Paintbrush",
  "Zap",
  "Truck",
  "Shovel",
  "Axe",
  "Ruler",
  "Cog",
  "Lightbulb",
  "Flame",
  "Droplets",
  "TreePine",
];

function IconoPreview({ nombre }: { nombre: string }) {
  const Icon = Icons[nombre as keyof typeof Icons] as
    | React.ComponentType<LucideProps>
    | undefined;
  if (!Icon) return <span>?</span>;
  return <Icon size={24} />;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [icono, setIcono] = useState("Wrench");
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, descripcion, icono, activo")
      .order("nombre");

    if (error) {
      setError("Error al cargar las categorías");
      return;
    }

    setCategorias(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    if (editando) {
      const { error } = await supabase
        .from("categorias")
        .update({ nombre, descripcion, icono })
        .eq("id", editando.id);

      if (error) {
        setError("Error al actualizar la categoría");
      } else {
        setSuccess("Categoría actualizada correctamente");
        resetForm();
        loadCategorias();
      }
    } else {
      const { error } = await supabase
        .from("categorias")
        .insert({ nombre, descripcion, icono });

      if (error) {
        setError("Error al crear la categoría");
      } else {
        setSuccess("Categoría creada correctamente");
        resetForm();
        loadCategorias();
      }
    }

    setLoading(false);
  }

  async function toggleActivo(categoria: Categoria) {
    const supabase = createClient();
    const { error } = await supabase
      .from("categorias")
      .update({ activo: !categoria.activo })
      .eq("id", categoria.id);

    if (error) {
      setError("Error al actualizar la categoría");
      return;
    }

    loadCategorias();
  }

  function handleEditar(categoria: Categoria) {
    setEditando(categoria);
    setNombre(categoria.nombre);
    setDescripcion(categoria.descripcion ?? "");
    setIcono(categoria.icono ?? "Wrench");
  }

  function resetForm() {
    setEditando(null);
    setNombre("");
    setDescripcion("");
    setIcono("Wrench");
  }

  return (
    <div>
      <h1>Gestión de categorías</h1>
      <Link href="/admin">← Volver al panel</Link>

      <h2>{editando ? "Editar categoría" : "Nueva categoría"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Descripción</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div>
          <label>Icono</label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {ICONOS_DISPONIBLES.map((nombre_icono) => (
              <button
                key={nombre_icono}
                type="button"
                onClick={() => setIcono(nombre_icono)}
                style={{
                  padding: "8px",
                  border:
                    icono === nombre_icono
                      ? "2px solid blue"
                      : "2px solid #ccc",
                  borderRadius: "8px",
                  background: "none",
                  cursor: "pointer",
                }}
                title={nombre_icono}
              >
                <IconoPreview nombre={nombre_icono} />
              </button>
            ))}
          </div>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : editando ? "Actualizar" : "Crear"}
        </button>
        {editando && (
          <button type="button" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>

      <h2>Categorías</h2>
      <table>
        <thead>
          <tr>
            <th>Icono</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}>
              <td>
                <IconoPreview nombre={cat.icono} />
              </td>
              <td>{cat.nombre}</td>
              <td>{cat.descripcion}</td>
              <td>{cat.activo ? "Activa" : "Inactiva"}</td>
              <td>
                <button onClick={() => handleEditar(cat)}>Editar</button>
                <button onClick={() => toggleActivo(cat)}>
                  {cat.activo ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
