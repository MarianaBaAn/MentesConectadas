import { API_BASE_URL, API_ENDPOINTS } from './config.js';
export { API_BASE_URL, API_ENDPOINTS };

const MSG_SIN_API = 'No se pudo conectar con la API. Verifica que el proyecto .NET esté en ejecución y que abriste la página desde él (no con Live Server).';


export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (e) {
    throw new Error(MSG_SIN_API);
  }
  const data = await response.json().catch(() => ({})); 
  if (!response.ok || data.isSuccess === false) {
    const detalle = data.respuesta || 'La API respondió con el código ' + response.status + '.';
    throw new Error(response.status === 404 ? detalle + ' ' + MSG_SIN_API : detalle);
  }
  return data;
}



// ======================= INICIO DE SESIÓN DEL ADMINISTRADOR =======================

export async function apiLoginAdmin(correo, password) {
  let response;
  try {
    response = await fetch(API_BASE_URL + API_ENDPOINTS.authLogin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
  } catch (e) {
    throw new Error(MSG_SIN_API);
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('Correo o contraseña incorrectos');
  if (!response.ok || !data.isSuccess || !data.usuario) throw new Error(data.respuesta || MSG_SIN_API);
  return { ...data.usuario, token: data.token };
}

// ======================= ACTIVIDAD DE LOS USUARIOS -> BASE DE DATOS =======================

function enviar(path, body) {
  try {
    fetch(API_BASE_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => {});
  } catch (e) { /* sin conexión se ignora */ }
}

export const apiGuardarUsuario = (user) => enviar(API_ENDPOINTS.actUsuario, { correo: user.email, nombre: user.name, tipo: user.type || null });
export const apiGuardarVista = (correo, idGuia) => enviar(API_ENDPOINTS.actVista, { correo, idGuia });
export const apiGuardarFavorito = (correo, idGuia, activo) => enviar(API_ENDPOINTS.actFavorito, { correo, idGuia, activo });
export const apiGuardarCalificacion = (correo, idGuia, estrellas) => enviar(API_ENDPOINTS.actCalificacion, { correo, idGuia, estrellas });
export const apiGuardarAutoevaluacion = (correo, idGuia, aciertos, total) => enviar(API_ENDPOINTS.actAutoevaluacion, { correo, idGuia, aciertos, total });
export const apiGuardarComentario = (correo, idGuia, texto, idLocal) => enviar(API_ENDPOINTS.actComentario, { correo, idGuia, texto, idLocal });
export const apiEliminarComentarioPropio = (correo, idLocal) => enviar(API_ENDPOINTS.actComentarioEliminar, { correo, idLocal });
export const apiGuardarDonacion = (correo, monto, otraCantidad) => enviar(API_ENDPOINTS.actDonacion, { correo: correo || null, monto, otraCantidad });

// ======================= PANEL DEL ADMINISTRADOR <- BASE DE DATOS =======================

async function apiAdmin(path, token, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' }
    });
  } catch (e) {
    throw new Error(MSG_SIN_API);
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('La sesión de administrador no es válida o venció. Cierra sesión y vuelve a entrar.');
  if (!response.ok || data.isSuccess === false) throw new Error(data.respuesta || 'La API respondió con el código ' + response.status + '.');
  return data.response;
}
const adminPost = (path, token, body) => apiAdmin(path, token, { method: 'POST', body: JSON.stringify(body) });

export const apiAdminResumen = (token) => apiAdmin(API_ENDPOINTS.adminResumen, token);
export const apiAdminComentarios = (token) => apiAdmin(API_ENDPOINTS.adminComentarios, token);
export const apiAdminComentarioOculto = (token, idComentario, oculto) => adminPost(API_ENDPOINTS.adminComentarioOculto, token, { idComentario, oculto });
export const apiAdminComentarioEliminar = (token, idComentario) => adminPost(API_ENDPOINTS.adminComentarioEliminar, token, { id: idComentario });
export const apiAdminDonaciones = (token) => apiAdmin(API_ENDPOINTS.adminDonaciones, token);
export const apiAdminDonacionEstado = (token, idDonacion, estado) => adminPost(API_ENDPOINTS.adminDonacionEstado, token, { idDonacion, estado });
export const apiAdminDonacionEliminar = (token, idDonacion) => adminPost(API_ENDPOINTS.adminDonacionEliminar, token, { id: idDonacion });


// ======================= GUÍAS <- BASE DE DATOS =======================

// Consulta general (GET api/Guia). "filtros" es opcional
export async function apiListaGuias(filtros = {}) {
    const query = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
    const data = await apiRequest(API_ENDPOINTS.guias + (query ? '?' + query : ''));
    return data.response || [];
}

// Una guía completa por su ID (GET api/Guia/{id})
export async function apiObtenerGuia(id) {
    const data = await apiRequest(API_ENDPOINTS.guias + '/' + encodeURIComponent(id));
    return data.response;
}


// Alta/cambio de una guía (POST o PUT api/Guia). Solo el administrador
// Regresa { numeroError, respuesta, idGuia }. Si falla, lanza un Error que trae numeroError y la respuesta de la API.
async function apiEscribirGuia(metodo, path, token, datos) {
    let response;
    try {
        response = await fetch(API_BASE_URL + path, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token || '' },
            body: datos == null ? undefined : JSON.stringify(datos)
        });
    } catch (e) {
        throw new Error(MSG_SIN_API);
    }
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        const err = new Error('La sesión de administrador no es válida o venció. Cierra sesión y vuelve a entrar.');
        err.numeroError = 401;
        throw err;
    }
    if (!response.ok || data.isSuccess === false) {
        const err = new Error(data.respuesta || 'La API respondió con el código ' + response.status + '.');
        err.numeroError = data.numeroError ?? response.status;
        throw err;
    }
    return { numeroError: data.numeroError, respuesta: data.respuesta, idGuia: data.response?.idGuia };
}

export const apiCrearGuia = (token, datos) => apiEscribirGuia('POST', API_ENDPOINTS.guias, token, datos);


// EXTRA ENTREGABLE 3
export const apiEditarGuia = (token, id, datos) => apiEscribirGuia('PUT', API_ENDPOINTS.guias + '/' + encodeURIComponent(id), token, datos);

// Baja lógica: ocultar = true oculta la guía; false la vuelve a mostrar (PUT api/Guia/{id}/visibilidad). No borra nada.
export const apiCambiarVisibilidad = (token, id, ocultar) => apiEscribirGuia('PUT', API_ENDPOINTS.guias + '/' + encodeURIComponent(id) + '/visibilidad', token, { ocultar });


// ======================= AUTOEVALUACIONES <- BASE DE DATOS =======================
export const apiCrearEvaluacion = (token, idGuia) => apiEscribirGuia('POST', API_ENDPOINTS.evaluaciones, token, { idGuia: Number(idGuia) });
// Eliminación FÍSICA: borra la autoevaluación y sus preguntas (DELETE api/Evaluacion/{id})
export const apiEliminarEvaluacion = (token, id) => apiEscribirGuia('DELETE', API_ENDPOINTS.evaluaciones + '/' + id, token, null);
export const apiCrearPregunta = (token, idEvaluacion, datos) => apiEscribirGuia('POST', API_ENDPOINTS.evaluaciones + '/' + idEvaluacion + '/preguntas', token, datos);
export const apiEditarPregunta = (token, idPregunta, datos) => apiEscribirGuia('PUT', API_ENDPOINTS.evaluaciones + '/preguntas/' + idPregunta, token, datos);
export const apiEliminarPregunta = (token, idPregunta) => apiEscribirGuia('DELETE', API_ENDPOINTS.evaluaciones + '/preguntas/' + idPregunta, token, null);