"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Categoria = {
  id: string;
  nombre: string;
};

export default function EditarHerramientaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioDia, setPrecioDia] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [comision, setComision] = useState(0.2);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategorias();
    loadComision();
    loadHerramienta();
  }, []);

  async function loadCategorias() {
    const supabase = createClient();
    const { data } = await supabase
      .from("categorias")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre");
    setCategorias(data ?? []);
  }

  async function loadComision() {
    const supabase = createClient();
    const { data } = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "comision")
      .single();
    if (data) setComision(parseFloat(data.valor));
  }

  async function loadHerramienta() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("herramientas")
      .select("nombre, descripcion, precio_dia, categoria_id")
      .eq("id", id)
      .single();

    if (error || !data) {
      setError("Herramienta no encontrada");
      return;
    }

    setNombre(data.nombre);
    setDescripcion(data.descripcion ?? "");
    setPrecioDia(data.precio_dia.toString());
    setCategoriaId(data.categoria_id);
  }

  const precioCliente = precioDia
    ? (parseFloat(precioDia) * (1 + comision)).toFixed(2)
    : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const { error } = await supabase
      .from("herramientas")
      .update({
        nombre,
        descripcion,
        precio_dia: parseFloat(precioDia),
        categoria_id: categoriaId,
      })
      .eq("id", id);

    if (error) {
      setError("Error al actualizar la herramienta");
    } else {
      setSuccess("Herramienta actualizada correctamente");
      setTimeout(() => router.push("/herramientas/mis-herramientas"), 1000);
    }

    setLoading(false);
  }

  return (
    <div>
      <h1>Editar herramienta</h1>
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
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div>
          <label>Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Tu precio por día (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precioDia}
            onChange={(e) => setPrecioDia(e.target.value)}
            required
          />
          {precioDia && (
            <p>
              El cliente pagará <strong>{precioCliente}€/día</strong> (comisión
              del {(comision * 100).toFixed(0)}% incluida)
            </p>
          )}
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
