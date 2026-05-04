import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vendedores_publicos")
    .select("ciudad")
    .not("ciudad", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Eliminar duplicados y ordenar
  const ciudades = [...new Set(data.map((v) => v.ciudad))]
    .filter(Boolean)
    .sort() as string[];

  return NextResponse.json({ ciudades });
}
