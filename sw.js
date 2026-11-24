// Service worker: lets the game run without internet after the first visit.
// Bump VERSION whenever index.html, app.js or the asset list changes, so old copies are removed.
var VERSION = 'v9';
var CACHE = 'fakkir-wastamti-' + VERSION;
var PAGE = './';
var FILES = [
  PAGE,
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './dev-logo.png',
  './dev-logo-white.png',
  './assets/cat-an-896a1c24.mp3',
  './assets/cat-fd-25448982.mp3',
  './assets/cat-na-85c5485c.mp3',
  './assets/cat-ob-420f9c4f.mp3',
  './assets/cat-pl-4bd06255.mp3',
  './assets/cat-ve-95abdd2c.mp3',
  './assets/or-4c49b1bd.mp3',
  './assets/intro-puzzle-9dc9ab63.mp3',
  './assets/intro-shapes-69217849.mp3',
  './assets/intro-sort-1c648d11.mp3',
  './assets/logo-99a0d23e.webp',
  './assets/name-01-fb76c207.mp3',
  './assets/name-02-874348ca.mp3',
  './assets/name-03-093edb70.mp3',
  './assets/name-04-35ef5e66.mp3',
  './assets/name-05-e9a94c34.mp3',
  './assets/name-06-44058add.mp3',
  './assets/name-07-3e6bbb0e.mp3',
  './assets/name-08-36e67a40.mp3',
  './assets/name-09-214a0b38.mp3',
  './assets/name-10-b84133c5.mp3',
  './assets/name-11-cb769ef9.mp3',
  './assets/pic-01-3dc7d8df.webp',
  './assets/pic-02-ef5b338f.webp',
  './assets/pic-03-110b93b4.webp',
  './assets/pic-04-cdba5af5.webp',
  './assets/pic-05-1d057a34.webp',
  './assets/pic-06-9fd48f06.webp',
  './assets/pic-07-57982387.webp',
  './assets/pic-08-49d62e1b.webp',
  './assets/pic-09-30db606a.webp',
  './assets/pic-10-c57aa3a7.webp',
  './assets/pic-11-ae546d01.webp',
  './assets/pic-12-dd59f608.webp',
  './assets/pic-13-f8178121.webp',
  './assets/pic-14-0a1ed925.webp',
  './assets/pic-15-eee56e46.webp',
  './assets/pic-16-47bf46d8.webp',
  './assets/pic-17-4416aae3.webp',
  './assets/pic-18-5ba1898b.webp',
  './assets/pic-19-17e250a6.webp',
  './assets/pic-20-d2aedd50.webp',
  './assets/pic-21-3ddd8cba.webp',
  './assets/pic-22-143ad0ec.webp',
  './assets/pic-23-1c059124.webp',
  './assets/pic-24-9a48697d.webp',
  './assets/pic-25-efb297ef.webp',
  './assets/pic-26-c86f0d23.webp',
  './assets/pic-27-d7bb6f45.webp',
  './assets/pic-28-7a81b17f.webp',
  './assets/pic-29-d9eed189.webp',
  './assets/pic-30-eb9ebcd4.webp',
  './assets/pic-31-062b2059.webp',
  './assets/pic-32-451bcea8.webp',
  './assets/pic-33-0dbebbf5.webp',
  './assets/pic-34-9a4cd947.webp',
  './assets/pic-35-a9d31c67.webp',
  './assets/pic-36-c35042eb.webp',
  './assets/pic-37-e00cf918.webp',
  './assets/pic-38-79c868b2.webp',
  './assets/pic-39-a15f7e21.webp',
  './assets/pic-40-4567e1cb.webp',
  './assets/pic-41-4d276bf6.webp',
  './assets/pic-42-5d2c3fcd.webp',
  './assets/pic-43-6bd3629a.webp',
  './assets/pic-44-ae96fb5e.webp',
  './assets/pic-45-e249a54a.webp',
  './assets/pic-46-fc217024.webp',
  './assets/pic-47-6a438f56.webp',
  './assets/pic-48-bb19ffa5.webp',
  './assets/pic-49-b2c90f1e.webp',
  './assets/pic-50-7b2ed128.webp',
  './assets/pic-51-96d3018c.webp',
  './assets/pic-52-8fd17d3a.webp',
  './assets/praise-01-169614e2.mp3',
  './assets/praise-02-c0291ee8.mp3',
  './assets/praise-03-378aa3ee.mp3',
  './assets/praise-04-103ffafb.mp3',
  './assets/puzzle-01-ade94223.jpg',
  './assets/puzzle-02-895d4aa2.jpg',
  './assets/puzzle-03-5870d970.jpg',
  './assets/puzzle-04-64b62b81.jpg',
  './assets/puzzle-05-c75dea90.jpg',
  './assets/puzzle-06-692d8d89.jpg',
  './assets/puzzle-07-5910f673.jpg',
  './assets/puzzle-08-a7180aa3.jpg',
  './assets/puzzle-09-d69b5650.jpg',
  './assets/puzzle-10-c5b75ab8.jpg',
  './assets/puzzle-11-0c4f374a.jpg'
];

// Pictures and sounds have the content hash in their names, so they live in their own cache
// that is NOT tied to VERSION: an update downloads only the files that are new.
var ASSETS = 'fakkir-wastamti-assets';
function isAsset(f) { return f.indexOf('/assets/') >= 0; }

self.addEventListener('install', function (e) {
  e.waitUntil(Promise.all([
    // all or nothing: if a file fails (weak connection), installation fails
    // and the previous, complete version keeps working until the next try
    caches.open(CACHE).then(function (c) { return c.addAll(FILES.filter(function (f) { return !isAsset(f); })); }),
    caches.open(ASSETS).then(function (c) {
      return Promise.all(FILES.filter(isAsset).map(function (f) {
        return c.match(f).then(function (hit) { return hit || c.add(f); });
      }));
    })
  ]).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  var wanted = FILES.filter(isAsset).map(function (f) { return new URL(f, location.href).href; });
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== ASSETS; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () {
      // remove pictures and sounds that the new version no longer uses
      return caches.open(ASSETS).then(function (c) {
        return c.keys().then(function (reqs) {
          return Promise.all(reqs.filter(function (r) { return wanted.indexOf(r.url.split('?')[0]) < 0; })
            .map(function (r) { return c.delete(r); }));
        });
      });
    }).then(function () { return self.clients.claim(); })
  );
});

// Only keep real, successful answers: an error page must never replace a good copy.
// For the page itself (html=true) the answer must also be an HTML page, so opening
// /og-image.jpg in a tab can't become the offline app.
function keep(key, res, name, html) {
  if (res && res.ok && res.type === 'basic' &&
      (!html || /text\/html/i.test(res.headers.get('content-type') || ''))) {
    var copy = res.clone();
    caches.open(name || CACHE).then(function (c) { c.put(key, copy); });
  }
  return res;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // The page: network first (so updates arrive), the saved copy when offline.
  // Every address of the page (with ?fbclid=... from shared links, or /index.html) is saved
  // under one name, so shared links do not pile up extra copies on the phone.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) { return keep(PAGE, res, CACHE, true); })
        .catch(function () {
          return caches.match(PAGE).then(function (r) {
            return r || caches.match(req, { ignoreSearch: true });
          });
        })
    );
    return;
  }

  // The code (app.js, manifest): network first too, so a new page never runs with old code.
  // Unchanged files answer with a tiny "not modified", so this costs almost no data.
  if (url.pathname.indexOf('/assets/') < 0 && !/\/icon-\d+\.png$/.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (res) { return keep(url.origin + url.pathname, res); })
        .catch(function () { return caches.match(req, { ignoreSearch: true }); })
    );
    return;
  }

  // Pictures and sounds (their names change whenever their content does): saved copy first.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (r) {
      return r || fetch(req).then(function (res) {
        return keep(isAsset(url.pathname) ? url.origin + url.pathname : req, res, isAsset(url.pathname) ? ASSETS : CACHE);
      });
    })
  );
});
