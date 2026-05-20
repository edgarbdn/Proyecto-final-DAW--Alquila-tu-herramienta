import { config } from "dotenv";

// Cargar .env.test antes de cualquier test
config({ path: ".env.test" });

// Verificar variables imprescindibles
const requiredVars = [
  "TEST_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TEST_USER_CLIENTE_EMAIL",
  "TEST_USER_CLIENTE_PASSWORD",
  "TEST_USER_VENDEDOR_EMAIL",
  "TEST_USER_VENDEDOR_PASSWORD",
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`\n❌ Faltan variables de entorno en .env.test:`);
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error(`\nCopia .env.test.example a .env.test y rellena los valores.\n`);
  process.exit(1);
}
