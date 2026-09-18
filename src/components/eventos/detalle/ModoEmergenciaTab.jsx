import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getContactosEmergencia } from '@/api/eventos.api'
import { useFiltrosBar } from '@/hooks/useFiltrosBar'
import { FiltrosBarConectado } from '@/components/ui/filtros-bar-conectado'

function buscarContacto(c, q) {
  return c.nombre.toLowerCase().includes(q) || c.apellido.toLowerCase().includes(q)
}

function telHref(telefono) {
  return `tel:${telefono.replace(/[^\d+]/g, '')}`
}

export function ModoEmergenciaTab({ evento }) {
  const [contactos, setContactos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getContactosEmergencia(evento.id)
      .then(setContactos)
      .finally(() => setIsLoading(false))
  }, [evento.id])

  const filtrosState = useFiltrosBar({
    data: contactos,
    queryParamKey: 'emergencia',
    buscar: buscarContacto,
  })
  const { datosFiltrados: contactosFiltrados } = filtrosState

  return (
    <div className="space-y-3">
      <FiltrosBarConectado
        filtrosState={filtrosState}
        filtros={[]}
        busquedaPlaceholder="Buscar por nombre o apellido..."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando contactos de emergencia...</p>
      ) : contactosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No hay contactos de emergencia cargados.</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="whitespace-nowrap font-medium text-foreground">Participante</TableHead>
                <TableHead className="whitespace-nowrap font-medium text-foreground">Contacto de emergencia</TableHead>
                <TableHead className="whitespace-nowrap font-medium text-foreground">Teléfono</TableHead>
                <TableHead className="whitespace-nowrap font-medium text-foreground">Parentesco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactosFiltrados.map((c) => (
                <TableRow key={c.participante_id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap">{c.nombre} {c.apellido}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.contacto_nombre}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <a
                      href={telHref(c.telefono)}
                      className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {c.telefono}
                    </a>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.parentesco || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
