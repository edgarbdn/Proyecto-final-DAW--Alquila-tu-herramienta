import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase-server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

async function verificarAdmin(token: string) {
  const supabase = await createServerSideClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: perfil } = await supabase.from("users").select("rol").eq("id", user.id).single();
  return perfil?.rol === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });
  const user = await verificarAdmin(token);
  if (!user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTORIZADO }, { status: 403 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: alquileres, error } = await supabaseAdmin
    .from("alquileres")
    .select(`
      id, fecha_inicio, fecha_fin, dias, precio_final, estado, created_at,
      herramientas(nombre),
      users!alquileres_cliente_id_fkey(nombre, apellidos)
    `)
    .order("created_at", { ascending: false });

  if (error) return apiError("GET /admin/alquileres", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);
  return NextResponse.json({ alquileres });
}
