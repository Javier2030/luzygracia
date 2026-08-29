"""Sella cada foto con la marca Luz y Gracia en el hueco de fondo más limpio:
nunca sobre la prenda ni sobre la piel de la modelo."""
import json
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

def logo_transparente(path="../docs/img/logo.png"):
    im = Image.open(path).convert("RGBA")
    a = np.array(im).astype(int)
    blanco = (a[:,:,0]>238)&(a[:,:,1]>238)&(a[:,:,2]>238)
    alpha = np.where(blanco, 0, a[:,:,3]).astype(np.uint8)
    im.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    return im.crop(im.getbbox())

LOGO = logo_transparente()

CREMA  = (247, 241, 230)   # el mismo fondo de luzygracia.com
DORADO = (198, 160, 74)

def sellar(im):
    """Pie de marca bajo la foto: el sello nunca toca la prenda ni el rostro."""
    W, H = im.size
    lw = int(W*0.34)
    lg = LOGO.resize((lw, int(LOGO.height*lw/LOGO.width)), Image.LANCZOS)
    franja = int(lg.height*1.40)
    out = Image.new("RGB", (W, H+franja), CREMA)
    out.paste(im, (0, 0))
    ImageDraw.Draw(out).rectangle([0, H, W, H+2], fill=DORADO)   # filete de separación
    out.paste(lg, ((W-lg.width)//2, H + (franja-lg.height)//2 + 1), lg)
    return out

if __name__ == "__main__":
    P = json.load(open("productos.json"))
    for p in P:
        im = Image.open(f"crops/p{p['pag']:02d}.png").convert("RGB")
        w,h = im.size
        if h>1500: im = im.resize((int(w*1500/h),1500), Image.LANCZOS)
        sellar(im).save(f"final/{p['archivo']}", "WEBP", quality=86, method=6)
    print("selladas", len(P))
