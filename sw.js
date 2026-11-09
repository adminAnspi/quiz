/* Service worker del Quiz ANSPI: tiene in memoria la "scocca" dell'app cosi' si apre subito.
   Strategia: prima la rete (cosi' gli aggiornamenti di index.html arrivano da soli),
   se non c'e' connessione usa la copia salvata. Le richieste verso Apps Script non vengono toccate. */
const CACHE = 'quiz-anspi-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  // ogni file viene salvato per conto suo: se uno manca l'installazione NON si blocca
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return Promise.all(SHELL.map(function (f) { return c.add(f).catch(function () {}); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return r;
      })
      .catch(function () {
        return caches.match(e.request).then(function (m) { return m || caches.match('index.html'); });
      })
  );
});
