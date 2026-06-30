import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const TOKEN_KEY = 'puerta_token'
const ORG_ACTIVA_KEY = 'org_activa_id'

export const httpClient = axios.create({
    baseURL: BASE_URL,
})

httpClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    const orgActivaId = localStorage.getItem(ORG_ACTIVA_KEY)
    if (orgActivaId) {
        config.headers['X-Org-Id'] = orgActivaId
    }

    return config
})

// Callback que AuthContext registra para reaccionar a un 401
// (ej. limpiar sesión y redirigir a /login) sin que este módulo
// dependa de React Router ni del contexto de auth.
let onUnauthorized = null

export function setOnUnauthorized(callback) {
    onUnauthorized = callback
}

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            onUnauthorized?.()
        }
        return Promise.reject(error)
    }
)

/**
 * Extrae un mensaje de error legible de una respuesta de Axios.
 * El back puede responder { error: "mensaje" } o { error: { message } }
 * o { message: "mensaje" } dependiendo del endpoint; cubrimos esos casos.
 */
export function getApiErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
    const data = error?.response?.data

    return (
        (typeof data?.error === 'string' ? data.error : data?.error?.message) ??
        data?.message ??
        error?.message ??
        fallback
    )
}