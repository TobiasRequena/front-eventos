import { useEffect, useState } from 'react'

/**
 * Lleva registro de qué tabs ya fueron visitadas. Se usa junto a
 * `forceMount` en TabsContent para que, una vez que una tab se visitó,
 * su contenido quede montado (oculto vía CSS) en vez de destruirse al
 * salir — así no se pierde el estado ni se repiten fetchs al volver.
 */
export function useTabsPersistentes(tabActivo) {
  const [visitadas, setVisitadas] = useState(() => new Set([tabActivo]))

  useEffect(() => {
    setVisitadas((prev) => (prev.has(tabActivo) ? prev : new Set(prev).add(tabActivo)))
  }, [tabActivo])

  return (tab) => visitadas.has(tab)
}
