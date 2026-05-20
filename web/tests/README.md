# Suite de tests — Alquila tu herramienta

Tres niveles de tests automatizados:

| Suite | Framework | Qué prueba |
|-------|-----------|------------|
| `tests/integration/` | Vitest | Endpoints de API: contratos, validaciones, casos de error |
| `tests/security/` | Vitest | Auth, autorización, IDOR, inyecciones, exposición de PII |
| `tests/e2e/` | Playwright | Flujos completos en navegador real |
| `tests/performance/` | k6 | Carga y estrés sobre la API |

---

## Setup inicial (UNA sola vez)

### 1. Instalar dependencias

```bash
npm install
npx playwright install chromium
```

### 2. Instalar k6

- **Windows (winget)**: `winget install k6 --source winget`
- **Mac**: `brew install k6`
- **Linux**: ver [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/)

### 3. Configurar variables de entorno

```bash
cp .env.test.example .env.test
```

Edita `.env.test` y pon:
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (de tu proyecto Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role key)

### 4. Crear los usuarios de prueba

```bash
npm run test:setup
```

Esto crea automáticamente:
- `test-cliente@example.com`
- `test-vendedor@example.com`
- `test-admin@example.com`

Si los emails ya existen, los reutiliza.

---

## Ejecutar los tests

### Tests de integración y seguridad (Vitest)

Necesitan el servidor de Next.js corriendo en local. En una terminal:

```bash
npm run dev
```

En otra terminal:

```bash
npm test               # todos los tests
npm run test:integration   # solo integración
npm run test:security      # solo seguridad
npm run test:watch         # modo watch (re-ejecuta al cambiar)
```

### Tests E2E (Playwright)

Playwright arranca el servidor solo si no está corriendo.

```bash
npm run test:e2e          # headless, en terminal
npm run test:e2e:ui       # con UI interactiva (recomendado para debug)
```

Ver el reporte HTML tras la ejecución:
```bash
npx playwright show-report
```

### Tests de rendimiento (k6)

Con el servidor corriendo:

```bash
npm run test:perf
# o directamente
k6 run tests/performance/load.js
k6 run tests/performance/stress.js
```

---

## Limpiar después

Cuando termines y quieras borrar los usuarios de prueba y sus datos:

```bash
npm run test:cleanup
```

Esto borra los 3 usuarios de test y en cascada todas sus herramientas, alquileres, etc.

---

## Convenciones

- Cada test es **independiente**: limpia después de sí mismo.
- Los tests **no asumen** orden de ejecución.
- Si un test necesita datos en BD, los crea con los `factories` en `tests/helpers/factories.ts`.
- Para tests de pago: están skipeados; verificar manualmente con Stripe en modo test.
