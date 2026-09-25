// Datos de ejemplo de la landing (maqueta). Se reemplazan por endpoints públicos en la etapa 2.
import { addDays } from 'date-fns'
import img1 from '@/assets/login/img-1.jpeg'
import img2 from '@/assets/login/img-2.jpeg'
import img3 from '@/assets/login/img-3.jpeg'
import img4 from '@/assets/login/img-4.jpeg'
import img5 from '@/assets/login/img-5.jpeg'
import img6 from '@/assets/login/img-6.jpeg'
import img8 from '@/assets/login/img-8.jpeg'
import img9 from '@/assets/login/img-9.jpeg'

export const SECCIONES = [
  { id: 'inicio', titulo: 'Iniciar sesión' },
  { id: 'como-funciona', titulo: 'Qué es y cómo funciona Talita Encuentro' },
  { id: 'costos', titulo: 'Costos' },
  { id: 'proximos-eventos', titulo: 'Próximos eventos' },
  { id: 'nosotros', titulo: 'Nosotros · Contacto' },
  { id: 'galeria', titulo: 'Galería de fotos' },
]

export const FUNCIONES = [
  { nombre: 'Gestioná tu organización', descripcion: 'Sumá a tu equipo con distintos roles, compartí los eventos entre todos y trabajá sobre los mismos datos, sin planillas sueltas.' },
  { nombre: 'Historial de eventos', descripcion: '', enDesarrollo: true },
  { nombre: 'Agrupar automático', descripcion: 'Armá grupos de trabajo en un clic: Talita reparte a los inscriptos según los criterios que vos elijas.' },
  { nombre: 'Agrupar manual', descripcion: 'Seleccioná varios participantes a la vez y movelos al grupo que quieras. Ideal para ajustar a mano después del armado automático.' },
  { nombre: 'Comunicaciones', descripcion: 'Enviá mails a tus inscriptos directamente desde la plataforma.' },
  { nombre: 'Visualización de datos eficiente', descripcion: 'Filtrá, buscá y descargá en Excel la información de tus inscriptos, con estadísticas claras de tu evento.' },
  { nombre: 'Política de menores', descripcion: 'Definí si tu evento admite menores y pedí automáticamente la autorización firmada de madre, padre o tutor.' },
  { nombre: 'Cupo máximo', descripcion: 'Poné un límite de inscriptos y Talita cierra la inscripción sola cuando se completa.' },
  { nombre: 'Ficha médica', descripcion: 'Pedí la ficha médica en la inscripción y tené a mano alergias, medicación y datos de salud cuando los necesites.' },
  { nombre: 'Inscripción grupal', descripcion: 'Un referente inscribe a su grupo y cada integrante completa sus datos desde su propio link.' },
  { nombre: 'Pasar lista', descripcion: 'Toma lista de los participantes, de forma rápida, y comunicate con los que faltan.' },
  { nombre: 'Botón de emergencia', descripcion: 'Accedé en segundos a los contactos de emergencia y la ficha médica de cualquier participante.' },
]

const hoy = new Date()

export const ORGANIZACIONES = [
  { nombre: 'Parroquia San José', sigla: 'SJ' },
  { nombre: 'Colegio Don Bosco', sigla: 'DB' },
  { nombre: 'Pastoral Juvenil Norte', sigla: 'PJ' },
  { nombre: 'Movimiento Scout 42', sigla: 'MS' },
  { nombre: 'Comunidad Emaús', sigla: 'CE' },
  { nombre: 'Grupo Misionero Luján', sigla: 'GM' },
  { nombre: 'Instituto Pío X', sigla: 'PX' },
]

const org = (i) => ORGANIZACIONES[i]

export const EVENTOS = [
  { codigo: 'PEREG26', nombre: 'Peregrinación a Luján', fecha: addDays(hoy, 3), org: org(0) },
  { codigo: 'CONV-DB', nombre: 'Convivencia de 5° año', fecha: addDays(hoy, 3), org: org(1) },
  { codigo: 'CAMP-PJ', nombre: 'Campamento de verano', fecha: addDays(hoy, 8), org: org(2) },
  { codigo: 'RET-CE', nombre: 'Retiro de jóvenes', fecha: addDays(hoy, 12), org: org(4) },
  { codigo: 'MISION', nombre: 'Misión de invierno', fecha: addDays(hoy, 17), org: org(5) },
  { codigo: 'SCOUT42', nombre: 'Fogón de manada', fecha: addDays(hoy, 21), org: org(3) },
  { codigo: 'PIOX-EN', nombre: 'Encuentro de exalumnos', fecha: addDays(hoy, 26), org: org(6) },
  { codigo: 'CONV-SJ', nombre: 'Convivencia de catequistas', fecha: addDays(hoy, 34), org: org(0) },
]

export const EQUIPO = [
  { nombre: 'Tobías', descripcion: 'Próximo analista en sistemas de computación por el Instituto Leibnitz.' },
  { nombre: 'Paulina', descripcion: 'Profesora de filosofía por el Instituto Salesiano Pío X.' },
]

// Texto provisorio: lo reemplazan Tobías y Paulina.
export const MANIFIESTO = [
  { titulo: 'Soñamos', texto: 'Texto pendiente.' },
  { titulo: 'Creemos', texto: 'Texto pendiente.' },
  { titulo: 'Nos inspira', texto: 'Texto pendiente.' },
  { titulo: 'Una pregunta necesaria', texto: 'Texto pendiente.' },
  { titulo: '¿Por qué "Talita"?', texto: 'Texto pendiente.' },
]

export const GALERIA = [
  { nombre: 'Peregrinación a Luján', fecha: '2025-10-04', org: 'Parroquia San José', fotos: [img1, img2, img3] },
  { nombre: 'Convivencia de 5° año', fecha: '2025-08-15', org: 'Colegio Don Bosco', fotos: [img4, img5] },
  { nombre: 'Campamento de verano', fecha: '2025-02-10', org: 'Pastoral Juvenil Norte', fotos: [img6, img8, img9] },
  { nombre: 'Retiro de jóvenes', fecha: '2024-11-22', org: 'Comunidad Emaús', fotos: [img2, img5, img9] },
]
