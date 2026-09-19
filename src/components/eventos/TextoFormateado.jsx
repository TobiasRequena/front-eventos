import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Strikethrough } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormControl, FormLabel } from '@/components/ui/form'

// Formato guardado como texto plano con marcas que se activan/desactivan: **negrita**, *cursiva*, ~~tachado~~.
// Se pueden combinar y anidar en cualquier orden. `\` escapa un caracter literal. El back no cambia.

function parsear(texto) {
  const runs = []
  let f = { b: false, i: false, s: false }
  let buf = ''
  const cortar = () => {
    if (buf) runs.push({ t: buf, ...f })
    buf = ''
  }
  for (let k = 0; k < texto.length; k++) {
    const c = texto[k]
    if (c === '\\' && k + 1 < texto.length) buf += texto[++k]
    else if (c === '*' && texto[k + 1] === '*') { cortar(); f = { ...f, b: !f.b }; k++ }
    else if (c === '~' && texto[k + 1] === '~') { cortar(); f = { ...f, s: !f.s }; k++ }
    else if (c === '*') { cortar(); f = { ...f, i: !f.i } }
    else buf += c
  }
  cortar()
  return runs
}

function envolver(run, contenido, Tags = { b: 'strong', i: 'em', s: 's' }) {
  let nodo = contenido
  if (run.s) nodo = { tag: Tags.s, hijo: nodo }
  if (run.i) nodo = { tag: Tags.i, hijo: nodo }
  if (run.b) nodo = { tag: Tags.b, hijo: nodo }
  return nodo
}

const escapar = (t) => t.replace(/[\\*~]/g, '\\$&')
const escaparHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function aHtml(texto) {
  return parsear(texto ?? '')
    .map((r) => {
      let h = escaparHtml(r.t).replace(/\n/g, '<br>')
      if (r.s) h = `<s>${h}</s>`
      if (r.i) h = `<i>${h}</i>`
      if (r.b) h = `<b>${h}</b>`
      return h
    })
    .join('')
}

// DOM del editor -> texto con marcas.
function serializar(root) {
  const runs = []
  const push = (t, f) => {
    const ult = runs[runs.length - 1]
    if (ult && ult.b === f.b && ult.i === f.i && ult.s === f.s) ult.t += t
    else runs.push({ t, ...f })
  }
  const recorrer = (nodo, f) => {
    if (nodo.nodeType === 3) return push(nodo.textContent, f)
    if (nodo.nodeType !== 1) return
    const tag = nodo.tagName
    if (tag === 'BR') return push('\n', { b: false, i: false, s: false })
    // execCommand a veces formatea con style inline en vez de tags (ej. <i style="font-weight: bold">).
    const { fontWeight, fontStyle, textDecorationLine, textDecoration } = nodo.style
    const nf = {
      b: f.b || tag === 'B' || tag === 'STRONG' || fontWeight === 'bold' || +fontWeight >= 600,
      i: f.i || tag === 'I' || tag === 'EM' || fontStyle === 'italic',
      s: f.s || tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || /line-through/.test(textDecorationLine + textDecoration),
    }
    const bloque = tag === 'DIV' || tag === 'P'
    if (bloque && runs.length && !runs[runs.length - 1].t.endsWith('\n')) push('\n', { b: false, i: false, s: false })
    nodo.childNodes.forEach((h) => recorrer(h, nf))
  }
  root.childNodes.forEach((n) => recorrer(n, { b: false, i: false, s: false }))
  // Solo se emiten los cambios de formato entre tramos: envolver cada tramo dejaba marcas pegadas ambiguas (`*` + `***`).
  const MARCAS = { b: '**', i: '*', s: '~~' }
  let prev = { b: false, i: false, s: false }
  let out = ''
  for (const r of [...runs, { t: '', b: false, i: false, s: false }]) {
    for (const k of ['b', 'i', 's']) if (r[k] !== prev[k]) out += MARCAS[k]
    out += escapar(r.t)
    prev = r
  }
  return out.replace(/\n$/, '')
}

export function TextoFormateado({ texto, className }) {
  if (!texto) return null
  return (
    <p className={cn('whitespace-pre-line', className)}>
      {parsear(texto).map((r, k) => {
        let n = envolver(r, r.t)
        const render = (x) => (typeof x === 'string' ? x : <x.tag>{render(x.hijo)}</x.tag>)
        return <span key={k}>{render(n)}</span>
      })}
    </p>
  )
}

const FORMATOS = [
  { cmd: 'bold', clave: 'b', icono: Bold, label: 'Negrita' },
  { cmd: 'italic', clave: 'i', icono: Italic, label: 'Cursiva' },
  { cmd: 'strikeThrough', clave: 's', icono: Strikethrough, label: 'Tachado' },
]

// Editor WYSIWYG de descripción; `field` es el de react-hook-form. Va dentro de un FormItem.
export function DescripcionEditor({ field, label, placeholder, className }) {
  const ref = useRef(null)
  const [activos, setActivos] = useState({})

  // Valor externo (carga inicial, reset) -> DOM. Si vino de tipear, ya coincide y no se toca (mantiene el cursor).
  useEffect(() => {
    const el = ref.current
    if (el && serializar(el) !== (field.value ?? '')) el.innerHTML = aHtml(field.value)
  }, [field.value])

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'br')
    document.addEventListener('selectionchange', actualizar)
    return () => document.removeEventListener('selectionchange', actualizar)
  }, [])

  function actualizar() {
    const el = ref.current
    if (!el || !el.contains(document.getSelection()?.anchorNode)) return
    setActivos(Object.fromEntries(FORMATOS.map((f) => [f.clave, document.queryCommandState(f.cmd)])))
  }

  const sincronizar = () => {
    const el = ref.current
    if (!el.textContent) el.innerHTML = ''
    field.onChange(serializar(el))
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        <div className="flex gap-1">
          {FORMATOS.map(({ cmd, clave, icono: Icono, label }) => (
            <Button
              key={cmd}
              type="button"
              variant={activos[clave] ? 'secondary' : 'outline'}
              size="icon-sm"
              title={label}
              aria-label={label}
              aria-pressed={!!activos[clave]}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                ref.current.focus()
                document.execCommand(cmd)
                sincronizar()
                actualizar()
              }}
            >
              <Icono />
            </Button>
          ))}
        </div>
      </div>
      <FormControl>
        <div
          ref={(el) => {
            ref.current = el
            field.ref?.(el)
          }}
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={sincronizar}
          onKeyUp={actualizar}
          onMouseUp={actualizar}
          onFocus={actualizar}
          onBlur={field.onBlur}
          onPaste={(e) => {
            e.preventDefault()
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
          }}
          className={cn(
            'min-h-[4.5rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 aria-invalid:border-destructive empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
            className
          )}
        />
      </FormControl>
    </>
  )
}
