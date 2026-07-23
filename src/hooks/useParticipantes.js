import { useCallback, useEffect, useState } from 'react'
import { getParticipantes } from '@/api/participantes.api'

export function useParticipantes(eventoId) {
  const [participantes, setParticipantes] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'refreshing' | 'success' | 'error'
  const [error, setError] = useState(null)

  const cargar = useCallback(async (esRefresh = false) => {
    if (!eventoId) return
    setStatus(esRefresh ? 'refreshing' : 'loading')
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
    setParticipantes,
    isLoading: status === 'loading',
    isRefreshing: status === 'refreshing',
    isError: status === 'error',
    error,
    reintentar: () => cargar(true),
  }
}