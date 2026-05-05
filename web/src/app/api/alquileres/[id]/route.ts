import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
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

  const { estado } = await request.json();

  if (!["confirmado", "cancelado"].includes(estado)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }

  // Verificar que el alquiler existe
  const { data: alquiler } = await supabase
    .from("alquileres")
    .select("id, estado, cliente_id, herramienta_id")
    .eq("id", id)
    .single();

  if (!alquiler) {
    return NextResponse.json(
      { error: "Alquiler no encontrado" },
      { status: 404 },
    );
  }

  // Verificar que el usuario es el vendedor de la herramienta
  const { data: herramienta } = await supabase
    .from("herramientas")
    .select("vendedor_id, nombre")
    .eq("id", alquiler.herramienta_id)
    .single();

  if (!herramienta || herramienta.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (alquiler.estado !== "pendiente") {
    return NextResponse.json(
      { error: "Solo se pueden gestionar solicitudes pendientes" },
      { status: 409 },
    );
  }

  // Actualizar estado
  const { error: updateError } = await supabase
    .from("alquileres")
    .update({ estado })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notificar al cliente
  const mensaje =
    estado === "confirmado"
      ? `Tu solicitud de alquiler para "${herramienta.nombre}" ha sido confirmada.`
      : `Tu solicitud de alquiler para "${herramienta.nombre}" ha sido cancelada.`;

  await supabase.from("notificaciones").insert({
    usuario_id: alquiler.cliente_id,
    titulo:
      estado === "confirmado" ? "Alquiler confirmado" : "Alquiler cancelado",
    mensaje,
  });

  return NextResponse.json({ ok: true });
}
