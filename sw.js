/* Service worker v04: guarda la app para abrirla sin señal.
   Primero la red (para recibir actualizaciones) y, si falla, la copia guardada. */
var CACHE = 'sst-pana-v04';
var ARCHIVOS = ['./', './index.html', './styles.css', './config.js', './logo.js', './logo_isotipo.png', './logo_isotipo_blanco.png', './ui.js', './modelo.js', './datos.js',
  './pdf.js', './app.js', './jspdf.umd.min.js', './icono-192.png', './icono-512.png', './manifest.webmanifest'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== CACHE; }).map(function (x) { return caches.delete(x); })); })
    .then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); }); }));
});
