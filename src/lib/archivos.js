import { toast } from 'sonner'

// Mismos tipos y tamaño que acepta el back; validar acá evita fallar recién al subir
export const ACCEPT_DOCUMENTO = '.pdf,.jpg,.jpeg,.png,.webp'
const TIPOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024

/** onChange de un input file de documento: valida y llama a onArchivo solo si es válido. */
export function elegirDocumento(e, onArchivo) {
  const archivo = e.target.files?.[0] ?? null
  e.target.value = ''
  if (!archivo) return
  if (!TIPOS_DOCUMENTO.includes(archivo.type)) {
    toast.error('El archivo debe ser PDF, JPG, PNG o WebP.')
    return
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    toast.error('El archivo no puede superar los 5MB.')
    return
  }
  onArchivo(archivo)
}
