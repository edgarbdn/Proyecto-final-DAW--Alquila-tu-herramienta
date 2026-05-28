import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const herramienta_id = searchParams.get("herramienta_id");
  const con_usuario = searchParams.get("con_usuario");

  if (!herramienta_id || !con_usuario) {
    return NextResponse.json({ error: ERROR_MESSAGES.CAMPOS_OBLIGATORIOS }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mensajes")
    .select(`
      id, contenido, leido, created_at,
      de_usuario_id,
      para_usuario_id,
      de_usuario:users!mensajes_de_usuario_id_fkey(id, nombre, apellidos, avatar_url),
      para_usuario:users!mensajes_para_usuario_id_fkey(id, nombre, apellidos, avatar_url)
    `)
    .eq("herramienta_id", herramienta_id)
    .or(`de_usuario_id.eq.${user.id},para_usuario_id.eq.${user.id}`)
    .or(`de_usuario_id.eq.${con_usuario},para_usuario_id.eq.${con_usuario}`)
    .order("created_at", { ascending: true });

  if (error) return apiError("GET /mensajes", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ mensajes: data });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: ERROR_MESSAGES.DATOS_INVALIDOS }, { status: 400 });
  }

  const { para_usuario_id, herramienta_id, contenido } = body;

  if (!para_usuario_id || !herramienta_id || !contenido?.trim()) {
    return NextResponse.json({ error: ERROR_MESSAGES.CAMPOS_OBLIGATORIOS }, { status: 400 });
  }

  if (contenido.trim().length > 1000) {
    return NextResponse.json({ error: "El mensaje no puede superar los 1000 caracteres." }, { status: 400 });
  }

  // No puedes enviarte un mensaje a ti mismo
  if (para_usuario_id === user.id) {
    return NextResponse.json({ error: "No puedes enviarte un mensaje a ti mismo." }, { status: 400 });
  }

  // Verificar que la herramienta existe
  const { data: herramienta } = await supabase
    .from("herramientas")
    .select("id")
    .eq("id", herramienta_id)
    .single();

  if (!herramienta) {
    return NextResponse.json({ error: ERROR_MESSAGES.NO_ENCONTRADO }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("mensajes")
    .insert({
      de_usuario_id: user.id,
      para_usuario_id,
      herramienta_id,
      contenido: contenido.trim(),
    })
    .select()
    .single();

  if (error) return apiError("POST /mensajes", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  // Notificar al receptor
  await supabase.from("notificaciones").insert({
    usuario_id: para_usuario_id,
    titulo: "Nuevo mensaje",
    mensaje: `Tienes un nuevo mensaje sobre una herramienta.`,
    enlace: `/herramientas/${herramienta_id}`,
  });

  return NextResponse.json({ mensaje: data }, { status: 201 });
}
