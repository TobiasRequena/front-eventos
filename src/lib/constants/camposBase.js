// Campos fijos de inscripción que SIEMPRE existen (estructura propia de la
// tabla `participante`, no pasan por campo_form). Se muestran como
// informativos/no editables en el creador — el organizador no los configura,
// ya vienen dados por el modelo de datos.
export const CAMPOS_BASE_INSCRIPCION = [
  { id: 'nombre', label: 'Nombre' },
  { id: 'apellido', label: 'Apellido' },
  { id: 'email', label: 'Email' },
  { id: 'dni', label: 'DNI' },
  { id: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
]