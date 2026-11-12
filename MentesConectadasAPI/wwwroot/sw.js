// Service Worker de Mentes Conectadas.
// Estrategia: red primero y, si no hay conexión, respuesta desde la caché.
const CACHE = 'mentes-conectadas-v23';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/admin.js',
  './js/admin-extra.js',
  './js/admin-db.js',
  './js/charts.js',
  './js/api.js',
  './js/app.js',
  './js/assistant.js',
  './js/auth.js',
  './js/config.js',
  './js/donations.js',
  './js/content.js',
  './js/evaluations.js',
  './js/favorites.js',
  './js/guides.js',
  './js/navigation.js',
  './js/neuro.js',
  './js/pages.js',
  './js/profile.js',
  './js/router.js',
  './js/state.js',
  './js/theme.js',
  './js/ui.js',
  './js/videos.js',
    './js/catalogo.js',
  './content/neurodivergencias.js',
  './content/textos.js',
  './assets/img/FondoLogin.jpg',
  './assets/img/DISCALCULIAimg1.jpeg',
  './assets/img/DISCALCULIAimg2.jpeg',
  './assets/img/DISCALCULIAportada.jpeg',
  './assets/img/autismo.jpg',
  './assets/img/autismo2.jpg',
  './assets/img/autismoPortada.jpg',
  './assets/img/dislexia.png',
  './assets/img/dislexia2.png',
  './assets/img/dislexia3.jpg',
  './assets/img/dislexiaPortada.jpg',
  './assets/img/dispraxiaimg.jpg',
  './assets/img/dispraxiaimg2.jpg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/logo.png',
  './assets/img/neuro-autismo.svg',
  './assets/img/neuro-discalculia.svg',
  './assets/img/neuro-dislexia.svg',
  './assets/img/neuro-dispraxia.svg',
  './assets/img/neuro-tdah.svg',
  './assets/img/portada_dispraxia.jpg',
  './assets/img/tdahima1.jpg',
  './assets/img/tdahimg2.jpg',
  './assets/img/tdahportada.jpeg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (/^\/(api|swagger)(\/|$)/i.test(new URL(e.request.url).pathname)) return;
  if (e.request.headers.has('range') || e.request.destination === 'video' || /\.mp4($|\?)/.test(e.request.url)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});
