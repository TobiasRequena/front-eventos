import { useState, useMemo } from 'react'

export function useColumnasVisibles(columns) {
  const [columnasExtrasVisibles, setColumnasExtrasVisibles] = useState(false)

  const columnVisibility = useMemo(() => {
    const visibility = {}
    columns.forEach((col) => {
      if (col.meta?.esExtra) {
        visibility[col.id] = columnasExtrasVisibles
      }
    })
    return visibility
  }, [columns, columnasExtrasVisibles])

  return { columnasExtrasVisibles, setColumnasExtrasVisibles, columnVisibility }
}