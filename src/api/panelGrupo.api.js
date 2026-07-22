import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

export function clientePanelGrupo(token, onTokenExpirado) {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        onTokenExpirado?.()
      }
      return Promise.reject(error)
    }
  )

  return client
}

export async function loginReferente({ dni, codigoGrupo }) {
  const { data } = await publicClient.post('/grupos/panel/login', { dni, codigoGrupo })
  return data
}

export async function getIntegrantes(grupoId, token, onTokenExpirado) {
  const { data } = await clientePanelGrupo(token, onTokenExpirado)
    .get(`/grupos/${grupoId}/panel/integrantes`)
  return data.integrantes
}

export async function getSolicitudes(grupoId, token, onTokenExpirado) {
  const { data } = await clientePanelGrupo(token, onTokenExpirado)
    .get(`/grupos/${grupoId}/panel/solicitudes`)
  return data.solicitudes
}

export async function responderSolicitud(participanteId, estado, token, onTokenExpirado) {
  const { data } = await clientePanelGrupo(token, onTokenExpirado)
    .patch(`/participantes/${participanteId}/vinculo`, { estado })
  return data
}