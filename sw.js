// Offline support. The app's own files: network first (so updates show up), this cache when there's no signal.
// transformers.js + its wasm (versioned URLs on jsdelivr): cache first. The AI models cache themselves (transformers.js browser cache).
const CACHE = 'closet-v9', SHELL = ['./', 'index.html', 'match.js', 'style.js', 'cutout.js', 'progress.js', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'version.txt'];
const keep = (req, res) => { if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range')) return;
  if (u.origin === location.origin)
    e.respondWith(fetch(req).then(r => keep(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r ?? caches.match('index.html'))));
  else if (u.hostname === 'cdn.jsdelivr.net' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'fonts.googleapis.com') // versioned libs + the Anton font: cache first, works offline
    e.respondWith(caches.match(req).then(r => r ?? fetch(req).then(res => keep(req, res))));
});
