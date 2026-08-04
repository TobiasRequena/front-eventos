import { httpClient } from '@/api/httpClient'

const base = (eventoId) => `/eventos/${eventoId}/esquemas-grupos-trabajo`

export async function getEsquemas(eventoId) {
  const { data } = await httpClient.get(base(eventoId))
  return data.esquemas
}

export async function getEsquema(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}`)
  return data.esquema
}

export async function crearEsquema(eventoId, payload) {
  const { data } = await httpClient.post(base(eventoId), payload)
  return data.esquema
}

export async function patchEsquema(eventoId, esquemaId, payload) {
  const { data } = await httpClient.patch(`${base(eventoId)}/${esquemaId}`, payload)
  return data.esquema
}

export async function eliminarEsquema(eventoId, esquemaId) {
  await httpClient.delete(`${base(eventoId)}/${esquemaId}`)
}

export async function getNombresPresets(eventoId) {
  const { data } = await httpClient.get(`${base(eventoId)}/nombres-presets`)
  return data.presets
}

export async function crearTanda(eventoId, esquemaId, payload) {
  const { data } = await httpClient.post(`${base(eventoId)}/${esquemaId}/tandas`, payload)
  return data.tanda
}

export async function patchTanda(eventoId, esquemaId, tandaId, payload) {
  const { data } = await httpClient.patch(`${base(eventoId)}/${esquemaId}/tandas/${tandaId}`, payload)
  return data.tanda
}

export async function eliminarTanda(eventoId, esquemaId, tandaId) {
  await httpClient.delete(`${base(eventoId)}/${esquemaId}/tandas/${tandaId}`)
}

export async function reordenarTandas(eventoId, esquemaId, tandas) {
  const { data } = await httpClient.patch(`${base(eventoId)}/${esquemaId}/tandas/reordenar`, { tandas })
  return data
}

export async function getPreview(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}/preview`)
  return data
}

export async function generarEsquema(eventoId, esquemaId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${esquemaId}/generar`)
  return data
}

export async function getGrupos(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}/grupos`)
  return data.grupos
}

export async function getPendientes(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}/pendientes`)
  return data.pendientes
}

export async function agregarAGrupo(eventoId, esquemaId, grupoId, participanteId) {
  const { data } = await httpClient.patch(
    `${base(eventoId)}/${esquemaId}/grupos/${grupoId}/agregar`,
    { participanteId }
  )
  return data
}

export async function quitarDeGrupo(eventoId, esquemaId, grupoId, participanteId) {
  const { data } = await httpClient.patch(
    `${base(eventoId)}/${esquemaId}/grupos/${grupoId}/quitar/${participanteId}`
  )
  return data
}

export async function agregarExcluido(eventoId, esquemaId, participanteIds) {
  const { data } = await httpClient.post(
    `${base(eventoId)}/${esquemaId}/excluidos`,
    { participanteIds }
  )
  return data
}

export async function quitarExcluido(eventoId, esquemaId, participanteId) {
  await httpClient.delete(`${base(eventoId)}/${esquemaId}/excluidos/${participanteId}`)
}

export async function descargarExcelEsquema(eventoId, esquemaId, nombreEsquema) {
  const response = await httpClient.get(
    `/eventos/${eventoId}/esquemas-grupos-trabajo/${esquemaId}/excel`,
    { responseType: 'blob' }
  )
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `grupos-${nombreEsquema ?? esquemaId}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function descargarExcelGrupo(eventoId, esquemaId, grupoId, nombreGrupo) {
  const response = await httpClient.get(
    `/eventos/${eventoId}/esquemas-grupos-trabajo/${esquemaId}/grupos/${grupoId}/excel`,
    { responseType: 'blob' }
  )
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `grupo-${nombreGrupo ?? grupoId}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function notificarEsquema(eventoId, esquemaId) {
  const { data } = await httpClient.post(
    `/eventos/${eventoId}/esquemas-grupos-trabajo/${esquemaId}/notificar`
  )
  return data
}

export async function notificarParticipante(eventoId, esquemaId, participanteId) {
  const { data } = await httpClient.post(
    `/eventos/${eventoId}/esquemas-grupos-trabajo/${esquemaId}/notificar/${participanteId}`
  )
  return data
}