#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Trae la TRM oficial (Superfinanciera vía datos.gov.co) y la deja en config.py.
Se ejecuta antes de generar. Si la consulta falla NO se inventa una tasa: se
conserva la última conocida y se avisa, porque publicar un precio en dólares
calculado con una tasa falsa es engañar al comprador de fuera."""
import io, json, re, subprocess, datetime as dt

def trae():
    for url, camino in [
      ("https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC",
       lambda d: (float(d[0]["valor"]), d[0]["vigenciadesde"][:10])),
      ("https://api.exchangerate-api.com/v4/latest/USD",
       lambda d: (float(d["rates"]["COP"]), d["date"])),
    ]:
        try:
            r = subprocess.run(["curl","-s","-m","25",url],capture_output=True,text=True)
            return camino(json.loads(r.stdout))
        except Exception:
            continue
    return None, None

val, fecha = trae()
cfg = io.open("config.py", encoding="utf-8").read()
if val and 2000 < val < 8000:          # cordura: la TRM no se sale de ese rango
    if "TRM =" in cfg:
        cfg = re.sub(r'TRM = [\d.]+', f'TRM = {val:.2f}', cfg)
        cfg = re.sub(r'TRM_FECHA = "[^"]*"', f'TRM_FECHA = "{fecha}"', cfg)
    else:
        cfg = cfg.replace("TAGLINE =",
              f'# Tasa oficial para mostrar el precio de referencia en dólares.\n'
              f'TRM = {val:.2f}\nTRM_FECHA = "{fecha}"\n\nTAGLINE =', 1)
    io.open("config.py","w",encoding="utf-8").write(cfg)
    print(f"[+] TRM {val:,.2f} del {fecha}")
else:
    print("[!] no se pudo consultar la TRM: se conserva la de config.py")
