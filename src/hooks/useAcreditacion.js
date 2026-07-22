import { useState, useCallback } from 'react'
import { crearSesionAcreditacion } from '@/api/acreditacion.api'

const STORAGE_KEY = 'puerta_acreditacion_sesion'

function cargarSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAcreditacion() {
  const [sesion, setSesion] = useState(cargarSesion)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const iniciarSesion = useCallback(async ({ nombre, apellido, eventoId }) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await crearSesionAcreditacion({ nombre, apellido, eventoId })
      const nuevaSesion = {
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        eventoId: data.evento_id,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaSesion))
      setSesion(nuevaSesion)
    } catch {
      setError('No pudimos iniciar la sesión. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSesion(null)
  }, [])

  return {
    sesion,
    isLoading,
    error,
    iniciarSesion,
    cerrarSesion,
    isAuthenticated: !!sesion,
  }
}