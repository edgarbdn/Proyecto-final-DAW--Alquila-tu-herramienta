import { createClient } from "@supabase/supabase-js";
import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createServerSideClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabaseAdmin
    .from("alquileres")
    .select(`
      id, fecha_inicio, fecha_fin, dias, precio_final, estado, created_at,
      herramientas(
        id, nombre,
        fotos(url, es_principal),
        users!herramientas_vendedor_id_fkey(id, nombre, apellidos, avatar_url)
      )
    `)
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Buscar alquileres ya valorados por este usuario
  const { data: valoraciones } = await supabaseAdmin
    .from("valoraciones")
    .select("alquiler_id")
    .eq("autor_id", user.id);

  const yaValorados = new Set((valoraciones ?? []).map((v: any) => v.alquiler_id));

  const alquileresConValoracion = (data ?? []).map((a: any) => ({
    ...a,
    ya_valorado: yaValorados.has(a.id),
  }));

  return NextResponse.json({ alquileres: alquileresConValoracion });
}
