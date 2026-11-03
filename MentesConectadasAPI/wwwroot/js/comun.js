// ===== Código compartido por todas las páginas =====
const app = document.getElementById('app');
const toast = document.getElementById('toast');
let contentDoc = null;
const ASSISTANT_ENABLED = false; // Asistente desactivado para esta versión.
const EVALUATION_ENABLED = false; // Autoevaluaciones desactivadas para esta versión.
const state = {
  user: obtenerUsuario(),
  favorites: JSON.parse(localStorage.getItem('mc_favorites') || '[]'),
  evaluations: JSON.parse(localStorage.getItem('mc_evaluations') || '[]'),
  ratings: JSON.parse(localStorage.getItem('mc_ratings') || '{}'),
  route: 'inicio',
  selectedNeuro: null,
  selectedGuide: null,
  evalIndex: 0,
  evalAnswers: [],
  evalGuideId: null,
  evalScore: 0
};
function save(){
  if(state.user)sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.user));else sessionStorage.removeItem(SESSION_KEY);
  localStorage.setItem('mc_favorites', JSON.stringify(state.favorites));
  localStorage.setItem('mc_evaluations', JSON.stringify(state.evaluations));
  localStorage.setItem('mc_ratings', JSON.stringify(state.ratings));
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),2400);}
const RUTAS = {
  inicio:'inicio.html', neuropublico:'informacion.html', 'sobre-nosotros':'sobre-nosotros.html',
  login:'login.html', registro:'registro.html', dashboard:'index.html',
  neurodivergencias:'neurodivergencias.html', guias:'guias.html', favoritas:'guias.html?vista=favoritas',
  perfil:'perfil.html', editar:'perfil.html?editar=1', asistente:'asistente-consulta/index.html'
};
function go(route){
  if(route.startsWith('neurodetalle:')){location.href='neurodivergencias.html?id='+encodeURIComponent(route.split(':')[1]);return;}
  location.href=RUTAS[route]||'index.html';
}
const CONTENT_FALLBACK={
  'landing-content':{
    eyebrow:'INFORMACIÓN · ORIENTACIÓN · CONVIVENCIA',
    title:'Mentes<br>Conectadas.',
    description:'Una plataforma de consulta para comprender la neurodivergencia y favorecer una convivencia universitaria más clara, respetuosa e inclusiva.',
    'intro-title':'Conocer para acompañar mejor.',
    'intro-text':'Mentes Conectadas reúne información y guías prácticas para que docentes, estudiantes y personal académico cuenten con recursos claros ante situaciones del entorno universitario.'
  },
  'public-content':{
    title:'Conoce la plataforma',
    description:'Encuentra información sobre neurodivergencia, situaciones frecuentes del entorno universitario y guías prácticas relacionadas con cada situación.',
    notice:'Mentes Conectadas es una herramienta educativa de consulta. No sustituye una evaluación, diagnóstico ni atención profesional.'
  },
  'dashboard-content':{
    title:'¿Qué encontrarás?',
    description:'Consulta información y guías para comprender mejor distintas situaciones que pueden presentarse en el entorno universitario.',
    'evaluation-title':'Evalúa tus conocimientos',
    'evaluation-description':'Responde preguntas breves relacionadas con una guía y revisa qué puntos puedes reforzar.'
  }
};
function templateText(id,key){const template=contentDoc?.querySelector(`template#${id}`);const node=template?.content?.querySelector(`[data-key="${key}"]`)||contentDoc?.querySelector(`#${id} [data-key="${key}"]`);if(node)return node.innerHTML.trim();return CONTENT_FALLBACK[id]?.[key]||'';}
function field(el,key){const n=el.querySelector(`[data-field="${key}"]`);return n?n.innerHTML.trim():'';}
function paragraphs(el,key){return [...el.querySelectorAll(`[data-field="${key}"] > p`)].map(x=>x.innerHTML.trim());}
function getNeuroData(){return [...(contentDoc?.querySelectorAll('.neuro-data')||[])].map(el=>({id:el.dataset.id,name:field(el,'name'),emoji:field(el,'emoji'),image:field(el,'image'),description:field(el,'description'),characteristics:paragraphs(el,'characteristics'),learning:field(el,'learning'),communication:field(el,'communication'),considerations:field(el,'considerations'),myths:field(el,'myths'),suggestions:paragraphs(el,'suggestions'),extraImage1:field(el,'extra-image-1'),extraImage2:field(el,'extra-image-2'),extraTitle1:field(el,'extra-title-1'),extraTitle2:field(el,'extra-title-2'),extraText1:field(el,'extra-text-1'),extraText2:field(el,'extra-text-2')}));}
function getGuideData(){return [...(contentDoc?.querySelectorAll('.guide-data')||[])].map(el=>({id:el.dataset.id,title:field(el,'title'),category:field(el,'category'),emoji:field(el,'emoji'),desc:field(el,'description'),neuro:field(el,'neuro'),neuroTags:(el.dataset.neurodivergencias||'').split(',').map(x=>x.trim()).filter(Boolean),situationTags:(el.dataset.situaciones||'').split(',').map(x=>x.trim()).filter(Boolean),steps:paragraphs(el,'steps'),avoid:paragraphs(el,'avoid'),questions:[...el.querySelectorAll('[data-field="questions"] > li')].map(q=>({text:q.querySelector('span')?.innerHTML.trim()||'',correct:q.dataset.correct,options:[...q.querySelectorAll('[data-option]')].map(o=>({key:o.dataset.option,text:o.innerHTML.trim()}))}))}));}
function header(auth=true){return `<header class="header"><div class="container nav">
  <button class="brand btn-ghost" onclick="go('${auth?'dashboard':'inicio'}')"><img src="assets/logo.png" alt="Logo de Mentes Conectadas"><span>Mentes Conectadas</span></button>
  <nav class="nav-links">${auth?`<button onclick="go('dashboard')">INICIO</button><button onclick="go('neurodivergencias')">NEURODIVERGENCIA</button><button onclick="go('guias')">GUÍAS PRÁCTICAS</button>${EVALUATION_ENABLED?`<button onclick="go('evaluacion')">AUTOEVALUACIONES</button>`:''}<button onclick="go('favoritas')">MIS GUÍAS</button><button onclick="go('sobre-nosotros')">SOBRE NOSOTROS</button>${ASSISTANT_ENABLED?`<button onclick="go('asistente')">ASISTENTE</button>`:''}<button onclick="go('perfil')">MI PERFIL</button>`:`<button onclick="go('inicio')">INICIO</button><button onclick="go('neuropublico')">INFORMACIÓN</button><button onclick="go('sobre-nosotros')">SOBRE NOSOTROS</button>`}</nav>
  <div class="nav-actions"><button class="icon-btn" onclick="go('guias')" aria-label="Buscar">⌕</button></div>
  <button class="menu-btn" onclick="document.querySelector('.mobile-nav').classList.toggle('open')">☰</button></div>
  <div class="container mobile-nav">${auth?`<button onclick="go('dashboard')">Inicio</button><button onclick="go('neurodivergencias')">Conoce la neurodivergencia</button><button onclick="go('guias')">Guías prácticas</button>${EVALUATION_ENABLED?`<button onclick="go('evaluacion')">Autoevaluaciones</button>`:''}<button onclick="go('favoritas')">Mis guías</button><button onclick="go('sobre-nosotros')">Sobre nosotros</button>${ASSISTANT_ENABLED?`<button onclick="go('asistente')">Asistente de consulta</button>`:''}<button onclick="go('perfil')">Mi perfil</button>`:`<button onclick="go('inicio')">Inicio</button><button onclick="go('neuropublico')">Información</button><button onclick="go('sobre-nosotros')">Sobre nosotros</button><button onclick="go('login')">Iniciar sesión</button><button onclick="go('registro')">Crear cuenta</button>`}</div></header>`;}
function disclaimer(){return `<aside class="disclaimer-note" role="note"><strong>Aviso importante</strong><p>La información y las guías de Mentes Conectadas son de carácter orientativo y educativo; no sustituyen un diagnóstico ni la valoración o atención de un profesional especializado. Las recomendaciones propuestas no se aplican a todas las personas ni a todas las situaciones, ya que cada experiencia y necesidad es diferente.</p></aside>`;}
function guideWarning(){return `<aside class="guide-warning" role="note"><strong>Ten en cuenta</strong><p>Estas guías no se aplican a todas las situaciones. Cada persona neurodivergente puede reaccionar de manera diferente; adapta las recomendaciones al contexto y respeta las preferencias de cada persona.</p></aside>`;}
function footer(showDisclaimer=true){return `<footer class="footer"><div class="container"><strong>Mentes Conectadas</strong><br><small>Información y guías prácticas para el entorno universitario.</small>${showDisclaimer?disclaimer():''}<hr style="border:0;border-top:1px solid rgba(255,255,255,.12);margin:18px 0"><small>Universidad Tecnológica de Tula-Tepeji · Herramienta educativa de consulta</small></div></footer>`;}
function closeModal(){document.getElementById('modal')?.remove();}
function confirmModal(title,message,buttons){const el=document.createElement('div');el.className='modal-backdrop';el.id='modal';el.innerHTML=`<section class="modal center"><div style="font-size:60px">✓</div><h2>${title}</h2><p style="color:var(--muted)">${message}</p><div class="modal-actions">${buttons}</div></section>`;document.body.appendChild(el);}
async function loadContent(){try{const r=await fetch('contenido.html');if(!r.ok)throw new Error('No se pudo cargar contenido.html');const html=await r.text();const parser=new DOMParser();contentDoc=parser.parseFromString(html,'text/html');}catch(e){const parser=new DOMParser();const html=window.MC_CONTENT_HTML||'';contentDoc=parser.parseFromString(html,'text/html');}}

let PAGE_VIEW = null;
async function render(){ if(!contentDoc) await loadContent(); app.innerHTML = PAGE_VIEW(); }
// Arranca una página: opcionalmente la protege con sesión y dibuja su vista.
function iniciarPagina(vista,{protegida=false,ruta='inicio'}={}){
  if(protegida && !protegerPagina()) return;
  state.route=ruta; PAGE_VIEW=vista; loadContent().then(render);
}

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
