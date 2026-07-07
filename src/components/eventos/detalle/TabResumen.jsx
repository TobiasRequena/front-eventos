import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ResumenKpis } from '@/components/eventos/detalle/ResumenKpis'
import { TalleresProgreso } from '@/components/eventos/detalle/TalleresProgreso.jsx'
import { RespuestasPopulares } from '@/components/eventos/detalle/RespuestasPopulares'
import { TallerParticipantesPanel } from '@/components/eventos/detalle/TallerParticipantesPanel'
import { EventoPreviewPanel } from '@/components/eventos/EventoPreviewPanel'
import { getEventoStats } from '@/api/eventos.api'

function ResumenSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

export function TabResumen({ evento }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null)
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null)

  useEffect(() => {
    if (!evento) return
    setIsLoading(true)
    getEventoStats(evento.id)
      .then(setStats)
      .finally(() => setIsLoading(false))
  }, [evento])

  if (isLoading || !stats) return <ResumenSkeleton />

  if (tallerSeleccionado) {
    return (
      <TallerParticipantesPanel
        bloque={bloqueSeleccionado}
        taller={tallerSeleccionado}
        onVolver={() => {
          setTallerSeleccionado(null)
          setBloqueSeleccionado(null)
        }}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <ResumenKpis stats={stats} />

        <RespuestasPopulares camposFormStats={stats.camposFormStats} />

        <TalleresProgreso
          bloquesTaller={stats.bloquesTaller}
          onSeleccionarTaller={(bloque, taller) => {
            setBloqueSeleccionado(bloque)
            setTallerSeleccionado(taller)
          }}
        />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <EventoPreviewPanel evento={evento} readOnly />
        </div>
      </div>
    </div>
  )
}