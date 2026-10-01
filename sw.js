/* v07.1: piloto operativo, caché exclusiva de esta aplicación. */
var CACHE = 'sst-pana-ats-ate-v07-1-ats-obligatorio-2';
var ARCHIVOS = ['./', './index.html', './styles.css', './config.js', './logo.js', './logo_isotipo.png', './logo_isotipo_blanco.png', './ui.js', './modelo.js', './datos.js', './pdf.js', './app.js', './jspdf.umd.min.js', './icono-192.png', './icono-512.png', './manifest.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return (k === 'sst-pana-v04' || k.indexOf('sst-pana-ats-ate-') === 0) && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url), scope = new URL(self.registration.scope);
  if (e.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    // Los archivos de la versión se actualizan juntos al cambiar CACHE.
    return c.match(e.request, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).catch(function () {
        if (e.request.mode === 'navigate') return c.match('./index.html');
        return Response.error();
      });
    });
  }));
});
