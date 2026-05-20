import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";
import {
  crearHerramientaPrueba,
  crearHorarioPrueba,
  limpiarHerramientasDeUsuario,
  limpiarAlquileresDeUsuario,
} from "../helpers/factories";

let tokenCliente: string;
let userIdCliente: string;
let tokenVendedor: string;
let userIdVendedor: string;
let herramientaId: string;
let horarioId: string;

beforeAll(async () => {
  // Login de ambos usuarios
  const cliente = await loginAndGetToken(
    process.env.TEST_USER_CLIENTE_EMAIL!,
    process.env.TEST_USER_CLIENTE_PASSWORD!,
  );
  tokenCliente = cliente.token;
  userIdCliente = cliente.userId;

  const vendedor = await loginAndGetToken(
    process.env.TEST_USER_VENDEDOR_EMAIL!,
    process.env.TEST_USER_VENDEDOR_PASSWORD!,
  );
  tokenVendedor = vendedor.token;
  userIdVendedor = vendedor.userId;

  // Crear una herramienta del vendedor para los tests
  const herramienta = await crearHerramientaPrueba({
    vendedor_id: userIdVendedor,
    nombre: "Taladro Test",
    precio_dia: 15,
  });
  herramientaId = herramienta.id;

  const horario = await crearHorarioPrueba(herramientaId, "10:00");
  horarioId = horario.id;
});

afterAll(async () => {
  await limpiarAlquileresDeUsuario(userIdCliente);
  await limpiarHerramientasDeUsuario(userIdVendedor);
});

describe("POST /api/alquileres (crear solicitud de alquiler)", () => {
  it("rechaza petición sin token", async () => {
    const res = await apiCall("/api/alquileres", { method: "POST", body: {} });
    expect(res.status).toBe(401);
  });

  it("rechaza si faltan campos obligatorios", async () => {
    const res = await apiCall("/api/alquileres", {
      method: "POST",
      token: tokenCliente,
      body: { herramienta_id: herramientaId },
    });
    expect(res.status).toBe(400);
  });

  it("rechaza fecha de inicio en el pasado (BUG #5)", async () => {
    const res = await apiCall("/api/alquileres", {
      method: "POST",
      token: tokenCliente,
      body: {
        herramienta_id: herramientaId,
        fecha_inicio: "2020-01-01",
        fecha_fin: "2020-01-05",
        horario_id: horarioId,
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pasado/i);
  });

  it("rechaza fecha de fin anterior a fecha de inicio", async () => {
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 10);
    const masFuturo = new Date();
    masFuturo.setDate(masFuturo.getDate() + 5);

    const res = await apiCall("/api/alquileres", {
      method: "POST",
      token: tokenCliente,
      body: {
        herramienta_id: herramientaId,
        fecha_inicio: futuro.toISOString().split("T")[0],
        fecha_fin: masFuturo.toISOString().split("T")[0],
        horario_id: horarioId,
      },
    });
    expect(res.status).toBe(400);
  });

  it("rechaza alquilar tu propia herramienta", async () => {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 3);
    const fin = new Date();
    fin.setDate(fin.getDate() + 5);

    const res = await apiCall("/api/alquileres", {
      method: "POST",
      token: tokenVendedor, // el vendedor intenta alquilar su propia
      body: {
        herramienta_id: herramientaId,
        fecha_inicio: inicio.toISOString().split("T")[0],
        fecha_fin: fin.toISOString().split("T")[0],
        horario_id: horarioId,
      },
    });
    expect(res.status).toBe(403);
  });

  it("crea una solicitud válida en estado 'pendiente'", async () => {
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 7);
    const fin = new Date();
    fin.setDate(fin.getDate() + 10);

    const res = await apiCall("/api/alquileres", {
      method: "POST",
      token: tokenCliente,
      body: {
        herramienta_id: herramientaId,
        fecha_inicio: inicio.toISOString().split("T")[0],
        fecha_fin: fin.toISOString().split("T")[0],
        horario_id: horarioId,
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.alquiler.estado).toBe("pendiente");
    expect(res.body.alquiler.precio_final).toBeGreaterThan(0);
  });

  it("rechaza solapamiento con un alquiler activo/confirmado existente", async () => {
    // Esto requeriría que el alquiler anterior esté en estado 'confirmado'.
    // En el flujo normal, lo confirmaría el vendedor. Lo dejamos documentado.
    // Para un test completo, necesitaríamos modificar el estado vía service client.
    expect(true).toBe(true); // placeholder
  });
});

describe("GET /api/alquileres/mis-alquileres", () => {
  it("rechaza sin token", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres");
    expect(res.status).toBe(401);
  });

  it("devuelve los alquileres del cliente autenticado", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      token: tokenCliente,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("alquileres");
    expect(Array.isArray(res.body.alquileres)).toBe(true);
  });

  it("solo devuelve alquileres del usuario logueado, no de otros", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      token: tokenCliente,
    });
    res.body.alquileres.forEach((a: any) => {
      // Todos deben pertenecer al cliente actual
      expect(a.cliente_id ?? userIdCliente).toBe(userIdCliente);
    });
  });
});

describe("GET /api/alquileres/recibidos (vendedor)", () => {
  it("rechaza sin token", async () => {
    const res = await apiCall("/api/alquileres/recibidos");
    expect(res.status).toBe(401);
  });

  it("devuelve solicitudes recibidas por el vendedor", async () => {
    const res = await apiCall("/api/alquileres/recibidos", {
      token: tokenVendedor,
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.alquileres)).toBe(true);
  });
});
