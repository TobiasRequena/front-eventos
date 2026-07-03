import { httpClient } from '@/api/httpClient'

/**
 * @param {File} archivo
 * @param {string} eventoId
 * @param {string} orgId
 * @returns {Promise<{ url: string }>}
 */
export async function subirPortadaEvento(archivo, eventoId, orgId) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('contexto', 'portada_evento')
  formData.append('orgId', orgId)
  formData.append('eventoId', eventoId)

  const { data } = await httpClient.post('/archivos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.archivo
}