#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Imágenes de las prendas base, dibujadas — sin modelos.

Las fotos que había venían con modelos de brazos tatuados. En una tienda cristiana eso
espanta a una parte del público, y no hay forma de arreglarlo recortando: el brazo está
pegado al torso, así que o se ve el tatuaje o se ve una franja de tela sin forma. Probadas
las dos cosas antes de llegar aquí.

La salida son siluetas planas, del color real de la prenda, sin piel, sin rostro y sin
nada que distraiga del producto. Además son propias: las fotos eran del fabricante.

    python3 prendas_mockup.py            # genera las que falten
    python3 prendas_mockup.py --todas    # rehace todas
"""
import os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "docs", "img", "prendas")
TMP = os.path.join(HERE, ".build_ropa")
W, H = 900, 1000

# Color con el que se dibuja cada referencia. Se elige el que el fabricante muestra como
# principal, para que la ficha no prometa un color que luego no llega.
PRENDAS = {
    "camiseta-basica":        ("camiseta",  "#1c1c1e"),
    "camiseta-polo":          ("polo",      "#1c1c1e"),
    "camiseta-galleta":       ("camiseta",  "#4a5340"),
    "camiseta-oversize":      ("oversize",  "#f2efe9"),
    "crop-top":               ("croptop",   "#c9b8d8"),
    "buzo-capota":            ("buzo",      "#1c1c1e"),
    "buzo-capota-nino":       ("buzo",      "#b9bcc2"),
    "buzo-cuello-redondo":    ("sudadera",  "#3b3f45"),
    "chaqueta-basica":        ("chaqueta",  "#2b2e33"),
    "jogger":                 ("jogger",    "#1f4fa8"),
    "buzo-capota-premium":    ("buzo",      "#5c1f28"),
    "cuello-redondo-premium": ("sudadera",  "#1c1c1e"),
    "chaqueta-premium":       ("chaqueta",  "#1c1c1e"),
}

# ── Siluetas ────────────────────────────────────────────────────────────────
# Cada una define el contorno del cuerpo, el detalle del cuello y lo que lleve
# encima. Las mangas largas salen del hombro y bajan hacia afuera hasta el puño:
# dibujarlas pegadas al costado hace que la prenda parezca un chaleco.
def cuerpo_camiseta(largo=790, ancho=(286, 614), manga=("M190 216 L160 306 L286 344",
                                                        "M710 216 L740 306 L614 344")):
    return (f"M392 158 L330 163 {manga[0]} L{ancho[0]} {largo} "
            f"Q450 {largo+24} {ancho[1]} {largo} L{ancho[1]} 344 {manga[1][1:]} "
            f"L570 163 L508 158 Q450 216 392 158 Z")

SIL = {
 "camiseta": {
   "path": ("M392 158 L330 163 L190 216 L160 306 L286 344 L286 792 "
            "Q450 816 614 792 L614 344 L740 306 L710 216 L570 163 L508 158 "
            "Q450 216 392 158 Z"),
   "cuello": "M392 158 Q450 216 508 158 Q450 194 392 158 Z",
 },
 "oversize": {   # más ancho y más largo, hombro caído
   "path": ("M386 150 L316 156 L168 222 L142 322 L282 362 L282 836 "
            "Q450 862 618 836 L618 362 L758 322 L732 222 L584 156 L514 150 "
            "Q450 212 386 150 Z"),
   "cuello": "M386 150 Q450 212 514 150 Q450 186 386 150 Z",
 },
 "polo": {       # cuello tejido con abertura y botones
   "path": ("M392 158 L330 163 L190 216 L160 306 L286 344 L286 792 "
            "Q450 816 614 792 L614 344 L740 306 L710 216 L570 163 L508 158 "
            "Q450 216 392 158 Z"),
   "cuello": ("M392 158 L418 150 L450 214 L482 150 L508 158 "
              "Q450 196 392 158 Z"),
   "extra": ('<path d="M436 210 L436 320" stroke="rgba(0,0,0,.30)" stroke-width="3" fill="none"/>'
             '<path d="M466 210 L466 320" stroke="rgba(0,0,0,.16)" stroke-width="3" fill="none"/>'
             '<circle cx="451" cy="248" r="5" fill="rgba(0,0,0,.30)"/>'
             '<circle cx="451" cy="300" r="5" fill="rgba(0,0,0,.30)"/>'),
 },
 "croptop": {    # cuerpo corto, hombro estrecho
   "path": ("M398 166 L344 172 L232 222 L208 300 L316 336 L316 606 "
            "Q450 626 584 606 L584 336 L692 300 L668 222 L556 172 L502 166 "
            "Q450 218 398 166 Z"),
   "cuello": "M398 166 Q450 218 502 166 Q450 196 398 166 Z",
 },
 # Manga LARGA: baja desde el hombro hacia afuera y termina en puño.
 "sudadera": {
   "path": ("M386 172 L318 178 L156 258 L118 606 L200 622 L262 396 L262 852 "
            "Q450 878 638 852 L638 396 L700 622 L782 606 L744 258 L582 178 L514 172 "
            "Q450 236 386 172 Z"),
   "cuello": "M386 172 Q450 236 514 172 Q450 206 386 172 Z",
   "extra": ('<path d="M118 606 L200 622" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'
             '<path d="M782 606 L700 622" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'
             '<path d="M262 852 Q450 878 638 852" stroke="rgba(0,0,0,.18)" stroke-width="4" fill="none"/>'),
 },
 "buzo": {
   "path": ("M386 186 L318 192 L156 272 L118 620 L200 636 L262 410 L262 866 "
            "Q450 892 638 866 L638 410 L700 636 L782 620 L744 272 L582 192 L514 186 "
            "Q450 250 386 186 Z"),
   "cuello": "M386 186 Q450 250 514 186 Q450 220 386 186 Z",
   "capota": "M326 224 Q344 124 450 116 Q556 124 574 224 Q450 268 326 224 Z",
   "extra": ('<path d="M336 706 Q450 732 564 706 L564 806 Q450 828 336 806 Z" '
             'fill="rgba(0,0,0,.08)" stroke="rgba(0,0,0,.16)" stroke-width="2.5"/>'
             '<path d="M118 620 L200 636" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'
             '<path d="M782 620 L700 636" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'
             '<circle cx="406" cy="250" r="6" fill="rgba(0,0,0,.38)"/>'
             '<circle cx="494" cy="250" r="6" fill="rgba(0,0,0,.38)"/>'
             '<path d="M406 250 Q432 312 450 328" stroke="#efe9dc" stroke-width="6" fill="none"/>'
             '<path d="M494 250 Q468 312 450 328" stroke="#efe9dc" stroke-width="6" fill="none"/>'),
 },
 "chaqueta": {
   "path": ("M386 186 L318 192 L156 272 L118 620 L200 636 L262 410 L262 866 "
            "Q450 892 638 866 L638 410 L700 636 L782 620 L744 272 L582 192 L514 186 "
            "Q450 250 386 186 Z"),
   "cuello": "M386 186 Q450 250 514 186 Q450 220 386 186 Z",
   "capota": "M326 224 Q344 124 450 116 Q556 124 574 224 Q450 268 326 224 Z",
   "extra": ('<line x1="450" y1="244" x2="450" y2="880" stroke="rgba(0,0,0,.40)" stroke-width="5"/>'
             '<line x1="450" y1="244" x2="450" y2="880" stroke="rgba(255,255,255,.12)" '
             'stroke-width="1.6" stroke-dasharray="7 6"/>'
             '<rect x="443" y="312" width="14" height="26" rx="4" fill="rgba(0,0,0,.45)"/>'
             '<path d="M118 620 L200 636" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'
             '<path d="M782 620 L700 636" stroke="rgba(0,0,0,.20)" stroke-width="4" fill="none"/>'),
 },
 "jogger": {
   "path": ("M300 210 L600 210 L616 300 L596 900 L500 900 L466 470 L434 470 "
            "L400 900 L304 900 L284 300 Z"),
   "cuello": "M300 210 L600 210 L604 250 L296 250 Z",
   "extra": ('<path d="M420 226 Q450 252 480 226" stroke="#efe9dc" stroke-width="6" fill="none"/>'
             '<path d="M330 470 Q345 560 340 690" stroke="rgba(0,0,0,.10)" stroke-width="14" fill="none"/>'
             '<path d="M570 470 Q555 560 560 690" stroke="rgba(255,255,255,.07)" stroke-width="14" fill="none"/>'),
 },
}


def chromium():
    for exe in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable"):
        if shutil.which(exe):
            return exe
    raise RuntimeError("no hay Chromium instalado")


def html(forma, color):
    s = SIL[forma]
    claro = int(color[1:3], 16) + int(color[3:5], 16) + int(color[5:7], 16) > 480
    borde = "rgba(0,0,0,.22)" if claro else "rgba(0,0,0,.35)"
    capota = (f'<path d="{s["capota"]}" fill="{color}" stroke="{borde}" stroke-width="2.5" '
              f'filter="url(#dentro)"/>') if s.get("capota") else ""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0}} html,body{{width:{W}px;height:{H}px;background:#fff}}
</style></head><body>
<svg width="{W}" height="{H}" viewBox="0 0 900 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tela" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{color}"/>
      <stop offset="55%" stop-color="{color}" stop-opacity=".94"/>
      <stop offset="100%" stop-color="{color}" stop-opacity=".84"/>
    </linearGradient>
    <filter id="sombra" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1a2238" flood-opacity=".14"/>
    </filter>
    <filter id="dentro"><feDropShadow dx="0" dy="3" stdDeviation="4"
      flood-color="#000" flood-opacity=".18"/></filter>
  </defs>
  <g filter="url(#sombra)">
    {capota}
    <path d="{s['path']}" fill="url(#tela)" stroke="{borde}" stroke-width="2.5"/>
    <path d="{s['cuello']}" fill="rgba(0,0,0,.13)" stroke="{borde}" stroke-width="2.5"/>
    {s.get('extra','')}
  </g>
</svg></body></html>"""


def construir(rehacer=False):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    from PIL import Image
    n = 0
    for slug, (forma, color) in PRENDAS.items():
        dest = os.path.join(OUT, slug + ".webp")
        if os.path.exists(dest) and not rehacer and os.path.exists(dest + ".bak_fotomodelo"):
            continue
        if os.path.exists(dest) and not os.path.exists(dest + ".bak_fotomodelo"):
            shutil.copy2(dest, dest + ".bak_fotomodelo")   # la foto original, por si acaso
        h = os.path.join(TMP, f"pr-{slug}.html")
        png = os.path.join(TMP, f"pr-{slug}.png")
        open(h, "w", encoding="utf-8").write(html(forma, color))
        subprocess.run([chromium(), "--headless=new", "--disable-gpu", "--no-sandbox",
                        "--disable-dev-shm-usage", "--hide-scrollbars",
                        f"--window-size={W},{H}", "--virtual-time-budget=6000",
                        f"--screenshot={png}", "file://" + h],
                       capture_output=True, timeout=180)
        if not os.path.exists(png):
            print(f"  ✗ {slug}"); continue
        im = Image.open(png).convert("RGB")
        im.thumbnail((760, 845), Image.LANCZOS)
        im.save(dest, "WEBP", quality=90, method=6)
        n += 1
        print(f"  ✓ {slug:26s} {forma:9s} {color}")
    return n


if __name__ == "__main__":
    n = construir("--todas" in sys.argv)
    print(f"\n{n} prendas dibujadas en {OUT}")
