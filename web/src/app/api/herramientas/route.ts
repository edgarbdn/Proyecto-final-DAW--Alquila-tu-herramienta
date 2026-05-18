import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categoria = searchParams.get("categoria");
  const ciudad = searchParams.get("ciudad");
  const nombre = searchParams.get("nombre");
  const precioMin = searchParams.get("precio_min");
  const precioMax = searchParams.get("precio_max");
  const pagina = parseInt(searchParams.get("pagina") ?? "1");
  const porPagina = parseInt(searchParams.get("limite") ?? "9");
  const aleatorio = searchParams.get("aleatorio") === "true";
  const offset = (pagina - 1) * porPagina;

  const supabase = createClient();

  // Leer comisión desde configuracion
  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "comision")
    .single();

  const comision = config ? parseFloat(config.valor) : 0.2;

  // Filtro de ciudad: buscar vendedores cuya ciudad coincida
  let vendedorIds: string[] | null = null;
  if (ciudad) {
    const { data: vendedores } = await supabase
      .from("vendedores_publicos")
      .select("id")
      .ilike("ciudad", `%${ciudad}%`);

    vendedorIds = vendedores?.map((v) => v.id) ?? [];
  }

  // Query base
  let query = supabase
    .from("herramientas")
    .select(
      `
      id,
      nombre,
      descripcion,
      precio_dia,
      disponible,
      vendedor:vendedores_publicos!vendedor_id(nombre, apellidos, ciudad),
      categoria:categorias!categoria_id(id, nombre),
      fotos(url, es_principal)
    `,
      { count: "exact" },
    )
    .eq("disponible", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + porPagina - 1);

  // Filtros opcionales
  if (nombre) query = query.ilike("nombre", `%${nombre}%`);
  if (categoria) query = query.eq("categoria_id", categoria);
  if (vendedorIds !== null) {
    if (vendedorIds.length === 0) {
      return NextResponse.json({
        herramientas: [],
        total: 0,
        pagina,
        totalPaginas: 0,
      });
    }
    query = query.in("vendedor_id", vendedorIds);
  }

  // Precio: el usuario filtra por precio público (con comisión)
  // Convertimos a precio del vendedor para filtrar en BD
  if (precioMin)
    query = query.gte("precio_dia", parseFloat(precioMin) / (1 + comision));
  if (precioMax)
    query = query.lte("precio_dia", parseFloat(precioMax) / (1 + comision));

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aplicar comisión al precio
  const herramientas = data?.map((h) => ({
    ...h,
    precio_dia_publico: parseFloat((h.precio_dia * (1 + comision)).toFixed(2)),
  }));

  return NextResponse.json({
    herramientas,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / porPagina),
  });
}
