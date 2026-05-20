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

  const { data, error } = await supabase
    .from("notificaciones")
    .select("id, titulo, mensaje, leida, created_at, enlace")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return apiError("GET /notificaciones", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ notificaciones: data });
}
