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


# ── RECORTE DE PUDOR (7-sep-2026, orden del dueño) ────────────────────────────
# El público de la tienda es cristiano y no le sienta bien la piel expuesta. El
# recorte se hace ANTES de sellar para que el pie de marca quede pegado a la foto
# ya recortada. Fracciones (x0,y0,x1,y1) sobre el crop original, elegidas a ojo:
# se corta por DEBAJO del bajo de la prenda —nunca por encima—, para no perder el
# largo, que es lo que distingue a un gabán. Donde hay dos modelos y una va más
# cubierta, el recorte lateral se queda con esa.
# Lo que el recorte NO puede resolver queda anotado en PIEL_SIN_SOLUCION.
PUDOR = {
 "gaban-m-798.webp":    (0.00, 0.00, 0.52, 0.55),
 "gaban-m-800.webp":    (0.00, 0.00, 1.00, 0.52),
 "gaban-m-801.webp":    (0.00, 0.00, 1.00, 0.72),
 "gaban-m-802.webp":    (0.00, 0.00, 1.00, 0.60),
 "gaban-m-803.webp":    (0.00, 0.00, 1.00, 0.62),
 "gaban-m-804.webp":    (0.00, 0.00, 1.00, 0.62),
 "gaban-m-805.webp":    (0.00, 0.00, 0.52, 0.52),
 "gaban-m-806.webp":    (0.00, 0.00, 1.00, 0.48),
 "gaban-m-807.webp":    (0.00, 0.00, 1.00, 0.47),
 "conjunto-m-810.webp": (0.00, 0.00, 1.00, 0.97),
 "conjunto-m-811.webp": (0.00, 0.00, 1.00, 0.97),
 "conjunto-m-816.webp": (0.00, 0.00, 1.00, 0.74),
}

# Fotos donde el top corto deja el abdomen en mitad del encuadre: recortarlo
# obligaría a cortar la prenda que se vende. Se dejan como están y se avisa;
# la salida es pedirle al proveedor otra toma, no destrozar la foto.
PIEL_SIN_SOLUCION = ["gaban-m-795.webp", "gaban-m-796.webp", "gaban-m-799.webp",
                     "conjunto-m-809.webp", "conjunto-m-812.webp"]


def pudor(im, archivo):
    if archivo not in PUDOR:
        return im
    w, h = im.size
    x0, y0, x1, y1 = PUDOR[archivo]
    return im.crop((int(w*x0), int(h*y0), int(w*x1), int(h*y1)))


if __name__ == "__main__":
    P = json.load(open("productos.json"))
    for p in P:
        im = Image.open(f"crops/p{p['pag']:02d}.png").convert("RGB")
        im = pudor(im, p["archivo"])
        w,h = im.size
        if h>1500: im = im.resize((int(w*1500/h),1500), Image.LANCZOS)
        sellar(im).save(f"final/{p['archivo']}", "WEBP", quality=86, method=6)
    print("selladas", len(P))
