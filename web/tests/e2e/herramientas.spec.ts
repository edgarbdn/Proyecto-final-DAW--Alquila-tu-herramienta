/**
 * Test E2E: gestión de herramientas (zona privada).
 * Crear, editar, activar/desactivar, eliminar.
 */
import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_USER_VENDEDOR_EMAIL!;
const PASSWORD = process.env.TEST_USER_VENDEDOR_PASSWORD!;

// Helper para loguearse antes de cada test
async function login(page: any) {
  await page.goto("/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: URL) => !url.pathname.includes("/login"));
}

test.describe("Gestión de herramientas", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("la página de mis-herramientas carga sin errores", async ({ page }) => {
    await page.goto("/mis-herramientas");
    await expect(page.locator("h1")).toContainText(/herramientas/i);
  });

  test("hay un botón para publicar nueva herramienta", async ({ page }) => {
    await page.goto("/mis-herramientas");
    const publicar = page.locator("text=/Publicar/i").first();
    await expect(publicar).toBeVisible();
  });

  test("la página de nueva herramienta tiene los campos requeridos", async ({
    page,
  }) => {
    await page.goto("/herramientas/nueva");
    await expect(page.locator('input[id="nombre"]')).toBeVisible();
    await expect(page.locator('textarea[id="descripcion"]')).toBeVisible();
    await expect(page.locator('select[id="categoria"]')).toBeVisible();
    await expect(page.locator('input[id="precio"]')).toBeVisible();
  });

  test("el textarea de descripción tiene altura suficiente (mejora UX)", async ({
    page,
  }) => {
    await page.goto("/herramientas/nueva");
    const textarea = page.locator('textarea[id="descripcion"]');
    const rows = await textarea.getAttribute("rows");
    expect(Number(rows)).toBeGreaterThanOrEqual(5);
  });
});

test.describe("Seguridad: usuario no autenticado", () => {
  test("redirige al intentar acceder a /mis-herramientas", async ({ page }) => {
    await page.goto("/mis-herramientas");
    await page.waitForURL(/\/login/);
  });

  test("redirige al intentar acceder a /perfil", async ({ page }) => {
    await page.goto("/perfil");
    await page.waitForURL(/\/login/);
  });

  test("redirige al intentar acceder a /herramientas/nueva", async ({
    page,
  }) => {
    await page.goto("/herramientas/nueva");
    await page.waitForURL(/\/login/);
  });
});
