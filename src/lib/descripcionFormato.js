// Formato de la descripción guardado como texto plano con marcas que se activan/desactivan:
// **negrita**, *cursiva*, ~~tachado~~. Se pueden combinar y anidar en cualquier orden.
// `[texto](https://url)` es un link. `\` escapa un caracter literal.
// Una línea que empieza con "- " es un item de lista.
// Mantener alineado con back-eventos/src/utils/descripcionHtml.js.

// Los límites se cuentan sobre el texto visible (sin marcas, "- " ni la url de los links).
// El back acepta más largo para dar margen a las marcas.
export const MAX_DESCRIPCION = 2000

const ENLACE = /\[((?:\\.|[^\]\\])*)\]\((https?:\/\/[^\s)]+)\)/y

// ¿Hay un `[texto](url)` que empieza en la posición k?
const enlaceEn = (texto, k) => {
  ENLACE.lastIndex = k
  return ENLACE.exec(texto)
}

export function parsear(texto) {
  const runs = []
  let f = { b: false, i: false, s: false }
  let enlace = null // { href, fin }: fin = índice del "]" que cierra el texto del link
  let buf = ''
  const cortar = () => {
    if (buf) runs.push({ t: buf, ...f, href: enlace?.href })
    buf = ''
  }
  for (let k = 0; k < texto.length; k++) {
    if (enlace && k === enlace.fin) {
      cortar()
      k += 2 + enlace.href.length // salta "](url)"; el for suma el último
      enlace = null
      continue
    }
    const c = texto[k]
    const m = c === '[' && !enlace ? enlaceEn(texto, k) : null
    if (c === '\\' && k + 1 < texto.length) buf += texto[++k]
    else if (c === '*' && texto[k + 1] === '*') { cortar(); f = { ...f, b: !f.b }; k++ }
    else if (c === '~' && texto[k + 1] === '~') { cortar(); f = { ...f, s: !f.s }; k++ }
    else if (c === '*') { cortar(); f = { ...f, i: !f.i } }
    else if (m) { cortar(); enlace = { href: m[2], fin: k + 1 + m[1].length } }
    else buf += c
  }
  cortar()
  return runs
}

// Texto -> líneas [{ lista, runs }].
export function lineas(texto) {
  const res = [{ lista: false, runs: [] }]
  for (const r of parsear(texto ?? '')) {
    r.t.split('\n').forEach((t, k) => {
      if (k > 0) res.push({ lista: false, runs: [] })
      if (t) res[res.length - 1].runs.push({ ...r, t })
    })
  }
  for (const l of res) {
    const [primero] = l.runs
    if (primero?.t.startsWith('- ')) {
      l.lista = true
      primero.t = primero.t.slice(2)
      if (!primero.t) l.runs.shift()
    }
  }
  return res
}

// Recorre el texto igual que parsear/lineas contando solo lo visible. Devuelve el largo visible
// y, si supera `max`, dónde cortar el texto crudo (`cierre` cierra un link cortado a la mitad).
function medir(texto, max = Infinity) {
  let n = 0
  let inicioLinea = true
  let enlace = null
  for (let k = 0; k < texto.length; k++) {
    if (enlace && k === enlace.fin) {
      k += 2 + enlace.href.length
      enlace = null
      continue
    }
    const ini = k
    const c = texto[k]
    const m = c === '[' && !enlace ? enlaceEn(texto, k) : null
    if (c === '\\' && k + 1 < texto.length) k++
    else if ((c === '*' || c === '~') && texto[k + 1] === c) { k++; continue }
    else if (c === '*') continue
    else if (m) { enlace = { href: m[2], fin: k + 1 + m[1].length }; continue }
    else if (inicioLinea && c === '-' && texto[k + 1] === ' ') { k++; inicioLinea = false; continue }
    inicioLinea = texto[k] === '\n'
    if (++n > max) return { largo: n, corte: ini, cierre: enlace ? `](${enlace.href})` : '' }
  }
  return { largo: n, corte: texto.length, cierre: '' }
}

export const largoVisible = (texto) => medir(texto ?? '').largo

export function recortarDescripcion(texto) {
  if (!texto) return texto
  const { corte, cierre } = medir(texto, MAX_DESCRIPCION)
  return texto.slice(0, corte) + cierre
}

// URLs http(s) del texto, sin la puntuación final. -> [{ inicio, fin }]
export function urlsEn(texto) {
  return [...texto.matchAll(/https?:\/\/\S+/g)].map((m) => ({
    inicio: m.index,
    fin: m.index + m[0].replace(/[.,;:!?)]+$/, '').length,
  }))
}

// "algo.com" -> "https://algo.com/". null si no parece una dirección web válida.
export function normalizarUrl(texto) {
  const s = (texto ?? '').trim()
  if (!s || /\s/.test(s)) return null
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
    if (!/^https?:$/.test(u.protocol) || !/\.[a-z]{2,}$/i.test(u.hostname)) return null
    // Links copiados desde Gmail vienen envueltos: google.com/url?q=<link real>&source=gmail...
    const destino = /(^|\.)google\.com$/.test(u.hostname) && u.pathname === '/url' && (u.searchParams.get('q') ?? u.searchParams.get('url'))
    if (destino) return normalizarUrl(destino)
    return u.href.replace(/\)/g, '%29')
  } catch {
    return null
  }
}
