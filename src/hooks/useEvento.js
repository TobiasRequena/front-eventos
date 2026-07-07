import { useCallback, useEffect, useState } from 'react'
import { getEventoPorId } from '@/api/eventos.api'

export function useEvento(id) {
  const [evento, setEvento] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!id) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getEventoPorId(id)
      setEvento(data)
      setStatus('success')
    } catch (err) {
      setError(err)
      setStatus('error')
    }
  }, [id])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    evento,
    setEvento,
    isLoading: status === 'loading',
    isError: status === 'error',
    reintentar: cargar,
  }
}