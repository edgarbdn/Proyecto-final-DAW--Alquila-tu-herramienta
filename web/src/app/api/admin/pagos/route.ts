import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase-server";

async function verificarAdmin(token: string) {
  const supabase = await createServerSideClient(token);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: perfil } = await supabase.from("users").select("rol").eq("id", user.id).single();
  return perfil?.rol === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const user = await verificarAdmin(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: pagos, error } = await supabaseAdmin
    .from("pagos")
    .select(`
      id, importe, estado, metodo, transaccion_id, created_at,
      alquileres(
        id, precio_final, dias,
        herramientas(nombre),
        users!alquileres_cliente_id_fkey(nombre, apellidos)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pagos });
}
