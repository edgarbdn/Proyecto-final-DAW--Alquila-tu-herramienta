import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

  // Obtener herramientas del vendedor
  const { data: herramientas } = await supabase
    .from("herramientas")
    .select("id")
    .eq("vendedor_id", user.id);

  if (!herramientas || herramientas.length === 0) {
    return NextResponse.json({ ganancias: [] });
  }

  const herramientaIds = herramientas.map((h) => h.id);

  // Obtener alquileres de esas herramientas
  const { data: alquileres } = await supabase
    .from("alquileres")
    .select("id")
    .in("herramienta_id", herramientaIds);

  if (!alquileres || alquileres.length === 0) {
    return NextResponse.json({ ganancias: [] });
  }

  const alquilerIds = alquileres.map((a) => a.id);

  // Obtener pagos de esos alquileres
  const { data: ganancias, error } = await supabase
    .from("pagos")
    .select(
      `
      id, importe, estado, metodo, transaccion_id, created_at,
      alquileres(fecha_inicio, fecha_fin, dias, comision_plataforma, herramientas(nombre))
    `,
    )
    .in("alquiler_id", alquilerIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ganancias });
}
