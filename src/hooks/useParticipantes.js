import { useCallback, useEffect, useState } from 'react'
import { getParticipantes } from '@/api/participantes.api'

export function useParticipantes(eventoId) {
  const [participantes, setParticipantes] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!eventoId) return
    setStatus('loading')
    setError(null)

    try {
      const raw = await getParticipantes(eventoId)

      const normalizados = raw.map((p) => ({
        ...p,
        fecha_nacimiento: p.nacimiento,
      }))

      setParticipantes(normalizados)
      setStatus('success')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [eventoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    participantes,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    reintentar: cargar,
  }
}