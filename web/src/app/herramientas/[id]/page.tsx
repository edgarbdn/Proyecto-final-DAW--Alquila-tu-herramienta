"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { DayPicker, DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { createClient } from "@/lib/supabase";

interface Foto {
  id: string;
  url: string;
  es_principal: boolean;
  orden: number;
}

interface Vendedor {
  id: string;
  nombre: string;
  apellidos: string;
  ciudad: string | null;
  direccion_publica: string | null;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Valoracion {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  autor: { nombre: string; apellidos: string } | null;
}

interface Descuento {
  id: string;
  dias_minimos: number;
  porcentaje: number;
}

interface Herramienta {
  id: string;
  nombre: string;
  descripcion: string;
  precio_dia: number;
  precio_dia_publico: number;
  disponible: boolean;
  vendedor: Vendedor | null;
  categoria: Categoria;
  fotos: Foto[];
  valoraciones: Valoracion[];
  descuentos: Descuento[];
}

export default function DetalleHerramientaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [herramienta, setHerramienta] = useState<Herramienta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoActiva, setFotoActiva] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Calendario
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

    fetch(`/api/herramientas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setHerramienta(data);
        setFotoActiva(data.fotos?.[0]?.url ?? null);
        setLoading(false);
      });

    fetch(`/api/herramientas/${id}/disponibilidad`)
      .then((r) => r.json())
      .then((data) => {
        const fechas = (data.fechasOcupadas ?? []).map(
          (f: string) => new Date(f),
        );
        setFechasOcupadas(fechas);
      });
  }, [id]);

  if (loading) return <p className="p-8">Cargando...</p>;
  if (!herramienta) return <p className="p-8">Herramienta no encontrada.</p>;

  const mediaNota =
    herramienta.valoraciones.length > 0
      ? (
          herramienta.valoraciones.reduce((acc, v) => acc + v.nota, 0) /
          herramienta.valoraciones.length
        ).toFixed(1)
      : null;

  // Calcular precio estimado según rango seleccionado
  function calcularPrecio() {
    if (!rango?.from || !rango?.to || !herramienta) return null;

    const dias = Math.ceil(
      (rango.to.getTime() - rango.from.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (dias <= 0) return null;

    const precioDia = herramienta.precio_dia;
    const comision = 0.2; // referencial, el cálculo real es en servidor

    // Buscar mejor descuento aplicable
    const descuento = herramienta.descuentos
      .filter((d) => d.dias_minimos <= dias)
      .sort((a, b) => b.dias_minimos - a.dias_minimos)[0];

    const porcentaje = descuento ? descuento.porcentaje : 0;
    const precioVendedor = precioDia * (1 - porcentaje / 100) * dias;
    const precioFinal = precioVendedor * (1 + comision);

    return { dias, porcentaje, precioFinal: precioFinal.toFixed(2) };
  }

  const resumen = calcularPrecio();

  async function handleAlquilar() {
    if (!rango?.from || !rango?.to || !token) return;
    setEnviando(true);
    setErrorAlquiler("");

    const fecha_inicio = rango.from.toISOString().split("T")[0];
    const fecha_fin = rango.to.toISOString().split("T")[0];

    const res = await fetch("/api/alquileres", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ herramienta_id: id, fecha_inicio, fecha_fin }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorAlquiler(data.error);
    } else {
      setExito(true);
    }

    setEnviando(false);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/herramientas"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <div>
          <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden mb-3">
            {fotoActiva ? (
              <Image
                src={fotoActiva}
                alt={herramienta.nombre}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sin foto
              </div>
            )}
          </div>
          {herramienta.fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {herramienta.fotos.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFotoActiva(f.url)}
                  className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 ${
                    fotoActiva === f.url
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <Image src={f.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-400 mb-1">
            {herramienta.categoria.nombre}
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {herramienta.nombre}
          </h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            {herramienta.precio_dia_publico}€/día
          </p>
          <p className="text-gray-600 mb-6">{herramienta.descripcion}</p>

          {/* Vendedor */}
          {herramienta.vendedor && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-gray-700 mb-2">Vendedor</h2>
              <p className="text-gray-800">
                {herramienta.vendedor.nombre} {herramienta.vendedor.apellidos}
              </p>
              {herramienta.vendedor.ciudad && (
                <p className="text-sm text-gray-500">
                  {herramienta.vendedor.ciudad}
                </p>
              )}
              {herramienta.vendedor.direccion_publica && (
                <p className="text-sm text-gray-500">
                  {herramienta.vendedor.direccion_publica}
                </p>
              )}
              {mediaNota && (
                <p className="text-sm text-yellow-500 mt-1">
                  ★ {mediaNota} / 5
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sección de alquiler */}
      {herramienta.disponible && (
        <div className="mt-10 border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Solicitar alquiler</h2>

          {exito ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold">
                ¡Solicitud enviada correctamente!
              </p>
              <p className="text-green-600 text-sm mt-1">
                El vendedor recibirá tu solicitud y la confirmará en breve.
              </p>
              <Link
                href="/alquileres/mis-alquileres"
                className="text-blue-600 text-sm hover:underline mt-2 block"
              >
                Ver mis alquileres →
              </Link>
            </div>
          ) : !usuarioId ? (
            <div>
              <p className="text-gray-600 mb-3">
                Debes iniciar sesión para alquilar esta herramienta.
              </p>
              <button
                onClick={() =>
                  router.push(`/login?redirect=/herramientas/${id}`)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Iniciar sesión
              </button>
            </div>
          ) : usuarioId === herramienta.vendedor?.id ? (
            <p className="text-gray-500 text-sm">
              No puedes alquilar tu propia herramienta.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona las fechas en el calendario. Los días en rojo no
                están disponibles.
              </p>
              <DayPicker
                mode="range"
                selected={rango}
                onSelect={setRango}
                locale={es}
                disabled={[{ before: new Date() }, ...fechasOcupadas]}
                modifiers={{ ocupado: fechasOcupadas }}
                modifiersClassNames={{ ocupado: "rdp-day--ocupado" }}
                showOutsideDays
              />

              {resumen && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>{resumen.dias} días</strong>
                    {resumen.porcentaje > 0 && (
                      <span className="text-green-600 ml-2">
                        ({resumen.porcentaje}% descuento aplicado)
                      </span>
                    )}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {resumen.precioFinal}€ total
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Precio final con comisión incluida
                  </p>
                </div>
              )}

              {errorAlquiler && (
                <p className="text-red-500 text-sm mt-3">{errorAlquiler}</p>
              )}

              <button
                onClick={handleAlquilar}
                disabled={!rango?.from || !rango?.to || enviando}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {enviando ? "Enviando solicitud..." : "Confirmar solicitud"}
              </button>
            </>
          )}
        </div>
      )}

      {!herramienta.disponible && (
        <div className="mt-10">
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
          >
            No disponible
          </button>
        </div>
      )}

      {/* Descuentos */}
      {herramienta.descuentos.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Descuentos por días</h2>
          <div className="space-y-2">
            {herramienta.descuentos.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border rounded-lg px-4 py-3 bg-green-50"
              >
                <p className="text-sm text-gray-700">
                  A partir de <strong>{d.dias_minimos} días</strong>
                </p>
                <span className="text-green-600 font-bold">
                  {d.porcentaje}% dto.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Valoraciones */}
      {herramienta.valoraciones.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Valoraciones del vendedor</h2>
          <div className="space-y-4">
            {herramienta.valoraciones.map((v) => (
              <div key={v.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-700">
                    {v.autor
                      ? `${v.autor.nombre} ${v.autor.apellidos}`
                      : "Usuario"}
                  </p>
                  <p className="text-yellow-500">
                    {"★".repeat(v.nota)}
                    {"☆".repeat(5 - v.nota)}
                  </p>
                </div>
                {v.comentario && (
                  <p className="text-sm text-gray-600">{v.comentario}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(v.created_at).toLocaleDateString("es-ES")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
