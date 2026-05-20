import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

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

  // Obtener alquileres del cliente
  const { data: alquileres } = await supabase
    .from("alquileres")
    .select("id")
    .eq("cliente_id", user.id);

  if (!alquileres || alquileres.length === 0) {
    return NextResponse.json({ pagos: [] });
  }

  const alquilerIds = alquileres.map((a) => a.id);

  const { data: pagos, error } = await supabase
    .from("pagos")
    .select(
      `
      id, importe, estado, metodo, transaccion_id, created_at,
      alquileres(fecha_inicio, fecha_fin, dias, comision_plataforma, herramientas(nombre))
    `,
    )
    .in("alquiler_id", alquilerIds)
    .order("created_at", { ascending: false });

  if (error) return apiError("GET /mis-pagos", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ pagos });
}
