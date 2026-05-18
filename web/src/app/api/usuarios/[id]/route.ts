import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Perfil público del usuario
  const { data: usuario, error } = await supabaseAdmin
    .from("users")
    .select("id, nombre, apellidos, ciudad, direccion_publica, avatar_url")
    .eq("id", id)
    .single();

  if (error || !usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Herramientas publicadas
  const { data: herramientas } = await supabaseAdmin
    .from("herramientas")
    .select("id, nombre, precio_dia, disponible, categorias(nombre), fotos(url, es_principal)")
    .eq("vendedor_id", id)
    .eq("disponible", true)
    .order("created_at", { ascending: false });

  // Valoraciones recibidas
  const { data: valoraciones } = await supabaseAdmin
    .from("valoraciones")
    .select("id, nota, comentario, created_at, autor:users!valoraciones_autor_id_fkey(nombre, apellidos, avatar_url)")
    .eq("destinatario_id", id)
    .order("created_at", { ascending: false });

  // Calcular media
  const notas = (valoraciones ?? []).map((v) => v.nota);
  const mediaNota = notas.length > 0
    ? parseFloat((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1))
    : null;

  // Comisión para calcular precio público
  const { data: config } = await supabaseAdmin
    .from("configuracion")
    .select("valor")
    .eq("clave", "comision")
    .single();
  const comision = config ? parseFloat(config.valor) : 0.2;

  const herramientasConPrecio = (herramientas ?? []).map((h) => ({
    ...h,
    precio_dia_publico: parseFloat((h.precio_dia * (1 + comision)).toFixed(2)),
  }));

  return NextResponse.json({
    usuario,
    herramientas: herramientasConPrecio,
    valoraciones: valoraciones ?? [],
    mediaNota,
    totalValoraciones: notas.length,
  });
}
