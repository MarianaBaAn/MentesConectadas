// Punto de entrada

import { state } from './state.js';
import { cargarCatalogo } from './catalogo.js';
import { go } from './navigation.js';
import { render } from './router.js';
import { closeModal } from './ui.js';
import { doLogin, doRegister, logout, showTypeHint } from './auth.js';
import { saveProfile } from './profile.js';
import { filterNeuro } from './neuro.js';
import { applyGuideFilters, clearGuideFilters, openGuide, setGuideRating } from './guides.js';
import { toggleFavorite } from './favorites.js';
import { startEvaluation, cancelEvaluation, selectAnswer, nextQuestion, previousQuestion, finishEvaluation } from './evaluations.js';
import { runAssistant } from './assistant.js';
import { selectDonationAmount, startDonation, setCustomDonation, blockNonDigits, pasteDigits } from './donations.js';
import { initTheme, toggleTheme } from './theme.js';
import { postComment, deleteMyComment } from './guides.js';
import { adminSetCommentsGuide, adminToggleComment, adminAskDeleteComment, adminDeleteComment, adminToggleDonation, adminAskDeleteDonation, adminDeleteDonation, adminExportDonations } from './admin-extra.js';
import { adminFilterRows, adminToggleHidden, adminEditGuide, adminAskDeleteGuide, adminDeleteGuide, adminAskRestore, adminRestore, adminSaveGuide, adminAskDeleteEvaluation, adminDeleteEvaluation, adminOpenQuestion, adminSaveQuestion, adminAskDeleteQuestion, adminDeleteQuestion, adminSetStats, adminExportCsv, adminOpenEvalSetup, adminSaveEvalSetup } from './admin.js';
import { initLazyVideos } from './videos.js';
import { adminReintentar } from './admin-db.js';

Object.assign(window, {
  go, closeModal, doLogin, doRegister, logout, saveProfile, filterNeuro,
  applyGuideFilters, clearGuideFilters, openGuide, setGuideRating, toggleFavorite,
  startEvaluation, cancelEvaluation, selectAnswer, nextQuestion, previousQuestion, finishEvaluation,
  runAssistant, selectDonationAmount, startDonation, setCustomDonation, blockNonDigits, pasteDigits,
  showTypeHint, toggleTheme,
    adminFilterRows, adminToggleHidden, adminEditGuide, adminAskDeleteGuide, adminDeleteGuide, adminAskRestore, adminRestore, adminSaveGuide,
  adminAskDeleteEvaluation, adminDeleteEvaluation, adminOpenQuestion, adminSaveQuestion, adminAskDeleteQuestion, adminDeleteQuestion,
  adminSetStats, adminExportCsv, adminOpenEvalSetup, adminSaveEvalSetup,
  postComment, deleteMyComment,
  adminSetCommentsGuide, adminToggleComment, adminAskDeleteComment, adminDeleteComment,
  adminToggleDonation, adminAskDeleteDonation, adminDeleteDonation, adminExportDonations,
  adminReintentar
});


window.addEventListener('hashchange', () => {
  const route = location.hash.replace('#', '') || 'inicio';
  if (route !== state.route) { state.route = route; render(); }
});

initTheme();
try { await cargarCatalogo(); } catch (e) { }
render();
initLazyVideos();

function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
if (document.readyState === 'complete') registerServiceWorker();
else window.addEventListener('load', registerServiceWorker);
