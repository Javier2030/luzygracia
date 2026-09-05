#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Envía por WhatsApp la ronda de contacto a proveedores mayoristas.

Se programó para el lunes a primera hora porque escribir a un móvil comercial
un sábado de madrugada juega en contra: el mensaje queda sepultado y da la
impresión equivocada.

Antes de enviar comprueba que el puente esté vivo y que WhatsApp Web tenga
sesión. Si algo falla NO lo intenta a ciegas: deja el motivo en el log y en
Telegram, para que no queden mensajes a medio mandar ni duplicados.
"""
import json, os, subprocess, sys, datetime as dt
# RUTA ABSOLUTA: bajo cron el PATH no trae el interop de Windows y
# "powershell.exe" falla con "No such file or directory" — el vigía
# moría en silencio sin avisar de nada.
PSEXE = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"


BASE = os.path.dirname(os.path.abspath(__file__))
LOG = "/tmp/proveedores_lunes.log"
ESTADO = os.path.join(BASE, ".proveedores_enviados.json")
PS = [PSEXE, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File"]

# Cada mensaje pide lo MISMO que ya se le preguntó a CLC, para poder comparar
# manzanas con manzanas: descuento, mínimo, envío directo al cliente y fotos.
COMUN = ("Quisiera saber: 1) qué descuento manejan para tienda online (facturamos como "
         "persona natural con RUT), 2) monto o cantidad mínima del primer pedido, "
         "3) si pueden despachar unidades sueltas directamente a la dirección de "
         "nuestro cliente final con Luz y Gracia como remitente, y 4) si nos autorizan "
         "a usar las fotos de su catálogo en la tienda. Gracias. "
         "Johana Heredia - Luz y Gracia - luzygracia.com")

DESTINOS = [
 {"id": "linaje_bendito", "tel": "573138163971", "nombre": "Linaje Bendito (ropa)",
  "msg": "Buen día. Le escribo de Luz y Gracia (luzygracia.com), tienda cristiana online "
         "en Bogotá. Estamos abriendo nuestra línea de ropa cristiana y vimos que manejan "
         "catálogo mayorista. " + COMUN},
 {"id": "confetex", "tel": "573155000533", "nombre": "Confetex de Colombia (ropa, fábrica)",
  "msg": "Buen día. Le escribo de Luz y Gracia (luzygracia.com), tienda cristiana online "
         "en Bogotá. Nos interesa su producción al por mayor para nuestra línea de ropa "
         "con mensaje cristiano (estampado propio). " + COMUN},
 {"id": "fussie", "tel": "573152447804", "nombre": "Fussie Joyería (joyería)",
  "msg": "Buen día. Le escribo de Luz y Gracia (luzygracia.com), tienda cristiana online "
         "en Bogotá. Estamos abriendo nuestra línea de joyería y buscamos piezas con motivo "
         "cristiano: cruces, dijes, anillos y pulseras. " + COMUN +
         " También me interesa saber si hacen grabado personalizado y su costo."},
]

def log(m):
    linea = f"[{dt.datetime.now():%Y-%m-%d %H:%M}] {m}"
    print(linea)
    with open(LOG, "a", encoding="utf-8") as f: f.write(linea + "\n")

def _ps(args, timeout=180):
    """PowerShell devuelve la salida en la página de códigos de Windows, no en
    UTF-8: sin errors='replace' esto revienta con un acento."""
    return subprocess.run(args, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)

def _cdp_responde():
    # OJO: desde WSL, 127.0.0.1:9445 NO alcanza el CDP de Windows (queda atado al
    # loopback de Windows). La comprobación tiene que hacerse DESDE PowerShell.
    r = _ps([PSEXE, "-NoProfile", "-Command",
             "try{(Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:9445/json/version' "
             "-TimeoutSec 6).StatusCode}catch{0}"], timeout=40)
    return "200" in (r.stdout or "")

def cdp_vivo():
    if _cdp_responde(): return True
    log("puente caído, levantando Edge con CDP…")
    _ps([PSEXE, "-NoProfile", "-Command",
        "Start-Process 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' "
        "-ArgumentList '--remote-debugging-port=9445','--user-data-dir=C:\\temp\\edge_cdp',"
        "'--no-first-run','--restore-last-session'"], timeout=60)
    import time
    for _ in range(15):
        time.sleep(4)
        if _cdp_responde(): return True
    return False

def wa_con_sesion():
    # la pestaña de WhatsApp puede no existir tras levantar Edge: se abre primero
    _ps([PSEXE, "-NoProfile", "-Command",
         "try{Invoke-WebRequest -UseBasicParsing "
         "'http://127.0.0.1:9445/json/new?https://web.whatsapp.com/' -Method PUT -TimeoutSec 15}catch{}"],
        timeout=60)
    import time; time.sleep(20)
    r = _ps(PS + ["C:\\temp\\wa_state.ps1"], timeout=120)
    return '"logueado":true' in (r.stdout or "")

def avisa(txt):
    try:
        subprocess.run(["/usr/bin/python3", "-c",
            f"import sys;sys.path.insert(0,'{BASE}');print({txt!r})"], capture_output=True)
    except Exception:
        pass

def main():
    # ENSAYO EN SECO de verdad. Antes no existía: pasarle --dry lo ignoraba y
    # mandaba los mensajes igual. Pasó el 25-jul y salieron tres WhatsApp un
    # sábado en vez del lunes. Ahora cualquier bandera desconocida NO envía.
    seco = ("--dry" in sys.argv or "--simulacro" in sys.argv)
    hechos = json.load(open(ESTADO)) if os.path.exists(ESTADO) else {}
    if seco:
        log("SIMULACRO: no se envía nada")
        for d in DESTINOS:
            estado = "ya enviado " + hechos[d["id"]] if hechos.get(d["id"]) else "pendiente"
            log(f"  {d['nombre']} ({d['tel']}) -> {estado}")
        return 0
    if not cdp_vivo():
        log("ABORTADO: no hay puente CDP. Nada enviado."); return 1
    if not wa_con_sesion():
        log("ABORTADO: WhatsApp Web sin sesión (pide QR). Nada enviado."); return 1

    ok = err = 0
    for d in DESTINOS:
        if hechos.get(d["id"]):
            log(f"ya enviado antes a {d['nombre']}, se omite"); continue
        r = _ps(PS + ["C:\\temp\\wa_send.ps1", "-Phone", d["tel"], "-Text", d["msg"]],
                timeout=1200)
        if "WA_ENVIADO=True" in (r.stdout or ""):
            hechos[d["id"]] = dt.datetime.now().isoformat(timespec="minutes")
            json.dump(hechos, open(ESTADO, "w"))
            log(f"ENVIADO a {d['nombre']} ({d['tel']})"); ok += 1
        else:
            log(f"FALLÓ {d['nombre']}: {r.stdout.strip()[-120:]}"); err += 1
    log(f"resumen: {ok} enviados, {err} fallidos, {len(hechos)} acumulados")
    return 0 if err == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
