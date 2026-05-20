/**
 * Script para asegurarse de que el usuario admin tiene rol='admin' en la tabla users.
 * Ejecutar si los tests de admin fallan con 403.
 */
import { config } from "dotenv";
config({ path: ".env.test" });

import { getServiceClient } from "./supabase";

async function main() {
  const supabase = getServiceClient();
  const adminEmail = process.env.TEST_USER_ADMIN_EMAIL!;

  // Buscar el usuario en Auth
  const { data: all } = await supabase.auth.admin.listUsers();
  const user = all.users.find((u) => u.email === adminEmail);

  if (!user) {
    console.error(`❌ No se encontró el usuario ${adminEmail}`);
    process.exit(1);
  }

  console.log(`✓ Usuario encontrado: ${user.id}`);

  // Forzar el rol admin en la tabla users
  const { error } = await supabase
    .from("users")
    .update({ rol: "admin" })
    .eq("id", user.id);

  if (error) {
    console.error(`❌ Error actualizando rol: ${error.message}`);
    process.exit(1);
  }

  // Verificar
  const { data: perfil } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .single();

  console.log(`✓ Rol actual en BD: ${perfil?.rol}`);

  if (perfil?.rol === "admin") {
    console.log(`\n✅ Usuario admin configurado correctamente.\n`);
  } else {
    console.error(`\n❌ El rol no se actualizó. Revisa los permisos RLS de la tabla users.\n`);
  }

  process.exit(0);
}

main().catch(console.error);
