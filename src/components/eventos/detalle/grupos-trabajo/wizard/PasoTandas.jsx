import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { crearTanda, patchTanda, eliminarTanda, reordenarTandas } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

const OPERADORES = [
  { value: 'igual', label: 'Igual a' },
  { value: 'distinto', label: 'Distinto de' },
  { value: 'mayor_que', label: 'Mayor que' },
  { value: 'menor_que', label: 'Menor que' },
  { value: 'contiene', label: 'Contiene' },
  { value: 'entre', label: 'Entre' },
]

const ESTADO_INICIAL_FORM = {
  nombreResuelto: '',
  operador: 'igual',
  valor: '',
  valor2: '',
}

function TandaForm({ tanda, onGuardar, onCancelar, guardando, esquema }) {
  const [form, setForm] = useState(
    tanda
      ? {
        nombreResuelto: tanda.nombre_resuelto,
        operador: tanda.condicion.operador,
        valor: String(tanda.condicion.valor ?? ''),
        valor2: String(tanda.condicion.valor2 ?? ''),
      }
      : ESTADO_INICIAL_FORM
  )

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit() {
    if (!form.nombreResuelto.trim()) {
      toast.error('El nombre de la tanda es obligatorio.')
      return
    }
    if (!form.valor.trim()) {
      toast.error('El valor de la condición es obligatorio.')
      return
    }

    const condicion = {
      operador: form.operador,
      valor: isNaN(Number(form.valor)) ? form.valor : Number(form.valor),
    }

    if (form.operador === 'entre' && form.valor2) {
      condicion.valor2 = isNaN(Number(form.valor2)) ? form.valor2 : Number(form.valor2)
    }

    onGuardar({ nombreResuelto: form.nombreResuelto, condicion })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Nombre de la tanda</Label>
        <Input
          placeholder="Ej. Jóvenes"
          value={form.nombreResuelto}
          onChange={(e) => handleChange('nombreResuelto', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Condición</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={form.operador} onValueChange={(v) => handleChange('operador', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPERADORES.map((op) => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Valor"
            value={form.valor}
            onChange={(e) => handleChange('valor', e.target.value)}
          />
          {form.operador === 'entre' && (
            <Input
              placeholder="Valor 2"
              value={form.valor2}
              onChange={(e) => handleChange('valor2', e.target.value)}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Se aplica sobre el atributo "{esquema?.criterio_tanda_atributo?.campo ?? 'definido en configuración'}".
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={guardando}>
          {guardando ? 'Guardando...' : tanda ? 'Actualizar' : 'Agregar'}
        </Button>
      </div>
    </div>
  )
}

export function PasoTandas({ evento, esquema, onActualizado, onSiguiente, onAnterior }) {
  const [tandas, setTandas] = useState(esquema.tandas ?? [])
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [tandaEditando, setTandaEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState({})

  const esBorrador = esquema.estado === 'borrador'
  const tieneCriterio = !!esquema.criterio_tanda_atributo

  async function handleGuardar(datos) {
    setGuardando(true)
    try {
      if (tandaEditando) {
        const actualizada = await patchTanda(evento.id, esquema.id, tandaEditando.id, datos)
        setTandas((prev) => prev.map((t) => t.id === tandaEditando.id ? actualizada : t))
        toast.success('Tanda actualizada.')
      } else {
        const nueva = await crearTanda(evento.id, esquema.id, {
          ...datos,
          orden: tandas.length,
        })
        setTandas((prev) => [...prev, nueva])
        toast.success('Tanda agregada.')
      }
      setDialogAbierto(false)
      setTandaEditando(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos guardar la tanda.'))
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(tanda) {
    setEliminando((prev) => ({ ...prev, [tanda.id]: true }))
    try {
      await eliminarTanda(evento.id, esquema.id, tanda.id)
      setTandas((prev) => prev.filter((t) => t.id !== tanda.id))
      toast.success('Tanda eliminada.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar la tanda.'))
    } finally {
      setEliminando((prev) => ({ ...prev, [tanda.id]: false }))
    }
  }

  async function moverTanda(index, direccion) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= tandas.length) return

    const nuevasTandas = [...tandas]
    const [tanda] = nuevasTandas.splice(index, 1)
    nuevasTandas.splice(nuevoIndex, 0, tanda)

    const conOrden = nuevasTandas.map((t, i) => ({ ...t, orden: i }))
    setTandas(conOrden)

    try {
      await reordenarTandas(
        evento.id,
        esquema.id,
        conOrden.map((t) => ({ id: t.id, orden: t.orden }))
      )
    } catch {
      toast.error('No pudimos guardar el nuevo orden.')
    }
  }

  return (
    <div className="space-y-5">
      {!tieneCriterio ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Este esquema no usa tandas — no definiste un criterio de tanda en la configuración.
            </p>
            <Button type="button" variant="outline" className="mt-4" onClick={onSiguiente}>
              Continuar sin tandas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Tandas
                  {tandas.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({tandas.length})
                    </span>
                  )}
                </CardTitle>
                {esBorrador && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setTandaEditando(null)
                      setDialogAbierto(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar tanda
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tandas.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Sin tandas todavía. Agregá al menos una para poder generar grupos.
                </p>
              ) : (
                <div className="space-y-2">
                  {tandas.map((tanda, index) => (
                    <div
                      key={tanda.id}
                      className="flex items-center gap-3 rounded-md border border-border p-3"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {tanda.nombre_resuelto}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tanda.condicion.operador}{' '}
                          {tanda.condicion.valor}
                          {tanda.condicion.valor2 ? ` y ${tanda.condicion.valor2}` : ''}
                        </p>
                      </div>
                      {esBorrador && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moverTanda(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moverTanda(index, 1)}
                            disabled={index === tandas.length - 1}
                            className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTandaEditando(tanda)
                              setDialogAbierto(true)
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-accent text-xs px-2"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(tanda)}
                            disabled={eliminando[tanda.id]}
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            El orden de las tandas importa cuando el modo de nombrado es "por tanda" — la primera tanda usa el primer nombre de la lista, la segunda el segundo, etc.
          </p>
        </>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onAnterior}>
          Atrás
        </Button>
        <Button type="button" onClick={onSiguiente}>
          Continuar
        </Button>
      </div>

      <Dialog open={dialogAbierto} onOpenChange={(v) => {
        if (!v) { setDialogAbierto(false); setTandaEditando(null) }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tandaEditando ? 'Editar tanda' : 'Nueva tanda'}</DialogTitle>
          </DialogHeader>
          <TandaForm
            tanda={tandaEditando}
            esquema={esquema}
            onGuardar={handleGuardar}
            onCancelar={() => { setDialogAbierto(false); setTandaEditando(null) }}
            guardando={guardando}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}