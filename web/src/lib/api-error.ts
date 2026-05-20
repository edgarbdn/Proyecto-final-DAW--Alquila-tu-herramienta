import { NextResponse } from "next/server";

/**
 * Manejo centralizado de errores de API.
 * - Loguea el error real en el servidor (visible en logs de Vercel/consola)
 * - Devuelve SIEMPRE un mensaje genérico en español al cliente
 * - Nunca expone detalles técnicos (mensajes de BD, stack traces, etc.)
 */
export function apiError(
  context: string,
  error: unknown,
  status = 500,
  mensajeCliente = "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
): NextResponse {
  // Log completo en servidor
  console.error(`[API Error] ${context}:`, error);

  return NextResponse.json({ error: mensajeCliente }, { status });
}

/**
 * Mensajes de error estándar en español para el cliente.
 * Usar estos en lugar de mensajes de BD o mensajes en inglés.
 */
export const ERROR_MESSAGES = {
  NO_AUTENTICADO: "Debes iniciar sesión para realizar esta acción.",
  NO_AUTORIZADO: "No tienes permiso para realizar esta acción.",
  NO_ENCONTRADO: "El recurso solicitado no existe.",
  DATOS_INVALIDOS: "Los datos enviados no son válidos.",
  CAMPOS_OBLIGATORIOS: "Faltan campos obligatorios.",
  ERROR_SERVIDOR: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
  CONFLICTO: "La operación no se puede realizar en el estado actual.",
} as const;
