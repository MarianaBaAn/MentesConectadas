// Configuración de la aplicación.

// Asistente de consulta activado
export const ASSISTANT_ENABLED = true;



export const SHOW_ADMIN_STATS = true;  

// Tipos de usuario permitidos. 
export const USER_TYPES = ['Estudiante', 'Docente'];

// ---- Administrador ----

export const ADMIN_TYPE = 'Administrador';
export const ADMIN_EMAIL = 'adminMentesConectadas@gmail.com';
export const isAdmin = (user) => Boolean(user && user.type === ADMIN_TYPE);


export function normalizeUserType(type) {
  return USER_TYPES.includes(type) || type === ADMIN_TYPE ? type : '';
}


export const TOPIC_AUDIENCE = {
  'sobrecarga':        ['Estudiante', 'Docente'],
  'comunicacion':      ['Estudiante', 'Docente'],
  'cambios':           ['Estudiante', 'Docente'],
  'participacion':     ['Estudiante', 'Docente'],
  'trabajo-equipo':    ['Estudiante'],
  'examen':            ['Docente'],
  'retroalimentacion': ['Docente'],
  'correccion':        ['Docente']
};

export const TOPIC_LABELS = {
  'sobrecarga': 'Sobrecarga de estímulos',
  'comunicacion': 'Comunicación',
  'cambios': 'Cambios inesperados',
  'participacion': 'Participación en clase',
  'trabajo-equipo': 'Trabajo en equipo',
  'examen': 'Situaciones durante un examen',
  'retroalimentacion': 'Retroalimentación',
  'correccion': 'Corrección respetuosa'
};


export const STORAGE_KEYS = {
  user: 'mc_user',
  registeredUser: 'mc_registered_user',
  favorites: 'mc_favorites',
  evaluations: 'mc_evaluations',
  ratings: 'mc_ratings',
  favoritesByUser: 'mc_favorites_by_user', // favoritos por usuario
  views: 'mc_views',                       // vistas de guías
  userLog: 'mc_user_log',                  // usuarios que han entrado en este navegador
  guideOverrides: 'mc_guide_overrides',    // guías creadas o editadas por el administrador
  guideDeleted: 'mc_guide_deleted',        // ids de guías originales eliminadas por el administrador
  theme: 'mc_theme',                       // oscuro/claro
  comments: 'mc_comments',                 // comentarios de las guías
  donations: 'mc_donations',               // registro de donaciones 
  assistantLog: 'mc_assistant_log'         // consultas hechas al asistente
};

// ---- Donaciones ----

export const DONATION_AMOUNTS = [15, 30, 50];
export const DONATION_CURRENCY = 'MXN';

export const DONATION_LINKS = {
  15: '',
  30: '',
  50: ''
};
// Monto libre 
// ejemplo 'https://www.paypal.me/tuusuario/
export const DONATION_CUSTOM_LINK = '';
export const DONATION_MIN = 1;
export const DONATION_MAX = 100000;



// Conexión con la API 

export const API_BASE_URL = '/api';
export const API_ENDPOINTS = {
    guias: '/Guia',
    evaluaciones: '/Evaluacion',
    authLogin: '/Auth/login',                 
    authLogin: '/Auth/login',


  // ---- Actividad de los usuarios  -> ActividadController 
  actUsuario: '/Actividad/usuario',
  actVista: '/Actividad/vista',
  actFavorito: '/Actividad/favorito',
  actCalificacion: '/Actividad/calificacion',
  actAutoevaluacion: '/Actividad/autoevaluacion',
  actComentario: '/Actividad/comentario',
  actComentarioEliminar: '/Actividad/comentario/eliminar',
  actDonacion: '/Actividad/donacion',

  // ---- Panel del administrador -> AdminController 
  adminResumen: '/Admin/resumen',
  adminComentarios: '/Admin/comentarios',
  adminComentarioOculto: '/Admin/comentario/oculto',
  adminComentarioEliminar: '/Admin/comentario/eliminar',
  adminDonaciones: '/Admin/donaciones',
  adminDonacionEstado: '/Admin/donacion/estado',
  adminDonacionEliminar: '/Admin/donacion/eliminar'
};