/**
 * Fixtures: crean datos auxiliares (herramientas, alquileres, etc.) para los tests.
 */
import { getAdminClient } from "./supabase";
import type { TestUser } from "./users";

export interface TestHerramienta {
  id: string;
  vendedor_id: string;
  nombre: string;
}

/**
 * Crea una herramienta de prueba propiedad del usuario indicado.
 */
export async function createTestHerramienta(
  vendedor: TestUser,
  overrides: Partial<{
    nombre: string;
    descripcion: string;
    precio_dia: number;
    disponible: boolean;
  }> = {}
): Promise<TestHerramienta> {
  const admin = getAdminClient();

  // Buscar una categoría cualquiera para asignar
  const { data: cat } = await admin
    .from("categorias")
    .select("id")
    .limit(1)
    .single();

  if (!cat) {
    throw new Error("No hay categorías en la BD. Asegúrate de tener al menos una.");
  }

  const { data: h, error } = await admin
    .from("herramientas")
    .insert({
      vendedor_id: vendedor.id,
      categoria_id: cat.id,
      nombre: overrides.nombre ?? `Test Herramienta ${Date.now()}`,
      descripcion: overrides.descripcion ?? "Herramienta creada por tests automatizados",
      precio_dia: overrides.precio_dia ?? 10,
      disponible: overrides.disponible ?? true,
    })
    .select("id, vendedor_id, nombre")
    .single();

  if (error || !h) {
    throw new Error(`No se pudo crear herramienta: ${error?.message}`);
  }

  // Añadir un horario de recogida por defecto
  await admin.from("horarios_recogida").insert({
    herramienta_id: h.id,
    hora: "10:00",
  });

  return h;
}

/**
 * Crea un alquiler en estado dado entre dos usuarios.
 */
export async function createTestAlquiler(
  cliente: TestUser,
  herramienta: TestHerramienta,
  opts: {
    estado?: "pendiente" | "confirmado" | "activo" | "finalizado" | "cancelado";
    fechaInicio?: string;
    fechaFin?: string;
  } = {}
): Promise<{ id: string }> {
  const admin = getAdminClient();

  const inicio = opts.fechaInicio ?? new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const fin = opts.fechaFin ?? new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];

  // Buscar horario de la herramienta
  const { data: horario } = await admin
    .from("horarios_recogida")
    .select("id")
    .eq("herramienta_id", herramienta.id)
    .limit(1)
    .single();

  const { data, error } = await admin
    .from("alquileres")
    .insert({
      herramienta_id: herramienta.id,
      cliente_id: cliente.id,
      fecha_inicio: inicio,
      fecha_fin: fin,
      dias: 2,
      precio_dia: 10,
      comision_plataforma: 4,
      precio_final: 24,
      horario_id: horario?.id,
      estado: opts.estado ?? "pendiente",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear alquiler: ${error?.message}`);
  }

  return data;
}
