// Panel del Administrador. Pestañas: Inicio,Guías y Autoevaluaciones; 
import { state, save, getAllFavorites } from './state.js';
import { USER_TYPES, SHOW_ADMIN_STATS } from './config.js';
import { esc, showToast, closeModal, footer, coverSlot } from './ui.js';
import { header, refreshView, go } from './navigation.js';
import { getGuideData, getGuideById, isOriginalGuide } from './content.js';
import { ratingSummary, ratingStars } from './guides.js';
import { hBars, columns, lineChart, donut, lastDays, countByDay } from './charts.js';
import { db, estadoCarga } from './admin-db.js';
// ---------- AGREGADO PARA POST ENTREGABLE 3 ----------
import { apiCrearGuia, apiEditarGuia, apiCambiarVisibilidad, apiListaGuias, apiCrearEvaluacion, apiEliminarEvaluacion, apiCrearPregunta, apiEditarPregunta, apiEliminarPregunta } from './api.js';
import { cargarCatalogo, recargarGuia } from './catalogo.js';

const NEURO_OPTIONS = ['Autismo', 'TDAH', 'Dislexia', 'Discalculia', 'Dispraxia'];
const SITUATION_TAGS = [
  ['sobrecarga', 'Sobrecarga de estímulos'], ['comunicacion', 'Comunicación'], ['trabajo-equipo', 'Trabajo en equipo'],
  ['examen', 'Exámenes'], ['cambios', 'Cambios inesperados'], ['organizacion', 'Organización'],
  ['participacion', 'Participación'], ['retroalimentacion', 'Retroalimentación'], ['correccion', 'Corrección respetuosa']
];
const decode = (s = '') => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
const plain = (s = '') => esc(decode(s)); 
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'guia';
const tagOf = (neuro) => slug(neuro);
const val = (id) => document.getElementById(id)?.value ?? '';

export function openModal(html) {
  closeModal();
  const el = document.createElement('div');
  el.className = 'modal-backdrop';
  el.id = 'modal';
  el.innerHTML = html;
  document.body.appendChild(el);
}
export function confirmAction(title, message, confirmLabel, onConfirm) {
  openModal(`<section class="modal center"><h2>${title}</h2><p style="color:var(--muted)">${message}</p><div class="modal-actions"><button class="btn btn-pink" onclick="${onConfirm}">${confirmLabel}</button><button class="btn btn-outline" onclick="closeModal()">Cancelar</button></div></section>`);
}
function audienceChips(g) { return g.audience.map(a => `<span class="chip chip-${a === 'Docente' ? 'blue' : 'green'}">${a}</span>`).join(''); }


function computeStats() {
  const favs = getAllFavorites();
  const guides = getGuideData();
  const typeOf = (email) => state.userLog[email]?.type || 'Sin tipo';
  const rows = guides.map(g => {
    const views = Array.isArray(state.views[g.id]) ? state.views[g.id] : [];
    const r = ratingSummary(g.id);
    const ratings = Array.isArray(state.ratings[g.id]) ? state.ratings[g.id] : [];
    const dist = [5, 4, 3, 2, 1].map(n => [n, ratings.filter(x => Number(x.rating) === n).length]);
    const evals = state.evaluations.filter(e => e.guideId === g.id);
    const evalAvg = evals.length ? Math.round(evals.reduce((s, e) => s + (e.score / e.total) * 100, 0) / evals.length) : null;
    return {
      g, views: views.length, viewers: new Set(views.map(v => v.user)).size,
      favs: Object.values(favs).filter(list => Array.isArray(list) && list.includes(g.id)).length,
      avg: r.avg, ratingCount: r.count, dist, evalCount: evals.length, evalAvg,
      comments: state.comments.filter(c => c.guideId === g.id).length
    };
  });
  const emails = new Set([...Object.keys(state.userLog)]);
  const byType = {};
  [...USER_TYPES, 'Sin tipo'].forEach(t => { byType[t] = { users: 0, views: 0, evals: 0, favs: 0 }; });
  emails.forEach(e => { byType[typeOf(e)].users++; });
  Object.values(state.views).flat().forEach(v => { const t = typeOf(v.user); if (byType[t]) byType[t].views++; });
  state.evaluations.forEach(e => { const t = typeOf(e.user); if (byType[t]) byType[t].evals++; });
  Object.entries(favs).forEach(([email, list]) => { const t = typeOf(email); if (byType[t] && Array.isArray(list)) byType[t].favs += list.length; });
  
  const miss = {};
  state.evaluations.forEach(e => {
    const g = guides.find(x => x.id === e.guideId);
    if (!g || !Array.isArray(e.answers)) return;
    g.questions.forEach((q, i) => {
      if (e.answers[i] === undefined) return;
      const k = g.id + '#' + i;
      miss[k] = miss[k] || { g, q, total: 0, wrong: 0 };
      miss[k].total++;
      if (e.answers[i] !== q.correct) miss[k].wrong++;
    });
  });
  const hardest = Object.values(miss).filter(m => m.wrong > 0).sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total) || b.wrong - a.wrong).slice(0, 5);
  const allRatings = rows.reduce((s, r) => s + r.ratingCount, 0);
  const weighted = rows.reduce((s, r) => s + (r.avg || 0) * r.ratingCount, 0);
  return {
    rows, byType, hardest,
    totals: {
      guides: guides.length,
      users: emails.size,
      views: rows.reduce((s, r) => s + r.views, 0),
      favs: rows.reduce((s, r) => s + r.favs, 0),
      ratings: allRatings,
      ratingAvg: allRatings ? (weighted / allRatings).toFixed(1) : null,
      evals: rows.reduce((s, r) => s + r.evalCount, 0),
      comments: state.comments.length,
      docentes: byType['Docente'].users,
      estudiantes: byType['Estudiante'].users,
      donations: state.donations.length,
      donationTotal: state.donations.reduce((s, d) => s + d.amount, 0)
    }
  };
}

// ---------- INICIO ----------
export function adminHome() {
  const r = db.resumen;
  const kpi = (n, label) => `<article class="kpi"><b>${n}</b><span>${label}</span></article>`;
  const card = (cls, title, text, route, btn) => `<article class="quick-card ${cls}"><div><h3>${title}</h3><p>${text}</p></div><button class="btn btn-outline btn-small" onclick="go('${route}')">${btn}</button></article>`;
  const registrados = r ? r.estudiantes + r.docentes : 0;
  const kpis = r
    ? `<section class="kpi-grid">${kpi(getGuideData().length, 'Guías')}<article class="kpi"><b>${registrados}</b><span>Personas registradas</span><span class="kpi-split-line">${r.estudiantes} ${r.estudiantes === 1 ? 'Estudiante' : 'Estudiantes'} · ${r.docentes} ${r.docentes === 1 ? 'Docente' : 'Docentes'}</span></article>${kpi(r.favoritos, 'Guías en favoritos')}${kpi(r.promedioCalificacion === null ? '—' : Number(r.promedioCalificacion).toFixed(1), 'Calificación promedio')}${kpi(r.autoevaluaciones, 'Autoevaluaciones realizadas')}${kpi(r.comentarios, 'Comentarios')}${kpi('$' + Number(r.donacionesMonto).toLocaleString('es-MX'), 'Donaciones registradas (' + r.donaciones + ')')}</section>`
    : estadoCarga('resumen');
  return `${header()}<main class="page"><div class="container">
    ${coverSlot('inicio')}
    <section class="dashboard-hero"><h1>Panel de administración</h1></section>
    ${kpis}
    <section class="quick-grid quick-grid-2">
      ${card('purple', 'Guías', 'Consulta todas las guías, crea nuevas, edítalas, ocúltalas o elimínalas.', 'admin-guias', 'Administrar guías')}
      ${card('green', 'Autoevaluaciones', 'Agrega, edita y elimina las preguntas de la autoevaluación de cada guía.', 'admin-evaluaciones', 'Administrar autoevaluaciones')}
      ${card('pink', 'Comentarios', 'Lee lo que opinan los usuarios sobre cada guía y modera los comentarios.', 'admin-comentarios', 'Ver comentarios')}
      ${SHOW_ADMIN_STATS ? card('blue', 'Estadísticas', 'Gráficas de vistas, favoritos, calificaciones y resultados de cada guía.', 'admin-estadisticas', 'Ver estadísticas') : ''}
      ${card('purple', 'Donaciones', 'Registro de aportaciones para medir el interés y la monetización.', 'admin-donaciones', 'Ver donaciones')}
    </section></div></main>${footer(false)}`;
}

// ---------- GUÍAS ----------
export function adminGuides() {
  const guides = getGuideData();
    const rows = guides.map(g => `<tr class="admin-row" data-id="${g.id}" data-text="${esc((g.title + ' ' + g.neuro + ' ' + g.category).toLowerCase())}" data-neuro="${esc(g.neuroTags[0] || '')}">
    <td><div class="admin-title"><div><strong>${g.title}</strong><small>${g.category || ''}</small></div></div></td>
    <td><span class="tag tag-soft">${g.neuro}</span></td>
    <td>${audienceChips(g)}</td>
    <td>${g.questions.length}</td>
    <td>${g.hidden ? '<span class="chip chip-off">Oculta</span>' : '<span class="chip chip-on">Visible</span>'}</td>
    <td class="admin-actions"><button class="btn btn-outline btn-small" onclick="openGuide('${g.id}')">Ver</button><button class="btn btn-primary btn-small" onclick="adminEditGuide('${g.id}')">Editar</button><button class="btn btn-outline btn-small" onclick="adminToggleHidden('${g.id}')">${g.hidden ? 'Mostrar' : 'Ocultar'}</button></td></tr>`).join('');
  return `${header()}<main class="page"><div class="container">
    ${coverSlot('guias')}
    <div class="content-head"><h1 class="section-title">Guías</h1></div>
    ${estadoCarga('guias')}
    <section class="kpi kpi-summary" aria-label="Resumen de guías"><div><b>${guides.length}</b><span>Total de guías</span></div><div class="kpi-split"><div><b>${guides.filter(g => g.audience.includes('Estudiante')).length}</b><span>Para Estudiantes</span></div><div><b>${guides.filter(g => g.audience.includes('Docente')).length}</b><span>Para Docentes</span></div></div></section>
    <div class="admin-toolbar"><input id="admin-search" class="search-input" placeholder="Buscar guía por nombre" oninput="adminFilterRows()"><select id="admin-neuro" class="search-input" onchange="adminFilterRows()"><option value="">Todas las neurodivergencias</option>${NEURO_OPTIONS.map(n => `<option value="${tagOf(n)}">${n}</option>`).join('')}</select><button class="btn btn-green" onclick="go('admin-guia:new')">+ Nueva guía</button></div>
    <div class="table-wrap"><table class="admin-table"><thead><tr><th>Guía</th><th>Neurodivergencia</th><th>Para</th><th>Preguntas</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No hay guías.</td></tr>'}</tbody></table></div>
    <p id="admin-empty" class="section-text" style="text-align:left" hidden>No encontramos guías con esos filtros.</p>
  </div></main>${footer(false)}`;
}
// FILTRO: consulta la API (GET api/Guia?texto=...&neurodivergencia=...) y deja visibles solo las coincidencias
let filtroTimer;
export function adminFilterRows() {
    clearTimeout(filtroTimer);
    filtroTimer = setTimeout(consultarFiltro, 250);
}
async function consultarFiltro() {
    if (!document.getElementById('admin-search')) return;
    const texto = val('admin-search').trim();
    const lista = document.getElementById('admin-neuro');
    const neurodivergencia = lista && lista.value ? lista.options[lista.selectedIndex].text : '';
    try {
        const guias = await apiListaGuias({ texto, neurodivergencia });
        const ids = new Set(guias.map(g => String(g.idGuia)));
        let shown = 0;
        document.querySelectorAll('.admin-row').forEach(r => { const ok = ids.has(r.dataset.id); r.hidden = !ok; if (ok) shown++; });
        const empty = document.getElementById('admin-empty'); if (empty) empty.hidden = shown > 0;
    } catch (e) { showToast(e.message); }
}

// OCULTAR / MOSTRAR (baja lógica): PUT api/Guia/{id}/visibilidad -> sp_ocultarGuia. No se borra nada de la base.
export async function adminToggleHidden(id) {
    const g = getGuideById(id); if (!g) return;
    try {
        const r = await apiCambiarVisibilidad(state.user?.token, id, !g.hidden);
        await recargarGuia(id);
        showToast(`${r.respuesta} (numeroError: ${r.numeroError})`);
        refreshView();
    } catch (e) {
        showToast(e.numeroError === undefined ? e.message : `${e.message} (numeroError: ${e.numeroError})`);
    }
}

// EDITAR: primero consulta la guía por su ID (GET api/Guia/{id}) y abre el formulario con esos datos
export async function adminEditGuide(id) {
    try {
        await recargarGuia(id);
        go('admin-guia:' + id);
    } catch (e) { showToast(e.message); }
}

export function adminAskDeleteGuide(id) {
  const g = getGuideById(id); if (!g) return;
  confirmAction('¿Eliminar esta guía?', `Se eliminará «${g.title}» (${g.neuro}) junto con su autoevaluación. Dejará de aparecer para todos los usuarios. Si es una guía original, puedes recuperarla con «Restaurar guías originales».`, 'Sí, eliminar', `adminDeleteGuide('${id}')`);
}
export function adminDeleteGuide(id) {
  delete state.guideOverrides[id];
  if (isOriginalGuide(id) && !state.guideDeleted.includes(id)) state.guideDeleted.push(id);
  state.favorites = state.favorites.filter(x => x !== id);
  save(); closeModal(); showToast('Guía eliminada'); refreshView();
}
export function adminAskRestore() {
  confirmAction('¿Restaurar guías originales?', 'Se quitarán todos los cambios del administrador: las guías nuevas se eliminan y las originales vuelven a su contenido, audiencia y preguntas de fábrica.', 'Sí, restaurar', 'adminRestore()');
}
export function adminRestore() {
  state.guideOverrides = {}; state.guideDeleted = [];
  save(); closeModal(); showToast('Guías originales restauradas'); refreshView();
}

// ---------- FORMULARIO DE GUÍA  ----------
export function adminGuideForm() {
  const id = state.route.split(':')[1];
  const isNew = id === 'new';
  const g = isNew ? { title: '', category: '', image: '', video: '', desc: '', neuro: 'Autismo', steps: [], avoid: [], situationTags: [], audience: [...USER_TYPES], hidden: false } : getGuideById(id);
  if (!g) return `${header()}<main class="page"><div class="container"><p>No encontramos esta guía.</p><button class="btn btn-outline" onclick="go('admin-guias')">Volver a guías</button></div></main>${footer(false)}`;
  const lines = (arr) => arr.map(x => decode(x)).join('\n');
  return `${header()}<main class="page"><div class="container profile-card admin-form">
    <h1>${isNew ? 'Nueva guía' : 'Editar guía'}</h1>
    <p class="section-text" style="text-align:left;margin:0 0 22px">${isNew ? 'Completa los datos. Después podrás agregar su autoevaluación en la pestaña «Autoevaluaciones».' : 'Los cambios se verán de inmediato para los usuarios que puedan ver esta guía.'}</p>
    <form class="form" onsubmit="event.preventDefault();adminSaveGuide('${isNew ? '' : g.id}')">
      <div class="field"><label>Título *</label><input id="gf-title" required maxlength="80" value="${plain(g.title)}"></div>
      <div class="form-row"><div class="field"><label>Neurodivergencia *</label><select id="gf-neuro" required>${NEURO_OPTIONS.map(n => `<option ${g.neuro === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Categoría *</label><input id="gf-category" required maxlength="60" value="${plain(g.category)}" placeholder="Ej. Comunicación"></div>
      </div>
      <div class="field"><label>Descripción corta *</label><textarea id="gf-desc" required rows="2" maxlength="260">${plain(g.desc)}</textarea></div>
      <div class="field"><label>¿Qué puedes hacer? * (una recomendación por línea)</label><textarea id="gf-steps" required rows="6">${plain(lines(g.steps))}</textarea></div>
      <div class="field"><label>¿Qué conviene evitar? * (una por línea)</label><textarea id="gf-avoid" required rows="4">${plain(lines(g.avoid))}</textarea></div>
      <fieldset class="field check-group"><legend>Para quién es la guía * (puedes marcar ambos)</legend>${USER_TYPES.map(t => `<label class="check"><input type="checkbox" name="gf-audience" value="${t}" ${g.audience.includes(t) ? 'checked' : ''}> ${t}</label>`).join('')}</fieldset>
      <fieldset class="field check-group"><legend>Situaciones relacionadas (sirven para los filtros)</legend>${SITUATION_TAGS.map(([v, l]) => `<label class="check"><input type="checkbox" name="gf-situation" value="${v}" ${g.situationTags.includes(v) ? 'checked' : ''}> ${l}</label>`).join('')}</fieldset>
      <label class="check"><input type="checkbox" id="gf-visible" ${g.hidden ? '' : 'checked'}> Guía visible para los usuarios</label>
      <div id="gf-result" class="form-result" role="status" hidden></div><div class="profile-actions"><button class="btn btn-blue" type="submit">Guardar guía</button><button class="btn btn-outline" type="button" onclick="go('admin-guias')">${isNew ? 'Volver a guías' : 'Cancelar'}</button></div>
    </form></div></main>${footer(false)}`;
}

const toLines = (text) => text.split('\n').map(x => x.trim()).filter(Boolean).map(esc);
const plainLines = (text) => text.split('\n').map(x => x.trim()).filter(Boolean);

// Muestra en el formulario lo que respondió la API: la respuesta y su numeroError.
function mostrarResultadoApi(ok, numeroError, respuesta) {
    const caja = document.getElementById('gf-result');
    if (!caja) return;
    caja.className = ok ? 'form-result form-result-ok' : 'alert-error';
    caja.textContent = numeroError === undefined ? respuesta : `${respuesta} (numeroError: ${numeroError})`;
    caja.hidden = false;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// NUEVA GUÍA: POST api/Guia -> sp_crearGuia -> tablas Guia, Recomendacion y GuiaSituacion
async function crearGuiaEnApi(datos) {
    const boton = document.querySelector('.admin-form button[type="submit"]');
    if (boton) boton.disabled = true;
    try {
        const r = await apiCrearGuia(state.user?.token, datos);
        try { await cargarCatalogo(); } catch (e) { /* ya se guardó yla tabla se actualiza al volver a abrirla */ }
        document.querySelector('.admin-form form').reset();
        mostrarResultadoApi(true, r.numeroError, r.respuesta);
        showToast(r.respuesta);
    } catch (e) {
        mostrarResultadoApi(false, e.numeroError, e.message);
    } finally {
        if (boton) boton.disabled = false;
    }
}

export async function adminSaveGuide(existingId) {
    const title = val('gf-title').trim(), category = val('gf-category').trim(), desc = val('gf-desc').trim();
    const steps = toLines(val('gf-steps')), avoid = toLines(val('gf-avoid'));
    const audience = [...document.querySelectorAll('input[name="gf-audience"]:checked')].map(i => i.value);
    const situations = [...document.querySelectorAll('input[name="gf-situation"]:checked')].map(i => i.value);
    const neuro = val('gf-neuro');
    if (!title || !category || !desc) { showToast('Completa título, categoría y descripción'); return; }
    if (!steps.length || !avoid.length) { showToast('Agrega al menos una recomendación y una cosa por evitar'); return; }
    if (!audience.length) { showToast('Elige para quién es la guía (Estudiante, Docente o ambos)'); return; }

    // NUEVA GUÍA: se guarda en la base de datos a través de la API
    if (!existingId) {
        await crearGuiaEnApi({
            titulo: title, neurodivergencia: neuro, categoria: category, descripcion: desc,
            recomendaciones: plainLines(val('gf-steps')), evitar: plainLines(val('gf-avoid')),
            paraEstudiante: audience.includes('Estudiante'), paraDocente: audience.includes('Docente'),
            situaciones: situations, activo: document.getElementById('gf-visible').checked
        });
        return;
    }

    // EDITAR: PUT api/Guia/{id} -> sp_editarGuia (conserva las situaciones que no aparecen en el formulario)
    const prev = getGuideById(existingId);
    const known = new Set(SITUATION_TAGS.map(([v]) => v));
    const keptExtra = prev ? prev.situationTags.filter(t => !known.has(t)) : [];
    await editarGuiaEnApi(existingId, {
        titulo: title, neurodivergencia: neuro, categoria: category, descripcion: desc,
        recomendaciones: plainLines(val('gf-steps')), evitar: plainLines(val('gf-avoid')),
        paraEstudiante: audience.includes('Estudiante'), paraDocente: audience.includes('Docente'),
        situaciones: [...situations, ...keptExtra], activo: document.getElementById('gf-visible').checked
    });
}

// EDITAR GUÍA: PUT api/Guia/{id}. Si sale bien vuelve a la tabla ya actualizada; si falla, muestra numeroError y respuesta en el formulario.
async function editarGuiaEnApi(id, datos) {
    const boton = document.querySelector('.admin-form button[type="submit"]');
    if (boton) boton.disabled = true;
    try {
        const r = await apiEditarGuia(state.user?.token, id, datos);
        try { await recargarGuia(id); } catch (e) { /* ya se guardó y la tabla se actualiza al volver a abrirla */ }
        showToast(`${r.respuesta} (numeroError: ${r.numeroError})`);
        go('admin-guias');
    } catch (e) {
        mostrarResultadoApi(false, e.numeroError, e.message);
    } finally {
        if (boton) boton.disabled = false;
    }
}

// ---------- AUTOEVALUACIONES ----------
export function adminEvaluations() {
  const guides = getGuideData();
  const cards = guides.map(g => `<article class="guide-card admin-eval-card">
    <div class="tag-row"><span class="tag">${g.category || ''}</span><span class="tag tag-soft">${g.neuro}</span></div>
    <h3>${g.title}</h3>
    <p>${g.evalId ? `${g.questions.length} ${g.questions.length === 1 ? 'pregunta' : 'preguntas'}` : 'Esta guía aún no tiene autoevaluación.'}</p>
    <div class="admin-chips">${audienceChips(g)}${g.hidden ? '<span class="chip chip-off">Guía oculta</span>' : ''}</div>
    <div class="admin-actions"><button class="btn btn-primary btn-small" onclick="go('admin-eval:${g.id}')">${g.evalId ? 'Ver / editar' : 'Crear autoevaluación'}</button>${g.evalId ? `<button class="btn btn-pink btn-small" onclick="adminAskDeleteEvaluation('${g.id}')">Eliminar</button>` : ''}</div></article>`).join('');
  return `${header()}<main class="page"><div class="container">
    ${coverSlot('autoevaluaciones')}
    <div class="content-head"><h1 class="section-title">Autoevaluaciones</h1><p class="section-text">Cada guía tiene su autoevaluación. Entra a una para ver sus preguntas, agregar nuevas, editarlas o eliminarlas.</p></div>
    <div class="admin-toolbar"><button class="btn btn-green" onclick="adminOpenEvalSetup()">+ Nueva autoevaluación</button></div>
    <div class="guide-grid">${cards || '<div class="empty" style="grid-column:1/-1">No hay guías.</div>'}</div></div></main>${footer(false)}`;
}

export function adminOpenEvalSetup() {
  const free = getGuideData().filter(x => !x.evalId);
  if (!free.length) {
    openModal(`<section class="modal center"><button class="close-btn" onclick="closeModal()">×</button><h2>Todas las guías ya tienen autoevaluación</h2><p style="color:var(--muted)">Cada guía tiene una autoevaluación. Para crear una nueva, primero agrega una guía nueva en «Guías» o elimina la autoevaluación de una guía existente.</p><div class="modal-actions"><button class="btn btn-green" onclick="closeModal();go('admin-guia:new')">+ Nueva guía</button><button class="btn btn-outline" onclick="closeModal()">Cerrar</button></div></section>`);
    return;
  }
  openModal(`<section class="modal"><button class="close-btn" onclick="closeModal()">×</button><h2>Nueva autoevaluación</h2>
    <form class="form" onsubmit="event.preventDefault();adminSaveEvalSetup()">
      <div class="field"><label for="ef-guide">Guía a la que se asigna *</label><select id="ef-guide" required>${free.map(x => `<option value="${x.id}">${x.title} (${x.neuro})</option>`).join('')}</select><small class="cell-sub">Solo aparecen las guías que todavía no tienen autoevaluación.</small></div>
      <div class="modal-actions"><button class="btn btn-blue" type="submit">Crear y agregar preguntas</button><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button></div>
    </form></section>`);
}
const textoError = (e) => e.numeroError === undefined ? e.message : `${e.message} (numeroError: ${e.numeroError})`;

// CREAR AUTOEVALUACIÓN: POST api/Evaluacion -> sp_crearEvaluacion (una por guía)
export async function adminSaveEvalSetup() {
    const id = val('ef-guide'); const g = getGuideById(id);
    if (!g) { showToast('Elige una guía'); return; }
    try {
        const r = await apiCrearEvaluacion(state.user?.token, id);
        await recargarGuia(id);
        closeModal(); showToast(`${r.respuesta} (numeroError: ${r.numeroError})`); go('admin-eval:' + id);
    } catch (e) { showToast(textoError(e)); }
}
export function adminAskDeleteEvaluation(id) {
  const g = getGuideById(id); if (!g) return;
  confirmAction('¿Eliminar la autoevaluación?', `Se borrarán las ${g.questions.length} preguntas de «${g.title}» (${g.neuro}). La guía se conserva. Los resultados que los usuarios ya obtuvieron no se borran.`, 'Sí, eliminar', `adminDeleteEvaluation('${id}')`);
}
// ELIMINACIÓN FÍSICA: DELETE api/Evaluacion/{id} -> sp_eliminarEvaluacion borra la autoevaluación y sus preguntas. La guía se conserva.
export async function adminDeleteEvaluation(id) {
    const g = getGuideById(id); if (!g || !g.evalId) return;
    try {
        const r = await apiEliminarEvaluacion(state.user?.token, g.evalId);
        await recargarGuia(id);
        closeModal(); showToast(`${r.respuesta} (numeroError: ${r.numeroError})`); refreshView();
    } catch (e) { closeModal(); showToast(textoError(e)); }
}
export function adminEvalEditor() {
  const g = getGuideById(state.route.split(':')[1]);
  if (!g) return `${header()}<main class="page"><div class="container"><p>No encontramos esta guía.</p><button class="btn btn-outline" onclick="go('admin-evaluaciones')">Volver</button></div></main>${footer(false)}`;
  const qs = g.questions.map((q, i) => `<article class="admin-question"><div class="admin-question-head"><strong>${i + 1}. ${q.text}</strong><div class="admin-actions"><button class="btn btn-outline btn-small" onclick="adminOpenQuestion('${g.id}',${i})">Editar</button><button class="btn btn-pink btn-small" onclick="adminAskDeleteQuestion('${g.id}',${i})">Eliminar</button></div></div><ul class="admin-options">${q.options.map(o => `<li class="${o.key === q.correct ? 'correct' : ''}"><b>${o.key.toUpperCase()}.</b> ${o.text}${o.key === q.correct ? ' <span class="chip chip-on">Correcta</span>' : ''}</li>`).join('')}</ul></article>`).join('');
  return `${header()}<main class="page"><div class="container">
    <button class="btn btn-outline btn-small" onclick="go('admin-evaluaciones')">← Volver a autoevaluaciones</button>
    <div class="content-head" style="margin-top:18px"><h1 class="section-title">${g.title}</h1><p class="section-text">Autoevaluación de la guía de ${g.neuro} · ${g.questions.length} ${g.questions.length === 1 ? 'pregunta' : 'preguntas'}</p></div>
    <div class="admin-footer-actions" style="justify-content:flex-start;margin:0 0 16px"><button class="btn btn-green" onclick="adminOpenQuestion('${g.id}',-1)">+ Agregar pregunta</button><button class="btn btn-outline" onclick="openGuide('${g.id}')">Ver la guía</button></div>
    ${qs || '<div class="empty">Esta guía todavía no tiene preguntas. Agrega la primera.</div>'}</div></main>${footer(false)}`;
}
export function adminOpenQuestion(guideId, index) {
  const g = getGuideById(guideId); if (!g) return;
  const q = index >= 0 ? g.questions[index] : { text: '', options: [], correct: 'a' };
  const keys = ['a', 'b', 'c', 'd'];
  const optRow = (k, i) => { const o = q.options.find(x => x.key === k); return `<div class="option-edit"><label class="check"><input type="radio" name="qf-correct" value="${k}" ${q.correct === k || (!q.options.length && i === 0) ? 'checked' : ''}> <b>${k.toUpperCase()}</b></label><input id="qf-opt-${k}" class="search-input" maxlength="180" placeholder="Opción ${k.toUpperCase()}${i < 2 ? ' (obligatoria)' : ' (opcional)'}" value="${o ? plain(o.text) : ''}"></div>`; };
  openModal(`<section class="modal"><button class="close-btn" onclick="closeModal()">×</button><h2>${index >= 0 ? 'Editar pregunta' : 'Nueva pregunta'}</h2><form class="form" onsubmit="event.preventDefault();adminSaveQuestion('${guideId}',${index})"><div class="field"><label>Pregunta *</label><textarea id="qf-text" required rows="2" maxlength="220">${plain(q.text)}</textarea></div><div class="field"><label>Opciones de respuesta (marca la correcta)</label>${keys.map(optRow).join('')}</div><div class="modal-actions"><button class="btn btn-blue" type="submit">Guardar pregunta</button><button class="btn btn-outline" type="button" onclick="closeModal()">Cancelar</button></div></form></section>`);
}
// AGREGAR / EDITAR PREGUNTA: POST api/Evaluacion/{id}/preguntas o PUT api/Evaluacion/preguntas/{id}
export async function adminSaveQuestion(guideId, index) {
    const g = getGuideById(guideId); if (!g) return;
    const text = val('qf-text').trim();
    const keys = ['a', 'b', 'c', 'd'];
    const filled = keys.map(k => ({ k, text: val('qf-opt-' + k).trim() })).filter(o => o.text);
    const correctKey = document.querySelector('input[name="qf-correct"]:checked')?.value;
    if (!text) { showToast('Escribe la pregunta'); return; }
    if (filled.length < 2) { showToast('Escribe al menos dos opciones'); return; }
    if (!filled.some(o => o.k === correctKey)) { showToast('Marca como correcta una opción que tenga texto'); return; }
    if (index < 0 && !g.evalId) { showToast('Esta guía todavía no tiene autoevaluación'); return; }
    const datos = {
        texto: text, opcionA: filled[0].text, opcionB: filled[1].text,
        opcionC: filled[2]?.text || null, opcionD: filled[3]?.text || null,
        correcta: keys[filled.findIndex(o => o.k === correctKey)]  
    };
    try {
        const r = index >= 0
            ? await apiEditarPregunta(state.user?.token, g.questions[index].id, datos)
            : await apiCrearPregunta(state.user?.token, g.evalId, datos);
        await recargarGuia(guideId);
        closeModal(); showToast(`${r.respuesta} (numeroError: ${r.numeroError})`); refreshView();
    } catch (e) { showToast(textoError(e)); }
}
export function adminAskDeleteQuestion(guideId, index) {
  confirmAction('¿Eliminar esta pregunta?', 'La pregunta se quitará de la autoevaluación.', 'Sí, eliminar', `adminDeleteQuestion('${guideId}',${index})`);
}
export async function adminDeleteQuestion(guideId, index) {
    const g = getGuideById(guideId); const q = g?.questions[index]; if (!q) return;
    try {
        const r = await apiEliminarPregunta(state.user?.token, q.id);   // DELETE api/Evaluacion/preguntas/{id}
        await recargarGuia(guideId);
        closeModal(); showToast(`${r.respuesta} (numeroError: ${r.numeroError})`); refreshView();
    } catch (e) { closeModal(); showToast(textoError(e)); }
}

// ---------- ESTADÍSTICAS ----------
let statsSort = 'views';
let statsNeuro = '';
const SORTS = {
  views: ['Más vistas', (a, b) => b.views - a.views],
  favs: ['Más guardadas en favoritos', (a, b) => b.favs - a.favs],
  rating: ['Mejor calificadas', (a, b) => (b.avg ?? -1) - (a.avg ?? -1) || b.ratingCount - a.ratingCount],
  evals: ['Más autoevaluaciones', (a, b) => b.evalCount - a.evalCount],
  title: ['Nombre (A-Z)', (a, b) => a.g.title.localeCompare(b.g.title, 'es')]
};
export function adminSetStats(sort, neuro) {
  if (sort !== undefined) statsSort = sort;
  if (neuro !== undefined) statsNeuro = neuro;
  refreshView();
}

function statsCharts(s) {
  const days = lastDays(14);
  const viewDates = Object.values(state.views).flat().map(v => v.date);
  const evalDates = state.evaluations.map(e => new Date(e.id).toISOString());
  const topViews = [...s.rows].sort((a, b) => b.views - a.views).slice(0, 8).filter(r => r.views).map(r => ({ label: decode(r.g.title), sub: r.g.neuro, value: r.views }));
  const topEval = s.rows.filter(r => r.evalAvg !== null).sort((a, b) => b.evalAvg - a.evalAvg).slice(0, 8).map(r => ({ label: decode(r.g.title), sub: r.g.neuro, value: r.evalAvg }));
  const dist = [5, 4, 3, 2, 1].map(n => ({ label: n + '★', value: s.rows.reduce((t, r) => t + (r.dist.find(d => d[0] === n)?.[1] || 0), 0) }));
  const types = Object.entries(s.byType).filter(([, v]) => v.views).map(([k, v]) => ({ label: k, value: v.views }));
  return `<section class="chart-grid">
    <article class="admin-panel chart-wide"><h2>Actividad de los últimos 14 días</h2>${lineChart(days.map(d => d.label), [{ name: 'Vistas de guías', color: 'var(--purple)', values: countByDay(days, viewDates) }, { name: 'Autoevaluaciones', color: 'var(--blue)', values: countByDay(days, evalDates) }, { name: 'Comentarios', color: 'var(--pink)', values: countByDay(days, state.comments.map(c => c.date)) }])}</article>
    <article class="admin-panel"><h2>Guías más vistas</h2>${hBars(topViews)}</article>
    <article class="admin-panel"><h2>Promedio de aciertos por guía</h2>${hBars(topEval, { suffix: '%' })}</article>
    <article class="admin-panel"><h2>Distribución de calificaciones</h2>${columns(dist)}</article>
    <article class="admin-panel"><h2>Vistas por tipo de usuario</h2>${donut(types)}</article>
  </section>`;
}
export function adminStats() {
  
  const s = computeStats();
  const rows = s.rows;
  const body = rows.map(r => `<tr>
    <td><div class="admin-title"><div><strong>${r.g.title}</strong><small>${r.g.neuro}</small></div></div></td>
    <td>${r.views}</td>
    <td>${r.favs}</td>
    <td>${r.avg === null ? '<span class="cell-sub">Sin calificaciones</span>' : `<span class="stars">${ratingStars(r.avg)}</span> <strong>${r.avg}/5</strong>`}</td>
    <td>${r.evalCount}</td>
    <td>${r.comments}</td>
  </tr>`).join('');

  return `${header()}<main class="page"><div class="container">
    ${coverSlot('estadisticas')}
    <div class="content-head"><h1 class="section-title">Estadísticas</h1></div>
    <div class="table-wrap"><table class="admin-table">
      <thead><tr><th>Guía</th><th>Vistas</th><th>Favoritos</th><th>Calificación</th><th>Autoevaluaciones</th><th>Comentarios</th></tr></thead>
      <tbody>${body || '<tr><td colspan="6">Todavía no hay actividad registrada.</td></tr>'}</tbody>
    </table></div>
  </div></main>${footer(false)}`;
}
export function adminExportCsv() {
  const s = computeStats();
  const q = (v) => '"' + String(decode(v ?? '')).replace(/"/g, '""') + '"';
  const head = ['Guía', 'Neurodivergencia', 'Para', 'Estado', 'Vistas', 'Personas que la vieron', 'En favoritos', 'Calificación promedio', 'Número de calificaciones', 'Autoevaluaciones realizadas', 'Promedio de autoevaluación (%)', 'Comentarios'];
  const lines = s.rows.map(r => [q(r.g.title), q(r.g.neuro), q(r.g.audience.join(' y ')), q(r.g.hidden ? 'Oculta' : 'Visible'), r.views, r.viewers, r.favs, r.avg ?? '', r.ratingCount, r.evalCount, r.evalAvg ?? '', r.comments].join(','));
  const blob = new Blob(['\ufeff' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `estadisticas-mentes-conectadas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('Archivo CSV descargado');
}
