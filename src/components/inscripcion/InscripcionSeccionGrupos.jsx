import { Users, UserPlus, User, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const OPCIONES = [
  {
    id: 'crear',
    label: 'Crear un grupo',
    descripcion: 'Soy el responsable y voy a traer más personas. El día del evento, mi QR acredita a todo el grupo de una sola vez.',
    icon: UserPlus,
    soloMayores: true,
  },
  {
    id: 'unirse',
    label: 'Unirme a un grupo existente',
    descripcion: 'Tengo el código de invitación de un grupo o quiero buscar uno.',
    icon: Users,
    soloMayores: false,
  },
  {
    id: 'individual',
    label: 'Participar individualmente',
    descripcion: 'Me inscribo solo, sin pertenecer a ningún grupo.',
    icon: User,
    soloMayores: true,
  },
]

function textoPoliticaMenor(politicaMenor) {
  if (politicaMenor === 'obligatorio') {
    return 'Los participantes menores de edad deben unirse al grupo de un adulto responsable. Sin referente adulto, no pueden completar la inscripción.'
  }
  if (politicaMenor === 'opcional') {
    return 'Los participantes menores de edad pueden inscribirse solos o vincularse al grupo de un adulto responsable.'
  }
  return null
}

function OpcionGrupo({ opcion, seleccionada, preview }) {
  const Icon = opcion.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        preview && 'cursor-default opacity-70',
        seleccionada && !preview && 'border-primary bg-primary/5',
        seleccionada && preview && 'border-primary/50 bg-primary/5',
        !seleccionada && 'border-border',
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{opcion.label}</p>
        <p className="text-xs text-muted-foreground">{opcion.descripcion}</p>
        {opcion.soloMayores && preview && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            Solo disponible para mayores de edad.
          </p>
        )}
      </div>
      {seleccionada && (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      )}
    </div>
  )
}

/**
 * Sección de grupos reutilizable:
 * - preview=true → todas las opciones visibles pero deshabilitadas, sin selección
 * - preview=false → se usa dentro del StepGrupo del wizard (no renderiza nada,
 *   el wizard maneja su propio UI con lógica de selección)
 *
 * En el preview mostramos las 3 opciones informativas + la explicación de
 * política de menores si aplica.
 */
export function InscripcionSeccionGrupos({ evento, preview = false }) {
  const politicaMenor = evento.politica_menor ?? 'no_aplica'
  const textoPolitica = textoPoliticaMenor(politicaMenor)
  const opcionesVisibles = politicaMenor === 'no_aplica'
    ? OPCIONES
    : OPCIONES // todas visibles, la restricción se explica con el texto

  if (!preview) return null // en el wizard, StepGrupo maneja su propia UI

  return (
    <div className="space-y-3">
      {textoPolitica && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{textoPolitica}</p>
        </div>
      )}
      <div className="space-y-2">
        {opcionesVisibles.map((opcion) => (
          <OpcionGrupo
            key={opcion.id}
            opcion={opcion}
            seleccionada={false}
            preview
          />
        ))}
      </div>
    </div>
  )
}