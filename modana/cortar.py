import json, os
from PIL import Image, ImageFilter
import numpy as np

W_PT, H_PT = 1247.239990234375, 935.4329833984375
TXT = json.load(open("txt.json"))

# (x0,y0,x1,y1) en fracción de la doble página; recorte limpio elegido a ojo por página
CROPS = {
  2:(0.262,0.00,0.500,1.00), 3:(0.055,0.00,0.495,1.00), 4:(0.500,0.02,0.982,1.00),
  5:(0.115,0.00,0.490,1.00), 6:(0.505,0.02,0.978,0.985), 7:(0.450,0.00,0.982,0.970),
  8:(0.500,0.00,0.982,1.00), 9:(0.520,0.00,0.982,1.00),10:(0.462,0.00,0.982,1.00),
 11:(0.472,0.00,0.982,1.00),12:(0.500,0.00,0.982,1.00),13:(0.020,0.00,0.480,1.00),
 14:(0.472,0.00,0.982,0.980),15:(0.020,0.00,0.500,1.00),16:(0.470,0.00,0.982,1.00),
 17:(0.752,0.00,0.985,1.00),18:(0.500,0.00,0.982,1.00),19:(0.500,0.00,0.982,1.00),
 20:(0.500,0.00,0.982,1.00),21:(0.500,0.00,0.982,1.00),22:(0.500,0.00,0.982,1.00),
 23:(0.500,0.00,0.982,1.00),24:(0.500,0.02,0.982,1.00),
}

def inpaint(a, x0,y0,x1,y1):
    """Relleno por interpolación bilineal desde los bordes: invisible sobre fondo liso."""
    h,w,_=a.shape
    x0=max(0,x0); y0=max(0,y0); x1=min(w,x1); y1=min(h,y1)
    if x1-x0<2 or y1-y0<2: return
    L=a[y0:y1, max(0,x0-1)].astype(float); R=a[y0:y1, min(w-1,x1)].astype(float)
    T=a[max(0,y0-1), x0:x1].astype(float); B=a[min(h-1,y1), x0:x1].astype(float)
    H,Wd=y1-y0, x1-x0
    u=np.linspace(0,1,Wd)[None,:,None]; v=np.linspace(0,1,H)[:,None,None]
    hor=L[:,None,:]*(1-u)+R[:,None,:]*u
    ver=T[None,:,:]*(1-v)+B[None,:,:]*v
    a[y0:y1, x0:x1]=np.clip((hor+ver)/2,0,255).astype(np.uint8)

def autotrim(im):
    """Quita marcos negros o blancos puros que deja el diseño del catálogo."""
    a=np.array(im).astype(int); h,w,_=a.shape
    def uni(line):
        m=line.mean(axis=1); return (m<28).mean()>0.9 or (m>250).mean()>0.97
    t=0
    while t<h//4 and uni(a[t]): t+=1
    b=h
    while b>3*h//4 and uni(a[b-1]): b-=1
    l=0
    while l<w//4 and uni(a[:,l]): l+=1
    r=w
    while r>3*w//4 and uni(a[:,r-1]): r-=1
    return im.crop((l,t,r,b))

os.makedirs("crops",exist_ok=True)
hechos=[]
for n,(fx0,fy0,fx1,fy1) in CROPS.items():
    f=f"orig/p{n:02d}.png"
    im=Image.open(f).convert("RGB"); W,H=im.size
    a=np.array(im)
    # 1) borrar los textos del PDF (código, tallas, tela, folios) que caigan en la página
    for t,bb in TXT.get(str(n),[]):
        x0=int(bb[0]/W_PT*W)-8; y0=int(bb[1]/H_PT*H)-8
        x1=int(bb[2]/W_PT*W)+8; y1=int(bb[3]/H_PT*H)+8
        inpaint(a,x0,y0,x1,y1)
    im=Image.fromarray(a)
    box=(int(fx0*W),int(fy0*H),int(fx1*W),int(fy1*H))
    c=im.crop(box)
    c=autotrim(c)
    c.save(f"crops/p{n:02d}.png")
    hechos.append(n)
print("recortes:",len(hechos))
