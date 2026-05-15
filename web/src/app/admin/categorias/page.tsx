"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
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
  "Wrench", "Hammer", "Drill", "Scissors", "Paintbrush",
  "Zap", "Truck", "Shovel", "Axe", "Ruler",
  "Cog", "Lightbulb", "Flame", "Droplets", "TreePine",
];

function IconoPreview({ nombre, size = 20 }: { nombre: string; size?: number }) {
  const Icon = Icons[nombre as keyof typeof Icons] as React.ComponentType<LucideProps> | undefined;
  if (!Icon) return <span className="text-gray-400">?</span>;
  return <Icon size={size} />;
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
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => { loadCategorias(); }, []);

  async function loadCategorias() {
    setLoadingCats(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nombre, descripcion, icono, activo")
      .order("nombre");
    if (error) setError("Error al cargar las categorías");
    else setCategorias(data ?? []);
    setLoadingCats(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = createClient();

    if (editando) {
      const { error } = await supabase.from("categorias").update({ nombre, descripcion, icono }).eq("id", editando.id);
      if (error) setError("Error al actualizar la categoría");
      else { setSuccess("Categoría actualizada"); resetForm(); loadCategorias(); }
    } else {
      const { error } = await supabase.from("categorias").insert({ nombre, descripcion, icono });
      if (error) setError("Error al crear la categoría");
      else { setSuccess("Categoría creada"); resetForm(); loadCategorias(); }
    }
    setLoading(false);
  }

  async function toggleActivo(categoria: Categoria) {
    const supabase = createClient();
    const { error } = await supabase.from("categorias").update({ activo: !categoria.activo }).eq("id", categoria.id);
    if (error) setError("Error al actualizar");
    else loadCategorias();
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
    <div className="px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona las categorías de herramientas</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">
          {editando ? "Editar categoría" : "Nueva categoría"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej: Electricidad"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F97316] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Icono</label>
            <div className="flex flex-wrap gap-2">
              {ICONOS_DISPONIBLES.map((nombre_icono) => (
                <button
                  key={nombre_icono}
                  type="button"
                  onClick={() => setIcono(nombre_icono)}
                  title={nombre_icono}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    icono === nombre_icono
                      ? "border-[#F97316] bg-orange-50 text-[#F97316]"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <IconoPreview nombre={nombre_icono} size={18} />
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          {success && <p className="text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">{success}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : editando ? "Actualizar" : "Crear categoría"}
            </button>
            {editando && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Icono</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingCats ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : categorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                      <IconoPreview nombre={cat.icono} size={18} />
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">{cat.nombre}</td>
                  <td className="px-5 py-4 text-gray-500">{cat.descripcion ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      cat.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.activo ? "bg-green-500" : "bg-red-500"}`} />
                      {cat.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(cat)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(cat)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          cat.activo
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {cat.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loadingCats && categorias.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">No hay categorías</p>
        )}
      </div>
    </div>
  );
}
