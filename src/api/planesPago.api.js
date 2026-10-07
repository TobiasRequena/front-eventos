import { httpClient } from '@/api/httpClient'

/**
 * Reemplaza todos los planes de pago en cuotas del evento.
 * @param {string} eventoId
 * @param {Array<{ nombre: string, cuotas: Array<{ porcentaje?: number|null, monto?: number|null, vencimiento?: string|null }> }>} planes
 */
export async function guardarPlanesPago(eventoId, planes) {
  const { data } = await httpClient.put(`/eventos/${eventoId}/planes-pago`, { planes })
  return data.planes
}
