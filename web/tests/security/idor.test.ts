/**
 * Tests de IDOR (Insecure Direct Object Reference).
 * Comprueban que un usuario no puede acceder ni modificar recursos de otro
 * cambiando IDs en la URL o el body.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { apiCall } from "../helpers/api";
import { loginAndGetToken } from "../helpers/supabase";
import {
  crearHerramientaPrueba,
  limpiarHerramientasDeUsuario,
} from "../helpers/factories";

let tokenCliente: string;
let userIdCliente: string;
let tokenVendedor: string;
let userIdVendedor: string;
let herramientaIdVendedor: string;

beforeAll(async () => {
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

  // Crear herramienta del vendedor
  const h = await crearHerramientaPrueba({
    vendedor_id: userIdVendedor,
    nombre: "Herramienta del Vendedor (IDOR test)",
  });
  herramientaIdVendedor = h.id;
});

afterAll(async () => {
  await limpiarHerramientasDeUsuario(userIdVendedor);
});

describe("IDOR: edición de herramientas ajenas", () => {
  it("el cliente NO puede añadir descuentos a una herramienta del vendedor", async () => {
    const res = await apiCall(
      `/api/herramientas/${herramientaIdVendedor}/descuentos`,
      {
        method: "POST",
        token: tokenCliente,
        body: { dias_minimos: 5, porcentaje: 10 },
      },
    );
    expect([401, 403, 404]).toContain(res.status);
  });

  it("el cliente NO puede eliminar descuentos de herramientas ajenas", async () => {
    const res = await apiCall(
      `/api/herramientas/${herramientaIdVendedor}/descuentos?descuento_id=00000000-0000-0000-0000-000000000000`,
      {
        method: "DELETE",
        token: tokenCliente,
      },
    );
    expect([401, 403, 404]).toContain(res.status);
  });
});

describe("IDOR: acceso a alquileres ajenos", () => {
  it("el vendedor NO ve alquileres del cliente como propios", async () => {
    const res = await apiCall("/api/alquileres/mis-alquileres", {
      token: tokenVendedor,
    });
    expect(res.status).toBe(200);
    // No debe contener alquileres del cliente
    if (res.body.alquileres) {
      res.body.alquileres.forEach((a: any) => {
        // mis-alquileres devuelve los del usuario logueado como cliente
        // El vendedor no debería ver ningún alquiler como cliente (a menos que sea cliente también)
        expect(a.cliente_id ?? null).not.toBe(userIdCliente);
      });
    }
  });
});

describe("IDOR: datos de perfil ajenos", () => {
  it("la API pública de usuario NO expone email", async () => {
    const res = await apiCall(`/api/usuarios/${userIdVendedor}`);
    if (res.status === 200) {
      expect(res.body).not.toHaveProperty("email");
      expect(res.body).not.toHaveProperty("password");
    }
  });

  it("la API pública de usuario NO expone dirección privada", async () => {
    const res = await apiCall(`/api/usuarios/${userIdVendedor}`);
    if (res.status === 200) {
      // El campo se llama 'direccion' (privado). 'direccion_publica' sí puede estar
      expect(res.body).not.toHaveProperty("direccion");
    }
  });

  it("la API pública de usuario NO expone teléfono", async () => {
    const res = await apiCall(`/api/usuarios/${userIdVendedor}`);
    if (res.status === 200) {
      expect(res.body).not.toHaveProperty("telefono");
    }
  });
});

describe("IDOR: gestión de notificaciones ajenas", () => {
  it("notificación inexistente devuelve 200 con 0 cambios o 404", async () => {
    const res = await apiCall(
      `/api/notificaciones/00000000-0000-0000-0000-000000000000`,
      {
        method: "PATCH",
        token: tokenCliente,
        body: { leida: true },
      },
    );
    // 404 si valida existencia, 200 con 0 cambios si no (ambos correctos)
    // Lo que NO debe ocurrir es modificar datos de otro usuario
    expect([200, 401, 403, 404]).toContain(res.status);
  });
});
