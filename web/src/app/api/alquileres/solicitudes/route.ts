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

  // Primero obtenemos las herramientas del vendedor
  const { data: herramientas } = await supabase
    .from("herramientas")
    .select("id")
    .eq("vendedor_id", user.id);

  if (!herramientas || herramientas.length === 0) {
    return NextResponse.json({ alquileres: [] });
  }

  const herramientaIds = herramientas.map((h) => h.id);

  const { data: alquileres, error } = await supabase
    .from("alquileres")
    .select(
      `
      id, fecha_inicio, fecha_fin, dias, precio_final, estado,
      cliente:users!alquileres_cliente_id_fkey(nombre, apellidos),
      herramientas(nombre)
    `,
    )
    .in("herramienta_id", herramientaIds)
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ alquileres });
}
