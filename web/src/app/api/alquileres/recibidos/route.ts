import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

async function getUser(token: string) {
  const supabase = await createServerSideClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET — alquileres recibidos como vendedor
export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createServerSideClient(token);

  const { data, error } = await supabase
    .from("alquileres")
    .select(`
      id, fecha_inicio, fecha_fin, dias, precio_final, estado, created_at,
      herramientas(id, nombre, fotos(url, es_principal)),
      users!alquileres_cliente_id_fkey(id, nombre, apellidos, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filtrar solo los que pertenecen a herramientas del usuario
  const { data: misHerramientas } = await supabase
    .from("herramientas")
    .select("id")
    .eq("vendedor_id", user.id);

  const misIds = new Set((misHerramientas ?? []).map((h: any) => h.id));
  const filtrados = (data ?? []).filter((a: any) => misIds.has(a.herramientas?.id));

  // Buscar alquileres ya valorados por el vendedor
  const { data: valoraciones } = await supabase
    .from("valoraciones")
    .select("alquiler_id")
    .eq("autor_id", user.id);

  const yaValorados = new Set((valoraciones ?? []).map((v: any) => v.alquiler_id));

  const filtradosConValoracion = filtrados.map((a: any) => ({
    ...a,
    ya_valorado: yaValorados.has(a.id),
  }));

  return NextResponse.json({ alquileres: filtradosConValoracion });
}

// PATCH — confirmar o rechazar
export async function PATCH(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const user = await getUser(token);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { alquiler_id, estado } = await request.json();

  if (!["confirmado", "cancelado"].includes(estado)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }

  const supabase = await createServerSideClient(token);

  // Verificar que el alquiler es de una herramienta del vendedor
  const { data: alquiler } = await supabase
    .from("alquileres")
    .select("id, cliente_id, fecha_inicio, fecha_fin, herramientas(id, nombre, vendedor_id)")
    .eq("id", alquiler_id)
    .single();

  if (!alquiler) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const herramienta = alquiler.herramientas as any;
  if (herramienta?.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase
    .from("alquileres")
    .update({ estado })
    .eq("id", alquiler_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notificar al cliente
  const mensaje = estado === "confirmado"
    ? `Tu solicitud de alquiler para "${herramienta.nombre}" del ${alquiler.fecha_inicio} al ${alquiler.fecha_fin} ha sido confirmada.`
    : `Tu solicitud de alquiler para "${herramienta.nombre}" del ${alquiler.fecha_inicio} al ${alquiler.fecha_fin} ha sido rechazada.`;

  await supabase.from("notificaciones").insert({
    usuario_id: alquiler.cliente_id,
    titulo: estado === "confirmado" ? "Alquiler confirmado ✓" : "Alquiler rechazado",
    mensaje,
  });

  return NextResponse.json({ ok: true });
}
