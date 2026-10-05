import { httpClient } from '@/api/httpClient'

/**
 * @param {string} eventoId
 * @param {{ incluirInactivos?: boolean }} [opciones]
 * @returns {Promise<Array<object>>}
 */
export async function listarCamposForm(eventoId, { incluirInactivos = false } = {}) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/campos-form`, {
    params: incluirInactivos ? { incluirInactivos: true } : undefined,
  })
  return data.campos
}

/**
 * Solo etiqueta, opciones (agregar/renombrar, nunca quitar) y activo (baja lógica).
 * @param {string} eventoId
 * @param {string} campoId
 * @param {{ etiqueta?: string, opciones?: string[], activo?: boolean }} payload
 * @returns {Promise<object>}
 */
export async function editarCampoForm(eventoId, campoId, payload) {
  const { data } = await httpClient.patch(`/eventos/${eventoId}/campos-form/${campoId}`, payload)
  return data.campo
}
