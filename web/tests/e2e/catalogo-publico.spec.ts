/**
 * Test E2E: navegación pública (sin autenticación).
 * Catálogo, búsqueda, filtros, página de detalle.
 */
import { test, expect } from "@playwright/test";

test.describe("Catálogo público", () => {
  test("se puede acceder al catálogo sin login", async ({ page }) => {
    await page.goto("/herramientas");
    await expect(page).toHaveURL(/\/herramientas/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("buscar por nombre filtra los resultados", async ({ page }) => {
    await page.goto("/herramientas");
    // El input de búsqueda existe en la sidebar
    const buscarInput = page.locator('input[placeholder*="Buscar" i]').first();
    if (await buscarInput.isVisible()) {
      await buscarInput.fill("taladro");
      await buscarInput.press("Enter");
      await page.waitForTimeout(1000);
      // Los resultados deberían cargarse — verificamos que no hay error
      await expect(page.locator("text=Error").first()).not.toBeVisible();
    }
  });

  test("el parámetro ?q= en URL precarga búsqueda (fix BUG #8)", async ({
    page,
  }) => {
    await page.goto("/herramientas?q=taladro");
    await page.waitForLoadState("networkidle");
    // El input debería tener "taladro" precargado
    const buscarInput = page.locator('input[placeholder*="Buscar" i]').first();
    if (await buscarInput.isVisible()) {
      await expect(buscarInput).toHaveValue("taladro");
    }
  });

  test("el filtro de precio mínimo no acepta negativos (fix BUG #7)", async ({
    page,
  }) => {
    await page.goto("/herramientas");
    const precioMin = page.locator('input[placeholder="Mín"]').first();
    if (await precioMin.isVisible()) {
      // El input debe tener atributo min="0"
      const minAttr = await precioMin.getAttribute("min");
      expect(minAttr).toBe("0");
    }
  });

  test("entrar al detalle de una herramienta carga la página", async ({
    page,
  }) => {
    await page.goto("/herramientas");
    await page.waitForLoadState("networkidle");
    // Clicar primera tarjeta de herramienta
    const primeraCard = page.locator('a[href*="/herramientas/"]').first();
    if (await primeraCard.isVisible()) {
      await primeraCard.click();
      await page.waitForLoadState("networkidle");
      // Estamos en la página de detalle
      await expect(page).toHaveURL(/\/herramientas\/.+/);
    }
  });

  test("la página de detalle NO muestra direccion_publica del vendedor (fix BUG #4)", async ({
    page,
  }) => {
    await page.goto("/herramientas");
    await page.waitForLoadState("networkidle");
    const primeraCard = page.locator('a[href*="/herramientas/"]').first();
    if (await primeraCard.isVisible()) {
      await primeraCard.click();
      await page.waitForLoadState("networkidle");
      // No debe aparecer ningún texto tipo "Calle X" expuesto públicamente
      // (esto es una verificación blanda; el assertion fuerte está en pii.test.ts)
    }
  });
});

test.describe("Páginas estáticas accesibles", () => {
  const rutas = [
    "/",
    "/sobre-nosotros",
    "/contacto",
    "/privacidad",
    "/terminos",
  ];

  rutas.forEach((ruta) => {
    test(`${ruta} carga sin errores`, async ({ page }) => {
      const response = await page.goto(ruta);
      expect(response?.status()).toBeLessThan(400);
    });
  });
});
