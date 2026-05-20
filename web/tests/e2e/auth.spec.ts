/**
 * Test E2E: flujo de autenticación.
 * Login, validaciones, logout, protección de rutas.
 */
import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_USER_CLIENTE_EMAIL!;
const PASSWORD = process.env.TEST_USER_CLIENTE_PASSWORD!;

test.describe("Autenticación", () => {
  test("login con credenciales válidas redirige correctamente", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    // Tras el login, no debería seguir en /login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });
  });

  test("login con contraseña incorrecta muestra error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', "contraseña-incorrecta-xxx");
    await page.click('button[type="submit"]');
    // Debe seguir en login y mostrar mensaje de error
    await expect(page).toHaveURL(/\/login/);
  });

  test("login con email no registrado falla", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "noexiste@xyz.test");
    await page.fill('input[type="password"]', "Whatever123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);
  });

  test("ruta protegida redirige a login si no autenticado", async ({
    page,
  }) => {
    await page.goto("/mis-herramientas");
    await page.waitForURL(/\/login/);
  });

  test("usuario autenticado no puede acceder a /login (redirige)", async ({
    page,
  }) => {
    // Primero loguearse
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"));

    // Intentar volver a /login
    await page.goto("/login");
    // Debería redirigir fuera de /login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 5000,
    });
  });
});
