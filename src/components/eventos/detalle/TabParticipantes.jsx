import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ParticipantesDataTable } from '@/components/eventos/detalle/ParticipantesDataTable'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { buildColumns } from '@/components/eventos/detalle/participantes.columns'
import { useParticipantes } from '@/hooks/useParticipantes'

function TablaSkeletonRows() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function TabParticipantes({ evento }) {
  const { participantes, isLoading, isError, reintentar } = useParticipantes(evento.id)
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const camposForm = evento.camposForm ?? []

  const columns = useMemo(
    () =>
      buildColumns({
        camposForm,
        tieneCosto: parseFloat(evento?.costo ?? 0) > 0,
        tieneGrupos: evento?.tiene_grupos ?? false,
        onVerDetalle: (participante) => {
          setParticipanteSeleccionado(participante)
          setDrawerAbierto(true)
        },
      }),
    [camposForm, evento]
  )

  if (isLoading) return <TablaSkeletonRows />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No pudimos cargar los participantes</p>
        <Button variant="outline" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <ParticipantesDataTable
        columns={columns}
        data={participantes}
        evento={evento}
        camposForm={camposForm}
      />
      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={camposForm}
        evento={evento}
        open={drawerAbierto}
        onClose={() => {
          setDrawerAbierto(false)
          setParticipanteSeleccionado(null)
        }}
      />
    </>
  )
}