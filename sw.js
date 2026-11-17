// Offline support. The app's own files: network first (so updates show up), this cache when there's no signal.
// transformers.js + its wasm (versioned URLs on jsdelivr): cache first. The AI models cache themselves (transformers.js browser cache).
const CACHE = 'closet-v43', SHELL = ['./', 'index.html', 'styles.css', 'match.js', 'style.js', 'cutout.js', 'progress.js', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'version.txt', 'gaps-worker.js'];
const keep = (req, res) => { if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range')) return;
  // App files: always revalidate with the server (cache: 'no-cache'). Without it the browser's own cache could hand a new
  // index.html an old match.js, the app fails to start, and nothing shows. Offline: the copy cached here.
  if (u.origin === location.origin)
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => keep(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r ?? caches.match('index.html'))));
  else if (u.hostname === 'cdn.jsdelivr.net') // versioned libs: cache first, works offline
    e.respondWith(caches.match(req).then(r => r ?? fetch(req).then(res => keep(req, res))));
});
