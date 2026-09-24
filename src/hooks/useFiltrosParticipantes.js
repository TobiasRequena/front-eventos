import { useMemo } from 'react'
import { eventoTieneCosto } from '@/lib/costoEvento'

export const OPCIONES_ESTADO_PAGO = [
  { value: 'todos', label: 'Todos' },
  { value: 'no_aplica', label: 'Sin costo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
]

export const OPCIONES_EDAD = [
  { value: 'todos', label: 'Todos' },
  { value: 'mayores', label: 'Solo mayores' },
  { value: 'menores', label: 'Solo menores' },
]

/**
 * Filtros declarativos (formato de useFiltrosBar) para listas de participantes:
 * pago, edad, grupo, zona y un select por cada campo de selección del formulario.
 */
export function useFiltrosParticipantes({ data, evento, camposForm = [] }) {
  const tieneCosto = eventoTieneCosto(evento)
  const tieneGrupos = evento?.tiene_grupos ?? false
  const tieneZonas = evento?.tiene_precio_por_zona ?? false

  const camposSeleccion = useMemo(
    () => camposForm.filter((campo) => campo.tipo === 'seleccion' && campo.opciones?.length > 0),
    [camposForm]
  )

  const grupos = useMemo(() => {
    const set = new Set()
    data.forEach((p) => { if (p.grupo?.nombre) set.add(p.grupo.nombre) })
    return Array.from(set).sort()
  }, [data])

  const zonas = useMemo(() => {
    const set = new Set()
    data.forEach((p) => { if (p.zona?.nombre) set.add(p.zona.nombre) })
    return Array.from(set).sort()
  }, [data])

  return useMemo(() => {
    const base = []
    if (tieneCosto) {
      base.push({
        key: 'pago',
        label: 'Estado de pago',
        opciones: OPCIONES_ESTADO_PAGO,
        predicate: (p, v) => p.estado_pago === v,
      })
    }
    base.push({
      key: 'edad',
      label: 'Edad',
      opciones: OPCIONES_EDAD,
      predicate: (p, v) => v === 'mayores' ? p.es_mayor : !p.es_mayor,
    })
    if (tieneGrupos && grupos.length > 0) {
      base.push({
        key: 'grupo',
        label: 'Grupo',
        placeholder: 'Todos los grupos',
        opciones: [
          { value: 'todos', label: 'Todos los grupos' },
          { value: 'sin_grupo', label: 'Sin grupo' },
          ...grupos.map((grupo) => ({ value: grupo, label: grupo })),
        ],
        predicate: (p, v) => v === 'sin_grupo' ? !p.grupo?.nombre : p.grupo?.nombre === v,
      })
    }
    if (tieneZonas && zonas.length > 0) {
      base.push({
        key: 'zona',
        label: 'Zona',
        placeholder: 'Todas las zonas',
        opciones: [
          { value: 'todos', label: 'Todas las zonas' },
          { value: 'sin_zona', label: 'Sin zona' },
          ...zonas.map((zona) => ({ value: zona, label: zona })),
        ],
        predicate: (p, v) => v === 'sin_zona' ? !p.zona?.nombre : p.zona?.nombre === v,
      })
    }
    camposSeleccion.forEach((campo) => {
      base.push({
        key: `campo_${campo.id}`,
        label: campo.etiqueta,
        opciones: [
          { value: 'todos', label: 'Todos' },
          ...campo.opciones.map((op) => ({ value: op, label: op })),
        ],
        predicate: (p, v) => String(p.respuestas_form?.[campo.id] ?? '') === v,
      })
    })
    return base
  }, [tieneCosto, tieneGrupos, grupos, tieneZonas, zonas, camposSeleccion])
}
