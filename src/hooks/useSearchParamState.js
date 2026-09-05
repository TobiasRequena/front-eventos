import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'

/**
 * Sincroniza un valor de filtro con la URL (?key=valor).
 * El estado se mantiene local para que tipear no pierda caracteres
 * (escribir en la URL en cada tecla es más lento que el tipeo y
 * termina descartando pulsaciones); la URL se actualiza recién
 * después de un debounce, con replace para no ensuciar el historial.
 */
export function useSearchParamState(key, defaultValue = '', { debounceMs = 400 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(() => searchParams.get(key) ?? defaultValue)
  const debouncedValue = useDebounce(value, debounceMs)
  const primerRender = useRef(true)

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!debouncedValue || debouncedValue === defaultValue) {
        next.delete(key)
      } else {
        next.set(key, debouncedValue)
      }
      return next
    }, { replace: true })
  }, [debouncedValue, key, defaultValue, setSearchParams])

  return [value, setValue]
}
