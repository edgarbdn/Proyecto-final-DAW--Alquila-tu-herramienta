import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  //Guardo la ruta en path para luego usarla en las condiciones.
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
  if (!session && rutasProtegidas.some((r) => path.startsWith(r))) {
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
      .eq("id", session.user.id)
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
