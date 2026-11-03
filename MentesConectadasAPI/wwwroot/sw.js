const CACHE = 'mentes-conectadas-api-v3';
const CORE = ['./', './index.html', './login.html', './registro.html', './inicio.html', './informacion.html', './sobre-nosotros.html', './neurodivergencias.html', './guias.html', './perfil.html', './css/styles.css', './js/config.js', './js/auth.js', './js/comun.js', './js/guias-lib.js', './js/login.js', './js/registro.js', './js/inicio.js', './js/informacion.js', './js/sobre-nosotros.js', './js/dashboard.js', './js/neurodivergencias.js', './js/guias.js', './js/perfil.js', './contenido.html', './contenido-data.js', './manifest.json', './assets/logo.png', './assets/icon-192.png', './assets/icon-512.png'];

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
    //if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
    if (new URL(e.request.url).pathname.startsWith('/api/')) return; // la API nunca se cachea
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});