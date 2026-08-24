import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Users, UserPlus, User, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { grupoNuevoSchema } from '@/lib/validators/inscripcion.schemas'
import { getGrupoPorCodigoInvitacion } from '@/api/inscripcion.api'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'
import { Checkbox } from "@/components/ui/checkbox"

const OPCIONES_ROL = [
  {
    id: 'unirse',
    label: 'Unirme a un grupo',
    descripcion: 'Tengo el código de un grupo o quiero buscar uno.',
    icon: Users,
    soloMayores: false,
  },
  {
    id: 'crear',
    label: 'Crear un grupo',
    descripcion: 'Soy el responsable y voy a traer más personas.',
    icon: UserPlus,
    soloMayores: true,
  },
  {
    id: 'individual',
    label: 'Participar individualmente',
    descripcion: 'Me inscribo solo, sin grupo.',
    icon: User,
    soloMayores: true,
  },
]

function OpcionRol({ opcion, seleccionada, onClick, deshabilitada }) {
  const Icon = opcion.icon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitada}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
        seleccionada
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-accent/50',
        deshabilitada && 'cursor-not-allowed opacity-40'
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{opcion.label}</p>
        <p className="text-xs text-muted-foreground">{opcion.descripcion}</p>
      </div>
      {seleccionada && (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      )}
    </button>
  )
}

function FormUnirseGrupo({ grupoPreseleccionado, onGrupoResuelto }) {
  const codigoInicial = grupoPreseleccionado?.codigo_inv ?? ''
  const [codigo, setCodigo] = useState(codigoInicial)
  const [buscando, setBuscando] = useState(false)
  const [grupoEncontrado, setGrupoEncontrado] = useState(
    grupoPreseleccionado?.id ? grupoPreseleccionado : null
  )

  // Si llegó con código pre-cargado pero sin datos del grupo resuelto,
  // buscar automáticamente al montar
  useEffect(() => {
    if (codigoInicial && !grupoPreseleccionado?.id) {
      buscarGrupo(codigoInicial)
    } else if (grupoPreseleccionado?.id) {
      // Ya tenemos el grupo resuelto, notificar al padre
      onGrupoResuelto(grupoPreseleccionado)
    }
  }, [])

  async function buscarGrupo(codigoABuscar) {
    const cod = (codigoABuscar ?? codigo).trim()
    if (!cod) return
    setBuscando(true)
    try {
      const grupo = await getGrupoPorCodigoInvitacion(cod)
      setGrupoEncontrado(grupo)
      onGrupoResuelto(grupo)
    } catch (error) {
      const status = error?.response?.status
      if (status === 404) toast.error('Código de grupo inválido.')
      else if (status === 409) toast.error('El grupo ya está lleno.')
      else toast.error('No pudimos verificar el código.')
      setGrupoEncontrado(null)
      onGrupoResuelto(null)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Código de invitación"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase())
            setGrupoEncontrado(null)
            onGrupoResuelto(null)
          }}
          className="uppercase"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => buscarGrupo()}
          disabled={buscando || !codigo.trim()}
          className="shrink-0"
        >
          <Search className="h-4 w-4" />
          {buscando ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {buscando && (
        <p className="text-xs text-muted-foreground">Verificando código...</p>
      )}

      {grupoEncontrado && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <div>
            <p className="font-medium text-foreground">{grupoEncontrado.nombre}</p>
            {grupoEncontrado.localidad && (
              <p className="text-xs text-muted-foreground">{grupoEncontrado.localidad}</p>
            )}
            {grupoEncontrado.max_integrantes != null && (
              <p className="text-xs text-muted-foreground">
                {grupoEncontrado.integrantes_count ?? '?'} / {grupoEncontrado.max_integrantes} integrantes
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FormCrearGrupo({ onDatosChange }) {
  const form = useForm({
    resolver: zodResolver(grupoNuevoSchema),
    defaultValues: {
      nombre: '',
      parroquia: '',
      localidad: '',
      maxIntegrantes: 10,
    },
  })

  function handleChange() {
    const valores = form.getValues()
    const valido = form.formState.isValid
    onDatosChange(valido ? valores : null)
  }

  return (
    <Form {...form}>
      <form onChange={handleChange} className="space-y-3">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del grupo</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Grupo San José" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="parroquia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parroquia / Institución</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="localidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localidad</FormLabel>
                <FormControl>
                  <Input placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="maxIntegrantes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de integrantes</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ej. 15"
                    disabled={field.value === null}
                    value={field.value === null ? '' : (field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="flex-1"
                  />
                </FormControl>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer shrink-0">
                  <Checkbox
                    checked={field.value === null}
                    onCheckedChange={(checked) => field.onChange(checked ? null : '')}
                  />
                  No lo sé
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {field.value === null
                  ? 'El grupo no tendrá límite de integrantes.'
                  : 'Cantidad máxima de personas que pueden unirse a tu grupo.'}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default function StepGrupo({ evento, wizard, codigoGrupoInicial }) {
  const { datosWizard, avanzar, retroceder, esUltimoPasoVisible } = wizard
  const { esMayor, rolGrupo: rolInicial } = datosWizard

  const soloDebeUnirse =
    !esMayor && evento.politica_menor === 'obligatorio'

  const puedeElegir =
    !esMayor && evento.politica_menor === 'opcional'

  const [rolElegido, setRolElegido] = useState(
    soloDebeUnirse ? 'unirse' : (rolInicial === 'responsable' ? 'crear' : rolInicial === 'ninguno' ? 'individual' : 'unirse')
  )
  const [grupoResuelto, setGrupoResuelto] = useState(
    datosWizard.grupoSeleccionado ?? null
  )
  const [datosGrupoNuevo, setDatosGrupoNuevo] = useState(
    datosWizard.datosGrupoNuevo ?? null
  )

  const opcionesDisponibles = OPCIONES_ROL.filter((op) => {
    if (soloDebeUnirse) return op.id === 'unirse'
    if (!esMayor && op.id === 'crear') return false
    if (puedeElegir && op.soloMayores) return false
    return true
  })

  function puedeAvanzar() {
    if (rolElegido === 'unirse') return grupoResuelto !== null
    if (rolElegido === 'crear') return datosGrupoNuevo !== null
    return true // individual
  }

  function handleAvanzar() {
    if (rolElegido === 'unirse' && !grupoResuelto) {
      toast.error('Buscá y seleccioná un grupo antes de continuar.')
      return
    }
    if (rolElegido === 'crear' && !datosGrupoNuevo) {
      toast.error('Completá los datos del grupo antes de continuar.')
      return
    }
    if (rolElegido === 'unirse') {
      avanzar({
        rolGrupo: 'autoinscripto',
        grupoId: grupoResuelto.id,
        grupoSeleccionado: grupoResuelto,
        datosGrupoNuevo: null,
      })
    } else if (rolElegido === 'crear') {
      avanzar({
        rolGrupo: 'responsable',
        grupoId: null,
        grupoSeleccionado: null,
        datosGrupoNuevo,
      })
    } else {
      avanzar({
        rolGrupo: 'ninguno',
        grupoId: null,
        grupoSeleccionado: null,
        datosGrupoNuevo: null,
      })
    }
  }

  return (
    <InscripcionStepLayout evento={evento} titulo="¿Cómo vas a participar?">
      <div className="space-y-4">
        {soloDebeUnirse && (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Como sos menor de edad, necesitás unirte al grupo de un adulto responsable.
          </p>
        )}

        <div className="space-y-2">
          {opcionesDisponibles.map((opcion) => (
            <OpcionRol
              key={opcion.id}
              opcion={opcion}
              seleccionada={rolElegido === opcion.id}
              onClick={() => setRolElegido(opcion.id)}
            />
          ))}
        </div>

        {rolElegido === 'unirse' && (
          <FormUnirseGrupo
            grupoPreseleccionado={
              codigoGrupoInicial
                ? { codigo_inv: codigoGrupoInicial, ...datosWizard.grupoSeleccionado }
                : datosWizard.grupoSeleccionado
            }
            onGrupoResuelto={setGrupoResuelto}
          />
        )}

        {rolElegido === 'crear' && (
          <FormCrearGrupo onDatosChange={setDatosGrupoNuevo} />
        )}

        {rolElegido === 'individual' && (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Te vas a inscribir sin pertenecer a ningún grupo.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={retroceder} className="flex-1">
            Atrás
          </Button>
          <Button
            type="button"
            onClick={handleAvanzar}
            className="flex-1"
          >
            {esUltimoPasoVisible ? 'Enviar inscripción' : 'Continuar'}
          </Button>
        </div>
      </div>
    </InscripcionStepLayout>
  )
}