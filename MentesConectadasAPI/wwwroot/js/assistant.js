// Asistente de consulta con IA.
// - La búsqueda local en guías e información (la de siempre) sigue funcionando y alimenta a la IA con contexto.
// - La IA (Gemini -> Groq) se pide a la API de .NET: POST /api/Chatbot/preguntar. Las llaves viven SOLO en el servidor.
// - Si la IA no está disponible, se muestran los resultados de la búsqueda local como antes.
import { footer, esc } from './ui.js';
import { logAssistantQuery, state } from './state.js';
import { header } from './navigation.js';
import { getNeuroData, getVisibleGuides } from './content.js';
import { API_BASE_URL } from './api.js';

// ======================= BÚSQUEDA LOCAL (sin cambios) =======================

const STOP = new Set('que como para por con una uno unos unas los las del les mis sus este esta esto estos estas cuando donde quien cual cuales hago hacer puedo debo deber puede pueden hay ser son fue era mas muy pero sino sobre ante entre desde hasta tengo tiene tienen quiero necesito ayuda algo cosa cosas'.split(' '));
export const normalizeText = (t='') => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ]+/g,' ').replace(/\s+/g,' ').trim();
const stem = (w) => (w.length > 6 ? w.slice(0, 6) : w);
export function queryTokens(q){return [...new Set(normalizeText(q).split(' ').filter(w=>w.length>=3&&!STOP.has(w)).map(stem))];}
function scoreText(text,tokens){const h=normalizeText(text);return tokens.reduce((s,t)=>s+(h.includes(t)?1:0),0);}
export function assistantFind(q){
  const tokens=queryTokens(q);if(!tokens.length)return {tokens,guides:[],neuros:[]};
  const need=tokens.length>=3?2:1;
  const guides=getVisibleGuides().map(g=>({g,s:scoreText(g.title+' '+g.category+' '+g.desc+' '+g.neuro+' '+g.steps.join(' ')+' '+g.avoid.join(' ')+' '+g.situationTags.join(' '),tokens)+(scoreText(g.title,tokens)*2)})).filter(x=>x.s>=need).sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.g);
  const neuros=getNeuroData().map(n=>({n,s:scoreText(n.name+' '+n.description+' '+n.characteristics.join(' ')+' '+n.learning+' '+n.communication+' '+n.considerations,tokens)+(scoreText(n.name,tokens)*2)})).filter(x=>x.s>=need).sort((a,b)=>b.s-a.s).slice(0,4).map(x=>x.n);
  return {tokens,guides,neuros};
}

// Tarjetas "Ver guía" / "Ver información" (las mismas de antes)
function resultCards(found){
  const {guides,neuros}=found;
  return `<div class="assistant-results"><h3>Guías e información relacionadas</h3>${guides.map(g=>`<article class="assistant-result"><div><span class="tag">Guía</span><h4>${g.title}</h4><p>${g.desc}</p></div><button class="btn btn-pink btn-small" onclick="openGuide('${g.id}')">Ver guía</button></article>`).join('')}${neuros.map(n=>`<article class="assistant-result"><div><span class="tag tag-soft">Información</span><h4>${n.name}</h4><p>${n.description}</p></div><button class="btn btn-outline btn-small" onclick="go('neurodetalle:${n.id}')">Ver información</button></article>`).join('')}</div>`;
}
const EMPTY_HTML = `<div class="assistant-empty"><strong>No encontramos una coincidencia exacta.</strong><p>Prueba con palabras como “sobrecarga”, “comunicación”, “autismo”, “TDAH” o “examen”. Tu consulta quedó registrada para que podamos agregar contenido sobre este tema.</p></div>`;

// Se conserva por compatibilidad: devuelve el HTML de la búsqueda local.
export function assistantSearch(q){
  const query=(q||'').trim();if(!query)return '';
  const found=assistantFind(query);
  return (!found.guides.length&&!found.neuros.length)?EMPTY_HTML:resultCards(found);
}

// ======================= CONTEXTO PARA LA IA =======================

const txt = (x) => Array.isArray(x) ? x.join('; ') : String(x || '');
const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

function guideContext(g){
  return cut(`GUÍA: ${g.title} (${g.category}; ${g.neuro})\nDescripción: ${g.desc}\nPasos recomendados: ${txt(g.steps)}\nQué evitar: ${txt(g.avoid)}`, 1800);
}
function neuroContext(n){
  return cut(`INFORMACIÓN: ${n.name}\n${n.description}\nCaracterísticas: ${txt(n.characteristics)}\nAprendizaje: ${txt(n.learning)}\nComunicación: ${txt(n.communication)}\nConsideraciones: ${txt(n.considerations)}`, 2200);
}
// Índice corto de todo el contenido: permite a la IA entender preguntas con otras palabras.
function indexContext(){
  const guias = getVisibleGuides().map(g => `- ${g.neuro}: ${g.title} — ${g.desc}`);
  const neuros = getNeuroData().map(n => `- ${n.name}`);
  return cut('ÍNDICE DE CONTENIDO DE LA PLATAFORMA\nGuías:\n' + guias.join('\n') + '\nInformación general sobre:\n' + neuros.join('\n'), 3800);
}
function buildContext(found){
  return [
    ...found.guides.slice(0, 3).map(guideContext),
    ...found.neuros.slice(0, 2).map(neuroContext),
    indexContext()
  ];
}

// ======================= CHAT =======================

// La conversación vive en memoria mientras la página esté abierta (no se guarda en el navegador).
const chat = { msgs: [], busy: false };
let chips = [];

function history(){
  // Mensajes anteriores a la pregunta actual (la última del arreglo).
  return chat.msgs.slice(0, -1)
    .filter(m => m.role === 'user' || (m.role === 'assistant' && m.ia))
    .slice(-6)
    .map(m => ({ rol: m.role, texto: m.text }));
}

async function askAI(message, found){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(API_BASE_URL + '/Chatbot/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ mensaje: message, tipo: state.user?.type || null, historial: history(), contexto: buildContext(found) })
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 429) return { limit: true, texto: data.respuesta || 'Hiciste muchas preguntas seguidas. Espera un momento e inténtalo de nuevo.' };
    if (!r.ok || data.isSuccess === false || !data.response?.texto) return null;
    return data.response;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Texto de la IA -> HTML seguro (se escapa primero; solo se permiten negritas, listas y párrafos).
function formatAI(text){
  let html = '', list = false;
  for (const raw of esc(text).split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) { if (!list) { html += '<ul>'; list = true; } html += `<li>${m[1]}</li>`; }
    else { if (list) { html += '</ul>'; list = false; } if (line) html += `<p>${line}</p>`; }
  }
  if (list) html += '</ul>';
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function messageHTML(m){
  if (m.role === 'user') return `<div class="chat-msg chat-user"><p>${esc(m.text)}</p></div>`;
  if (m.local) {
    const has = m.found && (m.found.guides.length || m.found.neuros.length);
    return `<div class="chat-msg chat-bot">${has ? '<p>El asistente con IA no está disponible en este momento. Esto es lo que encontré en las guías:</p>' + resultCards(m.found) : EMPTY_HTML}</div>`;
  }
  const has = m.found && (m.found.guides.length || m.found.neuros.length);
  return `<div class="chat-msg chat-bot">${formatAI(m.text)}${has ? resultCards(m.found) : ''}</div>`;
}

const WELCOME = `<div class="chat-msg chat-bot"><p>Hola, soy el asistente de Mentes Conectadas. Puedo ayudarte a encontrar información y guías sobre neurodivergencia en el entorno universitario.</p><p>Escribe tu duda o elige un tema.</p></div>`;

function logHTML(){
  return (chat.msgs.length ? '' : WELCOME) + chat.msgs.map(messageHTML).join('') +
    (chat.busy ? '<div class="chat-msg chat-bot chat-typing" aria-label="El asistente está escribiendo"><span></span><span></span><span></span></div>' : '');
}

function paint(){
  const log = document.getElementById('chat-log');
  if (!log) return; // el usuario cambió de pantalla
  log.innerHTML = logHTML();
  log.scrollTop = log.scrollHeight;
  const btn = document.getElementById('chat-send');
  if (btn) btn.disabled = chat.busy;
}

export async function runAssistant(quickText){
  const input = document.getElementById('assistant-query');
  const q = (typeof quickText === 'string' ? quickText : (input?.value || '')).trim();
  if (!q || chat.busy) return;
  if (input) input.value = '';

  chat.msgs.push({ role: 'user', text: q });
  chat.busy = true;
  paint();

  const found = assistantFind(q);
  const hits = found.guides.length + found.neuros.length;
  const ai = await askAI(q, found);

  if (ai && ai.limit) {
    chat.msgs.push({ role: 'assistant', ia: false, text: ai.texto });
  } else if (ai) {
    // Si la IA dice que no hay información, la consulta queda como "sin respuesta" para el panel del administrador.
    logAssistantQuery(q, normalizeText(q), ai.sinInfo ? 0 : Math.max(hits, 1));
    chat.msgs.push({ role: 'assistant', ia: true, text: ai.texto, found: ai.sinInfo ? null : found });
  } else {
    logAssistantQuery(q, normalizeText(q), hits);
    chat.msgs.push({ role: 'assistant', local: true, found });
  }

  chat.busy = false;
  paint();
}

function quickAsk(i){ runAssistant(chips[i]); }
function newChat(){ if (chat.busy) return; chat.msgs = []; paint(); }
Object.assign(window, { quickAsk, newChat });

export function assistantView(){
  const seen = new Set();
  chips = getVisibleGuides().filter(g => !seen.has(g.title) && seen.add(g.title)).slice(0, 4).map(g => `Cuéntame sobre: ${g.title}`);
  return `${header()}<main class="page"><div class="container"><section class="assistant-panel chatbot">
    <div class="content-head"><span class="pill-title">Asistente de consulta</span><p class="section-text">Escribe una duda o situación y el asistente responderá con la información de las guías de Mentes Conectadas.</p></div>
    <p class="chat-aviso">Asistente con inteligencia artificial: sus respuestas son orientativas y no sustituyen la atención de un profesional. Por favor, no escribas nombres ni datos personales.</p>
    <div id="chat-log" class="chat-log" aria-live="polite">${logHTML()}</div>
    <div class="chat-chips">${chips.map((c, i) => `<button class="btn btn-outline btn-small" onclick="quickAsk(${i})">${esc(c.replace('Cuéntame sobre: ', ''))}</button>`).join('')}<button class="btn btn-outline btn-small" onclick="newChat()">Nueva conversación</button></div>
    <div class="assistant-search"><input id="assistant-query" class="search-input" maxlength="500" placeholder="Ej. ¿Qué hago ante una sobrecarga?" onkeydown="if(event.key==='Enter')runAssistant()"><button id="chat-send" class="btn btn-primary" onclick="runAssistant()">Enviar</button></div>
  </section></div></main>${footer()}`;
}
