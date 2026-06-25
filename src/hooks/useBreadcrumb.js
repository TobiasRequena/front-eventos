import { useEffect } from 'react'
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext'

/**
 * Cada página llama a este hook con la lista de migas que quiere mostrar
 * en el topbar, ej: useBreadcrumb([{ label: 'Eventos', to: '/eventos' }, { label: 'Activos' }])
 * El último item no necesita `to` (es la página actual, no es un link).
 */
export function useBreadcrumb(items) {
  const { setItems } = useBreadcrumbContext()

  // Serializamos a JSON para comparar por valor y no por referencia del array,
  // así evitamos un loop de renders si la página pasa un array nuevo cada render.
  const key = JSON.stringify(items)

  useEffect(() => {
    setItems(items)
    return () => setItems([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}