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

  const { data: herramientas, error } = await supabaseAdmin
    .from("herramientas")
    .select("id, nombre, precio_dia, disponible, created_at, users!herramientas_vendedor_id_fkey(nombre, apellidos)")
    .order("created_at", { ascending: false });

  if (error) return apiError("GET /admin/herramientas", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);
  return NextResponse.json({ herramientas });
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });
  const user = await verificarAdmin(token);
  if (!user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTORIZADO }, { status: 403 });

  const { herramienta_id, disponible } = await request.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabaseAdmin
    .from("herramientas")
    .update({ disponible })
    .eq("id", herramienta_id);

  if (error) return apiError("PATCH /admin/herramientas", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);
  return NextResponse.json({ ok: true });
}
