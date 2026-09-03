import { httpClient } from '@/api/httpClient'

const base = (eventoId) => `/eventos/${eventoId}/esquemas-grupos-trabajo`

export async function getAgrupaciones(eventoId) {
  const { data } = await httpClient.get(base(eventoId))
  return data.esquemas
}

export async function getAgrupacion(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}`)
  return data.esquema
}

export async function crearAgrupacion(eventoId, payload) {
  const { data } = await httpClient.post(base(eventoId), payload)
  return data.esquema
}

export async function patchAgrupacion(eventoId, esquemaId, payload) {
  const { data } = await httpClient.patch(`${base(eventoId)}/${esquemaId}`, payload)
  return data.esquema
}

export async function eliminarAgrupacion(eventoId, esquemaId) {
  await httpClient.delete(`${base(eventoId)}/${esquemaId}`)
}

export async function getNombresPresets(eventoId) {
  const { data } = await httpClient.get(`${base(eventoId)}/nombres-presets`)
  return data.presets
}

export async function getPreview(eventoId, esquemaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${esquemaId}/preview`)
  return data
}

export async function generarAgrupacion(eventoId, esquemaId) {
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

export async function descargarExcelAgrupacion(eventoId, esquemaId, nombre) {
  const response = await httpClient.get(
    `${base(eventoId)}/${esquemaId}/excel`,
    { responseType: 'blob' }
  )
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `grupos-${nombre ?? esquemaId}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function descargarExcelGrupo(eventoId, esquemaId, grupoId, nombreGrupo) {
  const response = await httpClient.get(
    `${base(eventoId)}/${esquemaId}/grupos/${grupoId}/excel`,
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

export async function notificarAgrupacion(eventoId, esquemaId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${esquemaId}/notificar`)
  return data
}

export async function notificarGrupo(eventoId, esquemaId, grupoId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${esquemaId}/grupos/${grupoId}/notificar`)
  return data
}

export async function notificarParticipante(eventoId, esquemaId, participanteId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${esquemaId}/notificar/${participanteId}`)
  return data
}