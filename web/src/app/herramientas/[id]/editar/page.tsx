"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

type Categoria = {
  id: string;
  nombre: string;
};

type Descuento = {
  id: string;
  dias_minimos: number;
  porcentaje: number;
  activo: boolean;
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

  // Descuentos
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [diasMinimos, setDiasMinimos] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [errorDescuento, setErrorDescuento] = useState("");
  const [loadingDescuento, setLoadingDescuento] = useState(false);

  useEffect(() => {
    loadCategorias();
    loadComision();
    loadHerramienta();
    loadDescuentos();
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("herramientas")
      .select("nombre, descripcion, precio_dia, categoria_id, vendedor_id")
      .eq("id", id)
      .single();

    if (error || !data) {
      setError("Herramienta no encontrada");
      return;
    }

    if (data.vendedor_id !== user?.id) {
      router.push("/herramientas/mis-herramientas");
      return;
    }

    setNombre(data.nombre);
    setDescripcion(data.descripcion ?? "");
    setPrecioDia(data.precio_dia.toString());
    setCategoriaId(data.categoria_id);
  }

  async function loadDescuentos() {
    const res = await fetch(`/api/herramientas/${id}/descuentos`);
    const data = await res.json();
    setDescuentos(data.descuentos ?? []);
  }

  async function handleAñadirDescuento() {
    setErrorDescuento("");
    setLoadingDescuento(true);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(`/api/herramientas/${id}/descuentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        dias_minimos: parseInt(diasMinimos),
        porcentaje: parseFloat(porcentaje),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorDescuento(data.error);
    } else {
      setDiasMinimos("");
      setPorcentaje("");
      loadDescuentos();
    }
    setLoadingDescuento(false);
  }

  async function handleEliminarDescuento(descuentoId: string) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch(
      `/api/herramientas/${id}/descuentos?descuento_id=${descuentoId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      },
    );
    loadDescuentos();
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar herramienta</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
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
          <label className="block text-sm font-medium mb-1">
            Tu precio por día (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precioDia}
            onChange={(e) => setPrecioDia(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
          {precioDia && (
            <p className="text-sm text-gray-500 mt-1">
              El cliente pagará <strong>{precioCliente}€/día</strong> (comisión
              del {(comision * 100).toFixed(0)}% incluida)
            </p>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* Descuentos */}
      <div>
        <h2 className="text-xl font-bold mb-4">Descuentos por días</h2>

        {descuentos.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">
            No hay descuentos configurados.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {descuentos.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border rounded px-4 py-2"
              >
                <p className="text-sm">
                  A partir de <strong>{d.dias_minimos} días</strong> →{" "}
                  <strong>{d.porcentaje}% de descuento</strong>
                </p>
                <button
                  onClick={() => handleEliminarDescuento(d.id)}
                  className="text-red-500 text-sm hover:underline ml-4"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">
              Días mínimos
            </label>
            <input
              type="number"
              min="2"
              value={diasMinimos}
              onChange={(e) => setDiasMinimos(e.target.value)}
              className="border rounded px-3 py-2 w-32"
              placeholder="Ej: 7"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Descuento (%)
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              className="border rounded px-3 py-2 w-32"
              placeholder="Ej: 10"
            />
          </div>
          <button
            onClick={handleAñadirDescuento}
            disabled={loadingDescuento || !diasMinimos || !porcentaje}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
        {errorDescuento && (
          <p className="text-red-500 text-sm mt-2">{errorDescuento}</p>
        )}
      </div>
    </div>
  );
}
