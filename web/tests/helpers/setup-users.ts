/**
 * Script para crear los usuarios de prueba en Supabase.
 * Ejecutar una vez antes de correr los tests: npm run test:setup
 *
 * Crea: cliente de prueba, vendedor de prueba, admin de prueba.
 * Si ya existen, los reutiliza.
 */
import { config } from "dotenv";
config({ path: ".env.test" });

import { getServiceClient } from "./supabase";

type TestUser = {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  rol: "usuario" | "admin";
};

const usuarios: TestUser[] = [
  {
    email: process.env.TEST_USER_CLIENTE_EMAIL!,
    password: process.env.TEST_USER_CLIENTE_PASSWORD!,
    nombre: "Test",
    apellidos: "Cliente",
    rol: "usuario",
  },
  {
    email: process.env.TEST_USER_VENDEDOR_EMAIL!,
    password: process.env.TEST_USER_VENDEDOR_PASSWORD!,
    nombre: "Test",
    apellidos: "Vendedor",
    rol: "usuario",
  },
  {
    email: process.env.TEST_USER_ADMIN_EMAIL!,
    password: process.env.TEST_USER_ADMIN_PASSWORD!,
    nombre: "Test",
    apellidos: "Admin",
    rol: "admin",
  },
];

async function crearUsuario(u: TestUser): Promise<string | null> {
  const supabase = getServiceClient();

  // Comprobar si ya existe
  const { data: existentes } = await supabase.auth.admin.listUsers();
  const existente = existentes.users.find((x) => x.email === u.email);

  let userId: string;
  if (existente) {
    console.log(`  ℹ ${u.email} ya existe, reutilizando`);
    userId = existente.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error || !data.user) {
      console.error(`  ✗ Error creando ${u.email}: ${error?.message}`);
      return null;
    }
    userId = data.user.id;
    console.log(`  ✓ Creado ${u.email}`);
  }

  // Asegurar que el perfil de la tabla `users` existe y tiene los datos correctos
  await supabase.from("users").upsert(
    {
      id: userId,
      nombre: u.nombre,
      apellidos: u.apellidos,
      telefono: "600000000",
      ciudad: "Barcelona",
      direccion: "Calle Test 1",
      direccion_publica: "Zona Test",
      rol: u.rol,
    },
    { onConflict: "id" },
  );

  return userId;
}

async function main() {
  console.log("\n🔧 Configurando usuarios de prueba...\n");

  for (const u of usuarios) {
    await crearUsuario(u);
  }

  console.log("\n✅ Usuarios de prueba listos.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
