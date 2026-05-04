import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categorias: data });
}
