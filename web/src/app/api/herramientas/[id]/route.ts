import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createClient();

  // Leer comisión
  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "comision")
    .single();

  const comision = config ? parseFloat(config.valor) : 0.2;

  // Herramienta con fotos, vendedor y categoría
  const { data: herramienta, error } = await supabase
    .from("herramientas")
    .select(
      `
      id,
      nombre,
      descripcion,
      precio_dia,
      disponible,
      vendedor:vendedores_publicos!vendedor_id(id, nombre, apellidos, ciudad, direccion_publica, avatar_url),
      categoria:categorias!categoria_id(id, nombre),
      fotos(id, url, es_principal, orden)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !herramienta) {
    return NextResponse.json(
      { error: "Herramienta no encontrada" },
      { status: 404 },
    );
  }

  // Valoraciones del vendedor
  const { data: valoraciones } = await supabase
    .from("valoraciones")
    .select(
      `
      id,
      nota,
      comentario,
      created_at,
      autor:users!autor_id(nombre, apellidos)
    `,
    )
    .eq("destinatario_id", (herramienta.vendedor as any)?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Descuentos de la herramienta
  const { data: descuentos } = await supabase
    .from("descuentos")
    .select("id, dias_minimos, porcentaje")
    .eq("herramienta_id", id)
    .eq("activo", true)
    .order("dias_minimos", { ascending: true });

  // Horarios de recogida
  const { data: horarios } = await supabase
    .from("horarios_recogida")
    .select("id, hora")
    .eq("herramienta_id", id)
    .order("hora", { ascending: true });

  // Ordenar fotos: principal primero, luego por orden
  const fotosOrdenadas = [...(herramienta.fotos ?? [])].sort((a, b) => {
    if (a.es_principal) return -1;
    if (b.es_principal) return 1;
    return a.orden - b.orden;
  });

  return NextResponse.json({
    ...herramienta,
    fotos: fotosOrdenadas,
    precio_dia_publico: parseFloat(
      (herramienta.precio_dia * (1 + comision)).toFixed(2),
    ),
    valoraciones: valoraciones ?? [],
    descuentos: descuentos ?? [],
    horarios: horarios ?? [],
  });
}
