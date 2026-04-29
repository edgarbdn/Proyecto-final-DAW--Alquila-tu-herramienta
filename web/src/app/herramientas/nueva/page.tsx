"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Categoria = {
  id: string;
  nombre: string;
};

async function uploadFoto(file: File, path: string, token: string): Promise<string | null> {
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
    }
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

  const precioCliente = precioDia
    ? (parseFloat(precioDia) * (1 + comision)).toFixed(2)
    : "0.00";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: { session } } = await supabase.auth.getSession();
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

    router.push("/");
  }

  return (
    <div>
      <h1>Publicar herramienta</h1>
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
        <div>
          <label>Foto principal</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFotoPrincipal(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label>Fotos adicionales</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              setFotosAdicionales(Array.from(e.target.files ?? []))
            }
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Publicando..." : "Publicar herramienta"}
        </button>
      </form>
    </div>
  );
}
