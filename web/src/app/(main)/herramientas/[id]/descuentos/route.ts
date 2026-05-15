import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSideClient();

  const { data, error } = await supabase
    .from("descuentos")
    .select("id, dias_minimos, porcentaje, activo")
    .eq("herramienta_id", id)
    .order("dias_minimos", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ descuentos: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSideClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: herramienta } = await supabase
    .from("herramientas")
    .select("vendedor_id")
    .eq("id", id)
    .single();

  if (!herramienta || herramienta.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { dias_minimos, porcentaje } = body;

  if (!dias_minimos || !porcentaje) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 },
    );
  }

  if (porcentaje <= 0 || porcentaje >= 100) {
    return NextResponse.json(
      { error: "El porcentaje debe estar entre 1 y 99" },
      { status: 400 },
    );
  }

  if (dias_minimos < 2) {
    return NextResponse.json(
      { error: "Los días mínimos deben ser al menos 2" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("descuentos")
    .insert({ herramienta_id: id, dias_minimos, porcentaje })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ descuento: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSideClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const descuentoId = searchParams.get("descuento_id");

  if (!descuentoId) {
    return NextResponse.json(
      { error: "Falta el id del descuento" },
      { status: 400 },
    );
  }

  const { data: descuento } = await supabase
    .from("descuentos")
    .select("herramienta_id, herramientas!inner(vendedor_id)")
    .eq("id", descuentoId)
    .single();

  if (!descuento || (descuento.herramientas as any).vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { error } = await supabase
    .from("descuentos")
    .delete()
    .eq("id", descuentoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
