
export function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
export function showToast(msg){const toast=document.getElementById('toast');toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2400);}
export function closeModal(){document.getElementById('modal')?.remove();}
export function confirmModal(title,message,buttons){const el=document.createElement('div');el.className='modal-backdrop';el.id='modal';el.innerHTML=`<section class="modal center"><div style="font-size:60px">✓</div><h2>${title}</h2><p style="color:var(--muted)">${message}</p><div class="modal-actions">${buttons}</div></section>`;document.body.appendChild(el);}
export function disclaimer(){return `<aside class="disclaimer-note" role="note"><strong>Aviso importante</strong><p>La información y las guías de Mentes Conectadas son de carácter orientativo y educativo; no sustituyen un diagnóstico ni la valoración o atención de un profesional especializado. Las recomendaciones propuestas no se aplican a todas las personas ni a todas las situaciones, ya que cada experiencia y necesidad es diferente.</p></aside>`;}

export function evaluationNotice(){return `<aside class="guide-warning" role="note"><strong>Sobre las autoevaluaciones</strong><p>Las autoevaluaciones sirven únicamente para medir tu nivel de conocimiento después de usar las guías; no son un diagnóstico ni una valoración de la persona. Se recomienda revisar primero la guía correspondiente y hacer la autoevaluación después.</p></aside>`;}
export function guideWarning(){return `<aside class="guide-warning" role="note"><strong>Ten en cuenta</strong><p>Estas guías no se aplican a todas las situaciones. Cada persona neurodivergente puede reaccionar de manera diferente; adapta las recomendaciones al contexto y respeta las preferencias de cada persona.</p></aside>`;}
export function footer(showDisclaimer=true){return `<footer class="footer"><div class="container"><strong>Mentes Conectadas</strong><br><small>Información y guías prácticas para el entorno universitario.</small>${showDisclaimer?disclaimer():''}<hr style="border:0;border-top:1px solid rgba(255,255,255,.12);margin:18px 0"><small>Universidad Tecnológica de Tula-Tepeji · Herramienta educativa de consulta</small></div></footer>`;}

// Espacio para la imagen de portada de una pantalla (assets/portadas/<nombre>.jpg).
// Si el archivo todavía no existe, el espacio se elimina solo y no se ve nada.

// Portadas disponibles en assets/img/portadas. aquí se agrega el nombre cuando se suba la imagen ['inicio', 'guias'].
const PORTADAS = [];
export function coverSlot(name) { if (!PORTADAS.includes(name)) return ''; return `<div class="page-cover"><img src="assets/img/portadas/${name}.jpg" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>`; }
// Corazón de favoritos
export function heartIcon(filled){return `<svg class="icon-heart" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;}
