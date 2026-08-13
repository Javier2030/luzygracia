# Biblioteca Luz y Gracia — cómo funciona

Sección de ebooks cristianos gratuitos en `luzygracia.com`, con aporte voluntario por
Nequi/Daviplata destinado a la Fundación El Alfarero.

## Piezas

| Archivo | Qué hace |
|---|---|
| `ebooks_src/<slug>.json` | El contenido de cada libro (texto puro, sin diseño) |
| `ebooks_src/_ESQUEMA.md` | El esquema y las reglas de redacción que sigue cada JSON |
| `ebooks_src/_CATALOGO.json` | Los 50 títulos, su colección y el orden en que se muestran |
| `ebooks.py` | Maqueta el PDF (6×9", tipografía embebida) y la portada JPEG |
| `web_biblioteca.py` | Genera `/biblioteca.html`, `/ebook/<slug>.html` y `/apoya.html` |
| `generate.py` | Sitio completo; llama solo a `web_biblioteca` al final |

## Comandos

```bash
cd /home/caper_mata/tienda_cristiana

python3 ebooks.py                 # maqueta TODOS los libros de ebooks_src/
python3 ebooks.py mi-primer-devocional   # maqueta solo uno (rápido para probar)
python3 generate.py               # regenera el sitio entero, biblioteca incluida

git add -A && git commit -m "..." && git push   # publica en luzygracia.com
```

El orden importa: primero `ebooks.py` (crea los PDF), después `generate.py`. Una ficha web
solo se publica si su PDF existe, para no anunciar descargas rotas.

## Agregar un libro nuevo

1. Añade su entrada al final de `ebooks_src/_CATALOGO.json` (slug, título, subtítulo,
   colección, eyebrow). Si usas una colección nueva, dale su color en `ACENTO` dentro de
   `ebooks.py`; si no, hereda el dorado de la marca.
2. Escribe `ebooks_src/<slug>.json` siguiendo `_ESQUEMA.md`.
3. `python3 ebooks.py <slug> && python3 generate.py`.

## Dónde se cambia el dinero y la causa

En `ebooks.py`, arriba del todo:

```python
DONA_NUM  = "3126295392"                       # Nequi / Daviplata / llave
DONA_URL  = "https://luzygracia.com/apoya.html"  # a dónde apunta el QR
FUNDACION = "Fundación El Alfarero"
```

Cambiar el número ahí lo cambia en los 50 PDF (hay que volver a maquetar) y en toda la web.

## Compromisos publicados

La página `/apoya.html` y la contraportada de cada PDF afirman dos cosas ante el público:

1. Lo recaudado por la biblioteca se entrega **completo** a la Fundación El Alfarero.
2. El **10 % de las ganancias** de la tienda va a fundaciones cristianas que trabajan
   con niños.

Están escritas como compromiso verificable y se ofrece enviar el soporte de la entrega a
quien lo pida por WhatsApp. Conviene guardar los comprobantes de cada giro a la fundación:
es lo que sostiene la promesa si alguien pregunta.
