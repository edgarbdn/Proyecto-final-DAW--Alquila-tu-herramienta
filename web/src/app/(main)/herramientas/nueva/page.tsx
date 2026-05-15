"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Categoria = {
  id: string;
  nombre: string;
};

type DescuentoForm = {
  dias_minimos: number;
  porcentaje: number;
};

async function uploadFoto(
  file: File,
  path: string,
  token: string,
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const formData = new FormData();
  formData.append("", file);

  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/fotos-herramientas/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: formData,
    },
  );

  if (!res.ok) return null;
  return `${supabaseUrl}/storage/v1/object/public/fotos-herramientas/${path}`;
}

export default function NuevaHerramientaPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioDia, setPrecioDia] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [fotoPrincipal, setFotoPrincipal] = useState<File | null>(null);
  const [fotosAdicionales, setFotosAdicionales] = useState<File[]>([]);
  const [comision, setComision] = useState(0.2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Descuentos
  const [descuentos, setDescuentos] = useState<DescuentoForm[]>([]);
  const [diasMinimos, setDiasMinimos] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [errorDescuento, setErrorDescuento] = useState("");

  useEffect(() => {
    loadCategorias();
    loadComision();
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

  function handleAñadirDescuento() {
    setErrorDescuento("");
    const dias = parseInt(diasMinimos);
    const pct = parseFloat(porcentaje);

    if (!diasMinimos || !porcentaje) {
      setErrorDescuento("Rellena los dos campos");
      return;
    }
    if (dias < 2) {
      setErrorDescuento("Los días mínimos deben ser al menos 2");
      return;
    }
    if (pct <= 0 || pct >= 100) {
      setErrorDescuento("El porcentaje debe estar entre 1 y 99");
      return;
    }
    if (descuentos.some((d) => d.dias_minimos === dias)) {
      setErrorDescuento("Ya tienes un descuento para ese número de días");
      return;
    }

    setDescuentos(
      [...descuentos, { dias_minimos: dias, porcentaje: pct }].sort(
        (a, b) => a.dias_minimos - b.dias_minimos,
      ),
    );
    setDiasMinimos("");
    setPorcentaje("");
  }

  function handleEliminarDescuento(dias: number) {
    setDescuentos(descuentos.filter((d) => d.dias_minimos !== dias));
  }

  const precioCliente = precioDia
    ? (parseFloat(precioDia) * (1 + comision)).toFixed(2)
    : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Crear la herramienta
    const { data: herramienta, error: errorHerramienta } = await supabase
      .from("herramientas")
      .insert({
        vendedor_id: user.id,
        categoria_id: categoriaId,
        nombre,
        descripcion,
        precio_dia: parseFloat(precioDia),
      })
      .select()
      .single();

    if (errorHerramienta) {
      setError("Error al publicar la herramienta");
      setLoading(false);
      return;
    }

    // 2. Subir foto principal
    if (fotoPrincipal) {
      const ext = fotoPrincipal.name.split(".").pop();
      const path = `${herramienta.id}/principal.${ext}`;
      const url = await uploadFoto(fotoPrincipal, path, session.access_token);
      if (url) {
        await supabase.from("fotos").insert({
          herramienta_id: herramienta.id,
          url,
          es_principal: true,
          orden: 0,
        });
      }
    }

    // 3. Subir fotos adicionales
    for (let i = 0; i < fotosAdicionales.length; i++) {
      const foto = fotosAdicionales[i];
      const ext = foto.name.split(".").pop();
      const path = `${herramienta.id}/foto-${i + 1}.${ext}`;
      const url = await uploadFoto(foto, path, session.access_token);
      if (url) {
        await supabase.from("fotos").insert({
          herramienta_id: herramienta.id,
          url,
          es_principal: false,
          orden: i + 1,
        });
      }
    }

    // 4. Guardar descuentos
    if (descuentos.length > 0) {
      await supabase.from("descuentos").insert(
        descuentos.map((d) => ({
          herramienta_id: herramienta.id,
          dias_minimos: d.dias_minimos,
          porcentaje: d.porcentaje,
        })),
      );
    }

    router.push("/herramientas/mis-herramientas");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Publicar herramienta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <label className="block text-sm font-medium mb-1">
            Foto principal
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFotoPrincipal(e.target.files?.[0] ?? null)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Fotos adicionales
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setFotosAdicionales(Array.from(e.target.files ?? []))
            }
            className="w-full"
          />
        </div>

        {/* Descuentos */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">
            Descuentos por días (opcional)
          </h2>
          {descuentos.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">
              No hay descuentos configurados.
            </p>
          ) : (
            <div className="space-y-2 mb-3">
              {descuentos.map((d) => (
                <div
                  key={d.dias_minimos}
                  className="flex items-center justify-between border rounded px-4 py-2"
                >
                  <p className="text-sm">
                    A partir de <strong>{d.dias_minimos} días</strong> →{" "}
                    <strong>{d.porcentaje}% de descuento</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleEliminarDescuento(d.dias_minimos)}
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
              type="button"
              onClick={handleAñadirDescuento}
              disabled={!diasMinimos || !porcentaje}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Añadir
            </button>
          </div>
          {errorDescuento && (
            <p className="text-red-500 text-sm mt-2">{errorDescuento}</p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar herramienta"}
        </button>
      </form>
    </div>
  );
}
