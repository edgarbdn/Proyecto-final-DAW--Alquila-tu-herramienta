import { stripe } from "@/lib/stripe";
import { createServerSideClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = await createServerSideClient(token);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { alquiler_id } = await request.json();

  if (!alquiler_id) {
    return NextResponse.json({ error: "Falta alquiler_id" }, { status: 400 });
  }

  // Obtener el alquiler
  const { data: alquiler } = await supabase
    .from("alquileres")
    .select("id, precio_final, estado, cliente_id, herramientas(nombre)")
    .eq("id", alquiler_id)
    .single();

  if (!alquiler) {
    return NextResponse.json(
      { error: "Alquiler no encontrado" },
      { status: 404 },
    );
  }

  if (alquiler.cliente_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (alquiler.estado !== "confirmado") {
    return NextResponse.json(
      { error: "Solo se pueden pagar alquileres confirmados" },
      { status: 409 },
    );
  }

  const herramienta = (Array.isArray(alquiler.herramientas) ? alquiler.herramientas[0] : alquiler.herramientas) as { nombre: string };

  // Crear sesión de Stripe Checkout
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Alquiler: ${herramienta.nombre}`,
          },
          unit_amount: Math.round(alquiler.precio_final * 100), // Stripe trabaja en céntimos
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/mis-alquileres?pago=exitoso`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/mis-alquileres?pago=cancelado`,
    metadata: {
      alquiler_id,
      cliente_id: user.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
