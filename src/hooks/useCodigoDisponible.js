import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { getCodigoDisponible } from '@/api/eventos.api'

const REGEX_CODIGO = /^[a-zA-Z0-9-]{3,20}$/

export function useCodigoDisponible(codigo) {
  const codigoDebounced = useDebounce(codigo, 600)
  const [estado, setEstado] = useState('idle') // idle | checking | disponible | no_disponible | error

  useEffect(() => {
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
  }, [codigoDebounced])

  return estado
}