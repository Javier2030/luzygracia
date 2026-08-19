#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
index_watch.py — Vigilante diario de INDEXACIÓN de luzygracia.com.
Consulta 'site:luzygracia.com' en Google (Edge REAL vía CDP 9333) y cuenta
cuántas páginas propias tiene Google en el índice. Avisa por Telegram cada vez
que el número cambia, y un aviso especial cuando la indexación queda COMPLETA
(>= total de URLs del sitemap). Cuando está completa, deja de repetir (solo
avisa de nuevo si baja). Cron: diario 14:40 UTC (09:40 COT).
"""
import json, os, re, subprocess, time, urllib.request

DOMAIN = "luzygracia.com"
BASE = os.path.dirname(os.path.abspath(__file__))
HIST = os.path.join(BASE, "index_history.json")
ENV_TG = "/home/caper_mata/arkea_quantum/mt5_bridge/.env"
PS = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
SERP = r"C:\temp\cdp_serp.ps1"
JS_WIN = r"C:\temp\index_count_lyg.js"
JS_WSL = "/mnt/c/temp/index_count_lyg.js"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

COUNT_JS = """(() => {
  const urls = new Set();
  document.querySelectorAll("a[href*='luzygracia.com']").forEach(a=>{
    const m = a.href.match(/https?:\\/\\/(?:www\\.)?luzygracia\\.com(\\/[^#?\\"]*)?/);
    if (m) urls.add((m[1]||'/'));
  });
  const none = /no encontró ningún resultado|did not match any documents/i.test(document.body.innerText);
  return JSON.stringify({count: urls.size, urls: [...urls].slice(0,60), none, sorry: location.href.includes('/sorry/')});
})()"""


def sitemap_total():
    try:
        sm = urllib.request.urlopen(f"https://{DOMAIN}/sitemap.xml", timeout=15).read().decode()
        return len(re.findall(r"<loc>", sm))
    except Exception:
        return 46


def fix_interop():
    """cron no hereda WSL_INTEROP; sin él powershell.exe falla en silencio.
    Probar el actual y luego cada socket vivo de /run/WSL."""
    import glob
    def ps_ok():
        try:
            r = subprocess.run([PS, "-NoProfile", "-Command", "echo ok"],
                               capture_output=True, text=True, timeout=15)
            return "ok" in (r.stdout or "")
        except Exception:
            return False
    if ps_ok():
        return True
    for s in sorted(glob.glob("/run/WSL/*_interop")):
        os.environ["WSL_INTEROP"] = s
        if ps_ok():
            print(f"interop recuperado via {s}")
            return True
    return False


def cdp_alive():
    r = subprocess.run([PS, "-NoProfile", "-Command",
                        "(Invoke-WebRequest 'http://127.0.0.1:9333/json/version' -UseBasicParsing -TimeoutSec 5).StatusCode"],
                       capture_output=True, text=True, errors="replace", timeout=30)
    return "200" in (r.stdout or "")


def launch_edge():
    subprocess.run([PS, "-NoProfile", "-Command",
                    f"Start-Process -FilePath '{EDGE}' -ArgumentList "
                    "'--remote-debugging-port=9333','--user-data-dir=C:\\temp\\edge_cdp','--no-first-run',"
                    "'--disable-background-timer-throttling','about:blank'"],
                   capture_output=True, text=True, timeout=30)
    time.sleep(12)


def tg(text):
    tok = chat = None
    try:
        for ln in open(ENV_TG):
            if ln.startswith("TG_TOKEN="): tok = ln.split("=", 1)[1].strip()
            if ln.startswith("TG_CHAT="): chat = ln.split("=", 1)[1].strip()
    except Exception:
        pass
    if not tok or not chat:
        print("(sin TG)\n" + text); return
    try:
        d = json.dumps({"chat_id": chat, "text": text, "parse_mode": "HTML",
                        "disable_web_page_preview": True}).encode()
        urllib.request.urlopen(urllib.request.Request(
            f"https://api.telegram.org/bot{tok}/sendMessage", data=d,
            headers={"Content-Type": "application/json"}), timeout=10)
    except Exception as e:
        print("TG fail:", e)


def measure(start=0):
    open(JS_WSL, "w", encoding="utf-8").write(COUNT_JS)
    # num=100 ya no lo respeta Google (2025): hay que paginar con start=
    url = f"https://www.google.com/search?q=site:{DOMAIN}&gl=co&hl=es&pws=0&start={start}"
    r = subprocess.run([PS, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SERP,
                        "-Url", url, "-JsFile", JS_WIN, "-WaitMs", "8000",
                        "-TabMatch", f"site:{DOMAIN}"],
                       capture_output=True, text=True, errors="replace", timeout=120)
    m = re.search(r'\{.*\}', (r.stdout or ""), re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def main():
    print(f"== index_watch {time.strftime('%Y-%m-%d %H:%M:%S')} ==")
    if not fix_interop():
        print("interop muerto: powershell.exe inaccesible (ni WSL_INTEROP ni sockets /run/WSL)")
        return
    if not cdp_alive():
        launch_edge()
        if not cdp_alive():
            tg("🔎 index_watch: no pude levantar Edge CDP (9333). Revisar.")
            return

    d = measure()
    # count==0 sin 'none' explícito = lectura inconclusa (página no cargó) → reintentar
    for intento in range(3):
        if d and not d.get("sorry") and (d.get("count", 0) > 0 or d.get("none")):
            break
        time.sleep(10)
        d = measure()
    if not d or d.get("sorry"):
        print("sin datos / captcha"); return
    if d.get("count", 0) == 0 and not d.get("none"):
        print("lectura inconclusa (0 sin 'none') — no se guarda"); return
    # paginar: Google entrega máx ~10 por página; acumular hasta agotar
    all_urls = set(d.get("urls", []))
    page = 1
    while not d.get("none") and d.get("count", 0) >= 10 and page < 8:
        time.sleep(6)
        d2 = measure(page * 10)
        if not d2 or d2.get("sorry") or d2.get("count", 0) == 0:
            break
        all_urls.update(d2.get("urls", []))
        d = d2
        page += 1
    count = len(all_urls)
    total = sitemap_total()

    hist = {}
    if os.path.exists(HIST):
        try: hist = json.load(open(HIST))
        except Exception: hist = {}
    prev = hist.get("last_count", -1)
    done_notified = hist.get("done_notified", False)

    hist["last_count"] = count
    hist["total"] = total
    hist["urls"] = sorted(all_urls)
    union = set(hist.get("urls_union_seen", []))
    union.update(all_urls)
    hist["urls_union_seen"] = sorted(union)
    # ── LO QUE ESTO MIDE **NO** ES LA INDEXACIÓN (corregido 2026-08-17) ──────────────────
    # Este vigía cuenta las URLs que Google DEVUELVE en un `site:luzygracia.com`. Eso es
    # una ESTIMACIÓN que el propio Google advierte que no es exhaustiva: pagina, recorta y
    # varía entre consultas. Medido el 17-ago: este script reportaba **75/92** mientras
    # Search Console —la fuente autoritativa, el índice real— decía **92 indexadas y 5 sin
    # indexar, de las cuales solo UNA es "rastreada sin indexar"** (las otras 4 son
    # redirecciones y canónicas intencionales). O sea: el sitio está prácticamente al 100%
    # y este número llevaba días marcando un problema inexistente.
    #
    # El costo no fue cosmético: se diagnosticó durante horas una "crisis de indexación" que
    # no existía, y una auditoría completa se construyó sobre estos datos falsos. Un vigía que
    # miente es peor que no tener vigía, porque dirige el trabajo hacia el problema equivocado.
    #
    # Se conserva la medición (sirve como señal de VISIBILIDAD en SERP), pero:
    #   1. se la nombra por lo que es, no como "indexadas";
    #   2. no se alerta por variaciones pequeñas (±3), que son ruido puro del operador site:;
    #   3. cada aviso recuerda cuál es la fuente de verdad.
    RUIDO = 3
    FUENTE = ("⚠️ Esto es lo que devuelve <code>site:</code>, NO el índice real. "
              "La verdad está en Search Console → Indexación de páginas.")
    if count >= total:
        if not done_notified:
            tg(f"🕊️ <b>VISIBILIDAD SERP COMPLETA</b>\n\nUn <code>site:{DOMAIN}</code> ya devuelve "
               f"las <b>{count}/{total}</b> páginas.\n{FUENTE}")
            hist["done_notified"] = True
    else:
        hist["done_notified"] = False
        if prev < 0:
            tg(f"🔎 <b>Visibilidad SERP {DOMAIN}</b>\n\nArranco vigilancia: <b>{count}/{total}</b> "
               f"URLs visibles en <code>site:</code>.\n{FUENTE}")
        elif abs(count - prev) > RUIDO:
            flecha = "📈" if count > prev else "📉"
            tg(f"🔎 <b>Visibilidad SERP {DOMAIN}</b> {flecha}\n\n<b>{count}/{total}</b> URLs visibles "
               f"en <code>site:</code> (antes {prev}) — variación de {abs(count-prev)}.\n{FUENTE}")

    json.dump(hist, open(HIST, "w"), ensure_ascii=False, indent=1)
    print(f"visibles en site: {count}/{total} (antes {prev}) — NO es la indexación real; ver GSC")


if __name__ == "__main__":
    main()
