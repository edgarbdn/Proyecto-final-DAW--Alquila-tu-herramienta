import { describe, it, expect } from "vitest";
import { apiCall } from "../helpers/api";

describe("GET /api/herramientas (catálogo público)", () => {
  it("devuelve lista de herramientas sin autenticación", async () => {
    const res = await apiCall("/api/herramientas");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("herramientas");
    expect(Array.isArray(res.body.herramientas)).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("pagina");
    expect(res.body).toHaveProperty("totalPaginas");
  });

  it("respeta el parámetro de paginación", async () => {
    const res = await apiCall("/api/herramientas?pagina=1&limite=3");
    expect(res.status).toBe(200);
    expect(res.body.herramientas.length).toBeLessThanOrEqual(3);
  });

  it("filtra por categoría", async () => {
    // Pedimos una herramienta para obtener una categoría real
    const todas = await apiCall("/api/herramientas?limite=20");
    const categoriaId = todas.body.herramientas[0]?.categoria?.id;
    if (!categoriaId) return; // No hay herramientas en BD

    const res = await apiCall(`/api/herramientas?categoria=${categoriaId}`);
    expect(res.status).toBe(200);
    res.body.herramientas.forEach((h: any) => {
      expect(h.categoria.id).toBe(categoriaId);
    });
  });

  it("filtra por nombre (búsqueda parcial)", async () => {
    const res = await apiCall("/api/herramientas?nombre=test");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.herramientas)).toBe(true);
  });

  it("calcula precio_dia_publico con comisión incluida", async () => {
    const res = await apiCall("/api/herramientas?limite=5");
    expect(res.status).toBe(200);
    res.body.herramientas.forEach((h: any) => {
      expect(h).toHaveProperty("precio_dia_publico");
      // El precio público debe ser mayor que el precio_dia (lleva comisión)
      expect(h.precio_dia_publico).toBeGreaterThanOrEqual(h.precio_dia);
    });
  });

  it("solo devuelve herramientas disponibles", async () => {
    const res = await apiCall("/api/herramientas?limite=50");
    expect(res.status).toBe(200);
    res.body.herramientas.forEach((h: any) => {
      expect(h.disponible).toBe(true);
    });
  });

  it("devuelve array vacío con filtros sin resultados", async () => {
    const res = await apiCall(
      "/api/herramientas?nombre=xyznoexistexxxxxxxxxx",
    );
    expect(res.status).toBe(200);
    expect(res.body.herramientas).toEqual([]);
    expect(res.body.total).toBe(0);
  });
});

describe("GET /api/herramientas/[id]", () => {
  it("devuelve 404 con id que no existe", async () => {
    const res = await apiCall(
      "/api/herramientas/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("devuelve datos completos con id válido", async () => {
    const todas = await apiCall("/api/herramientas?limite=1");
    const id = todas.body.herramientas[0]?.id;
    if (!id) return;

    const res = await apiCall(`/api/herramientas/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", id);
    expect(res.body).toHaveProperty("fotos");
    expect(res.body).toHaveProperty("valoraciones");
    expect(res.body).toHaveProperty("descuentos");
    expect(res.body).toHaveProperty("horarios");
    expect(res.body).toHaveProperty("vendedor");
  });

  it("NO expone direccion_publica del vendedor (fix BUG #4)", async () => {
    const todas = await apiCall("/api/herramientas?limite=1");
    const id = todas.body.herramientas[0]?.id;
    if (!id) return;

    const res = await apiCall(`/api/herramientas/${id}`);
    expect(res.body.vendedor).not.toHaveProperty("direccion_publica");
  });
});

describe("GET /api/categorias", () => {
  it("devuelve lista de categorías activas", async () => {
    const res = await apiCall("/api/categorias");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("categorias");
    expect(Array.isArray(res.body.categorias)).toBe(true);
  });
});

describe("GET /api/ciudades", () => {
  it("devuelve lista de ciudades", async () => {
    const res = await apiCall("/api/ciudades");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ciudades");
    expect(Array.isArray(res.body.ciudades)).toBe(true);
  });
});
