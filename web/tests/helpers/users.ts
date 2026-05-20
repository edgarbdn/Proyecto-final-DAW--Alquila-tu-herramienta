/**
 * Helpers para crear/eliminar usuarios de prueba en Supabase.
 * Cada test que necesite usuarios los crea al inicio y los elimina al final.
 * El prefijo `test_` permite identificarlos para una limpieza masiva si fuera necesario.
 */
import { getAdminClient } from "./supabase";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  rol: "usuario" | "admin";
}

const PASSWORD = "Test1234!Test";

/**
 * Crea un usuario de prueba con email único.
 * Devuelve los datos y un token JWT válido para usar en peticiones.
 */
export async function createTestUser(opts: {
  rol?: "usuario" | "admin";
  perfilCompleto?: boolean;
} = {}): Promise<TestUser> {
  const admin = getAdminClient();
  const email = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.local`;

  // 1. Crear usuario en auth
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      nombre: "Test",
      apellidos: "User",
    },
  });

  if (createError || !created.user) {
    throw new Error(`No se pudo crear usuario de prueba: ${createError?.message}`);
  }

  // 2. Si el trigger `handle_new_user` no creó la fila, la insertamos manualmente.
  //    Aseguramos también que el rol y el perfil están como queremos.
  const updates: any = {
    rol: opts.rol ?? "usuario",
    nombre: "Test",
    apellidos: "User",
  };

  if (opts.perfilCompleto) {
    updates.telefono = "+34600000000";
    updates.ciudad = "Madrid";
    updates.direccion = "Calle Falsa 123";
    updates.direccion_publica = "Calle Falsa";
  }

  await admin
    .from("users")
    .upsert({ id: created.user.id, ...updates }, { onConflict: "id" });

  // 3. Iniciar sesión para obtener un token JWT
  const { data: signIn, error: signInError } = await admin.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });

  if (signInError || !signIn.session) {
    throw new Error(`No se pudo iniciar sesión: ${signInError?.message}`);
  }

  return {
    id: created.user.id,
    email,
    password: PASSWORD,
    token: signIn.session.access_token,
    rol: opts.rol ?? "usuario",
  };
}

/**
 * Elimina un usuario de prueba y todos sus datos asociados (cascade).
 */
export async function deleteTestUser(user: TestUser): Promise<void> {
  const admin = getAdminClient();
  await admin.auth.admin.deleteUser(user.id);
}

/**
 * Limpia todos los usuarios de test que queden en la BD.
 * Útil ejecutarlo si una suite se queda colgada.
 */
export async function cleanupAllTestUsers(): Promise<number> {
  const admin = getAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const testUsers = (users?.users ?? []).filter((u) =>
    u.email?.startsWith("test_") && u.email?.endsWith("@test.local")
  );

  for (const u of testUsers) {
    await admin.auth.admin.deleteUser(u.id);
  }

  return testUsers.length;
}
