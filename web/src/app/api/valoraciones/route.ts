import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

  const { alquiler_id, destinatario_id, nota, comentario } =
    await request.json();

  if (!alquiler_id || !destinatario_id || !nota) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 },
    );
  }

  if (nota < 1 || nota > 5) {
    return NextResponse.json(
      { error: "La nota debe ser entre 1 y 5" },
      { status: 400 },
    );
  }

  // Verificar que el alquiler está finalizado
  const { data: alquiler } = await supabase
    .from("alquileres")
    .select("id, estado, cliente_id, herramientas(vendedor_id)")
    .eq("id", alquiler_id)
    .single();

  if (!alquiler) {
    return NextResponse.json(
      { error: "Alquiler no encontrado" },
      { status: 404 },
    );
  }

  if (alquiler.estado !== "finalizado") {
    return NextResponse.json(
      { error: "Solo se pueden valorar alquileres finalizados" },
      { status: 409 },
    );
  }

  const vendedorId = (
    alquiler.herramientas as unknown as { vendedor_id: string }
  )?.vendedor_id;

  // Verificar que el autor es el cliente o el vendedor
  if (user.id !== alquiler.cliente_id && user.id !== vendedorId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Verificar que no ha valorado ya este alquiler
  const { data: yaValorado } = await supabase
    .from("valoraciones")
    .select("id")
    .eq("alquiler_id", alquiler_id)
    .eq("autor_id", user.id)
    .single();

  if (yaValorado) {
    return NextResponse.json(
      { error: "Ya has valorado este alquiler" },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("valoraciones").insert({
    alquiler_id,
    autor_id: user.id,
    destinatario_id,
    nota,
    comentario,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
