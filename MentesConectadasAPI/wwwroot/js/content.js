// Acceso al contenido informativo
import { TEXTOS } from '../content/textos.js';
import { NEURODIVERGENCIAS } from '../content/neurodivergencias.js';
import { GUIAS } from './catalogo.js';
import { state } from './state.js';
import { TOPIC_AUDIENCE, USER_TYPES, isAdmin } from './config.js';

export function templateText(id, key) {
  return TEXTOS[id]?.[key] || '';
}

export function getNeuroData() {
  return NEURODIVERGENCIAS;
}


export const topicOf = (id) => String(id).replace(/^(autismo|tdah)-/, '');


function withDefaults(g) {
  return {
    ...g,
    audience: Array.isArray(g.audience) ? g.audience : (TOPIC_AUDIENCE[topicOf(g.id)] || [...USER_TYPES]),
    hidden: Boolean(g.hidden),
    questions: Array.isArray(g.questions) ? g.questions : [],
    steps: g.steps || [],
    avoid: g.avoid || [],
    neuroTags: g.neuroTags || [],
    situationTags: g.situationTags || []
  };
}


export function getGuideData() {
    return GUIAS.map(withDefaults);
}
export function getGuideById(id) {
  return getGuideData().find(g => g.id === id);
}
export function isOriginalGuide(id) {
  return GUIAS.some(g => g.id === id);
}
export function getOriginalGuides() {
  return GUIAS;
}


export function canAccessGuide(user, g) {
  if (!g) return false;
  if (isAdmin(user)) return true;
  if (g.hidden) return false;
  if (!user || !user.type) return true;
  return g.audience.includes(user.type);
}

export function getVisibleGuides(user = state.user) {
  return getGuideData().filter(g => canAccessGuide(user, g));
}

export function getVisibleEvaluations(user = state.user) {
  return getVisibleGuides(user).filter(g => g.questions.length > 0);
}
