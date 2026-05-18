"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Categoria = {
  id: string;
  nombre: string;
};

type DescuentoForm = {
  dias_minimos: number;
  porcentaje: number;
};

async function uploadFoto(file: File, path: string, token: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const formData = new FormData();
  formData.append("", file);
  const res = await fetch(`${supabaseUrl}/storage/v1/object/fotos-herramientas/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    body: formData,
  });
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
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState<string | null>(null);
  const [fotosAdicionales, setFotosAdicionales] = useState<File[]>([]);
  const [fotosAdicionalesPreview, setFotosAdicionalesPreview] = useState<string[]>([]);
  const [comision, setComision] = useState(0.2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [descuentos, setDescuentos] = useState<DescuentoForm[]>([]);
  const [diasMinimos, setDiasMinimos] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [errorDescuento, setErrorDescuento] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [errorHorario, setErrorHorario] = useState("");
  const fotoPrincipalRef = useRef<HTMLInputElement>(null);
  const fotosAdicionalesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategorias();
    loadComision();
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

  function handleFotoPrincipal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFotoPrincipal(file);
    if (file) setFotoPrincipalPreview(URL.createObjectURL(file));
    else setFotoPrincipalPreview(null);
  }

  function handleFotosAdicionales(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFotosAdicionales(files);
    setFotosAdicionalesPreview(files.map((f) => URL.createObjectURL(f)));
  }

  function handleAñadirDescuento() {
    setErrorDescuento("");
    const dias = parseInt(diasMinimos);
    const pct = parseFloat(porcentaje);
    if (!diasMinimos || !porcentaje) { setErrorDescuento("Rellena los dos campos"); return; }
    if (dias < 2) { setErrorDescuento("Los días mínimos deben ser al menos 2"); return; }
    if (pct <= 0 || pct >= 100) { setErrorDescuento("El porcentaje debe estar entre 1 y 99"); return; }
    if (descuentos.some((d) => d.dias_minimos === dias)) { setErrorDescuento("Ya tienes un descuento para ese número de días"); return; }
    setDescuentos([...descuentos, { dias_minimos: dias, porcentaje: pct }].sort((a, b) => a.dias_minimos - b.dias_minimos));
    setDiasMinimos("");
    setPorcentaje("");
  }

  function handleAñadirHorario() {
    setErrorHorario("");
    if (!horaSeleccionada) { setErrorHorario("Selecciona una hora"); return; }
    if (horarios.includes(horaSeleccionada)) { setErrorHorario("Ese horario ya está añadido"); return; }
    setHorarios([...horarios, horaSeleccionada].sort());
    setHoraSeleccionada("");
  }

  function handleEliminarHorario(hora: string) {
    setHorarios(horarios.filter((h) => h !== hora));
  }

  function handleEliminarDescuento(dias: number) {
    setDescuentos(descuentos.filter((d) => d.dias_minimos !== dias));
  }

  const precioCliente = precioDia ? (parseFloat(precioDia) * (1 + comision)).toFixed(2) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (horarios.length === 0) { setError("Añade al menos un horario de recogida"); setLoading(false); return; }

    const { data: herramienta, error: errorHerramienta } = await supabase
      .from("herramientas")
      .insert({ vendedor_id: user.id, categoria_id: categoriaId, nombre, descripcion, precio_dia: parseFloat(precioDia) })
      .select()
      .single();

    if (errorHerramienta) { setError("Error al publicar la herramienta"); setLoading(false); return; }

    if (fotoPrincipal) {
      const ext = fotoPrincipal.name.split(".").pop();
      const path = `${herramienta.id}/principal.${ext}`;
      const url = await uploadFoto(fotoPrincipal, path, session.access_token);
      if (url) await supabase.from("fotos").insert({ herramienta_id: herramienta.id, url, es_principal: true, orden: 0 });
    }

    for (let i = 0; i < fotosAdicionales.length; i++) {
      const foto = fotosAdicionales[i];
      const ext = foto.name.split(".").pop();
      const path = `${herramienta.id}/foto-${i + 1}.${ext}`;
      const url = await uploadFoto(foto, path, session.access_token);
      if (url) await supabase.from("fotos").insert({ herramienta_id: herramienta.id, url, es_principal: false, orden: i + 1 });
    }

    if (descuentos.length > 0) {
      await supabase.from("descuentos").insert(
        descuentos.map((d) => ({ herramienta_id: herramienta.id, dias_minimos: d.dias_minimos, porcentaje: d.porcentaje }))
      );
    }

    if (horarios.length > 0) {
      await supabase.from("horarios_recogida").insert(
        horarios.map((h) => ({ herramienta_id: herramienta.id, hora: h }))
      );
    }

    router.push("/mis-herramientas");
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-12">
      <div className="max-w-[1320px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Cabecera */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Publicar herramienta</h1>
            <p className="text-sm text-gray-500 mt-1">Rellena los datos de tu herramienta para empezar a alquilarla</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
              <input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej: Taladro percutor Bosch"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Describe el estado, características y condiciones de uso..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400 resize-none"
              />
            </div>

            {/* Categoría */}
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
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <label htmlFor="precio" className="text-sm font-medium text-gray-700 block mb-1">Tu precio por día (€)</label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                value={precioDia}
                onChange={(e) => setPrecioDia(e.target.value)}
                required
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#F97316] transition-colors placeholder-gray-400"
              />
              {precioCliente && (
                <div className="mt-2 bg-orange-50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    El cliente pagará <span className="font-bold text-[#F97316]">{precioCliente}€/día</span>
                  </p>
                  <span className="text-xs text-gray-400">Comisión {(comision * 100).toFixed(0)}% incluida</span>
                </div>
              )}
            </div>

            {/* Fotos */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-700 border-t border-gray-100 pt-4">Fotos</h2>

              {/* Foto principal */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Foto principal</label>
                <div
                  onClick={() => fotoPrincipalRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#F97316] transition-colors flex items-center gap-4"
                >
                  {fotoPrincipalPreview ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image src={fotoPrincipalPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{fotoPrincipal ? fotoPrincipal.name : "Seleccionar foto principal"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o WEBP</p>
                  </div>
                </div>
                <input ref={fotoPrincipalRef} type="file" accept="image/*" onChange={handleFotoPrincipal} className="hidden" />
              </div>

              {/* Fotos adicionales */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Fotos adicionales</label>
                <div
                  onClick={() => fotosAdicionalesRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#F97316] transition-colors"
                >
                  {fotosAdicionalesPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {fotosAdicionalesPreview.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image src={src} alt={`Foto ${i + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <p className="text-sm text-gray-400">Añadir más fotos (opcional)</p>
                    </div>
                  )}
                </div>
                <input ref={fotosAdicionalesRef} type="file" accept="image/*" multiple onChange={handleFotosAdicionales} className="hidden" />
              </div>
            </div>

            {/* Descuentos */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Descuentos por días <span className="font-normal text-gray-400">(opcional)</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">Ofrece descuentos para alquileres de larga duración</p>
              </div>

              {descuentos.length > 0 && (
                <div className="space-y-2">
                  {descuentos.map((d) => (
                    <div key={d.dias_minimos} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-700">
                        A partir de <span className="font-semibold">{d.dias_minimos} días</span> → <span className="font-semibold text-[#F97316]">{d.porcentaje}% dto.</span>
                      </p>
                      <button type="button" onClick={() => handleEliminarDescuento(d.dias_minimos)} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Días mínimos</label>
                  <input
                    type="number"
                    min="2"
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
                  type="button"
                  onClick={handleAñadirDescuento}
                  disabled={!diasMinimos || !porcentaje}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                >
                  Añadir
                </button>
              </div>
              {errorDescuento && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{errorDescuento}</p>}
            </div>

            {/* Horarios de recogida */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">Horarios de recogida <span className="font-normal text-red-400">*</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">Elige los horarios en los que el cliente puede recoger la herramienta</p>
              </div>

              {horarios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {horarios.map((h) => (
                    <div key={h} className="flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-semibold px-3 py-1.5 rounded-full">
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarHorario(h)}
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

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Publicando..." : "Publicar herramienta"}
            </button>
          </form>
        </div>

          {/* Recuadro lateral */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">¿Tienes alguna sugerencia?</h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                ¿Echas de menos una categoría? ¿Quieres sugerirnos algo para mejorar tu experiencia como publicador?
              </p>
              <a
                href="/contacto"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors"
              >
                Escríbenos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-2 text-sm">Consejos para publicar</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Usa fotos con buena luz y fondo neutro
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Describe el estado real de la herramienta
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Añade descuentos para atraer más alquileres
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#F97316] mt-0.5 shrink-0">✓</span>
                  Un precio justo genera más reservas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
