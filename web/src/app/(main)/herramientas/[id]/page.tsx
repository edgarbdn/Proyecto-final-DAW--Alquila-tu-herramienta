"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DayPicker, DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { createClient } from "@/lib/supabase";

interface Foto { id: string; url: string; es_principal: boolean; orden: number; }
interface Vendedor { id: string; nombre: string; apellidos: string; ciudad: string | null; direccion_publica: string | null; avatar_url: string | null; }
interface Categoria { id: string; nombre: string; }
interface Valoracion { id: string; nota: number; comentario: string | null; created_at: string; autor: { nombre: string; apellidos: string } | null; }
interface Descuento { id: string; dias_minimos: number; porcentaje: number; }
interface Herramienta {
  id: string; nombre: string; descripcion: string; precio_dia: number; precio_dia_publico: number;
  disponible: boolean; vendedor: Vendedor | null; categoria: Categoria;
  fotos: Foto[]; valoraciones: Valoracion[]; descuentos: Descuento[];
}

function Estrellas({ nota, size = "sm" }: { nota: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} className={`${cls} ${i <= nota ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function DetalleHerramientaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoActiva, setFotoActiva] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fechasOcupadas, setFechasOcupadas] = useState<Date[]>([]);
  const [rango, setRango] = useState<DateRange | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [errorAlquiler, setErrorAlquiler] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioId(session?.user?.id ?? null);
      setToken(session?.access_token ?? null);
    });
    fetch(`/api/herramientas/${id}`).then((r) => r.json()).then((data) => {
      if (data.error) { setLoading(false); return; }
      setHerramienta({
        ...data,
        fotos: data.fotos ?? [],
        valoraciones: data.valoraciones ?? [],
        descuentos: data.descuentos ?? [],
      });
      setFotoActiva(data.fotos?.find((f: Foto) => f.es_principal)?.url ?? data.fotos?.[0]?.url ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
    fetch(`/api/herramientas/${id}/disponibilidad`).then((r) => r.json()).then((data) => {
      setFechasOcupadas((data.fechasOcupadas ?? []).map((f: string) => new Date(f)));
    });
  }, [id]);

  if (loading) return (
    <main className="max-w-[1320px] mx-auto px-4 py-8 space-y-4">
      <div className="h-8 w-32 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    </main>
  );

  if (!herramienta) return (
    <main className="max-w-[1320px] mx-auto px-4 py-8">
      <p className="text-gray-500">Herramienta no encontrada.</p>
    </main>
  );

  const mediaNota = herramienta.valoraciones.length > 0
    ? (herramienta.valoraciones.reduce((acc, v) => acc + v.nota, 0) / herramienta.valoraciones.length).toFixed(1)
    : null;

  function calcularPrecio() {
    if (!rango?.from || !rango?.to || !herramienta) return null;
    const dias = Math.ceil((rango.to.getTime() - rango.from.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) return null;
    const descuento = herramienta.descuentos.filter((d) => d.dias_minimos <= dias).sort((a, b) => b.dias_minimos - a.dias_minimos)[0];
    const porcentaje = descuento ? descuento.porcentaje : 0;
    const precioVendedor = herramienta.precio_dia * (1 - porcentaje / 100) * dias;
    const precioFinal = precioVendedor * 1.2;
    return { dias, porcentaje, precioFinal: precioFinal.toFixed(2) };
  }

  const resumen = calcularPrecio();

  async function handleAlquilar() {
    if (!rango?.from || !rango?.to || !token) return;
    setEnviando(true);
    setErrorAlquiler("");
    const toLocalDateString = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const fecha_inicio = toLocalDateString(rango.from);
    const fecha_fin = toLocalDateString(rango.to);
    const res = await fetch("/api/alquileres", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ herramienta_id: id, fecha_inicio, fecha_fin }),
    });
    const data = await res.json();
    if (!res.ok) setErrorAlquiler(data.error);
    else setExito(true);
    setEnviando(false);
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <main className="max-w-[1320px] mx-auto px-4 py-8">
      <Link href="/herramientas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#F97316] transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 rounded-2xl p-6">
        {/* Columna izquierda: Galería + Vendedor */}
        <div className="flex flex-col gap-6">
          {/* Galería */}
          <div className="space-y-3">
            <div className="relative h-80 sm:h-96 bg-gray-100 rounded-2xl overflow-hidden">
              {fotoActiva ? (
                <Image src={fotoActiva} alt={herramienta.nombre} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                  </svg>
                </div>
              )}
              {!herramienta.disponible && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white text-gray-700 font-semibold text-sm px-4 py-2 rounded-full">No disponible</span>
                </div>
              )}
            </div>
            {herramienta.fotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {herramienta.fotos.map((f) => (
                  <button key={f.id} onClick={() => setFotoActiva(f.url)}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${fotoActiva === f.url ? "border-[#F97316]" : "border-transparent"}`}
                  >
                    <Image src={f.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vendedor */}
          {herramienta.vendedor && (
            <div className="flex-1 flex items-center justify-center">
              <Link
                href={`/usuario/${herramienta.vendedor.id}`}
                className="border-2 border-[#F97316] rounded-2xl p-4 pl-24 flex items-center relative min-h-[80px] w-full max-w-xs sm:max-w-sm mx-auto hover:bg-orange-50 transition-colors"
              >
                <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#F97316] overflow-hidden flex items-center justify-center text-white font-bold text-3xl shrink-0 border-2 border-[#F97316] shadow-md">
                  {herramienta.vendedor.avatar_url ? (
                    <Image src={herramienta.vendedor.avatar_url} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    herramienta.vendedor.nombre[0]?.toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-base truncate">{herramienta.vendedor.nombre} {herramienta.vendedor.apellidos}</p>
                  {herramienta.vendedor.ciudad && <p className="text-sm text-gray-500 mt-1 truncate">{herramienta.vendedor.ciudad}</p>}
                  {herramienta.vendedor.direccion_publica && <p className="text-sm text-gray-400 mt-0.5 truncate">{herramienta.vendedor.direccion_publica}</p>}
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Columna derecha: Info + Descuentos */}
        <div className="space-y-5">
          {/* Categoría y nombre */}
          <div>
            <span className="text-xs font-semibold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full">{herramienta.categoria.nombre}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{herramienta.nombre}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-[#F97316]">{herramienta.precio_dia_publico}€<span className="text-base font-normal text-gray-400">/día</span></span>
              {mediaNota && (
                <div className="flex items-center gap-1.5">
                  <Estrellas nota={Math.round(parseFloat(mediaNota))} />
                  <span className="text-sm text-gray-500">{mediaNota}</span>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{herramienta.descripcion}</p>

          {/* Descuentos */}
          {herramienta.descuentos.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-4 space-y-3">
              <p className="text-base font-bold text-green-800">Descuentos por duración</p>
              <div className="flex flex-wrap gap-2">
                {herramienta.descuentos.map((d) => (
                  <span key={d.id} className="text-sm font-bold bg-green-600 text-white px-4 py-2 rounded-full shadow-sm">
                    +{d.dias_minimos} días → {d.porcentaje}% dto.
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección alquiler */}
      <div className="mt-10">
        {exito ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="font-bold text-green-700 text-lg">¡Solicitud enviada!</p>
            <p className="text-green-600 text-sm mt-1">El propietario recibirá tu solicitud y la confirmará en breve.</p>
            <Link href="/mis-alquileres" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:text-green-800 mt-3 transition-colors">
              Ver mis alquileres →
            </Link>
          </div>
        ) : !herramienta.disponible ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-gray-500 font-semibold">Esta herramienta no está disponible actualmente</p>
          </div>
        ) : !usuarioId ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-gray-600 mb-4">Inicia sesión para alquilar esta herramienta</p>
            <button onClick={() => router.push(`/login?redirect=/herramientas/${id}`)}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        ) : usuarioId === herramienta.vendedor?.id ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">No puedes alquilar tu propia herramienta</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Solicitar alquiler</h2>
            <p className="text-sm text-gray-500 mb-5">Selecciona las fechas. Los días bloqueados ya están reservados.</p>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <DayPicker
                mode="range"
                selected={rango}
                onSelect={setRango}
                locale={es}
                disabled={[{ before: hoy }, ...fechasOcupadas]}
                modifiers={{ ocupado: fechasOcupadas }}
                modifiersClassNames={{ ocupado: "rdp-day--ocupado" }}
                showOutsideDays
              />

              <div className="flex-1 w-full space-y-4">
                {resumen ? (
                  <div className="bg-orange-50 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duración</span>
                      <span className="font-semibold text-gray-900">{resumen.dias} días</span>
                    </div>
                    {resumen.porcentaje > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento</span>
                        <span className="font-semibold text-green-600">-{resumen.porcentaje}%</span>
                      </div>
                    )}
                    <div className="border-t border-orange-100 pt-2 flex justify-between">
                      <span className="text-gray-700 font-semibold">Total</span>
                      <span className="text-2xl font-bold text-[#F97316]">{resumen.precioFinal}€</span>
                    </div>
                    <p className="text-xs text-gray-400">Comisión incluida</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-5 text-center">
                    <p className="text-sm text-gray-400">Selecciona fechas para ver el precio</p>
                  </div>
                )}

                {errorAlquiler && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{errorAlquiler}</p>}

                <button onClick={handleAlquilar} disabled={!rango?.from || !rango?.to || enviando}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? "Enviando solicitud..." : "Confirmar solicitud"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Valoraciones */}
      {herramienta.valoraciones.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Valoraciones del vendedor
            {mediaNota && <span className="ml-2 text-[#F97316]">★ {mediaNota}</span>}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {herramienta.valoraciones.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{v.autor ? `${v.autor.nombre} ${v.autor.apellidos}` : "Usuario"}</p>
                  <Estrellas nota={v.nota} />
                </div>
                {v.comentario && <p className="text-sm text-gray-600 leading-relaxed">{v.comentario}</p>}
                <p className="text-xs text-gray-400 mt-2">{new Date(v.created_at).toLocaleDateString("es-ES")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
