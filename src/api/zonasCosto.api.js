import { httpClient } from '@/api/httpClient'

/**
 * @param {string} eventoId
 * @param {{ nombre: string, costo: number }} payload
 * @returns {Promise<object>}
 */
export async function crearZonaCosto(eventoId, payload) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/zonas-costo`, payload)
  return data.zona
}

/**
 * @param {string} eventoId
 * @param {string} zonaId
 * @param {{ nombre?: string, costo?: number }} payload
 * @returns {Promise<object>}
 */
export async function editarZonaCosto(eventoId, zonaId, payload) {
  const { data } = await httpClient.patch(`/eventos/${eventoId}/zonas-costo/${zonaId}`, payload)
  return data.zona
}

/**
 * @param {string} eventoId
 * @param {string} zonaId
 */
export async function eliminarZonaCosto(eventoId, zonaId) {
  await httpClient.delete(`/eventos/${eventoId}/zonas-costo/${zonaId}`)
}
