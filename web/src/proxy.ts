import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // getUser() verifica la sesión contra el servidor de Supabase
  // evita race conditions al volver de Stripe u otras redirecciones externas
  const { data: { user } } = await supabase.auth.getUser();
  const session = user ? { user } : null;

  const path = request.nextUrl.pathname;

  // Si estás logueado e intentas ir a /login o /register, redirige a /
  if (session && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Rutas protegidas para usuarios no autenticados
  const rutasProtegidas = [
    "/perfil",
    "/herramientas/nueva",
    "/mis-herramientas",
    "/mis-alquileres",
    "/solicitudes",
    "/notificaciones",
  ];

  // Al volver de Stripe, la cookie puede no estar lista en el primer request.
  // Permitimos el acceso — la página carga en cliente y verifica la sesión por su cuenta.
  const esVueltaDePago = path === "/mis-alquileres" && request.nextUrl.searchParams.has("pago");

  if (!session && !esVueltaDePago && rutasProtegidas.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas con patrón dinámico: /herramientas/[id]/editar
  if (!session && /^\/herramientas\/[^\/]+\/editar/.test(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si intentas ir a /admin sin sesión, redirige a /login
  if (!session && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si intentas ir a /admin pero no eres admin, redirige a /
  if (session && path.startsWith("/admin")) {
    const { data: perfil } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user!.id)
      .single();

    if (perfil?.rol !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
