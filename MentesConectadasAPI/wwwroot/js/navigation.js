// Navegación
import { state } from './state.js';
import { ASSISTANT_ENABLED, isAdmin, SHOW_ADMIN_STATS } from './config.js';
import { themeButton } from './theme.js';


let renderer = () => {};
export function setRenderer(fn) { renderer = fn; }
export function refreshView() { renderer(); }

export function go(route){state.route=route;location.hash=route;window.scrollTo({top:0,behavior:'instant'});renderer();}

const AUTH_NAV = [
  
  ['dashboard', 'INICIO', 'Inicio'],
  ['neurodivergencias', 'NEURODIVERGENCIA', 'Conoce la neurodivergencia'],
  ['guias', 'GUÍAS PRÁCTICAS', 'Guías prácticas'],
  ['evaluacion', 'AUTOEVALUACIÓN', 'Autoevaluación'],
  ['favoritas', 'MIS GUÍAS', 'Mis guías'],
  ['sobre-nosotros', 'SOBRE NOSOTROS', 'Sobre nosotros'],
  ...(ASSISTANT_ENABLED ? [['asistente', 'ASISTENTE', 'Asistente de consulta']] : []),
  ['perfil', 'MI PERFIL', 'Mi perfil']
];

const ADMIN_NAV = [
  ['admin', 'INICIO', 'Inicio'],
  ['admin-guias', 'GUÍAS', 'Guías'],
  ['admin-evaluaciones', 'AUTOEVALUACIONES', 'Autoevaluaciones'],
  ['admin-comentarios', 'COMENTARIOS', 'Comentarios'],
  ...(SHOW_ADMIN_STATS ? [['admin-estadisticas', 'ESTADÍSTICAS', 'Estadísticas']] : []),
  ['admin-donaciones', 'DONACIONES', 'Donaciones'],
  ['perfil', 'MI PERFIL', 'Mi perfil']
];
const navButtons = (index) => (isAdmin(state.user) ? ADMIN_NAV : AUTH_NAV).map(item => `<button onclick="go('${item[0]}')">${item[index]}</button>`).join('');

export function header(auth=true){const admin=auth&&isAdmin(state.user);const home=admin?'admin':(auth?'dashboard':'inicio');return `<header class="header"><div class="container nav">
  <button class="brand btn-ghost" onclick="go('${home}')"><img src="assets/img/logo.png" alt="Logo de Mentes Conectadas"><span>Mentes Conectadas</span></button>
  <nav class="nav-links">${auth?navButtons(1):`<button onclick="go('inicio')">INICIO</button><button onclick="go('neuropublico')">INFORMACIÓN</button><button onclick="go('sobre-nosotros')">SOBRE NOSOTROS</button>`}</nav>
  <div class="nav-actions">${themeButton('icon-btn')}</div>
  <button class="menu-btn" onclick="document.querySelector('.mobile-nav').classList.toggle('open')" aria-label="Abrir menú">☰</button></div>
  <div class="container mobile-nav">${auth?navButtons(2):`<button onclick="go('inicio')">Inicio</button><button onclick="go('neuropublico')">Información</button><button onclick="go('sobre-nosotros')">Sobre nosotros</button><button onclick="go('login')">Iniciar sesión</button><button onclick="go('registro')">Crear cuenta</button>`}${themeButton('mobile-theme-btn',true)}</div></header>`;}
