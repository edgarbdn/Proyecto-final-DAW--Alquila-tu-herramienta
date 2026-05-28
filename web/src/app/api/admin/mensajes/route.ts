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
  const admin = await verificarAdmin(token);
  if (!admin) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTORIZADO }, { status: 403 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { searchParams } = new URL(request.url);
  const herramienta_id = searchParams.get("herramienta_id");
  const usuario1 = searchParams.get("usuario1");
  const usuario2 = searchParams.get("usuario2");

  if (herramienta_id && usuario1 && usuario2) {
    const { data, error } = await supabaseAdmin
      .from("mensajes")
      .select(`
        id, contenido, leido, created_at,
        de_usuario_id, para_usuario_id,
        de_usuario:users!mensajes_de_usuario_id_fkey(id, nombre, apellidos, avatar_url),
        para_usuario:users!mensajes_para_usuario_id_fkey(id, nombre, apellidos, avatar_url)
      `)
      .eq("herramienta_id", herramienta_id)
      .or(`and(de_usuario_id.eq.${usuario1},para_usuario_id.eq.${usuario2}),and(de_usuario_id.eq.${usuario2},para_usuario_id.eq.${usuario1})`)
      .order("created_at", { ascending: true });

    if (error) return apiError("GET /admin/mensajes conversacion", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);
    return NextResponse.json({ mensajes: data });
  }

  const { data, error } = await supabaseAdmin
    .from("mensajes")
    .select(`
      id, contenido, leido, created_at,
      de_usuario_id, para_usuario_id, herramienta_id,
      de_usuario:users!mensajes_de_usuario_id_fkey(id, nombre, apellidos),
      para_usuario:users!mensajes_para_usuario_id_fkey(id, nombre, apellidos),
      herramienta:herramientas!mensajes_herramienta_id_fkey(id, nombre)
    `)
    .order("created_at", { ascending: false });

  if (error) return apiError("GET /admin/mensajes", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  const convMap = new Map<string, any>();
  for (const msg of data ?? []) {
    const ids = [msg.de_usuario_id, msg.para_usuario_id].sort();
    const key = `${msg.herramienta_id}__${ids[0]}__${ids[1]}`;
    if (!convMap.has(key)) {
      convMap.set(key, {
        herramienta_id: msg.herramienta_id,
        herramienta: msg.herramienta,
        usuario1_id: msg.de_usuario_id,
        usuario1: msg.de_usuario,
        usuario2_id: msg.para_usuario_id,
        usuario2: msg.para_usuario,
        ultimo_mensaje: msg.contenido,
        ultimo_mensaje_at: msg.created_at,
        total_mensajes: 0,
      });
    }
    convMap.get(key).total_mensajes++;
  }

  return NextResponse.json({ conversaciones: Array.from(convMap.values()) });
}
