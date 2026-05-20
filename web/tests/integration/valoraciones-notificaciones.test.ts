import { describe, it, expect, beforeAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";

let tokenCliente: string;
let userIdCliente: string;

beforeAll(async () => {
  const cliente = await loginAndGetToken(
    process.env.TEST_USER_CLIENTE_EMAIL!,
    process.env.TEST_USER_CLIENTE_PASSWORD!,
  );
  tokenCliente = cliente.token;
  userIdCliente = cliente.userId;
});

describe("POST /api/valoraciones", () => {
  it("rechaza sin token", async () => {
    const res = await apiCall("/api/valoraciones", {
      method: "POST",
      body: { alquiler_id: "x", destinatario_id: "x", nota: 5 },
    });
    expect(res.status).toBe(401);
  });

  it("rechaza si faltan campos obligatorios", async () => {
    const res = await apiCall("/api/valoraciones", {
      method: "POST",
      token: tokenCliente,
      body: { alquiler_id: "x" },
    });
    expect(res.status).toBe(400);
  });

  it("rechaza nota fuera de rango (>5)", async () => {
    const res = await apiCall("/api/valoraciones", {
      method: "POST",
      token: tokenCliente,
      body: {
        alquiler_id: "00000000-0000-0000-0000-000000000000",
        destinatario_id: "00000000-0000-0000-0000-000000000000",
        nota: 10,
      },
    });
    expect(res.status).toBe(400);
  });

  it("rechaza nota fuera de rango (<1)", async () => {
    const res = await apiCall("/api/valoraciones", {
      method: "POST",
      token: tokenCliente,
      body: {
        alquiler_id: "00000000-0000-0000-0000-000000000000",
        destinatario_id: "00000000-0000-0000-0000-000000000000",
        nota: 0,
      },
    });
    expect(res.status).toBe(400);
  });

  it("rechaza valorar un alquiler que no existe", async () => {
    const res = await apiCall("/api/valoraciones", {
      method: "POST",
      token: tokenCliente,
      body: {
        alquiler_id: "00000000-0000-0000-0000-000000000000",
        destinatario_id: "00000000-0000-0000-0000-000000000000",
        nota: 5,
      },
    });
    expect(res.status).toBe(404);
  });

  it.skip("rechaza valorar alquiler no finalizado (requiere fixture compleja)", () => {});
});

describe("GET /api/notificaciones", () => {
  it("rechaza sin token", async () => {
    const res = await apiCall("/api/notificaciones");
    expect(res.status).toBe(401);
  });

  it("devuelve notificaciones del usuario autenticado", async () => {
    const res = await apiCall("/api/notificaciones", { token: tokenCliente });
    expect(res.status).toBe(200);
  });
});
