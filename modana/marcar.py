"""Sella cada foto con la marca Luz y Gracia y exporta el webp definitivo."""
import json, re, os
from PIL import Image, ImageFilter
import numpy as np

def logo_transparente(path="../docs/img/logo.png"):
    im = Image.open(path).convert("RGBA")
    a = np.array(im).astype(int)
    # respeta el alfa que ya trae el PNG y además convierte su fondo blanco en alfa
    blanco = (a[:,:,0]>238)&(a[:,:,1]>238)&(a[:,:,2]>238)
    alpha = np.where(blanco, 0, a[:,:,3]).astype(np.uint8)
    # borde suave para que no quede aserrado
    al = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(al)
    return im.crop(im.getbbox())

LOGO = logo_transparente()

def sellar(im):
    W,H = im.size
    w = int(W*0.36)
    lg = LOGO.resize((w, int(LOGO.height*w/LOGO.width)), Image.LANCZOS)
    # halo claro detrás: el logo es dorado y oscuro, sobre ropa negra se perdería
    halo = Image.new("RGBA", lg.size, (0,0,0,0))
    m = lg.split()[3].filter(ImageFilter.GaussianBlur(9))
    halo.paste((255,255,255,205), (0,0), m)
    halo.paste((255,255,255,205), (0,0), m)
    x, y = W-lg.width-int(W*0.035), H-lg.height-int(H*0.028)
    base = im.convert("RGBA")
    base.alpha_composite(halo, (x,y))
    lg.putalpha(lg.split()[3].point(lambda v:int(v*0.92)))
    base.alpha_composite(lg, (x,y))
    return base.convert("RGB")

P = json.load(open("productos.json"))
for p in P:
    im = Image.open(f"crops/p{p['pag']:02d}.png").convert("RGB")
    w,h = im.size
    if h>1500: im = im.resize((int(w*1500/h),1500), Image.LANCZOS)
    sellar(im).save(f"final/{p['archivo']}", "WEBP", quality=86, method=6)
print("selladas", len(P))
