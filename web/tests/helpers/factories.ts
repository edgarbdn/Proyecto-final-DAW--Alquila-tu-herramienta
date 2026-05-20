import { getServiceClient } from "./supabase";

// Crea una herramienta directamente en BD (saltando la API)
export async function crearHerramientaPrueba(opts: {
  vendedor_id: string;
  nombre?: string;
  precio_dia?: number;
  disponible?: boolean;
}): Promise<{ id: string }> {
  const supabase = getServiceClient();

  // Buscar primera categoría disponible
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id")
    .eq("activo", true)
    .limit(1)
    .single();

  if (!categoria) {
    throw new Error("No hay categorías activas en la BD");
  }

  const { data, error } = await supabase
    .from("herramientas")
    .insert({
      vendedor_id: opts.vendedor_id,
      categoria_id: categoria.id,
      nombre: opts.nombre ?? `Test Herramienta ${Date.now()}`,
      descripcion: "Herramienta de prueba creada por tests automatizados",
      precio_dia: opts.precio_dia ?? 10,
      disponible: opts.disponible ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Error creando herramienta: ${error?.message}`);
  }

  return data;
}

// Borra una herramienta y todas sus dependencias
export async function eliminarHerramientaPrueba(id: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("herramientas").delete().eq("id", id);
}

// Crea un horario de recogida para una herramienta
export async function crearHorarioPrueba(
  herramienta_id: string,
  hora = "10:00",
): Promise<{ id: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("horarios_recogida")
    .insert({ herramienta_id, hora })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Error creando horario: ${error?.message}`);
  return data;
}

// Limpia todas las herramientas de un usuario (útil para teardown)
export async function limpiarHerramientasDeUsuario(
  vendedor_id: string,
): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("herramientas").delete().eq("vendedor_id", vendedor_id);
}

// Limpia todos los alquileres de un usuario
export async function limpiarAlquileresDeUsuario(
  cliente_id: string,
): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from("alquileres").delete().eq("cliente_id", cliente_id);
}
