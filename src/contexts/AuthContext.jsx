import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '@/api/auth.api'
import { TOKEN_KEY, setOnUnauthorized } from '@/api/httpClient'

const ORG_ACTIVA_KEY = 'org_activa_id'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null)
    const [organizaciones, setOrganizaciones] = useState([])
    const [orgActivaId, setOrgActivaId] = useState(() => localStorage.getItem(ORG_ACTIVA_KEY))
    // 'loading' = todavía no sabemos si hay sesión válida (chequeo inicial)
    const [status, setStatus] = useState('loading')

    const limpiarSesion = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(ORG_ACTIVA_KEY)
        localStorage.removeItem('talita.meGusta') // son del usuario: no quedan para quien use la máquina después
        setUsuario(null)
        setOrganizaciones([])
        setOrgActivaId(null)
        setStatus('unauthenticated')
    }, [])

    // El httpClient avisa por acá cuando una request vuelve 401,
    // típicamente porque el token expiró.
    useEffect(() => {
        setOnUnauthorized(limpiarSesion)
    }, [limpiarSesion])

    const aplicarSesion = useCallback((usuarioData, organizacionesData) => {
        setUsuario(usuarioData)
        setOrganizaciones(organizacionesData)

        setOrgActivaId((prevOrgActivaId) => {
            const sigueSiendoValida = organizacionesData.some((org) => org.id === prevOrgActivaId)
            const orgActivaFinal = sigueSiendoValida ? prevOrgActivaId : (organizacionesData[0]?.id ?? null)

            // Siempre sincronizamos localStorage con el resultado, en vez de asumir
            // que ya está correcto cuando la org previa sigue siendo válida.
            if (orgActivaFinal) {
                localStorage.setItem(ORG_ACTIVA_KEY, orgActivaFinal)
            } else {
                localStorage.removeItem(ORG_ACTIVA_KEY)
            }
            return orgActivaFinal
        })

        setStatus('authenticated')
    }, [])

    const cargarSesionDesdeToken = useCallback(async () => {
        try {
            const data = await authApi.getMe()
            aplicarSesion(data.usuario, data.organizaciones)
        } catch {
            limpiarSesion()
        }
    }, [aplicarSesion, limpiarSesion])

    // Al montar la app: si hay token guardado, validarlo contra /me.
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) {
            setStatus('unauthenticated')
            return
        }
        cargarSesionDesdeToken()
    }, [cargarSesionDesdeToken])

    const login = useCallback(
        async (credentials) => {
            const data = await authApi.login(credentials)
            localStorage.setItem(TOKEN_KEY, data.token)
            await cargarSesionDesdeToken()
        },
        [cargarSesionDesdeToken]
    )

    const register = useCallback(
        async (payload) => {
            const data = await authApi.register(payload)
            localStorage.setItem(TOKEN_KEY, data.token)
            // No cargamos la sesión automáticamente acá: si el usuario todavía
            // no verificó su email, RegisterPage lo manda a /verificar-email
            // sin marcar isAuthenticated, para que GuestRoute no lo redirija
            // a /dashboard en el medio (race entre navigate() y <GuestRoute>).
            // Cuando corresponda entrar directo, el caller llama a
            // completarSesion().
            return data
        },
        []
    )

    const completarSesion = useCallback(
        () => cargarSesionDesdeToken(),
        [cargarSesionDesdeToken]
    )

    const logout = useCallback(() => {
        limpiarSesion()
    }, [limpiarSesion])

    const cambiarOrgActiva = useCallback((nuevaOrgId) => {
        setOrgActivaId(nuevaOrgId)
        localStorage.setItem(ORG_ACTIVA_KEY, nuevaOrgId)
    }, [])

    const orgActiva = useMemo(
        () => organizaciones.find((org) => org.id === orgActivaId) ?? null,
        [organizaciones, orgActivaId]
    )

    const value = useMemo(
        () => ({
            usuario,
            organizaciones,
            orgActiva,
            status,
            isAuthenticated: status === 'authenticated',
            isLoading: status === 'loading',
            login,
            register,
            completarSesion,
            logout,
            cambiarOrgActiva,
        }),
        [usuario, organizaciones, orgActiva, status, login, register, completarSesion, logout, cambiarOrgActiva]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
    }
    return context
}