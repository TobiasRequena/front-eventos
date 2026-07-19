import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

function clienteConToken(token) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function loginReferente({ dni, codigoGrupo }) {
  const { data } = await publicClient.post('/grupos/panel/login', { dni, codigoGrupo })
  return data
}

export async function getIntegrantes(grupoId, token) {
  const { data } = await clienteConToken(token).get(`/grupos/${grupoId}/panel/integrantes`)
  return data.integrantes
}

export async function getSolicitudes(grupoId, token) {
  const { data } = await clienteConToken(token).get(`/grupos/${grupoId}/panel/solicitudes`)
  return data.solicitudes
}

export async function responderSolicitud(participanteId, estado, token) {
  const { data } = await clienteConToken(token).patch(
    `/participantes/${participanteId}/vinculo`,
    { estado }
  )
  return data
}