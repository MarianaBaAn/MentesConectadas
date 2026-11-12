
import { esc } from './ui.js';

export function guideArt(g) {
  // Video > imagen > nada. Si el archivo no carga, el recuadro se quita.
  if (g.video) return `<div class="guide-art guide-art-video"><video controls playsinline preload="none" data-src="${esc(g.video)}" aria-label="Video de la guía: ${esc(g.title)}"></video></div>`;
  if (g.image) return `<div class="guide-art guide-art-image"><img src="${esc(g.image)}" alt="" loading="lazy" onerror="this.parentNode.remove()"></div>`;
  return '';
}

function loadVideo(video) {
  if (video.dataset.loaded) return;
  video.dataset.loaded = '1';
  video.preload = 'metadata';
  video.src = video.dataset.src + '#t=0.1'; 
}

const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { loadVideo(entry.target); observer.unobserve(entry.target); }
      });
    }, { rootMargin: '200px' })
  : null;

function watchVideos() {
  document.querySelectorAll('video[data-src]:not([data-loaded])').forEach(v => (observer ? observer.observe(v) : loadVideo(v)));
}

function hideBrokenVideo(video) {
  const box = video.closest('.guide-art-video');
  if (box) box.remove();
}

export function initLazyVideos() {
  watchVideos();
  
  new MutationObserver(watchVideos).observe(document.getElementById('app'), { childList: true, subtree: true });
  
  document.addEventListener('error', e => { if (e.target instanceof HTMLVideoElement) hideBrokenVideo(e.target); }, true);
  document.addEventListener('play', e => {
    if (!(e.target instanceof HTMLVideoElement)) return;
    document.querySelectorAll('video').forEach(v => { if (v !== e.target) v.pause(); });
  }, true);
}
