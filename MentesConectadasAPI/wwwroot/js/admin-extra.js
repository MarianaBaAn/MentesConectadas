// Panel del Administrador: Comentarios y Donaciones.

import { state } from './state.js';
import { DONATION_CURRENCY } from './config.js';
import { esc, showToast, closeModal, footer } from './ui.js';
import { header, refreshView } from './navigation.js';
import { getGuideData, getGuideById } from './content.js';
import { confirmAction } from './admin.js';
import { db, estadoCarga, recargarAdmin } from './admin-db.js';
import { apiAdminComentarioOculto, apiAdminComentarioEliminar, apiAdminDonacionEstado, apiAdminDonacionEliminar } from './api.js';

const kpi = (n, label) => `<article class="kpi"><b>${n}</b><span>${label}</span></article>`;
const money = (n) => '$' + Number(n).toLocaleString('es-MX');
const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('es-MX') + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); };

const shell = (inner) => `${header()}<main class="page"><div class="container">${inner}</div></main>${footer(false)}`;
function download(name, rows) {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const blob = new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('Archivo CSV descargado');
}

const token = () => state.user?.token;

// ------------- COMENTARIOS ------------------
let commentsGuide = '';
export function adminSetCommentsGuide(id) { commentsGuide = id; refreshView(); }
export function adminComments() {
  const guides = getGuideData();
  const cabecera = `<div class="content-head"><h1 class="section-title">Comentarios</h1><p class="section-text">Opiniones que los usuarios dejan en cada guía. Un comentario oculto se conserva aquí pero se marca como oculto.</p></div>`;
  const all = db.comentarios;
  if (!all) return shell(cabecera + estadoCarga('comentarios'), false);
  const list = all.filter(c => !commentsGuide || c.idGuia === commentsGuide); 
  const stars = (n) => n ? `<span class="stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>` : '';
  const items = list.map(c => { const g = guides.find(x => x.id === c.idGuia); return `<article class="admin-question ${c.oculto ? 'is-hidden' : ''}"><div class="admin-question-head"><div><strong>${g ? g.title : 'Guía eliminada'}</strong><small class="cell-sub">${g ? g.neuro : ''} · ${esc(c.nombre)}${c.tipoUsuario ? ' (' + esc(c.tipoUsuario) + ')' : ''} · ${fmtDate(c.fecha)} ${stars(c.estrellas)}</small></div><div class="admin-actions">${c.oculto ? '<span class="chip chip-off">Oculto</span>' : ''}<button class="btn btn-outline btn-small" onclick="adminToggleComment(${c.idComentario})">${c.oculto ? 'Mostrar' : 'Ocultar'}</button><button class="btn btn-pink btn-small" onclick="adminAskDeleteComment(${c.idComentario})">Eliminar</button></div></div><p class="comment-text">${esc(c.texto)}</p></article>`; }).join('');
  const conComentarios = new Set(all.map(c => c.idGuia)).size;
  return shell(`${cabecera}
    ${estadoCarga('comentarios')}
    <section class="kpi-grid">${kpi(all.length, 'Comentarios en total')}${kpi(all.filter(c => c.oculto).length, 'Ocultos')}${kpi(conComentarios, 'Guías con comentarios')}</section>
    <div class="admin-toolbar"><select class="search-input" onchange="adminSetCommentsGuide(this.value)" aria-label="Filtrar por guía"><option value="">Todas las guías</option>${guides.map(g => `<option value="${g.id}" ${g.id === commentsGuide ? 'selected' : ''}>${g.title} (${g.neuro})</option>`).join('')}</select></div>
    ${items || '<div class="empty">Todavía no hay comentarios.</div>'}`, false);
}
export async function adminToggleComment(id) {
  const c = db.comentarios?.find(x => x.idComentario === id); if (!c) return;
  try {
    await apiAdminComentarioOculto(token(), id, !c.oculto);
    showToast(c.oculto ? 'Comentario visible' : 'Comentario oculto');
    recargarAdmin('admin-comentarios');
  } catch (e) { showToast(e.message); }
}
export function adminAskDeleteComment(id) {
  confirmAction('¿Eliminar este comentario?', 'Se borrará de forma definitiva de la base de datos. Si solo quieres que no se muestre, usa «Ocultar».', 'Sí, eliminar', `adminDeleteComment(${id})`);
}
export async function adminDeleteComment(id) {
  try {
    await apiAdminComentarioEliminar(token(), id);
    closeModal(); showToast('Comentario eliminado');
    recargarAdmin('admin-comentarios');
  } catch (e) { closeModal(); showToast(e.message); }
}

// ================= DONACIONES  =================
export function adminDonations() {
  const cabecera = `<div class="content-head"><h1 class="section-title">Donaciones</h1></div>`;
  const data = db.donaciones;
  if (!data) return shell(cabecera + estadoCarga('donaciones'), false);
  const d = data.lista; 
  const total = d.reduce((s, x) => s + x.monto, 0);
  const confirmed = d.filter(x => x.estado === 'confirmada');
  const confirmedTotal = confirmed.reduce((s, x) => s + x.monto, 0);
  const donors = new Set(d.map(x => x.correo || ('anonimo-' + x.idDonacion))).size;
  const users = data.totalUsuarios;
  const rows = d.map(x => `<tr><td>${fmtDate(x.fecha)}</td><td>${x.correo ? `${esc(x.nombre || '')}<small class="cell-sub">${esc(x.correo)}</small>` : '<span class="cell-sub">Sin sesión</span>'}</td><td><strong>${money(x.monto)}</strong> <small class="cell-sub">${x.otraCantidad ? 'otra cantidad' : 'predefinida'}</small></td><td>${x.estado === 'confirmada' ? '<span class="chip chip-on">Confirmada</span>' : '<span class="chip chip-off">Intención</span>'}</td><td class="admin-actions"><button class="btn btn-outline btn-small" onclick="adminToggleDonation(${x.idDonacion})">${x.estado === 'confirmada' ? 'Marcar como intención' : 'Confirmar pago'}</button><button class="btn btn-pink btn-small" onclick="adminAskDeleteDonation(${x.idDonacion})">Eliminar</button></td></tr>`).join('');
  return shell(`${cabecera}
    ${estadoCarga('donaciones')}
    <section class="kpi-grid">${kpi(d.length, 'Intenciones registradas')}${kpi(money(total), 'Monto de intenciones')}${kpi(confirmed.length, 'Pagos confirmados')}${kpi(money(confirmedTotal), 'Monto confirmado')}${kpi(d.length ? money(Math.round(total / d.length)) : '—', 'Aportación promedio')}${kpi(users ? Math.round((donors / users) * 100) + '%' : '—', 'Personas que quisieron donar')}</section>
    <div class="admin-toolbar"><span class="section-text" style="margin:0;text-align:left">Registro de donaciones</span></div>
    <div class="table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Persona</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Todavía no hay donaciones registradas.</td></tr>'}</tbody></table></div>`, false);
}
export async function adminToggleDonation(id) {
  const x = db.donaciones?.lista.find(v => v.idDonacion === id); if (!x) return;
  try {
    await apiAdminDonacionEstado(token(), id, x.estado === 'confirmada' ? 'intencion' : 'confirmada');
    recargarAdmin('admin-donaciones');
  } catch (e) { showToast(e.message); }
}
export function adminAskDeleteDonation(id) {
  confirmAction('¿Eliminar este registro?', 'Se quitará del historial de donaciones (base de datos).', 'Sí, eliminar', `adminDeleteDonation(${id})`);
}
export async function adminDeleteDonation(id) {
  try {
    await apiAdminDonacionEliminar(token(), id);
    closeModal(); showToast('Registro eliminado');
    recargarAdmin('admin-donaciones');
  } catch (e) { closeModal(); showToast(e.message); }
}
export function adminExportDonations() {
  const lista = db.donaciones?.lista || [];
  download(`donaciones-mentes-conectadas-${new Date().toISOString().slice(0, 10)}.csv`, [['Fecha', 'Nombre', 'Correo', 'Monto', 'Moneda', 'Tipo', 'Estado'], ...lista.map(x => [x.fecha, x.nombre, x.correo, x.monto, DONATION_CURRENCY, x.otraCantidad ? 'Otra cantidad' : 'Predefinida', x.estado === 'confirmada' ? 'Confirmada' : 'Intención'])]);
}
