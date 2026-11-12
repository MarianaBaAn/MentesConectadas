// Autenticación 
import { state, save, getRegisteredUser, saveRegisteredUser, loadFavoritesForCurrentUser, logUser } from './state.js';
import { USER_TYPES, normalizeUserType, ADMIN_EMAIL, ADMIN_TYPE, TOPIC_AUDIENCE, TOPIC_LABELS } from './config.js';
import { showToast, confirmModal, footer } from './ui.js';
import { header, go } from './navigation.js';
import { apiLoginAdmin, apiGuardarUsuario } from './api.js';

export function login(){return `${header(false)}<main class="auth-page login-fondo"><section class="auth-card"><h1>Iniciar sesión</h1><p>Ingresa a tu cuenta para consultar y guardar guías prácticas.</p><form class="form" onsubmit="event.preventDefault();doLogin()"><div class="field"><label>Correo electrónico</label><input id="login-email" type="email" required placeholder="Correo electrónico"></div><div class="field"><label>Contraseña</label><input id="login-pass" type="password" required placeholder="Contraseña"></div><button class="btn btn-blue" type="submit">INICIAR SESIÓN</button></form><div class="auth-footer">¿No tienes una cuenta? <button onclick="go('registro')">REGÍSTRATE</button></div></section></main>${footer()}`;}
export function registro(){return `${header(false)}<main class="auth-page"><section class="auth-card"><h1>Crear una cuenta</h1><p>Regístrate para consultar información y guardar guías prácticas.</p><form class="form" onsubmit="event.preventDefault();doRegister()"><div class="field"><label>Nombre completo</label><input id="reg-name" required placeholder="Nombre completo"></div><div class="field"><label>Correo electrónico</label><input id="reg-email" type="email" required placeholder="Correo electrónico"></div><div class="field"><label>Contraseña</label><input id="reg-pass" type="password" minlength="6" required placeholder="Contraseña"></div><div class="field"><label>Confirmar contraseña</label><input id="reg-pass2" type="password" minlength="6" required placeholder="Confirmar contraseña"></div><div class="field"><label>Tipo de usuario</label><select id="reg-type" required onchange="showTypeHint(this.value)"><option value="">Selecciona una opción</option>${USER_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}</select><div id="reg-type-hint" class="type-hint" hidden></div></div><button class="btn btn-blue" type="submit">CREAR CUENTA</button></form><div class="auth-footer">¿Ya tienes una cuenta? <button onclick="go('login')">INICIAR SESIÓN</button></div></section></main>${footer()}`;}
export async function doLogin(){const email=document.getElementById('login-email').value.trim();const pass=document.getElementById('login-pass').value;
  // Administrador
  if(email.toLowerCase()===ADMIN_EMAIL.toLowerCase()){
    try{const admin=await apiLoginAdmin(email,pass);state.user={name:admin.nombre,email:admin.correo,type:ADMIN_TYPE,token:admin.token};loadFavoritesForCurrentUser();save();showToast('Sesión de administrador iniciada');setTimeout(()=>go('admin'),350);}
    catch(error){showToast(error.message);}
    return;}
  // Estudiante / Docente
  const saved=getRegisteredUser();if(saved&&saved.email===email&&saved.pass===pass)state.user={name:saved.name,email,type:normalizeUserType(saved.type)};else state.user={name:email.split('@')[0],email,type:'Estudiante'};loadFavoritesForCurrentUser();logUser(state.user);apiGuardarUsuario(state.user);save();showToast('Sesión iniciada');setTimeout(()=>go('dashboard'),350);}
export function doRegister(){const name=document.getElementById('reg-name').value.trim(),email=document.getElementById('reg-email').value.trim(),pass=document.getElementById('reg-pass').value,pass2=document.getElementById('reg-pass2').value,type=document.getElementById('reg-type').value;if(email.toLowerCase()===ADMIN_EMAIL.toLowerCase()){showToast('Ese correo no está disponible');return;}if(pass!==pass2){showToast('Las contraseñas no coinciden');return;}if(!USER_TYPES.includes(type)){showToast('Selecciona un tipo de usuario válido');return;}saveRegisteredUser({name,email,pass,type});state.user={name,email,type};loadFavoritesForCurrentUser();logUser(state.user);apiGuardarUsuario(state.user);save();confirmModal('Cuenta creada','Tu cuenta de demostración fue creada correctamente.',`<button class="btn btn-green" onclick="closeModal();go('dashboard')">Continuar</button>`);}
export function logout(){state.user=null;loadFavoritesForCurrentUser();save();showToast('Sesión cerrada');setTimeout(()=>go('inicio'),300);}

// Aviso del registro
export function showTypeHint(type){
  const box=document.getElementById('reg-type-hint');if(!box)return;
  if(!USER_TYPES.includes(type)){box.hidden=true;box.innerHTML='';return;}
  const topics=Object.keys(TOPIC_AUDIENCE).filter(k=>TOPIC_AUDIENCE[k].includes(type)).map(k=>TOPIC_LABELS[k]);
  box.hidden=false;
  box.innerHTML=`<strong>Como ${type} tendrás:</strong><ul><li>Toda la información sobre neurodivergencia.</li><li>Guías prácticas y autoevaluaciones de Autismo y TDAH sobre: ${topics.join(', ')}.</li></ul>`;
}
