import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = await createServerSideClient(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { herramienta_id, fecha_inicio, fecha_fin } = body;

  if (!herramienta_id || !fecha_inicio || !fecha_fin) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 },
    );
  }

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  if (inicio >= fin) {
    return NextResponse.json(
      { error: "La fecha de fin debe ser posterior a la de inicio" },
      { status: 400 },
    );
  }

  const hoy = new Date().toISOString().split("T")[0];

  if (fecha_inicio < hoy) {
    return NextResponse.json(
      { error: "La fecha de inicio no puede ser en el pasado" },
      { status: 400 },
    );
  }

  // Calcular días
  const dias = Math.ceil(
    (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Verificar solapamiento con alquileres existentes
  const { data: solapados } = await supabase
    .from("alquileres")
    .select("id")
    .eq("herramienta_id", herramienta_id)
    .in("estado", ["confirmado", "activo"])
    .lte("fecha_inicio", fecha_fin)
    .gte("fecha_fin", fecha_inicio);

  if (solapados && solapados.length > 0) {
    return NextResponse.json(
      { error: "Las fechas seleccionadas no están disponibles" },
      { status: 409 },
    );
  }

  // Obtener herramienta y comisión
  const [{ data: herramienta }, { data: config }] = await Promise.all([
    supabase
      .from("herramientas")
      .select("precio_dia, vendedor_id")
      .eq("id", herramienta_id)
      .single(),
    supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "comision")
      .single(),
  ]);

  if (!herramienta) {
    return NextResponse.json(
      { error: "Herramienta no encontrada" },
      { status: 404 },
    );
  }

  // Verificar que el cliente no es el vendedor
  if (herramienta.vendedor_id === user.id) {
    return NextResponse.json(
      { error: "No puedes alquilar tu propia herramienta" },
      { status: 403 },
    );
  }

  const comision = config ? parseFloat(config.valor) : 0.2;
  const precioDia = parseFloat(herramienta.precio_dia);

  // Buscar el mejor descuento aplicable
  const { data: descuentos } = await supabase
    .from("descuentos")
    .select("dias_minimos, porcentaje")
    .eq("herramienta_id", herramienta_id)
    .eq("activo", true)
    .lte("dias_minimos", dias)
    .order("dias_minimos", { ascending: false })
    .limit(1);

  const descuento = descuentos?.[0] ?? null;
  const porcentajeDescuento = descuento ? parseFloat(descuento.porcentaje) : 0;

  // Calcular precio: (precio_dia_vendedor × (1 - descuento/100) × dias) × (1 + comision)
  const precioVendedor = precioDia * (1 - porcentajeDescuento / 100) * dias;
  const precioFinal = parseFloat((precioVendedor * (1 + comision)).toFixed(2));
  const comisionPlataforma = parseFloat(
    (precioFinal - precioVendedor).toFixed(2),
  );

  // Crear alquiler
  const { data: alquiler, error: errorAlquiler } = await supabase
    .from("alquileres")
    .insert({
      herramienta_id,
      cliente_id: user.id,
      fecha_inicio,
      fecha_fin,
      dias,
      precio_dia: precioDia,
      comision_plataforma: comisionPlataforma,
      precio_final: precioFinal,
      estado: "pendiente",
    })
    .select()
    .single();

  if (errorAlquiler) {
    return NextResponse.json({ error: errorAlquiler.message }, { status: 500 });
  }

  // Notificar al vendedor
  await supabase.from("notificaciones").insert({
    usuario_id: herramienta.vendedor_id,
    titulo: "Nueva solicitud de alquiler",
    mensaje: `Tienes una nueva solicitud de alquiler para tu herramienta del ${fecha_inicio} al ${fecha_fin}.`,
  });

  return NextResponse.json({ alquiler }, { status: 201 });
}
