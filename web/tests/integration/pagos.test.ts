import { describe, it, expect, beforeAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";

let tokenCliente: string;

beforeAll(async () => {
  const cliente = await loginAndGetToken(
    process.env.TEST_USER_CLIENTE_EMAIL!,
    process.env.TEST_USER_CLIENTE_PASSWORD!,
  );
  tokenCliente = cliente.token;
});

describe("POST /api/pagos/checkout", () => {
  it("rechaza petición sin token", async () => {
    const res = await apiCall("/api/pagos/checkout", {
      method: "POST",
      body: { alquiler_id: "abc" },
    });
    expect(res.status).toBe(401);
  });

  it("rechaza si falta alquiler_id", async () => {
    const res = await apiCall("/api/pagos/checkout", {
      method: "POST",
      token: tokenCliente,
      body: {},
    });
    expect(res.status).toBe(400);
  });

  it("rechaza alquiler que no existe", async () => {
    const res = await apiCall("/api/pagos/checkout", {
      method: "POST",
      token: tokenCliente,
      body: { alquiler_id: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status).toBe(404);
  });

  // Los tests con alquileres reales que requieren llamar a Stripe se omiten
  // porque al ser modo test crearían sesiones reales en Stripe.
  // El flujo completo se valida manualmente.
  it.skip("crea sesión de checkout (skipped — probar manualmente)", () => {});
});

describe("GET /api/pagos/mis-pagos", () => {
  it("rechaza sin token", async () => {
    const res = await apiCall("/api/pagos/mis-pagos");
    expect(res.status).toBe(401);
  });

  it("devuelve los pagos del usuario autenticado", async () => {
    const res = await apiCall("/api/pagos/mis-pagos", { token: tokenCliente });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/pagos/webhook (Stripe)", () => {
  it("rechaza petición sin firma de Stripe", async () => {
    const res = await apiCall("/api/pagos/webhook", {
      method: "POST",
      body: { test: true },
    });
    // Sin signature header: el webhook devuelve 400 con error de firma
    expect(res.status).toBe(400);
  });

  it("rechaza firma de Stripe inválida", async () => {
    const res = await apiCall("/api/pagos/webhook", {
      method: "POST",
      headers: { "stripe-signature": "firma-falsa" },
      body: { test: true },
    });
    expect(res.status).toBe(400);
  });
});
