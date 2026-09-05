import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye } from 'lucide-react'
import { getFichasMedicas } from '@/api/eventos.api'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { getParticipantePorId } from '../../../api/participantes.api'
import { useParticipanteDrawer } from '@/hooks/useParticipanteDrawer'
import { SearchInput } from '@/components/ui/search-input'
import { useSearchParamState } from '@/hooks/useSearchParamState'
import { useMemo } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const CONDICIONES = [
  { campo: 'tiene_diabetes', label: 'Diabetes' },
  { campo: 'tiene_asma', label: 'Asma' },
  { campo: 'tiene_epilepsia', label: 'Epilepsia' },
  { campo: 'tiene_cardiopatia', label: 'Cardiopatía' },
]

const CATEGORIAS = {
  condiciones: {
    label: 'Condiciones de salud',
    filtro: (f) => f.tiene_diabetes || f.tiene_asma || f.tiene_epilepsia || f.tiene_cardiopatia || f.otras_condiciones,
    subfiltros: [
      { value: 'todos', label: 'Todas las condiciones', filtro: (f) => f.tiene_diabetes || f.tiene_asma || f.tiene_epilepsia || f.tiene_cardiopatia || f.otras_condiciones },
      { value: 'diabetes', label: 'Diabetes', filtro: (f) => f.tiene_diabetes },
      { value: 'asma', label: 'Asma', filtro: (f) => f.tiene_asma },
      { value: 'epilepsia', label: 'Epilepsia', filtro: (f) => f.tiene_epilepsia },
      { value: 'cardiopatia', label: 'Cardiopatía', filtro: (f) => f.tiene_cardiopatia },
      { value: 'otras', label: 'Otras condiciones', filtro: (f) => f.otras_condiciones },
    ],
    columnas: ['nombre', 'condiciones', 'otras_condiciones'],
  },
  alergias: {
    label: 'Alergias y restricciones',
    filtro: (f) => f.alergias || f.restricciones_alimentarias,
    subfiltros: [
      { value: 'todos', label: 'Todas', filtro: (f) => f.alergias || f.restricciones_alimentarias },
      { value: 'alergias', label: 'Alergias', filtro: (f) => f.alergias },
      { value: 'restricciones', label: 'Restricciones alimentarias', filtro: (f) => f.restricciones_alimentarias },
    ],
    columnas: ['nombre', 'alergias', 'restricciones'],
  },
  adaptaciones: {
    label: 'Adaptaciones y discapacidad',
    filtro: (f) => f.tiene_discapacidad || f.recomendaciones,
    subfiltros: [
      { value: 'todos', label: 'Todas', filtro: (f) => f.tiene_discapacidad || f.recomendaciones },
      { value: 'discapacidad', label: 'Discapacidad', filtro: (f) => f.tiene_discapacidad },
      { value: 'recomendaciones', label: 'Recomendaciones', filtro: (f) => f.recomendaciones },
    ],
    columnas: ['nombre', 'adaptaciones', 'recomendaciones'],
  },
  medicacion: {
    label: 'Medicación (menores)',
    filtro: (f) => !f.es_mayor && f.medicacion?.length > 0,
    subfiltros: [
      { value: 'todos', label: 'Todos', filtro: (f) => !f.es_mayor && f.medicacion?.length > 0 },
    ],
    columnas: ['nombre', 'medicacion'],
  },
}


export function FichasMedicasPanel({ evento, categoria, onVolver }) {
  const { participante: participanteSeleccionado, drawerAbierto, cargando, abrirDrawer, cerrarDrawer } = useParticipanteDrawer()
  const [fichas, setFichas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busqueda, setBusqueda] = useSearchParamState('ficha')
  const [subfiltro, setSubfiltro] = useState('todos')

  useEffect(() => {
    getFichasMedicas(evento.id)
      .then((data) => setFichas(data))
      .finally(() => setIsLoading(false))
  }, [evento.id])

  const config = CATEGORIAS[categoria]

  // Resetear subfiltro cuando cambia categoría
  useEffect(() => setSubfiltro('todos'), [categoria])

  const fichasFiltradas = useMemo(() => {
    const subfiltroActivo = config.subfiltros.find(s => s.value === subfiltro)
    let resultado = fichas.filter(subfiltroActivo?.filtro ?? config.filtro)
    if (busqueda) {
      const q = busqueda.toLowerCase()
      resultado = resultado.filter(
        (f) => f.nombre.toLowerCase().includes(q) || f.apellido.toLowerCase().includes(q)
      )
    }
    return resultado
  }, [fichas, subfiltro, busqueda])

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

      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={setBusqueda}
          className="flex-1 min-w-48"
        />
        {config.subfiltros.length > 1 && (
          <Select value={subfiltro} onValueChange={setSubfiltro}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.subfiltros.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{config.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fichas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay participantes en esta categoría.
            </p>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="font-medium text-foreground">Nombre</TableHead>
                    {config.columnas.includes('condiciones') && (
                      <TableHead className="font-medium text-foreground">Condiciones</TableHead>
                    )}
                    {config.columnas.includes('otras_condiciones') && (
                      <TableHead className="font-medium text-foreground">Otras</TableHead>
                    )}
                    {config.columnas.includes('alergias') && (
                      <TableHead className="font-medium text-foreground">Alergias</TableHead>
                    )}
                    {config.columnas.includes('restricciones') && (
                      <TableHead className="font-medium text-foreground">Restricciones</TableHead>
                    )}
                    {config.columnas.includes('adaptaciones') && (
                      <TableHead className="font-medium text-foreground">Adaptaciones</TableHead>
                    )}
                    {config.columnas.includes('recomendaciones') && (
                      <TableHead className="font-medium text-foreground">Recomendaciones</TableHead>
                    )}
                    {config.columnas.includes('medicacion') && (
                      <TableHead className="font-medium text-foreground">Medicación</TableHead>
                    )}
                    <TableHead className="font-medium text-foreground">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichasFiltradas.map((ficha) => (
                    <TableRow key={ficha.participante_id} className="hover:bg-muted/50 align-top">
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {ficha.nombre} {ficha.apellido}
                        {!ficha.es_mayor && (
                          <Badge variant="secondary" className="ml-1.5 text-xs">Menor</Badge>
                        )}
                      </TableCell>
                      {config.columnas.includes('condiciones') && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {CONDICIONES.filter((c) => ficha[c.campo]).map((c) => (
                              <Badge key={c.campo} variant="outline" className="text-xs">{c.label}</Badge>
                            ))}
                            {!CONDICIONES.some((c) => ficha[c.campo]) && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {config.columnas.includes('otras_condiciones') && (
                        <TableCell className="text-sm text-muted-foreground">
                          {ficha.otras_condiciones ?? '—'}
                        </TableCell>
                      )}
                      {config.columnas.includes('alergias') && (
                        <TableCell className="text-sm text-muted-foreground">
                          {ficha.alergias ?? '—'}
                        </TableCell>
                      )}
                      {config.columnas.includes('restricciones') && (
                        <TableCell className="text-sm text-muted-foreground">
                          {ficha.restricciones_alimentarias ?? '—'}
                        </TableCell>
                      )}
                      {config.columnas.includes('adaptaciones') && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ficha.adaptaciones && Object.entries(ficha.adaptaciones)
                              .filter(([k, v]) => v && k !== 'otra')
                              .map(([k]) => (
                                <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                              ))
                            }
                            {ficha.adaptaciones?.otra && (
                              <Badge variant="outline" className="text-xs">{ficha.adaptaciones.otra}</Badge>
                            )}
                            {!ficha.tiene_discapacidad && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      )}
                      {config.columnas.includes('recomendaciones') && (
                        <TableCell className="text-sm text-muted-foreground max-w-48">
                          {ficha.recomendaciones ?? '—'}
                        </TableCell>
                      )}
                      {config.columnas.includes('medicacion') && (
                        <TableCell>
                          {ficha.medicacion?.length > 0 ? (
                            <div className="space-y-0.5">
                              {ficha.medicacion.map((med, i) => (
                                <p key={i} className="text-xs text-foreground">
                                  {med.nombre} — {med.dosis} ({med.horario})
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => abrirDrawer(ficha.participante_id)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalle</TooltipContent>
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
      />
    </div>
  )
}