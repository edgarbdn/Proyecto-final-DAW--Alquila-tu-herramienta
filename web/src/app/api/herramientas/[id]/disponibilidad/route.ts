import { createClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createClient();

  // Traer alquileres activos y confirmados
  const { data, error } = await supabase
    .from("alquileres")
    .select("fecha_inicio, fecha_fin")
    .eq("herramienta_id", id)
    .in("estado", ["confirmado", "activo"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generar array de fechas ocupadas
  const fechasOcupadas: string[] = [];

  for (const alquiler of data ?? []) {
    const inicio = new Date(alquiler.fecha_inicio);
    const fin = new Date(alquiler.fecha_fin);

    const actual = new Date(inicio);
    while (actual <= fin) {
      fechasOcupadas.push(actual.toISOString().split("T")[0]);
      actual.setDate(actual.getDate() + 1);
    }
  }

  return NextResponse.json({ fechasOcupadas });
}
