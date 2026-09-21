import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Link2, List, Strikethrough } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormControl, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MAX_DESCRIPCION, largoVisible, lineas, normalizarUrl, urlsEn } from '@/lib/descripcionFormato'

const CLASE_LINK = 'text-blue-500 underline underline-offset-2'

const escapar = (t) => t.replace(/[\\*~[\]]/g, '\\$&')
const escaparHtml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function aHtml(texto) {
  const ls = lineas(texto)
  return ls
    .map((l, k) => {
      const h = l.runs
        .map((r) => {
          let x = escaparHtml(r.t)
          if (r.href) x = `<a href="${escaparHtml(r.href)}">${x}</a>`
          if (r.s) x = `<s>${x}</s>`
          if (r.i) x = `<i>${x}</i>`
          if (r.b) x = `<b>${x}</b>`
          return x
        })
        .join('')
      if (l.lista) return (ls[k - 1]?.lista ? '' : '<ul>') + `<li>${h || '<br>'}</li>` + (ls[k + 1]?.lista ? '' : '</ul>')
      return h + (ls[k + 1] && !ls[k + 1].lista ? '<br>' : '')
    })
    .join('')
}

// DOM del editor -> texto con marcas.
function serializar(root) {
  const runs = []
  const push = (t, f) => {
    const ult = runs[runs.length - 1]
    if (ult && ult.b === f.b && ult.i === f.i && ult.s === f.s && ult.href === f.href) ult.t += t
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
      href: f.href,
    }
    if (tag === 'A') {
      const href = nodo.getAttribute('href') ?? ''
      // Solo http(s); espacios y ")" se codifican para no romper el `[texto](url)`.
      if (/^https?:\/\//i.test(href)) nf.href = href.replace(/\s/g, '%20').replace(/\)/g, '%29')
    }
    const plano = { b: false, i: false, s: false }
    const sinSalto = () => runs.length && !runs[runs.length - 1].t.endsWith('\n')
    if (['DIV', 'P', 'UL', 'LI'].includes(tag) && sinSalto()) push('\n', plano)
    if (tag === 'LI') push('- ', plano)
    nodo.childNodes.forEach((h) => recorrer(h, nf))
    if (tag === 'UL' && sinSalto()) push('\n', plano)
  }
  root.childNodes.forEach((n) => recorrer(n, { b: false, i: false, s: false }))
  // Solo se emiten los cambios de formato entre tramos: envolver cada tramo dejaba marcas pegadas ambiguas (`*` + `***`).
  const MARCAS = { b: '**', i: '*', s: '~~' }
  let prev = { b: false, i: false, s: false }
  let out = ''
  for (const r of [...runs, { t: '', b: false, i: false, s: false }]) {
    if (r.href !== prev.href) {
      if (prev.href) out += `](${prev.href})`
      if (r.href) out += '['
    }
    for (const k of ['b', 'i', 's']) if (r[k] !== prev[k]) out += MARCAS[k]
    out += escapar(r.t)
    prev = r
  }
  return out.replace(/\n$/, '')
}

// Las URLs http(s) se muestran como links; no cambia lo que se guarda.
function conLinks(t) {
  const partes = []
  let pos = 0
  urlsEn(t).forEach(({ inicio, fin }, k) => {
    partes.push(t.slice(pos, inicio))
    partes.push(
      <a key={k} href={t.slice(inicio, fin)} target="_blank" rel="noopener noreferrer" className={CLASE_LINK}>
        {t.slice(inicio, fin)}
      </a>
    )
    pos = fin
  })
  partes.push(t.slice(pos))
  return partes
}

function Tramo({ r }) {
  let n = r.href
    ? <a href={r.href} target="_blank" rel="noopener noreferrer" className={CLASE_LINK}>{r.t}</a>
    : conLinks(r.t)
  if (r.s) n = <s>{n}</s>
  if (r.i) n = <em>{n}</em>
  if (r.b) n = <strong>{n}</strong>
  return n
}

export function TextoFormateado({ texto, className }) {
  if (!texto) return null
  const ls = lineas(texto)
  const bloques = []
  ls.forEach((l, k) => {
    const contenido = l.runs.map((r, j) => <Tramo key={j} r={r} />)
    if (!l.lista) return bloques.push(<div key={k}>{contenido.length ? contenido : <br />}</div>)
    const ult = bloques[bloques.length - 1]
    const item = <li key={k}>{contenido}</li>
    if (ult?.type === 'ul') bloques[bloques.length - 1] = <ul key={ult.key} className="list-disc pl-5">{[...ult.props.children, item]}</ul>
    else bloques.push(<ul key={k} className="list-disc pl-5">{[item]}</ul>)
  })
  return <div className={className}>{bloques}</div>
}

// <a> que contiene la selección actual, si está dentro del editor.
const enLink = (el) => {
  const nodo = document.getSelection()?.anchorNode
  const a = (nodo?.nodeType === 3 ? nodo.parentElement : nodo)?.closest('a')
  return a && el.contains(a) ? a : null
}

const FORMATOS = [
  { cmd: 'bold', clave: 'b', icono: Bold, label: 'Negrita' },
  { cmd: 'italic', clave: 'i', icono: Italic, label: 'Cursiva' },
  { cmd: 'strikeThrough', clave: 's', icono: Strikethrough, label: 'Tachado' },
  { cmd: 'insertUnorderedList', clave: 'l', icono: List, label: 'Lista' },
]

// Marca las URLs con la CSS Custom Highlight API (estilo en index.css): se ven como link sin tocar el DOM ni lo guardado.
const HIGHLIGHT_LINK = 'descripcion-link'
function resaltarLinks(el) {
  if (!el || !globalThis.CSS?.highlights) return
  const rangos = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  // ponytail: una URL partida en varios nodos de texto (ej. formato a mitad de la URL) no se resalta.
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    for (const { inicio, fin } of urlsEn(n.textContent)) {
      const r = new Range()
      r.setStart(n, inicio)
      r.setEnd(n, fin)
      rangos.push(r)
    }
  }
  CSS.highlights.set(HIGHLIGHT_LINK, new Highlight(...rangos))
}

// Editor WYSIWYG de descripción; `field` es el de react-hook-form. Va dentro de un FormItem.
export function DescripcionEditor({ field, label, placeholder, className }) {
  const ref = useRef(null)
  const [activos, setActivos] = useState({})
  // Diálogo para pedir la dirección; guarda la selección porque el editor la pierde al perder el foco.
  const [dialogo, setDialogo] = useState(null) // { rango, hayTexto }
  const [direccion, setDireccion] = useState('')
  const [direccionInvalida, setDireccionInvalida] = useState(false)
  const pendiente = useRef(null) // link a aplicar cuando el diálogo termine de cerrarse
  const largo = largoVisible(field.value)

  // Valor externo (carga inicial, reset) -> DOM. Si vino de tipear, ya coincide y no se toca (mantiene el cursor).
  useEffect(() => {
    const el = ref.current
    if (el && serializar(el) !== (field.value ?? '')) el.innerHTML = aHtml(field.value)
    resaltarLinks(el)
  }, [field.value])

  useEffect(() => () => globalThis.CSS?.highlights?.delete(HIGHLIGHT_LINK), [])

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'br')
    document.addEventListener('selectionchange', actualizar)
    return () => document.removeEventListener('selectionchange', actualizar)
  }, [])

  function actualizar() {
    const el = ref.current
    if (!el || !el.contains(document.getSelection()?.anchorNode)) return
    setActivos({
      ...Object.fromEntries(FORMATOS.map((f) => [f.clave, document.queryCommandState(f.cmd)])),
      k: !!enLink(el),
    })
  }

  function aplicarLink({ url, rango, hayTexto }) {
    const el = ref.current
    const sel = document.getSelection()
    el.focus()
    if (rango) {
      sel.removeAllRanges()
      sel.addRange(rango)
    }
    if (hayTexto) document.execCommand('createLink', false, url)
    else document.execCommand('insertHTML', false, `<a href="${escaparHtml(url)}">${escaparHtml(url)}</a>`)
    sincronizar()
    actualizar()
  }

  // Con selección crea el link sobre lo elegido; sin selección inserta uno con la dirección como texto.
  // Si lo elegido ya parece una dirección ("algo.com") se usa directo; si no, se pide en un diálogo.
  function hacerLink() {
    const el = ref.current
    el.focus()
    const actual = enLink(el)
    if (actual) {
      // unlink no hace nada con el cursor colapsado: se selecciona el link entero.
      document.getSelection().selectAllChildren(actual)
      document.execCommand('unlink')
      sincronizar()
      return actualizar()
    }
    const sel = document.getSelection()
    const rango = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null
    const hayTexto = !!sel.toString().trim()
    const url = normalizarUrl(sel.toString())
    if (url) return aplicarLink({ url, rango, hayTexto })
    setDireccion('')
    setDireccionInvalida(false)
    setDialogo({ rango, hayTexto })
  }

  function confirmarDireccion() {
    const url = normalizarUrl(direccion)
    if (!url) return setDireccionInvalida(true)
    pendiente.current = { url, ...dialogo }
    setDialogo(null)
  }

  // Radix devuelve el foco al cerrar el diálogo: el link se aplica recién después, con el foco ya devuelto.
  function alCerrarDialogo(e) {
    e.preventDefault()
    const p = pendiente.current
    pendiente.current = null
    if (p) aplicarLink(p)
    else if (dialogo === null) ref.current.focus()
  }

  const sincronizar = () => {
    const el = ref.current
    // Vacío de verdad (para que vuelva el placeholder), pero sin borrar una lista recién creada.
    if (!el.textContent && !el.querySelector('li')) el.innerHTML = ''
    // Sin línea vacía arriba de todo (ej. al borrar la primera línea antes de una lista):
    // no se puede borrar con Backspace y al acercarse desde la lista fusiona el item con ella.
    while (el.firstChild?.nodeName === 'BR' && el.childNodes.length > 1) el.firstChild.remove()
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
          <Button
            type="button"
            variant={activos.k ? 'secondary' : 'outline'}
            size="icon-sm"
            title={activos.k ? 'Quitar link' : 'Link'}
            aria-label={activos.k ? 'Quitar link' : 'Link'}
            aria-pressed={!!activos.k}
            onMouseDown={(e) => e.preventDefault()}
            onClick={hacerLink}
          >
            <Link2 />
          </Button>
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
            '[&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-blue-500 [&_a]:underline [&_a]:underline-offset-2 min-h-[4.5rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 aria-invalid:border-destructive empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
            className
          )}
        />
      </FormControl>
      <p className={cn('text-right text-xs text-muted-foreground', largo > MAX_DESCRIPCION && 'text-destructive')}>
        {largo}/{MAX_DESCRIPCION}
      </p>
      <Dialog open={!!dialogo} onOpenChange={(abierto) => !abierto && setDialogo(null)}>
        <DialogContent onCloseAutoFocus={alCerrarDialogo}>
          <DialogHeader>
            <DialogTitle>Agregar link</DialogTitle>
            <DialogDescription>
              {dialogo?.hayTexto
                ? 'Pegá la dirección a la que va a llevar el texto seleccionado.'
                : 'Pegá la dirección: se va a insertar como link.'}
            </DialogDescription>
          </DialogHeader>
          {/* Sin <form>: el submit burbujearía por el portal hasta el formulario del evento. */}
          <div className="space-y-1.5">
            <Input
              autoFocus
              value={direccion}
              placeholder="https://ejemplo.com"
              aria-invalid={direccionInvalida}
              onChange={(e) => {
                setDireccion(e.target.value)
                setDireccionInvalida(false)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                e.stopPropagation()
                confirmarDireccion()
              }}
            />
            {direccionInvalida && (
              <p className="text-sm text-destructive">Ingresá una dirección válida, por ejemplo https://ejemplo.com</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogo(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmarDireccion}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
