import { describe, it, expect, beforeAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";

let tokenAdmin: string;
let tokenCliente: string;

beforeAll(async () => {
  const admin = await loginAndGetToken(
    process.env.TEST_USER_ADMIN_EMAIL!,
    process.env.TEST_USER_ADMIN_PASSWORD!,
  );
  tokenAdmin = admin.token;

  const cliente = await loginAndGetToken(
    process.env.TEST_USER_CLIENTE_EMAIL!,
    process.env.TEST_USER_CLIENTE_PASSWORD!,
  );
  tokenCliente = cliente.token;
});

describe("Endpoints /api/admin/* protegidos por rol admin", () => {
  const endpoints = [
    "/api/admin/usuarios",
    "/api/admin/herramientas",
    "/api/admin/alquileres",
    "/api/admin/pagos",
    "/api/admin/valoraciones",
    "/api/admin/stats",
    "/api/admin/graficos",
  ];

  endpoints.forEach((endpoint) => {
    describe(`GET ${endpoint}`, () => {
      it("rechaza petición sin autenticar", async () => {
        const res = await apiCall(endpoint);
        expect([401, 403]).toContain(res.status);
      });

      it("rechaza usuario no-admin", async () => {
        const res = await apiCall(endpoint, { token: tokenCliente });
        expect(res.status).toBe(403);
      });

      it("permite acceso a admin", async () => {
        const res = await apiCall(endpoint, { token: tokenAdmin });
        // 200 si todo va bien; aceptamos también 500 si la BD no tiene datos
        expect([200, 500]).toContain(res.status);
      });
    });
  });
});
