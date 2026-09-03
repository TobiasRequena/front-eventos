import { useState, useEffect, useRef } from 'react'
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
import { useProvincias, useLocalidades, useBuscarLocalidades } from '@/hooks/useGeoref'
import { Loader2 } from 'lucide-react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'

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

function LocalidadSearch({ provinciaId, value, onChange }) {
  const [busqueda, setBusqueda] = useState(value ?? '')
  const [abierto, setAbierto] = useState(false)
  const inputRef = useRef(null)
  const seleccionando = useRef(false)
  const { resultados, isLoading, buscar } = useBuscarLocalidades(provinciaId)

  useEffect(() => {
    if (seleccionando.current) {
      seleccionando.current = false
      return
    }
    const timer = setTimeout(() => buscar(busqueda), 300)
    return () => clearTimeout(timer)
  }, [busqueda, provinciaId])

  useEffect(() => {
    if (resultados.length > 0) setAbierto(true)
  }, [resultados])

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            onChange('')
          }}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onFocus={() => busqueda.length >= 2 && resultados.length > 0 && setAbierto(true)}
          placeholder={provinciaId ? 'Buscar localidad...' : 'Primero seleccioná provincia'}
          disabled={!provinciaId}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {abierto && resultados.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          {resultados.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted text-left transition-colors"
              onClick={() => {
                seleccionando.current = true
                setBusqueda(loc.nombre)
                onChange(loc.nombre)
                setAbierto(false)
                inputRef.current?.blur()
              }}
            >
              {loc.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
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

function FormCrearGrupo({ onDatosChange, defaultValues }) {
  const [provinciaId, setProvinciaId] = useState('')
  const { provincias, isLoading: cargandoProvincias } = useProvincias()

  const form = useForm({
    resolver: zodResolver(grupoNuevoSchema),
    defaultValues: defaultValues ?? {
      nombre: '',
      parroquia: '',
      provincia: '',
      localidad: '',
      maxIntegrantes: 10,
    },
  })

  const { trigger } = form

  function handleChange() {
    const valores = form.getValues()
    const resultado = grupoNuevoSchema.safeParse(valores)
    onDatosChange(resultado.success ? valores : null)
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

        <FormField
          control={form.control}
          name="parroquia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parroquia / Institución</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Parroquia San Martín" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <Combobox
                  items={provincias.map(p => p.nombre)}
                  value={field.value}
                  onValueChange={(v) => {
                    const prov = provincias.find(p => p.nombre === v)
                    setProvinciaId(prov?.id ?? '')
                    field.onChange(v)
                    form.setValue('localidad', '')
                    handleChange()
                  }}
                >
                  <ComboboxInput placeholder="Seleccioná una provincia" disabled={cargandoProvincias} />
                  <ComboboxContent>
                    <ComboboxEmpty>No se encontraron provincias.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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
                <LocalidadSearch
                  provinciaId={provinciaId}
                  value={field.value}
                  onClick={() => {
                    setBusqueda(loc.nombre)
                    onChange(loc.nombre)
                    setAbierto(false)
                    setTimeout(() => handleChange(), 0)
                  }}
                  onChange={(v) => {
                    field.onChange(v)
                    handleChange()
                  }}
                />
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
          <FormCrearGrupo
            onDatosChange={setDatosGrupoNuevo}
            defaultValues={datosWizard.datosGrupoNuevo}
          />
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