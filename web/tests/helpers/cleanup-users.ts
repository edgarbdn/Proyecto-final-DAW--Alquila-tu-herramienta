/**
 * Script para borrar los usuarios de prueba y todos sus datos.
 * Ejecutar al terminar: npm run test:cleanup
 */
import { config } from "dotenv";
config({ path: ".env.test" });

import { getServiceClient } from "./supabase";

const emails = [
  process.env.TEST_USER_CLIENTE_EMAIL,
  process.env.TEST_USER_VENDEDOR_EMAIL,
  process.env.TEST_USER_ADMIN_EMAIL,
].filter(Boolean) as string[];

async function main() {
  console.log("\n🧹 Limpiando usuarios de prueba...\n");

  const supabase = getServiceClient();
  const { data: all } = await supabase.auth.admin.listUsers();

  for (const email of emails) {
    const user = all.users.find((u) => u.email === email);
    if (!user) {
      console.log(`  ℹ ${email} no existe`);
      continue;
    }
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  ✗ Error borrando ${email}: ${error.message}`);
    } else {
      console.log(`  ✓ Borrado ${email}`);
    }
  }

  console.log("\n✅ Limpieza completada.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
