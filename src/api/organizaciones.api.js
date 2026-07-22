import { httpClient } from '@/api/httpClient'

export async function getOrganizaciones() {
  const { data } = await httpClient.get('/organizaciones')
  return data.organizaciones
}

export async function getOrganizacion(id) {
  const { data } = await httpClient.get(`/organizaciones/${id}`)
  return data.organizacion
}

export async function patchOrganizacion(id, payload) {
  const { data } = await httpClient.patch(`/organizaciones/${id}`, payload)
  return data.organizacion
}

export async function getMiembros(orgId) {
  const { data } = await httpClient.get(`/organizaciones/${orgId}/miembros`)
  return data.miembros
}

export async function invitarMiembro(orgId, payload) {
  const { data } = await httpClient.post(`/organizaciones/${orgId}/miembros`, payload)
  return data
}

export async function eliminarMiembro(orgId, usuarioId) {
  await httpClient.delete(`/organizaciones/${orgId}/miembros/${usuarioId}`)
}

export async function cambiarRolMiembro(orgId, usuarioId, rol) {
  const { data } = await httpClient.patch(
    `/organizaciones/${orgId}/miembros/${usuarioId}`,
    { rol }
  )
  return data.vinculo
}

export async function salirOrganizacion(orgId) {
  await httpClient.delete(`/organizaciones/${orgId}/miembros/me`)
}