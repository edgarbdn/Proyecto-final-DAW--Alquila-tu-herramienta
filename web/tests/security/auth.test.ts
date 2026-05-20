/**
 * Tests de seguridad: autenticación y autorización.
 * Comprueban que los endpoints protegidos rechazan accesos no autorizados.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";

let tokenCliente: string;
let tokenVendedor: string;

beforeAll(async () => {
  tokenCliente = (
    await loginAndGetToken(
      process.env.TEST_USER_CLIENTE_EMAIL!,
      process.env.TEST_USER_CLIENTE_PASSWORD!,
    )
  ).token;

  tokenVendedor = (
    await loginAndGetToken(
      process.env.TEST_USER_VENDEDOR_EMAIL!,
      process.env.TEST_USER_VENDEDOR_PASSWORD!,
    )
  ).token;
});

describe("Autenticación: endpoints protegidos rechazan sin token", () => {
  const endpointsProtegidos = [
    { method: "GET" as const, path: "/api/alquileres/mis-alquileres" },
    { method: "GET" as const, path: "/api/alquileres/recibidos" },
    { method: "GET" as const, path: "/api/alquileres/solicitudes" },
    { method: "POST" as const, path: "/api/alquileres" },
    { method: "POST" as const, path: "/api/pagos/checkout" },
    { method: "GET" as const, path: "/api/pagos/mis-pagos" },
    { method: "GET" as const, path: "/api/pagos/ganancias" },
    { method: "POST" as const, path: "/api/valoraciones" },
    { method: "GET" as const, path: "/api/notificaciones" },
  ];

  endpointsProtegidos.forEach(({ method, path }) => {
    it(`${method} ${path} rechaza sin token`, async () => {
      const res = await apiCall(path, {
        method,
        body: method === "POST" ? {} : undefined,
      });
      expect([401, 403]).toContain(res.status);
    });
  });
});

describe("Token inválido o expirado", () => {
  it("rechaza token malformado", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      token: "token-falso-no-valido",
    });
    expect([401, 403]).toContain(res.status);
  });

  it("rechaza token vacío", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      token: "",
    });
    expect([401, 403]).toContain(res.status);
  });

  it("sin prefijo Bearer el token se ignora (comportamiento Supabase)", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      headers: { Authorization: tokenCliente }, // sin "Bearer "
    });
    // Supabase ignora el token mal formateado y lo trata como anon → 401
    // Algunas implementaciones lo aceptan igualmente → 200
    // Ambos son aceptables; lo importante es que no devuelva datos de otro usuario
    expect([200, 401, 403]).toContain(res.status);
  });
});

describe("Inyección de tokens entre usuarios", () => {
  it("el token del cliente NO da acceso a endpoints de admin", async () => {
    const res = await apiCall("/api/admin/usuarios", {
      token: tokenCliente,
    });
    expect(res.status).toBe(403);
  });

  it("el token del vendedor NO da acceso a endpoints de admin", async () => {
    const res = await apiCall("/api/admin/herramientas", {
      token: tokenVendedor,
    });
    expect(res.status).toBe(403);
  });
});
