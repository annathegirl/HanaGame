const CACHE = "hana-cache-v1";

const ASSETS = [
  "./",
  "index.html",
  "style.css",
  "game.js",
  "manifest.webmanifest",
  "Gemini_Generated_Image_yefmyuyefmyuyefm.png",

  "IMG_8331.png",
  "IMG_8329.png",
  "IMG_8330.png",
  "IMG_8337.png",
  "IMG_8338.png",
  "IMG_8339.png",
  "IMG_8340.png",
  "IMG_8341.png",
  "unnamed.png",

  "iconshana-192.png",
  "iconshana-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
