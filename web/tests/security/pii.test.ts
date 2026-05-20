/**
 * Tests para asegurar que NO se exponen datos personales sensibles
 * a través de la API pública. Verifica el fix del BUG #4 del informe QA.
 */
import { describe, it, expect } from "vitest";
import { apiCall } from "../helpers/api";

describe("Exposición de PII en API pública", () => {
  it("GET /api/herramientas no expone teléfono, email ni dirección privada", async () => {
    const res = await apiCall("/api/herramientas?limite=10");
    expect(res.status).toBe(200);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/"telefono"/);
    expect(bodyStr).not.toMatch(/"email"/);
    expect(bodyStr).not.toMatch(/"direccion"\s*:/); // direccion (sin "_publica")
    expect(bodyStr).not.toMatch(/"password"/);
  });

  it("GET /api/herramientas/[id] no expone direccion_publica del vendedor (post-fix BUG #4)", async () => {
    const lista = await apiCall("/api/herramientas?limite=1");
    const id = lista.body.herramientas[0]?.id;
    if (!id) return;

    const res = await apiCall(`/api/herramientas/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.vendedor).not.toHaveProperty("direccion_publica");
    expect(res.body.vendedor).not.toHaveProperty("direccion");
    expect(res.body.vendedor).not.toHaveProperty("telefono");
    expect(res.body.vendedor).not.toHaveProperty("email");
  });

  it("la respuesta de herramientas no incluye id del vendedor en el objeto vendedor", async () => {
    // Tras el fix, el id va a nivel de herramienta (vendedor_id), no anidado
    const lista = await apiCall("/api/herramientas?limite=1");
    const id = lista.body.herramientas[0]?.id;
    if (!id) return;

    const res = await apiCall(`/api/herramientas/${id}`);
    expect(res.body.vendedor).not.toHaveProperty("id");
  });

  it("las valoraciones no exponen email del autor", async () => {
    const lista = await apiCall("/api/herramientas?limite=20");
    // Buscamos una herramienta con valoraciones
    for (const h of lista.body.herramientas) {
      const detalle = await apiCall(`/api/herramientas/${h.id}`);
      const valoraciones = detalle.body.valoraciones || [];
      valoraciones.forEach((v: any) => {
        if (v.autor) {
          expect(v.autor).not.toHaveProperty("email");
          expect(v.autor).not.toHaveProperty("telefono");
          expect(v.autor).not.toHaveProperty("direccion");
        }
      });
    }
  });
});

describe("Headers de seguridad en respuestas", () => {
  it("la API devuelve Content-Type application/json (no HTML)", async () => {
    const res = await apiCall("/api/herramientas");
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
