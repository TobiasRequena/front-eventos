import { useState, useCallback } from 'react'
import { loginReferente } from '@/api/panelGrupo.api'

const STORAGE_KEY = 'talita_panel_grupo'

function cargarSesion() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const sesion = raw ? JSON.parse(raw) : null
    if (sesion && sesion.token && sesion.grupo && sesion.responsable && sesion.evento) {
      return sesion
    }
    if (sesion) sessionStorage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function usePanelGrupo() {
  const [sesion, setSesion] = useState(cargarSesion)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async ({ dni, codigoGrupo }) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await loginReferente({ dni, codigoGrupo })
      const nuevaSesion = {
        token: data.token,
        grupo: data.grupo,
        responsable: data.responsable,
        evento: data.evento,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaSesion))
      setSesion(nuevaSesion)
    } catch (err) {
      const mensaje =
        err?.response?.status === 401
          ? 'DNI o código de grupo incorrecto.'
          : 'No pudimos iniciar sesión. Revisá tu conexión.'
      setError(mensaje)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSesion(null)
  }, [])

  return {
    sesion,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!sesion,
  }
}