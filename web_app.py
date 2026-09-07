#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convierte el sitio en app instalable (PWA).

Genera el manifiesto, el service worker y el bloque que va en el <head> de todas
las páginas. Con eso, quien entre desde el celular ve «Instalar app» y le queda
el icono en la pantalla de inicio, sin pasar por ninguna tienda de aplicaciones.

Tres decisiones que conviene no deshacer sin pensarlas:

1. El service worker sirve la caché SOLO como respaldo (network-first). Un
   catálogo con precios no puede servirse de una copia vieja: si el dueño sube
   un precio y el visitante ve el de la semana pasada, se vende a pérdida. La
   caché existe para que la app abra sin datos, no para ahorrar peticiones.

2. No se cachea nada de /camiseta/, /producto/ ni las páginas de precio salvo
   como último recurso offline, por lo mismo.

3. El aviso de instalación aparece una sola vez y se puede cerrar. Si el
   visitante lo cierra, no vuelve a salir en 30 días: un banner insistente
   espanta más ventas de las que trae.
"""
import json, os

NOMBRE = "Luz y Gracia"
NOMBRE_LARGO = "Luz y Gracia · Regalos y productos cristianos"
CREMA = "#faf6ee"
TINTA = "#1a2238"
VERSION_SW = "lg-v1"


def manifest():
    return json.dumps({
        "name": NOMBRE_LARGO,
        "short_name": NOMBRE,
        "description": "Biblias, camisetas cristianas, regalos y libros. Envío a toda Colombia con pago contraentrega.",
        "start_url": "/?fuente=app",
        "scope": "/",
        "display": "standalone",
        "orientation": "portrait",
        "background_color": CREMA,
        "theme_color": TINTA,
        "lang": "es-CO",
        "dir": "ltr",
        "categories": ["shopping", "lifestyle", "books"],
        "icons": [
            {"src": "/img/app/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "/img/app/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "/img/app/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
            {"src": "/img/app/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
        "shortcuts": [
            {"name": "Ropa cristiana", "url": "/ropa-cristiana.html",
             "icons": [{"src": "/img/app/icon-192.png", "sizes": "192x192"}]},
            {"name": "Biblias", "url": "/biblias.html",
             "icons": [{"src": "/img/app/icon-192.png", "sizes": "192x192"}]},
            {"name": "Libros gratis", "url": "/biblioteca.html",
             "icons": [{"src": "/img/app/icon-192.png", "sizes": "192x192"}]},
        ],
    }, ensure_ascii=False, indent=1)


def service_worker():
    return f"""/* Luz y Gracia — service worker.
   Estrategia: red primero, caché como respaldo. Un catálogo con precios NO puede
   servirse de una copia vieja; la caché está para que la app abra sin señal. */
const CACHE = "{VERSION_SW}";
const BASE = [
  "/", "/ropa-cristiana.html", "/biblias.html", "/biblioteca.html",
  "/img/app/icon-192.png", "/img/logo.png"
];

self.addEventListener("install", e => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
}});

self.addEventListener("activate", e => {{
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener("fetch", e => {{
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // nada de terceros
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(req)
      .then(res => {{
        if (res && res.status === 200 && res.type === "basic") {{
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }}
        return res;
      }})
      .catch(() => caches.match(req).then(r => r || caches.match("/")))
  );
}});
"""


def head_html():
    """Lo que va en el <head> de todas las páginas."""
    return (
        f'<link rel="manifest" href="/manifest.json">'
        f'<meta name="mobile-web-app-capable" content="yes">'
        f'<meta name="apple-mobile-web-app-capable" content="yes">'
        f'<meta name="apple-mobile-web-app-status-bar-style" content="default">'
        f'<meta name="apple-mobile-web-app-title" content="{NOMBRE}">'
        f'<link rel="apple-touch-icon" href="/img/app/apple-touch-icon.png">'
    )


def script_html():
    """Registro del service worker y aviso de instalación. Va antes de </body>."""
    return """<div id="lg-app" hidden>
  <div class="lg-app-in">
    <img src="/img/app/icon-192.png" alt="" width="44" height="44">
    <div class="lg-app-tx"><b>Instala la app</b><span>Ábrela desde tu pantalla de inicio</span></div>
    <button id="lg-app-si" type="button">Instalar</button>
    <button id="lg-app-no" type="button" aria-label="Ahora no">&times;</button>
  </div>
</div>
<style>
#lg-app{position:fixed;left:12px;right:12px;bottom:12px;z-index:80;animation:lgUp .3s cubic-bezier(.22,1,.36,1)}
@keyframes lgUp{from{transform:translateY(120%);opacity:0}to{transform:none;opacity:1}}
.lg-app-in{display:flex;align-items:center;gap:12px;background:#1a2238;color:#faf6ee;
  border-radius:16px;padding:12px 14px;box-shadow:0 18px 44px -18px rgba(0,0,0,.6);
  max-width:520px;margin:0 auto;border:1px solid rgba(227,194,126,.34)}
.lg-app-in img{border-radius:11px;flex:none;background:#faf6ee}
.lg-app-tx{display:flex;flex-direction:column;line-height:1.3;flex:1;min-width:0}
.lg-app-tx b{font-size:.95rem}
.lg-app-tx span{font-size:.79rem;color:#c3c8da}
#lg-app-si{background:#e3c27e;color:#1a2238;border:0;border-radius:10px;padding:10px 17px;
  font-weight:700;font-family:inherit;font-size:.88rem;cursor:pointer;flex:none}
#lg-app-no{background:none;border:0;color:#8f96ad;font-size:1.5rem;line-height:1;cursor:pointer;
  padding:0 4px;flex:none}
@media(min-width:900px){#lg-app{left:auto;right:20px;bottom:20px;max-width:420px}}
</style>
<script>
(function(){
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("/sw.js").catch(function(){});
    });
  }
  // El aviso se muestra una vez; si lo cierran, no vuelve en 30 días.
  var CLAVE = "lg_app_no", MES = 30*24*60*60*1000, guardado = 0;
  try { guardado = parseInt(localStorage.getItem(CLAVE) || "0", 10); } catch(e){}
  if (Date.now() - guardado < MES) return;

  var evento = null, caja = document.getElementById("lg-app");
  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault(); evento = e;
    if (caja) caja.hidden = false;
  });
  var si = document.getElementById("lg-app-si"), no = document.getElementById("lg-app-no");
  if (si) si.addEventListener("click", function(){
    if (!evento) return;
    evento.prompt();
    evento.userChoice.then(function(){ evento = null; if (caja) caja.hidden = true; });
  });
  if (no) no.addEventListener("click", function(){
    if (caja) caja.hidden = true;
    try { localStorage.setItem(CLAVE, String(Date.now())); } catch(e){}
  });
  window.addEventListener("appinstalled", function(){
    if (caja) caja.hidden = true;
    try { localStorage.setItem(CLAVE, String(Date.now())); } catch(e){}
  });
})();
</script>"""


def generar(write):
    write("manifest.json", manifest())
    write("sw.js", service_worker())
    print("  ✓ app instalable: manifest.json + sw.js")
