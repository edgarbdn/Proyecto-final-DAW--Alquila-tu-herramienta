import { createClient } from "@supabase/supabase-js";
import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  // Usar service role para saltar RLS y poder leer datos de otros usuarios
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabaseAdmin
    .from("mensajes")
    .select(`
      id, contenido, leido, created_at,
      de_usuario_id, para_usuario_id, herramienta_id,
      de_usuario:users!mensajes_de_usuario_id_fkey(id, nombre, apellidos, avatar_url),
      para_usuario:users!mensajes_para_usuario_id_fkey(id, nombre, apellidos, avatar_url),
      herramienta:herramientas!mensajes_herramienta_id_fkey(id, nombre, fotos(url, es_principal))
    `)
    .or(`de_usuario_id.eq.${user.id},para_usuario_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return apiError("GET /mensajes/conversaciones", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  const conversacionesMap = new Map<string, any>();

  for (const msg of data ?? []) {
    const interlocutorId = msg.de_usuario_id === user.id ? msg.para_usuario_id : msg.de_usuario_id;
    const key = `${msg.herramienta_id}__${interlocutorId}`;

    if (!conversacionesMap.has(key)) {
      const interlocutor = msg.de_usuario_id === user.id ? msg.para_usuario : msg.de_usuario;
      conversacionesMap.set(key, {
        herramienta_id: msg.herramienta_id,
        herramienta: msg.herramienta,
        interlocutor_id: interlocutorId,
        interlocutor,
        ultimo_mensaje: msg.contenido,
        ultimo_mensaje_at: msg.created_at,
        no_leidos: 0,
      });
    }

    if (msg.para_usuario_id === user.id && !msg.leido) {
      const conv = conversacionesMap.get(key);
      conv.no_leidos++;
    }
  }

  return NextResponse.json({ conversaciones: Array.from(conversacionesMap.values()) });
}
