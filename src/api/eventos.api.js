import { httpClient } from '@/api/httpClient'

/**
 * Lista los eventos de la organización activa (X-Org-Id va en el header
 * automáticamente, ver httpClient.js).
 * @returns {Promise<Array<object>>}
 */
export async function getEventos() {
  const { data } = await httpClient.get('/eventos')
  return data.eventos
}

/**
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getEventoPorId(id) {
  const { data } = await httpClient.get(`/eventos/${id}`)
  return data.evento
}

/**
 * @param {object} payload - ver contrato de POST /eventos
 * @returns {Promise<{ evento: object, camposForm: Array, talleres: Array, esPrimerEventoGratis: boolean }>}
 */
export async function crearEvento(payload) {
  const { data } = await httpClient.post('/eventos', payload)
  return data
}

/**
 * @param {string} codigo
 * @returns {Promise<boolean>}
 */
export async function getCodigoDisponible(codigo) {
  const { data } = await httpClient.get(`/eventos/codigo/${codigo}/disponible`)
  return data.disponible
}

export async function getEventoStats(id) {
  const { data } = await httpClient.get(`/eventos/${id}/stats`)
  return data
}

/**
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function patchEvento(id, payload) {
  const { data } = await httpClient.patch(`/eventos/${id}`, payload)
  return data.evento
}

export async function eliminarEvento(id) {
  await httpClient.delete(`/eventos/${id}`)
}

export async function descargarInscriptosExcel(eventoId, nombreEvento) {
  const response = await httpClient.get(`/eventos/${eventoId}/inscriptos/excel`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `inscriptos-${nombreEvento ?? eventoId}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}