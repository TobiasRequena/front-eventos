import { httpClient } from '@/api/httpClient'

/**
 * @param {{ email: string, contrasena: string }} credentials
 * @returns {Promise<{ token: string, usuario: object }>}
 */
export async function login(credentials) {
    const { data } = await httpClient.post('/auth/login', credentials)
    return data
}

/**
 * @param {{ nombre: string, apellido: string, email: string, contrasena: string, organizacion?: { nombre: string } }} payload
 * @returns {Promise<{ token: string, usuario: object, organizacion: object }>}
 */
export async function register(payload) {
    const { data } = await httpClient.post('/auth/register', payload)
    return data
}

/**
 * @returns {Promise<{ usuario: object, organizaciones: Array<object> }>}
 */
export async function getMe() {
    const { data } = await httpClient.get('/auth/me')
    return data
}