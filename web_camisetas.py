#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""La línea de camisetas estampadas en el sitio.

Genera /camisetas-cristianas.html y una ficha por diseño en /camiseta/<slug>.html.

Cada ficha lleva la foto real del producto, el precio cerrado, las tallas y un
botón de WhatsApp con el pedido ya escrito —diseño, color y talla— para que la
venta no se vaya en tres mensajes preguntando qué hay y cuánto vale.

Se separa de `web_ropa.py` a propósito: aquella línea vende diseño propio
estampado por encargo con precio calculado; esta vende producto terminado a
precio fijo. Mezclarlas en una sola página confunde al que compra.
"""
import os, urllib.parse
import generate as G
import config as C
import camisetas as M

esc = G.esc
WA = C.WHATSAPP
AUTORA = "Johana Heredia Arévalo"
BASE = G.BASE


def wa(msg):
    return "https://wa.me/" + WA + "?text=" + urllib.parse.quote(msg)


def css():
    return """<style>
/* El hero, las cifras, el bloque oscuro y la lista numerada se reutilizan de
   web_biblioteca / web_libros / web_ropa: allí viven pegados a su propia página,
   así que aquí se repiten para que esta no dependa de que otra se genere antes. */
.bhero{background:linear-gradient(160deg,var(--tinta) 0%,#232c4a 55%,#2d3657 100%);color:var(--crema);padding:64px 0 58px;position:relative;overflow:hidden}
.bhero::after{content:"";position:absolute;right:-120px;top:-90px;width:420px;height:420px;border:1px solid rgba(227,194,126,.14);border-radius:50%}
.bhero .wrap{position:relative;z-index:2;text-align:center}
.bhero .eyebrow{color:var(--oro2)}
.bhero h1{color:var(--crema);font-size:clamp(2rem,4.4vw,3.1rem);max-width:22ch;margin:14px auto 0}
.bhero p.lead{color:#cfd4e4;max-width:64ch;margin:16px auto 0}
.bstats{display:flex;gap:34px;flex-wrap:wrap;justify-content:center;margin-top:30px;border-top:1px solid rgba(227,194,126,.24);padding-top:20px}
.bstats div b{display:block;font-family:'Playfair Display',serif;font-size:1.7rem;color:var(--oro2);line-height:1.1}
.bstats div span{font-size:.82rem;color:#b8bcd0;letter-spacing:.04em}
.pers{background:var(--tinta);color:var(--crema);border-radius:18px;padding:38px 34px;margin:46px 0}
.pers h2{color:var(--crema);font-size:1.8rem;line-height:1.2}
.pers p{color:#cfd4e4;margin-top:14px;line-height:1.75;max-width:62ch}
.pers b{color:var(--oro2)}
.pers .btn{display:inline-block;background:var(--oro);color:var(--tinta);padding:14px 28px;border-radius:11px;font-weight:700;margin-top:20px}
.pasos{counter-reset:p;list-style:none;margin:16px 0 0;display:grid;gap:13px}
.pasos li{display:flex;gap:14px;line-height:1.65;align-items:flex-start}
.pasos li::before{counter-increment:p;content:counter(p);background:var(--tinta);color:var(--crema);width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:.82rem;font-weight:700;flex:none;margin-top:2px}
.camgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:26px;margin-top:38px}
.camcard{background:#fff;border:1px solid var(--linea);border-radius:16px;overflow:hidden;
  display:flex;flex-direction:column;text-decoration:none;color:inherit;
  transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s}
.camcard:hover{transform:translateY(-5px);box-shadow:0 22px 48px -24px rgba(60,40,20,.34);border-color:var(--oro)}
.camcard .foto{background:var(--crema2);aspect-ratio:1/1;overflow:hidden;display:flex;align-items:center;justify-content:center}
.camcard .foto img{width:100%;height:100%;object-fit:cover;display:block}
.camcard .cuerpo{padding:16px 17px 18px;display:flex;flex-direction:column;gap:7px;flex:1}
.camcard h3{font-family:'Playfair Display',serif;font-size:1.03rem;line-height:1.28;margin:0;color:var(--tinta)}
.camcard .cita{font-size:.8rem;color:var(--oro);font-weight:600;letter-spacing:.02em}
.camcard .cols{font-size:.82rem;color:var(--suave);margin-top:auto}
.camcard .pie{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:9px;
  padding-top:11px;border-top:1px solid var(--linea)}
.camcard .precio{font-family:'Playfair Display',serif;font-size:1.32rem;font-weight:700;color:var(--tinta)}
.camcard .ver{font-size:.83rem;color:var(--oro);font-weight:600}

.fichacam{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:start;margin-top:30px}
@media(max-width:860px){.fichacam{grid-template-columns:1fr;gap:26px}}
.fichacam .foto{border-radius:18px;overflow:hidden;border:1px solid var(--linea);background:var(--crema2)}
.fichacam .foto img{width:100%;height:auto;display:block}
.pcerrado{background:var(--crema2);border:1px solid var(--linea);border-radius:14px;padding:20px 22px;margin:20px 0}
.pcerrado .p{font-family:'Playfair Display',serif;font-size:2.25rem;font-weight:700;color:var(--oro);line-height:1.1}
.pcerrado .u{font-size:.87rem;color:var(--suave);margin-top:5px}
.tallasfijas{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}
.tallasfijas span{border:1px solid var(--linea);background:#fff;border-radius:9px;padding:9px 16px;font-size:.9rem;font-weight:600}
.listacol{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}
.listacol span{background:var(--crema2);border:1px solid var(--linea);border-radius:999px;padding:6px 13px;font-size:.84rem}
.incluye{margin:18px 0 0;padding-left:1.1rem}
.incluye li{margin-bottom:6px;font-size:.94rem}
</style>"""


def tarjeta(slug, titulo, cita, colores, alto, disenos):
    n = len(disenos)
    extra = f" · {n} diseños" if n > 1 else ""
    return f"""<a class="camcard" href="/camiseta/{slug}.html">
  <div class="foto"><picture>
    <source type="image/webp" srcset="/img/camisetas/{slug}-420.webp 420w, /img/camisetas/{slug}.webp 900w" sizes="(max-width:720px) 90vw, 280px">
    <img src="/img/camisetas/{slug}-420.jpg" width="900" height="{alto}" alt="{esc(titulo)}" loading="lazy" decoding="async"></picture></div>
  <div class="cuerpo">
    <h3>{esc(titulo)}</h3>
    {f'<div class="cita">{esc(cita)}</div>' if cita else ''}
    <div class="cols">{esc(' · '.join(colores))}{extra}</div>
    <div class="pie"><span class="precio">{M.cop(M.PRECIO)}</span><span class="ver">Ver →</span></div>
  </div></a>"""


def pagina_indice():
    cards = "".join(tarjeta(*c) for c in M.CAMISETAS)
    nd = M.total_disenos()
    n = len(M.CAMISETAS)
    ld = {"@context": "https://schema.org", "@type": "ItemList",
          "itemListElement": [{"@type": "Product", "name": t,
                               "image": f"{BASE}/img/camisetas/{s_}.jpg",
                               "url": f"{BASE}/camiseta/{s_}.html",
                               "offers": {"@type": "Offer", "price": str(M.PRECIO),
                                          "priceCurrency": "COP",
                                          "availability": "https://schema.org/InStock"}}
                              for s_, t, _c, _co, _a, _d in M.CAMISETAS]}
    bc = G.crumbs_ld([("Inicio", "/"), ("Camisetas cristianas", "/camisetas-cristianas.html")])
    G.write("camisetas-cristianas.html", f"""{G.head(
 f"Camisetas cristianas estampadas · {M.cop(M.PRECIO)} — {nd} diseños | {C.BRAND}",
 f"Camisetas cristianas estampadas en {M.TELA.lower()} a {M.cop(M.PRECIO)} cada una. "
 f"{nd} diseños con versículos, tallas {M.TALLAS[0]} a {M.TALLAS[-1]} y envío a toda Colombia con pago contraentrega.",
 "/camisetas-cristianas.html", [ld, bc])}{css()}
{G.header_html()}
<div class="bhero"><div class="wrap">
<div class="eyebrow">Luz y Gracia · Vestir</div>
<h1>Camisetas cristianas listas para llevar</h1>
<p class="lead">{nd} diseños para llevar la Palabra puesta, en {M.TELA.lower()}.
Todas al mismo precio, sin importar el diseño ni el color: lo que ves es lo que pagas.</p>
<div class="bstats">
<div><b>{M.cop(M.PRECIO)}</b><span>Cada una</span></div>
<div><b>{nd}</b><span>Diseños</span></div>
<div><b>{len(M.TALLAS)}</b><span>Tallas: {" a ".join([M.TALLAS[0], M.TALLAS[-1]])}</span></div>
<div><b>14</b><span>Colores</span></div>
</div></div></div>
<section><div class="wrap">
<h2 class="h2c">Los diseños</h2>
<p class="lead">Cada foto es del producto real. Toca la que te guste para ver colores,
tallas y pedirla por WhatsApp.</p>
<div class="camgrid">{cards}</div>

<div class="pers">
<h2>¿Es para tu grupo, tu iglesia o un retiro?</h2>
<p>Si necesitas varias, escríbenos y cuadramos el precio por cantidad. También podemos
estampar <b>el nombre de tu ministerio</b> o la fecha del retiro sobre cualquiera de estos
diseños.</p>
<a class="btn" href="{wa('Hola, quiero camisetas cristianas para mi grupo o iglesia. Somos aproximadamente ___ personas.')}"
 target="_blank" rel="noopener">Pedir por cantidad</a>
</div>

<h2 class="h2c">Cómo pedirla</h2>
<ol class="pasos" style="max-width:70ch;margin:16px auto 0">
<li>Elige el diseño y entra a su ficha para ver los colores disponibles.</li>
<li>Escribe por WhatsApp con un clic: el mensaje ya va con el diseño puesto, solo dices color y talla.</li>
<li>Pagas por Nequi, Daviplata o contraentrega y te llega a toda Colombia.</li>
</ol>
</div></section>
{G.footer_html()}""")


def pagina_ficha(slug, titulo, cita, colores, alto, disenos):
    lista = "".join(f"<li>{esc(d)}</li>" for d in disenos)
    plural = len(disenos) > 1
    msg = f"Hola, quiero la camiseta «{titulo}» ({M.cop(M.PRECIO)}). Color: ___ · Talla: ___"
    desc = (f"Camiseta cristiana «{titulo}» en {M.TELA.lower()}, {M.cop(M.PRECIO)}. "
            f"{'Colores' if len(colores) > 1 else 'Color'}: {', '.join(colores).lower()}. "
            f"Tallas {M.TALLAS[0]} a {M.TALLAS[-1]}. Envío a toda Colombia con pago contraentrega.")
    ld = {"@context": "https://schema.org", "@type": "Product",
          "name": titulo, "description": desc,
          "image": f"{BASE}/img/camisetas/{slug}.jpg",
          "brand": {"@type": "Brand", "name": C.BRAND},
          "material": M.TELA,
          "offers": {"@type": "Offer", "price": str(M.PRECIO), "priceCurrency": "COP",
                     "availability": "https://schema.org/InStock",
                     "url": f"{BASE}/camiseta/{slug}.html"}}
    bc = G.crumbs_ld([("Inicio", "/"), ("Camisetas cristianas", "/camisetas-cristianas.html"),
                      (titulo[:44], f"/camiseta/{slug}.html")])
    G.write(f"camiseta/{slug}.html", f"""{G.head(
 f"{titulo[:58]} · Camiseta cristiana {M.cop(M.PRECIO)} | {C.BRAND}",
 desc, f"/camiseta/{slug}.html", [ld, bc])}{css()}
{G.header_html()}
<section><div class="wrap">
<div class="fichacam">
<div class="foto"><picture>
<source type="image/webp" srcset="/img/camisetas/{slug}-420.webp 420w, /img/camisetas/{slug}.webp 900w" sizes="(max-width:860px) 92vw, 520px">
<img src="/img/camisetas/{slug}.jpg" width="900" height="{alto}" alt="{esc(titulo)}" fetchpriority="high" decoding="async"></picture></div>
<div>
<h1 style="font-size:1.75rem;line-height:1.24">{esc(titulo)}</h1>
{f'<p style="color:var(--oro);font-weight:600;margin-top:6px">{esc(cita)}</p>' if cita else ''}
<div class="pcerrado">
<div class="p">{M.cop(M.PRECIO)}</div>
<div class="u">Precio por camiseta. El mismo para cualquier diseño, color y talla.</div>
</div>
<p style="font-weight:600;margin-bottom:2px">Tallas disponibles</p>
<div class="tallasfijas">{"".join(f'<span>{t}</span>' for t in M.TALLAS)}</div>
<p style="font-weight:600;margin:16px 0 2px">{"Colores" if len(colores) > 1 else "Color"}</p>
<div class="listacol">{"".join(f'<span>{esc(c)}</span>' for c in colores)}</div>
<p style="font-weight:600;margin:18px 0 2px">{"Diseños de esta referencia" if plural else "El diseño"}</p>
<ul class="incluye">{lista}</ul>
<p style="margin-top:16px;color:var(--suave);font-size:.92rem">{esc(M.TELA)}. Estampado que
aguanta el uso y el lavado. Envío a toda Colombia y <b>pago contraentrega</b>.</p>
<div style="margin-top:22px;display:flex;gap:11px;flex-wrap:wrap">
<a class="btn" href="{wa(msg)}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
<a class="btn ghost" href="/camisetas-cristianas.html">Ver los demás diseños</a>
</div>
<p style="margin-top:10px;font-size:.85rem;color:var(--suave)">Al escribir, dinos el
<b>color</b> y la <b>talla</b> y te confirmamos disponibilidad al momento.</p>
</div></div>
</div></section>
{G.footer_html()}""")


def main():
    import os
    faltan = [c[0] for c in M.CAMISETAS
              if not os.path.exists(os.path.join(G.OUT, "img", "camisetas", f"{c[0]}.jpg"))]
    if faltan:
        print("  ⚠ faltan fotos:", ", ".join(faltan))
    pagina_indice()
    for c in M.CAMISETAS:
        pagina_ficha(*c)
    print(f"  ✓ camisetas: 1 índice + {len(M.CAMISETAS)} fichas ({M.total_disenos()} diseños)")


if __name__ == "__main__":
    main()
