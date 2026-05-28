import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

// PATCH — marcar mensajes como leídos en una conversación
export async function PATCH(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: ERROR_MESSAGES.DATOS_INVALIDOS }, { status: 400 });
  }

  const { herramienta_id, de_usuario_id } = body;

  if (!herramienta_id || !de_usuario_id) {
    return NextResponse.json({ error: ERROR_MESSAGES.CAMPOS_OBLIGATORIOS }, { status: 400 });
  }

  const { error } = await supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("herramienta_id", herramienta_id)
    .eq("de_usuario_id", de_usuario_id)
    .eq("para_usuario_id", user.id)
    .eq("leido", false);

  if (error) return apiError("PATCH /mensajes/leidos", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ ok: true });
}
