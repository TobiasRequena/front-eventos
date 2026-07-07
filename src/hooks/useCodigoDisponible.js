import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { getCodigoDisponible } from '@/api/eventos.api'

const REGEX_CODIGO = /^[a-zA-Z0-9-]{3,20}$/

export function useCodigoDisponible(codigo, codigoOriginal = null) {
  const codigoDebounced = useDebounce(codigo, 600)
  const [estado, setEstado] = useState('idle')

  // Resetear a idle apenas el usuario empieza a tipear
  // (antes de que el debounce se dispare)
  useEffect(() => {
    if (!codigo || codigo === codigoOriginal) return
    setEstado('idle')
  }, [codigo, codigoOriginal])

  useEffect(() => {
    // Si el código es el mismo que el original del evento → disponible sin consultar
    if (codigoDebounced && codigoDebounced === codigoOriginal) {
      setEstado('disponible')
      return
    }

    if (!codigoDebounced || !REGEX_CODIGO.test(codigoDebounced)) {
      setEstado('idle')
      return
    }

    let cancelado = false
    setEstado('checking')

    getCodigoDisponible(codigoDebounced)
      .then((disponible) => {
        if (!cancelado) setEstado(disponible ? 'disponible' : 'no_disponible')
      })
      .catch(() => {
        if (!cancelado) setEstado('error')
      })

    return () => { cancelado = true }
  }, [codigoDebounced, codigoOriginal])

  return estado
}