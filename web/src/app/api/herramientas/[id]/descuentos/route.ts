import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { apiError, ERROR_MESSAGES } from "@/lib/api-error";

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

  if (error) return apiError("GET /descuentos", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ descuentos: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const { data: herramienta } = await supabase
    .from("herramientas")
    .select("vendedor_id")
    .eq("id", id)
    .single();

  if (!herramienta || herramienta.vendedor_id !== user.id)
    return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTORIZADO }, { status: 403 });

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: ERROR_MESSAGES.DATOS_INVALIDOS }, { status: 400 });
  }

  const dias_minimos = parseInt(body.dias_minimos);
  const porcentaje = parseFloat(body.porcentaje);

  if (isNaN(dias_minimos) || isNaN(porcentaje))
    return NextResponse.json({ error: "Los días mínimos y el porcentaje deben ser números válidos." }, { status: 400 });

  if (dias_minimos < 2)
    return NextResponse.json({ error: "Los días mínimos deben ser al menos 2." }, { status: 400 });

  if (porcentaje <= 0 || porcentaje >= 100)
    return NextResponse.json({ error: "El descuento debe estar entre 1% y 99%." }, { status: 400 });

  const { data, error } = await supabase
    .from("descuentos")
    .insert({ herramienta_id: id, dias_minimos, porcentaje })
    .select()
    .single();

  if (error) return apiError("POST /descuentos", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ descuento: data }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTENTICADO }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const descuentoId = searchParams.get("descuento_id");

  if (!descuentoId)
    return NextResponse.json({ error: ERROR_MESSAGES.CAMPOS_OBLIGATORIOS }, { status: 400 });

  const { data: descuento } = await supabase
    .from("descuentos")
    .select("herramienta_id, herramientas!inner(vendedor_id)")
    .eq("id", descuentoId)
    .single();

  if (!descuento || (descuento.herramientas as any).vendedor_id !== user.id)
    return NextResponse.json({ error: ERROR_MESSAGES.NO_AUTORIZADO }, { status: 403 });

  const { error } = await supabase.from("descuentos").delete().eq("id", descuentoId);

  if (error) return apiError("DELETE /descuentos", error, 500, ERROR_MESSAGES.ERROR_SERVIDOR);

  return NextResponse.json({ ok: true });
}
