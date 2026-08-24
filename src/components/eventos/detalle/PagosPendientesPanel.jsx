import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getParticipantesPendientesPago } from '@/api/eventos.api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { Eye } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useParticipanteDrawer } from '@/hooks/useParticipanteDrawer'

export function PagosPendientesPanel({ evento, onVolver }) {
  const [participantes, setParticipantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getParticipantesPendientesPago(evento.id)
      .then(setParticipantes)
      .finally(() => setIsLoading(false))
  }, [evento.id])

  const { participante: participanteSeleccionado, drawerAbierto, cargando, abrirDrawer, cerrarDrawer } = useParticipanteDrawer()

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onVolver}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al resumen
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comprobantes pendientes de revisión
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : participantes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay comprobantes pendientes de revisión.
            </p>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="font-medium text-foreground">Nombre</TableHead>
                    <TableHead className="font-medium text-foreground">DNI</TableHead>
                    <TableHead className="font-medium text-foreground">Grupo</TableHead>
                    <TableHead className="font-medium text-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantes.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {p.nombre} {p.apellido}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.dni}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.grupo?.nombre ?? '—'}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => abrirDrawer(p.id)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Ver comprobante</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={evento.camposForm ?? []}
        evento={evento}
        open={drawerAbierto}
        cargando={cargando}
        onClose={cerrarDrawer}
        onActualizar={() => getParticipantesPendientesPago(evento.id).then(setParticipantes)}
      />
    </div>
  )
}