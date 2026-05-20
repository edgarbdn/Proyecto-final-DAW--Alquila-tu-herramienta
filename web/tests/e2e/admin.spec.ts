/**
 * Test E2E: panel de admin.
 * Solo accesible para usuarios con rol admin.
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_USER_ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.TEST_USER_ADMIN_PASSWORD!;
const CLIENTE_EMAIL = process.env.TEST_USER_CLIENTE_EMAIL!;
const CLIENTE_PASSWORD = process.env.TEST_USER_CLIENTE_PASSWORD!;

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url: URL) => !url.pathname.includes("/login"));
}

test.describe("Acceso al panel de admin", () => {
  test("usuario admin puede acceder a /admin", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin");
    // No debe redirigir al login
    await expect(page).toHaveURL(/\/admin/);
  });

  test("usuario normal NO puede acceder a /admin", async ({ page }) => {
    await login(page, CLIENTE_EMAIL, CLIENTE_PASSWORD);
    await page.goto("/admin");
    // Debe redirigir fuera de /admin (a / o /login según el middleware)
    await page.waitForURL((url) => !url.pathname.startsWith("/admin"), {
      timeout: 5000,
    });
  });

  test("usuario no autenticado es redirigido al login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/);
  });
});
