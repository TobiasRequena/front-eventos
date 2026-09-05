import { useCallback, useMemo, useState } from 'react'
import { useSearchParamState } from '@/hooks/useSearchParamState'

/**
 * Dueño del estado y la lógica de una barra de filtros: búsqueda + N selects
 * declarativos (estáticos o generados dinámicamente, da igual). No sabe nada
 * de JSX/Selects — devuelve datos puros para que un componente los use.
 *
 * `filtros`: [{ key, label, opciones: [{value,label}], placeholder?, default?, siempre?, predicate: (item, valor) => boolean }]
 * `buscar`: (item, queryEnMinusculas) => boolean
 * `siempre: true` hace que el predicate se ejecute también con el valor por
 * defecto (para selects que siempre filtran, como una categoría con
 * subfiltro "todos" que igual exige cumplir la condición base) — ese filtro
 * tampoco genera chip de "filtro activo", es parte del browsing normal.
 */
export function useFiltrosBar({ data, queryParamKey, buscar, filtros = [] }) {
  const [busqueda, setBusqueda] = useSearchParamState(queryParamKey)
  const [valores, setValores] = useState({})

  const setValor = useCallback((key, valor) => {
    setValores((prev) => ({ ...prev, [key]: valor }))
  }, [])

  const datosFiltrados = useMemo(() => {
    return data.filter((item) => {
      if (busqueda && buscar && !buscar(item, busqueda.toLowerCase())) return false
      return filtros.every((filtro) => {
        const valorDefault = filtro.default ?? 'todos'
        const valor = valores[filtro.key] ?? valorDefault
        if (!filtro.siempre && valor === valorDefault) return true
        return filtro.predicate(item, valor)
      })
    })
  }, [data, busqueda, buscar, filtros, valores])

  const filtrosActivos = useMemo(() => {
    const activos = []
    if (busqueda) {
      activos.push({ key: '__busqueda', label: `Buscar: "${busqueda}"`, onClear: () => setBusqueda('') })
    }
    filtros.forEach((filtro) => {
      if (filtro.siempre) return
      const valorDefault = filtro.default ?? 'todos'
      const valor = valores[filtro.key] ?? valorDefault
      if (valor !== valorDefault) {
        const opcion = filtro.opciones.find((o) => o.value === valor)
        activos.push({
          key: filtro.key,
          label: `${filtro.label}: ${opcion?.label ?? valor}`,
          onClear: () => setValor(filtro.key, valorDefault),
        })
      }
    })
    return activos
  }, [busqueda, filtros, valores, setBusqueda, setValor])

  const limpiarTodo = useCallback(() => {
    setBusqueda('')
    setValores({})
  }, [setBusqueda])

  return { datosFiltrados, busqueda, setBusqueda, valores, setValor, filtrosActivos, limpiarTodo }
}
