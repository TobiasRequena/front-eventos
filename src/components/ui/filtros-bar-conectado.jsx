import { SelectFiltro } from '@/components/ui/select-filtro'
import { FiltrosBar } from '@/components/ui/filtros-bar'

/**
 * Conecta el estado de useFiltrosBar con el layout de FiltrosBar: arma los
 * <SelectFiltro> a partir de `filtros` + `filtrosState`, y le pasa todo a
 * FiltrosBar. Es un componente real (no una función devuelta por el hook),
 * así React lo trata como una unidad estable en el árbol de renderizado.
 */
export function FiltrosBarConectado({ filtrosState, filtros, busquedaPlaceholder, columnas, acciones }) {
  const { busqueda, setBusqueda, valores, setValor, filtrosActivos, limpiarTodo } = filtrosState

  const selects = filtros.map((filtro) => (
    <SelectFiltro
      key={filtro.key}
      label={filtro.label}
      placeholder={filtro.placeholder}
      value={valores[filtro.key] ?? (filtro.default ?? 'todos')}
      onChange={(valor) => setValor(filtro.key, valor)}
      opciones={filtro.opciones}
    />
  ))

  return (
    <FiltrosBar
      busqueda={busqueda}
      onBusquedaChange={setBusqueda}
      busquedaPlaceholder={busquedaPlaceholder}
      selects={selects}
      filtrosActivos={filtrosActivos}
      onLimpiarTodo={limpiarTodo}
      columnas={columnas}
      acciones={acciones}
    />
  )
}
