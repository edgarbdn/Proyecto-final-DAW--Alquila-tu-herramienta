import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const alquiler_id = session.metadata?.alquiler_id;
    const cliente_id = session.metadata?.cliente_id;

    if (!alquiler_id) {
      return NextResponse.json({ error: "No alquiler_id" }, { status: 400 });
    }

    // Usar cliente de servicio para saltarse RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Actualizar estado del alquiler a "activo"
    await supabase
      .from("alquileres")
      .update({ estado: "activo" })
      .eq("id", alquiler_id);

    // Obtener vendedor_id del alquiler
    const { data: alquiler } = await supabase
      .from("alquileres")
      .select("herramientas!inner(vendedor_id)")
      .eq("id", alquiler_id)
      .single();
    const vendedor_id = (alquiler?.herramientas as any)?.vendedor_id;

    // Registrar el pago
    await supabase.from("pagos").insert({
      alquiler_id,
      transaccion_id: session.payment_intent,
      importe: session.amount_total ? session.amount_total / 100 : 0,
      estado: "completado",
      metodo: "tarjeta",
    });

    // Notificar al cliente
    if (cliente_id) {
      await supabase.from("notificaciones").insert({
        usuario_id: cliente_id,
        titulo: "Pago completado",
        mensaje: "Tu pago se ha procesado correctamente. ¡Disfruta del alquiler!",
        enlace: "/mis-alquileres",
      });
    }

    // Notificar al vendedor
    if (vendedor_id) {
      await supabase.from("notificaciones").insert({
        usuario_id: vendedor_id,
        titulo: "Pago recibido",
        mensaje: "El cliente ha realizado el pago. El alquiler ya está activo.",
        enlace: "/solicitudes",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
