// Favoritos ("Mis guías")
import { state, save } from './state.js';
import { showToast } from './ui.js';
import { refreshView } from './navigation.js';
import { apiGuardarFavorito } from './api.js';

export function isFavorite(guideId) {
  return state.favorites.includes(guideId);
}
export function toggleFavorite(id){let activo;if(state.favorites.includes(id)){state.favorites=state.favorites.filter(x=>x!==id);activo=false;showToast('Guía quitada de Mis guías');}else{state.favorites.push(id);activo=true;showToast('Guía guardada en Mis guías');}save();if(state.user)apiGuardarFavorito(state.user.email,id,activo);if(['guias','favoritas','perfil'].includes(state.route))refreshView();}
