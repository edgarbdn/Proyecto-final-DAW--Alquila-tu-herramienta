import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase-server";

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

  // Verificar que es admin
  const { data: perfil } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [
    { count: totalUsuarios },
    { count: totalHerramientas },
    { count: totalAlquileres },
    { data: ingresos },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("herramientas")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("alquileres")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin.from("pagos").select("importe").eq("estado", "completado"),
  ]);

  const totalIngresos = ingresos?.reduce((sum, p) => sum + p.importe, 0) ?? 0;

  return NextResponse.json({
    totalUsuarios,
    totalHerramientas,
    totalAlquileres,
    totalIngresos,
  });
}
