import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getEventos } from '@/api/eventos.api'

export function useEventos() {
  const { orgActiva } = useAuth()
  const [eventos, setEventos] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  const cargarEventos = useCallback(async () => {
    if (!orgActiva?.id) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getEventos()
      setEventos(data)
      setStatus('success')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [orgActiva?.id])

  useEffect(() => {
    cargarEventos()
  }, [cargarEventos])

  return {
    eventos,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    reintentar: cargarEventos,
  }
}