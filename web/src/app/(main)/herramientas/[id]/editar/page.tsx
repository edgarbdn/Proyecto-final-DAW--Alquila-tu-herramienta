"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Categoria = { id: string; nombre: string; };
type Descuento = { id: string; dias_minimos: number; porcentaje: number; activo: boolean; };
type Horario = { id: string; hora: string; };
type FotoExistente = { id: string; url: string; es_principal: boolean; orden: number; };

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
  const [loadingData, setLoadingData] = useState(true);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [diasMinimos, setDiasMinimos] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [errorDescuento, setErrorDescuento] = useState("");
  const [loadingDescuento, setLoadingDescuento] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [errorHorario, setErrorHorario] = useState("");

  // Fotos
  const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]);
  const [eliminandoFoto, setEliminandoFoto] = useState<string | null>(null);
  const [confirmarEliminarFoto, setConfirmarEliminarFoto] = useState<FotoExistente | null>(null);
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  const [fotosNuevasPreview, setFotosNuevasPreview] = useState<string[]>([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [errorFotos, setErrorFotos] = useState("");
  const fotosInputRef = useRef<HTMLInputElement>(null);
  // Foto principal nueva
  const [nuevaFotoPrincipal, setNuevaFotoPrincipal] = useState<File | null>(null);
  const [nuevaFotoPrincipalPreview, setNuevaFotoPrincipalPreview] = useState<string | null>(null);
  const [subiendoPrincipal, setSubiendoPrincipal] = useState(false);
  const fotoPrincipalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategorias();
    loadComision();
    loadHerramienta();
    loadDescuentos();
    loadHorarios();
    loadFotos();
  }, []);

  async function loadCategorias() {
    const supabase = createClient();
    const { data } = await supabase.from("categorias").select("id, nombre").eq("activo", true).order("nombre");
    setCategorias(data ?? []);
  }

  async function loadComision() {
    const supabase = createClient();
    const { data } = await supabase.from("configuracion").select("valor").eq("clave", "comision").single();
    if (data) setComision(parseFloat(data.valor));
  }

  async function loadHerramienta() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("herramientas")
      .select("nombre, descripcion, precio_dia, categoria_id, vendedor_id")
      .eq("id", id)
      .single();

    if (error || !data) { setError("Herramienta no encontrada"); setLoadingData(false); return; }
    if (data.vendedor_id !== user?.id) { router.push("/mis-herramientas"); return; }

    setNombre(data.nombre);
    setDescripcion(data.descripcion ?? "");
    setPrecioDia(data.precio_dia.toString());
    setCategoriaId(data.categoria_id);
    setLoadingData(false);
  }

  async function loadDescuentos() {
    const res = await fetch(`/api/herramientas/${id}/descuentos`);
    const data = await res.json();
    setDescuentos(data.descuentos ?? []);
  }

  async function loadHorarios() {
    const supabase = createClient();
    const { data } = await supabase
      .from("horarios_recogida")
      .select("id, hora")
      .eq("herramienta_id", id)
      .order("hora", { ascending: true });
    setHorarios(data ?? []);
  }

  async function handleAñadirHorario() {
    setErrorHorario("");
    if (!horaSeleccionada) { setErrorHorario("Selecciona una hora"); return; }
    if (horarios.some((h) => h.hora === horaSeleccionada)) { setErrorHorario("Ese horario ya está añadido"); return; }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("horarios_recogida")
      .insert({ herramienta_id: id, hora: horaSeleccionada })
      .select("id, hora")
      .single();
    if (error) { setErrorHorario("Error al añadir el horario"); return; }
    setHorarios([...horarios, data].sort((a, b) => a.hora.localeCompare(b.hora)));
    setHoraSeleccionada("");
  }

  async function handleEliminarHorario(horarioId: string) {
    const supabase = createClient();
    // Verificar si hay alquileres activos o pendientes con este horario
    const { data: alquileres } = await supabase
      .from("alquileres")
      .select("id")
      .eq("horario_id", horarioId)
      .in("estado", ["pendiente", "confirmado", "activo"])
      .limit(1);

    if (alquileres && alquileres.length > 0) {
      setErrorHorario("No puedes eliminar este horario porque tiene alquileres activos o pendientes asociados.");
      return;
    }

    const { error } = await supabase.from("horarios_recogida").delete().eq("id", horarioId);
    if (error) { setErrorHorario("Error al eliminar el horario"); return; }
    setHorarios(horarios.filter((h) => h.id !== horarioId));
    setErrorHorario("");
  }

  async function handleAñadirDescuento() {
    setErrorDescuento("");
    setLoadingDescuento(true);

    const dias = parseInt(diasMinimos);
    const pct = parseFloat(porcentaje);

    if (!diasMinimos || isNaN(dias) || dias < 2 || dias > 30) { setErrorDescuento("Los días mínimos deben estar entre 2 y 30"); setLoadingDescuento(false); return; }
    if (!porcentaje || isNaN(pct) || pct < 1 || pct > 99) { setErrorDescuento("El descuento debe estar entre 1% y 99%"); setLoadingDescuento(false); return; }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/herramientas/${id}/descuentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ dias_minimos: dias, porcentaje: pct }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Traducir errores técnicos a mensajes comprensibles
      const msg = data.error ?? "";
      if (msg.includes("integer") || msg.includes("syntax") || msg.includes("invalid input")) {
        setErrorDescuento("El valor introducido no es válido. Usa solo números enteros para los días.");
      } else if (msg.includes("duplicate") || msg.includes("unique")) {
        setErrorDescuento("Ya existe un descuento con esos días mínimos.");
      } else if (msg.includes("foreign key") || msg.includes("violates")) {
        setErrorDescuento("Error al guardar el descuento. Inténtalo de nuevo.");
      } else {
        setErrorDescuento("Error al añadir el descuento. Comprueba los datos e inténtalo de nuevo.");
      }
    } else {
      setDiasMinimos("");
      setPorcentaje("");
      loadDescuentos();
    }
    setLoadingDescuento(false);
  }

  async function handleEliminarDescuento(descuentoId: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/herramientas/${id}/descuentos?descuento_id=${descuentoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    loadDescuentos();
  }

  async function loadFotos() {
    const supabase = createClient();
    const { data } = await supabase
      .from("fotos")
      .select("id, url, es_principal, orden")
      .eq("herramienta_id", id)
      .order("orden", { ascending: true });
    setFotosExistentes(data ?? []);
  }

  async function handleEliminarFoto(foto: FotoExistente) {
    setEliminandoFoto(foto.id);
    setErrorFotos("");
    const supabase = createClient();

    // Extraer el path relativo del bucket desde la URL pública
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const prefix = `${supabaseUrl}/storage/v1/object/public/fotos-herramientas/`;
    const storagePath = foto.url.startsWith(prefix) ? foto.url.slice(prefix.length) : null;

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("fotos-herramientas")
        .remove([storagePath]);
      if (storageError) {
        setErrorFotos("Error al eliminar la imagen del servidor");
        setEliminandoFoto(null);
        return;
      }
    }

    const { error: dbError } = await supabase.from("fotos").delete().eq("id", foto.id);
    if (dbError) {
      setErrorFotos("Error al eliminar la foto");
      setEliminandoFoto(null);
      return;
    }

    setFotosExistentes((prev) => prev.filter((f) => f.id !== foto.id));
    setEliminandoFoto(null);
  }

  function handleSeleccionarNuevaFotoPrincipal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setNuevaFotoPrincipal(file);
    setNuevaFotoPrincipalPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubirNuevaFotoPrincipal() {
    if (!nuevaFotoPrincipal) return;
    setSubiendoPrincipal(true);
    setErrorFotos("");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Eliminar foto principal anterior de Storage y BD
    const principalAnterior = fotosExistentes.find((f) => f.es_principal);
    if (principalAnterior) {
      const prefix = `${supabaseUrl}/storage/v1/object/public/fotos-herramientas/`;
      const storagePath = principalAnterior.url.startsWith(prefix)
        ? principalAnterior.url.slice(prefix.length)
        : null;
      if (storagePath) {
        await supabase.storage.from("fotos-herramientas").remove([storagePath]);
      }
      await supabase.from("fotos").delete().eq("id", principalAnterior.id);
    }

    // Subir nueva foto principal
    const ext = nuevaFotoPrincipal.name.split(".").pop();
    const path = `${id}/principal-${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append("", nuevaFotoPrincipal);
    const res = await fetch(`${supabaseUrl}/storage/v1/object/fotos-herramientas/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, apikey: anonKey },
      body: formData,
    });

    if (res.ok) {
      const url = `${supabaseUrl}/storage/v1/object/public/fotos-herramientas/${path}`;
      await supabase.from("fotos").insert({
        herramienta_id: id,
        url,
        es_principal: true,
        orden: 0,
      });
    } else {
      setErrorFotos("Error al subir la foto principal");
      setSubiendoPrincipal(false);
      return;
    }

    setNuevaFotoPrincipal(null);
    setNuevaFotoPrincipalPreview(null);
    if (fotoPrincipalRef.current) fotoPrincipalRef.current.value = "";
    await loadFotos();
    setSubiendoPrincipal(false);
  }

  function handleSeleccionarFotosNuevas(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFotosNuevas(files);
    setFotosNuevasPreview(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubirFotosNuevas() {
    if (fotosNuevas.length === 0) return;
    setSubiendoFotos(true);
    setErrorFotos("");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    // Calcular el mayor orden existente para no colisionar
    const maxOrden = fotosExistentes.reduce((max, f) => Math.max(max, f.orden), 0);

    for (let i = 0; i < fotosNuevas.length; i++) {
      const file = fotosNuevas[i];
      const ext = file.name.split(".").pop();
      const path = `${id}/extra-${Date.now()}-${i}.${ext}`;
      const formData = new FormData();
      formData.append("", file);
      const res = await fetch(`${supabaseUrl}/storage/v1/object/fotos-herramientas/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: anonKey },
        body: formData,
      });
      if (res.ok) {
        const url = `${supabaseUrl}/storage/v1/object/public/fotos-herramientas/${path}`;
        await supabase.from("fotos").insert({
          herramienta_id: id,
          url,
          es_principal: false,
          orden: maxOrden + i + 1,
        });
      }
    }

    // Limpiar selección y recargar
    setFotosNuevas([]);
    setFotosNuevasPreview([]);
    if (fotosInputRef.current) fotosInputRef.current.value = "";
    await loadFotos();
    setSubiendoFotos(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validar que existe foto principal
    const tieneFotoPrincipal = fotosExistentes.some((f) => f.es_principal);
    if (!tieneFotoPrincipal) {
      setError("La foto principal es obligatoria. Añade una foto principal antes de guardar.");
      setLoading(false);
      return;
    }

    if (!precioDia || parseFloat(precioDia) <= 0) {
      setError("El precio debe ser mayor que 0");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("herramientas")
      .update({ nombre, descripcion, precio_dia: parseFloat(precioDia), categoria_id: categoriaId })
      .eq("id", id);

    if (error) setError("Error al actualizar la herramienta");
    else { setSuccess("Herramienta actualizada correctamente"); setTimeout(() => router.push("/mis-herramientas"), 1000); }
    setLoading(false);
  }

  const precioCliente = precioDia ? (parseFloat(precioDia) * (1 + comision)).toFixed(2) : null;

  if (loadingData) return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-12">
      <div className="max-w-[1320px] mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-12">
      <div className="max-w-[1320px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Formulario principal */}
          <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-8">
              <Link href="/mis-herramientas" className="text-gray-400 hover:text-[#F97316] transition-colors" aria-label="Volver a mis herramientas">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar herramienta</h1>
                <p className="text-sm text-gray-500 mt-0.5">Modifica los datos de tu herramienta</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nombre" className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="categoria" className="text-sm font-medium text-gray-700 block mb-1">Categoría</label>
                <select
                  id="categoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors bg-white"
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="precio" className="text-sm font-medium text-gray-700 block mb-1">Tu precio por día (€)</label>
                <input
                  id="precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={precioDia}
                  onChange={(e) => setPrecioDia(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors"
                />
                {precioCliente && (
                  <div className="mt-2 bg-orange-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">El cliente pagará <span className="font-bold text-[#F97316]">{precioCliente}€/día</span></p>
                    <span className="text-xs text-gray-400">Comisión {(comision * 100).toFixed(0)}% incluida</span>
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
              {success && <p className="text-green-600 text-sm bg-green-50 px-4 py-3 rounded-xl">{success}</p>}
            </form>

            {/* Fotos */}
            <div className="border-t border-gray-100 mt-8 pt-8 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Fotos</h2>
                <p className="text-xs text-gray-400 mt-0.5">Gestiona las imágenes de tu herramienta</p>
              </div>

              {/* FOTO PRINCIPAL */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 block">
                  Foto principal <span className="text-red-400">*</span>
                </label>

                {/* Foto principal actual */}
                {(() => {
                  const principal = fotosExistentes.find((f) => f.es_principal);
                  return principal ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 group">
                        <Image src={principal.url} alt="Foto principal" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setConfirmarEliminarFoto(principal)}
                          disabled={eliminandoFoto === principal.id}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          {eliminandoFoto === principal.id ? (
                            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 bg-[#F97316] text-white text-xs font-bold px-2 py-1 rounded-lg mb-2">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Foto principal actual
                        </span>
                        <p className="text-xs text-gray-400">Pasa el ratón por encima para eliminarla</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-red-600 font-medium">No hay foto principal. Añade una antes de guardar.</p>
                    </div>
                  );
                })()}

                {/* Cambiar / añadir foto principal */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {fotosExistentes.some((f) => f.es_principal) ? "Cambiar foto principal" : "Añadir foto principal"}
                  </p>
                  <div
                    onClick={() => fotoPrincipalRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#F97316] transition-colors flex items-center gap-4"
                  >
                    {nuevaFotoPrincipalPreview ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={nuevaFotoPrincipalPreview} alt="Nueva principal" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      {nuevaFotoPrincipal ? nuevaFotoPrincipal.name : "Seleccionar imagen"}
                    </p>
                  </div>
                  <input
                    ref={fotoPrincipalRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSeleccionarNuevaFotoPrincipal}
                    className="hidden"
                  />
                  {nuevaFotoPrincipal && (
                    <button
                      type="button"
                      onClick={handleSubirNuevaFotoPrincipal}
                      disabled={subiendoPrincipal}
                      className="mt-3 inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {subiendoPrincipal ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Subiendo...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        {fotosExistentes.some((f) => f.es_principal) ? "Reemplazar foto principal" : "Subir foto principal"}</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* FOTOS ADICIONALES */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700 block">Fotos adicionales</label>

                {/* Fotos adicionales existentes */}
                {fotosExistentes.filter((f) => !f.es_principal).length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {fotosExistentes.filter((f) => !f.es_principal).map((foto) => (
                      <div key={foto.id} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                        <Image src={foto.url} alt="Foto" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setConfirmarEliminarFoto(foto)}
                          disabled={eliminandoFoto === foto.id}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          {eliminandoFoto === foto.id ? (
                            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No hay fotos adicionales.</p>
                )}

                {/* Añadir fotos adicionales */}
                <div>
                  <div
                    onClick={() => fotosInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#F97316] transition-colors"
                  >
                    {fotosNuevasPreview.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {fotosNuevasPreview.map((src, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <Image src={src} alt={`Nueva foto ${i + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <p className="text-sm text-gray-400">Seleccionar imágenes (múltiple)</p>
                      </div>
                    )}
                  </div>
                  <input ref={fotosInputRef} type="file" accept="image/*" multiple onChange={handleSeleccionarFotosNuevas} className="hidden" />
                  {fotosNuevas.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSubirFotosNuevas}
                      disabled={subiendoFotos}
                      className="mt-3 inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {subiendoFotos ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Subiendo...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        Subir {fotosNuevas.length} foto{fotosNuevas.length !== 1 ? "s" : ""}</>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {errorFotos && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{errorFotos}</p>}
            </div>
            <div className="border-t border-gray-100 mt-8 pt-8 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Descuentos por días <span className="font-normal text-gray-400">(opcional)</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">Ofrece descuentos para alquileres de larga duración</p>
              </div>

              {descuentos.length > 0 && (
                <div className="space-y-2">
                  {descuentos.map((d) => (
                    <div key={d.id} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-700">
                        A partir de <span className="font-semibold">{d.dias_minimos} días</span> → <span className="font-semibold text-[#F97316]">{d.porcentaje}% dto.</span>
                      </p>
                      <button onClick={() => handleEliminarDescuento(d.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {descuentos.length === 0 && (
                <p className="text-sm text-gray-400">No hay descuentos configurados.</p>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Días mínimos</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={diasMinimos}
                    onChange={(e) => setDiasMinimos(e.target.value)}
                    placeholder="Ej: 7"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    placeholder="Ej: 10"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <button
                  onClick={handleAñadirDescuento}
                  disabled={loadingDescuento || !diasMinimos || !porcentaje}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  Añadir
                </button>
              </div>
              {errorDescuento && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{errorDescuento}</p>}
            </div>

            {/* Horarios de recogida */}
            <div className="border-t border-gray-100 mt-8 pt-8 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Horarios de recogida</h2>
                <p className="text-xs text-gray-400 mt-0.5">Elige los horarios en los que el cliente puede recoger la herramienta</p>
              </div>

              {horarios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {horarios.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-semibold px-3 py-1.5 rounded-full">
                      <span>{h.hora}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarHorario(h.id)}
                        className="text-[#F97316] hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {horarios.length === 0 && (
                <p className="text-sm text-gray-400">No hay horarios configurados.</p>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Hora</label>
                  <input
                    type="time"
                    value={horaSeleccionada}
                    onChange={(e) => setHoraSeleccionada(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAñadirHorario}
                  disabled={!horaSeleccionada}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  Añadir
                </button>
              </div>
              {errorHorario && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{errorHorario}</p>}
            </div>

            {/* Botón guardar */}
            <div className="border-t border-gray-100 mt-8 pt-8">
              <button
                onClick={handleSubmit as any}
                disabled={loading}
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

          </div>

          {/* Recuadro lateral */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Consejos</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Mantén la descripción actualizada
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Ajusta el precio según la demanda
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Los descuentos atraen más alquileres
                </li>
              </ul>
            </div>

            <Link
              href={`/herramientas/${id}`}
              className="flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm font-semibold text-gray-700 hover:border-[#F97316] hover:text-[#F97316] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ver página pública
            </Link>
          </div>
        </div>
      </div>

      {/* Modal confirmación eliminar foto */}
      {confirmarEliminarFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">¿Eliminar foto?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirmarEliminarFoto.es_principal
                ? "Vas a eliminar la foto principal. Esta acción no se puede deshacer."
                : "Esta acción no se puede deshacer."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmarEliminarFoto(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const foto = confirmarEliminarFoto;
                  setConfirmarEliminarFoto(null);
                  await handleEliminarFoto(foto);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
