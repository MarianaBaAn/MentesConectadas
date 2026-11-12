
import { STORAGE_KEYS as K, normalizeUserType } from './config.js';
import { apiGuardarVista, apiGuardarDonacion, apiGuardarComentario } from './api.js';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback; 
  }
}

const storedUser = read(K.user, null);
const favoritesByUser = read(K.favoritesByUser, {});
const legacyFavorites = read(K.favorites, []); 


function favoritesFor(user) {
  if (!user) return [];
  if (Array.isArray(favoritesByUser[user.email])) return favoritesByUser[user.email];
  return Object.keys(favoritesByUser).length === 0 && Array.isArray(legacyFavorites) ? [...legacyFavorites] : [];
}

export const state = {
  user: storedUser ? { ...storedUser, type: normalizeUserType(storedUser.type) } : null,
  favorites: favoritesFor(storedUser),
  evaluations: read(K.evaluations, []),
  ratings: read(K.ratings, {}),
  views: read(K.views, {}),
  userLog: read(K.userLog, {}),
  guideOverrides: read(K.guideOverrides, {}),
  guideDeleted: read(K.guideDeleted, []),
  comments: read(K.comments, []),
  donations: read(K.donations, []),
  assistantLog: read(K.assistantLog, []),
  route: location.hash.replace('#', '') || 'inicio',
  selectedNeuro: null,
  selectedGuide: null,
  evalIndex: 0,
  evalAnswers: [],
  evalGuideId: null,
  evalScore: 0
};

export function save() {
  localStorage.setItem(K.user, JSON.stringify(state.user));
  if (state.user) favoritesByUser[state.user.email] = state.favorites;
  localStorage.setItem(K.favoritesByUser, JSON.stringify(favoritesByUser));
  localStorage.setItem(K.favorites, JSON.stringify(state.favorites));
  localStorage.setItem(K.evaluations, JSON.stringify(state.evaluations));
  localStorage.setItem(K.ratings, JSON.stringify(state.ratings));
  localStorage.setItem(K.views, JSON.stringify(state.views));
  localStorage.setItem(K.userLog, JSON.stringify(state.userLog));
  localStorage.setItem(K.guideOverrides, JSON.stringify(state.guideOverrides));
  localStorage.setItem(K.guideDeleted, JSON.stringify(state.guideDeleted));
  localStorage.setItem(K.comments, JSON.stringify(state.comments));
  localStorage.setItem(K.donations, JSON.stringify(state.donations));
  localStorage.setItem(K.assistantLog, JSON.stringify(state.assistantLog));
}


export function loadFavoritesForCurrentUser() {
  state.favorites = favoritesFor(state.user);
}


export function getAllFavorites() {
  if (state.user) favoritesByUser[state.user.email] = state.favorites;
  return favoritesByUser;
}


export function logUser(user) {
  if (!user || !user.email) return;
  const prev = state.userLog[user.email];
  state.userLog[user.email] = { name: user.name, type: user.type, first: prev?.first || new Date().toISOString(), last: new Date().toISOString() };
}


export function recordView(guideId) {
  if (!state.user) return;
  if (!Array.isArray(state.views[guideId])) state.views[guideId] = [];
  state.views[guideId].push({ user: state.user.email, date: new Date().toISOString() });
  save();
  apiGuardarVista(state.user.email, guideId); 
}


export function getSavedTheme() {
  return read(K.theme, 'dark') === 'light' ? 'light' : 'dark';
}
export function saveTheme(theme) {
  try { localStorage.setItem(K.theme, JSON.stringify(theme)); } catch (e) { /* sin almacenamiento: se ignora */ }
}


export function getRegisteredUser() {
  return read(K.registeredUser, null);
}
export function saveRegisteredUser(user) {
  localStorage.setItem(K.registeredUser, JSON.stringify(user));
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);


export function logDonation(amount, custom) {
  state.donations.push({ id: newId(), amount, custom: Boolean(custom), user: state.user?.email || '', name: state.user?.name || '', date: new Date().toISOString(), status: 'intencion' });
  save();
  apiGuardarDonacion(state.user?.email, amount, custom); 
}


export function logAssistantQuery(q, norm, hits) {
  state.assistantLog.push({ id: newId(), q: q.slice(0, 120), norm, hits, user: state.user?.email || '', date: new Date().toISOString() });
  if (state.assistantLog.length > 2000) state.assistantLog = state.assistantLog.slice(-2000);
  save();
}


export function addComment(guideId, text) {
  const id = newId();
  state.comments.push({ id, guideId, user: state.user.email, name: String(state.user.name || '').split(' ')[0] || 'Usuario', type: state.user.type || '', text, date: new Date().toISOString(), hidden: false });
  save();
  apiGuardarComentario(state.user.email, guideId, text, id); 
}
