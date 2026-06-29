import { useNavigate } from 'react-router-dom'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FILTROS_EVENTO } from '@/lib/eventos.helpers'

export function EventosFilterToggle({ filtroActivo }) {
  const navigate = useNavigate()

  function handleChange(nuevoFiltro) {
    // ToggleGroup en modo "single" puede deseleccionar (devuelve ''),
    // ignoramos ese caso para que siempre quede un filtro activo.
    if (nuevoFiltro) {
      navigate(`/eventos/${nuevoFiltro}`)
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={filtroActivo}
      onValueChange={handleChange}
      variant="outline"
    >
      {Object.entries(FILTROS_EVENTO).map(([key, { label }]) => (
        <ToggleGroupItem key={key} value={key} className="px-4">
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}