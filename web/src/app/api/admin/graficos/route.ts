import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase-server";

// Verifica que el usuario es admin
async function verificarAdmin(token: string) {
  const supabase = await createServerSideClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: perfil } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();
  return perfil?.rol === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await verificarAdmin(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") ?? "mes"; // dia | mes | año | rango
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Calcular rango de fechas según período
  const ahora = new Date();
  let fechaDesde: Date;
  let fechaHasta: Date = ahora;
  let formatoAgrupacion: "day" | "month" | "year";

  if (periodo === "rango" && desde && hasta) {
    fechaDesde = new Date(desde);
    fechaHasta = new Date(hasta);
    // Si el rango es mayor de 60 días agrupamos por mes, si es mayor de 2 años por año
    const dias = (fechaHasta.getTime() - fechaDesde.getTime()) / (1000 * 60 * 60 * 24);
    formatoAgrupacion = dias <= 60 ? "day" : dias <= 730 ? "month" : "year";
  } else if (periodo === "dia") {
    fechaDesde = new Date(ahora);
    fechaDesde.setDate(ahora.getDate() - 29);
    formatoAgrupacion = "day";
  } else if (periodo === "año") {
    fechaDesde = new Date(ahora);
    fechaDesde.setFullYear(ahora.getFullYear() - 4);
    formatoAgrupacion = "year";
  } else {
    // mes por defecto
    fechaDesde = new Date(ahora);
    fechaDesde.setMonth(ahora.getMonth() - 11);
    formatoAgrupacion = "month";
  }

  const desdeISO = fechaDesde.toISOString();
  const hastaISO = fechaHasta.toISOString();

  // Alquileres en el rango con su pago
  const { data: alquileres } = await supabaseAdmin
    .from("alquileres")
    .select("created_at, estado, pagos(importe, estado)")
    .gte("created_at", desdeISO)
    .lte("created_at", hastaISO)
    .order("created_at", { ascending: true });

  // Herramientas por categoría
  const { data: herramientasCat } = await supabaseAdmin
    .from("herramientas")
    .select("categoria_id, categorias(nombre)")
    .eq("disponible", true);

  // Agrupar alquileres por período
  const mapaAlquileres: Record<string, { alquileres: number; ingresos: number; comision: number }> = {};

  for (const a of alquileres ?? []) {
    const fecha = new Date(a.created_at);
    let clave: string;

    if (formatoAgrupacion === "day") {
      clave = fecha.toISOString().slice(0, 10);
    } else if (formatoAgrupacion === "month") {
      clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    } else {
      clave = String(fecha.getFullYear());
    }

    if (!mapaAlquileres[clave]) {
      mapaAlquileres[clave] = { alquileres: 0, ingresos: 0, comision: 0 };
    }
    mapaAlquileres[clave].alquileres += 1;
    const pago = (a as any).pagos?.[0];
    if (pago?.estado === "completado") {
      const importe = Number(pago.importe);
      const comision = parseFloat((importe * 0.2 / 1.2).toFixed(2));
      mapaAlquileres[clave].comision += comision;
      mapaAlquileres[clave].ingresos += parseFloat((importe - comision).toFixed(2));
    }
  }

  // Convertir a array ordenado
  const graficoPrincipal = Object.entries(mapaAlquileres)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valores]) => ({
      fecha,
      alquileres: valores.alquileres,
      ingresos: parseFloat(valores.ingresos.toFixed(2)),
      comision: parseFloat(valores.comision.toFixed(2)),
    }));

  // Herramientas por categoría agrupadas
  const mapaCategorias: Record<string, number> = {};
  for (const h of herramientasCat ?? []) {
    const nombre = (h.categorias as any)?.nombre ?? "Sin categoría";
    mapaCategorias[nombre] = (mapaCategorias[nombre] ?? 0) + 1;
  }

  const graficoCategorias = Object.entries(mapaCategorias)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    graficoPrincipal,
    graficoCategorias,
    periodo,
    formatoAgrupacion,
    desde: desdeISO,
    hasta: hastaISO,
  });
}
