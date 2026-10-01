'use strict';
/* Estudio Luz y Gracia — personalizador de biblias para el celular.
 *
 * Todo corre en el teléfono, sin servidor:
 *  - dibuja la tapa (color, grano, costura, cierre, canto) y el grabado con el
 *    acabado que hará el taller (foil, bajo relieve o láser);
 *  - arma la propuesta para el cliente: imagen + enlace donde puede corregir el
 *    texto y aprobar por WhatsApp;
 *  - arma la orden para el taller: ficha con medidas y archivo vectorial 1:1
 *    (PDF y SVG) sacado de las MISMAS curvas que se ven en pantalla.
 *
 * Unidades: el diseño vive en milímetros sobre la tapa (origen arriba a la
 * izquierda, y hacia abajo). La pantalla y los archivos solo escalan.
 * Los diseños se guardan en este teléfono (localStorage). El enlace al cliente
 * lleva el diseño dentro del propio enlace (#c=…): no hay base de datos, y la
 * orden al taller nunca lleva datos del cliente.
 */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtMm = v => (Math.round(v * 10) / 10).toLocaleString('es-CO');
const pesos = v => '$' + Math.round(v || 0).toLocaleString('es-CO');
const WA_JOHANA = '573126295392';
const LS_ACTUAL = 'lg_est_actual', LS_DIS = 'lg_est_disenos', LS_AJ = 'lg_est_ajustes', LS_CONT = 'lg_est_contador';

function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

/* ───────────────────────── Catálogos ───────────────────────── */

const FUENTES = {
  cinzel:     { n: 'Romana clásica',  fam: 'Cinzel SemiBold', f: 'cinzel.ttf' },
  marcellus:  { n: 'Grabado',         fam: 'Marcellus', f: 'marcellus.ttf' },
  cormorant:  { n: 'Garamond',        fam: 'Cormorant Garamond SemiBold', f: 'cormorant.ttf' },
  playfair:   { n: 'Elegante',        fam: 'Playfair Display SemiBold Italic', f: 'playfair-italic.ttf' },
  montserrat: { n: 'Moderna',         fam: 'Montserrat SemiBold', f: 'montserrat.ttf' },
  pinyon:     { n: 'Caligrafía fina', fam: 'Pinyon Script', f: 'pinyon.ttf', script: 1 },
  greatvibes: { n: 'Caligrafía',      fam: 'Great Vibes', f: 'greatvibes.ttf', script: 1 },
  parisienne: { n: 'Manuscrita',      fam: 'Parisienne', f: 'parisienne.ttf', script: 1 },
  fraktur:    { n: 'Gótica',          fam: 'UnifrakturMaguntia', f: 'fraktur.ttf' },
};

const ACABADOS = {
  oro:     { n: 'Dorado',       tipo: 'foil', tec: 'Estampado en caliente · foil dorado', cli: 'letras doradas estampadas en caliente',
             stops: ['#7d571a', '#d9b65c', '#fbeaa9', '#b98b2d', '#f1d88e', '#8f6721'] },
  plata:   { n: 'Plateado',     tipo: 'foil', tec: 'Estampado en caliente · foil plateado', cli: 'letras plateadas estampadas en caliente',
             stops: ['#6c6f73', '#c7cace', '#f8f9fb', '#989ba0', '#e5e7ea', '#7a7d81'] },
  rosa:    { n: 'Oro rosa',     tipo: 'foil', tec: 'Estampado en caliente · foil oro rosa', cli: 'letras en oro rosa estampadas en caliente',
             stops: ['#86503f', '#d69d8b', '#f7d7cb', '#b5715d', '#ebbfae', '#935848'] },
  blanco:  { n: 'Blanco',       tipo: 'pig', col: '#f2eee5', tec: 'Estampado en caliente · foil blanco', cli: 'letras blancas estampadas en caliente' },
  negro:   { n: 'Negro',        tipo: 'pig', col: '#151515', tec: 'Estampado en caliente · foil negro', cli: 'letras negras estampadas en caliente' },
  relieve: { n: 'Bajo relieve', tipo: 'relieve', tec: 'Bajo relieve en seco (golpe sin color)', cli: 'bajo relieve: letras hundidas, sin color' },
  laser:   { n: 'Láser',        tipo: 'laser', tec: 'Grabado láser', cli: 'grabado láser' },
};
const DESC_ACABADO = {
  foil: 'Estampado en caliente: una placa caliente presiona una lámina metálica sobre la tapa. Es el acabado clásico de biblia.',
  pig: 'Estampado en caliente con lámina de color. Da contraste fuerte en tapas oscuras (blanco) o claras (negro).',
  relieve: 'Golpe en seco sin lámina: las letras quedan hundidas en el mismo color de la tapa. Sobrio; se ve mejor en tapas medias y oscuras.',
  laser: 'El láser quema la superficie y deja el trazo más oscuro. Permite letra muy pequeña. En símil piel confirma con el taller que trabaja PU: algunos solo graban cuero genuino.',
};

const COLORES = [
  ['#1d1d20', 'Negro'], ['#3b2a22', 'Café oscuro'], ['#6a4027', 'Café'], ['#8b5a2b', 'Café miel'],
  ['#4b3428', 'Moka'], ['#5b1a24', 'Vino'], ['#1f2d4d', 'Azul noche'], ['#3a4630', 'Verde oliva'],
  ['#c9a24b', 'Mostaza'], ['#d9a7a9', 'Rosa palo'], ['#d8c8ae', 'Beige'], ['#efe9df', 'Blanco perla'],
];
const TAMANOS = [['Bolsillo', 95, 135], ['Compacta', 120, 170], ['Manual', 145, 210], ['Letra grande', 165, 240]];
const ESTADOS = [['cotizado', 'Cotizado'], ['aprobado', 'Aprobado'], ['anticipo', 'Anticipo recibido'],
  ['taller', 'En el taller'], ['listo', 'Listo'], ['entregado', 'Entregado']];
const ROLES = { nombre: 'Nombre', fecha: 'Fecha / ocasión', versiculo: 'Versículo', titulo: 'Título', libre: 'Texto', cita: 'Cita' };
const MARCOS = [['no', 'Sin marco'], ['simple', 'Filete'], ['doble', 'Doble filete'], ['esquinas', 'Esquinas']];
const ORDEN_ICONOS = ['cruz', 'cruzfina', 'paloma', 'resplandor', 'laurel', 'olivo', 'filete', 'corona', 'corazon', 'espiga',
  'llama', 'manos', 'biblia', 'iglesia', 'ancla', 'estrella', 'anillo', 'infinito', 'gota', 'brote', 'pluma'];

/* ───────────────────────── Fuentes ───────────────────────── */

const F = {};
async function cargarFuentes() {
  await Promise.all(Object.entries(FUENTES).map(async ([k, v]) => {
    const r = await fetch('f/' + v.f);
    if (!r.ok) throw new Error('No cargó la fuente ' + v.f);
    const buf = await r.arrayBuffer();
    const font = opentype.parse(buf.slice(0));
    F[k] = font;
    const cap = font.tables.os2 && font.tables.os2.sCapHeight;
    v.cap = (cap || font.unitsPerEm * 0.7) / font.unitsPerEm;
    try { const ff = new FontFace('lg-' + k, buf); await ff.load(); document.fonts.add(ff); } catch (e) { /* solo afecta la vista de los botones */ }
  }));
}

/* ───────────────────────── Geometría ─────────────────────────
   Un trazo es una lista de comandos absolutos:
   ['M',x,y] ['L',x,y] ['Q',x1,y1,x,y] ['C',x1,y1,x2,y2,x,y] ['Z']            */

function mapear(cmds, a, b, c, d, e, f) {           // x' = a·x + c·y + e ; y' = b·x + d·y + f
  return cmds.map(k => {
    if (k[0] === 'Z') return ['Z'];
    const o = [k[0]];
    for (let i = 1; i < k.length; i += 2) { const x = k[i], y = k[i + 1]; o.push(a * x + c * y + e, b * x + d * y + f); }
    return o;
  });
}

function caja(cmds) {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, px = 0, py = 0;
  const add = (x, y) => { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; };
  for (const k of cmds) {
    const t = k[0];
    if (t === 'M' || t === 'L') { add(k[1], k[2]); px = k[1]; py = k[2]; }
    else if (t === 'Q') {
      for (const s of [.25, .5, .75]) { const u = 1 - s; add(u * u * px + 2 * u * s * k[1] + s * s * k[3], u * u * py + 2 * u * s * k[2] + s * s * k[4]); }
      add(k[3], k[4]); px = k[3]; py = k[4];
    } else if (t === 'C') {
      for (const s of [.2, .4, .6, .8]) {
        const u = 1 - s;
        add(u * u * u * px + 3 * u * u * s * k[1] + 3 * u * s * s * k[3] + s * s * s * k[5],
            u * u * u * py + 3 * u * u * s * k[2] + 3 * u * s * s * k[4] + s * s * s * k[6]);
      }
      add(k[5], k[6]); px = k[5]; py = k[6];
    }
  }
  if (x1 === Infinity) return null;
  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

function aPath2D(cmds) {
  const p = new Path2D();
  for (const k of cmds) {
    switch (k[0]) {
      case 'M': p.moveTo(k[1], k[2]); break;
      case 'L': p.lineTo(k[1], k[2]); break;
      case 'Q': p.quadraticCurveTo(k[1], k[2], k[3], k[4]); break;
      case 'C': p.bezierCurveTo(k[1], k[2], k[3], k[4], k[5], k[6]); break;
      case 'Z': p.closePath(); break;
    }
  }
  return p;
}

function parseD(d) {
  const t = d.split(' '), n = { M: 2, L: 2, Q: 4, C: 6, Z: 0 }, out = [];
  let i = 0;
  while (i < t.length) { const op = t[i++]; const k = [op]; for (let j = 0; j < n[op]; j++) k.push(parseFloat(t[i++])); out.push(k); }
  return out;
}

// Todas las piezas propias van con el mismo sentido de giro: así la regla
// «nonzero» las une en vez de abrir huecos donde una hoja pisa el tallo.
function subtrazos(cmds) {
  const subs = []; let cur = null;
  for (const k of cmds) { if (k[0] === 'M') { cur = [k]; subs.push(cur); } else if (cur) cur.push(k); }
  return subs;
}
function area(sub) {
  const pts = [];
  for (const k of sub) if (k[0] !== 'Z') for (let i = 1; i < k.length; i += 2) pts.push([k[i], k[i + 1]]);
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}
function invertir(sub) {
  const segs = []; let px = sub[0][1], py = sub[0][2];
  for (const k of sub.slice(1)) {
    if (k[0] === 'Z') continue;
    segs.push({ k, de: [px, py] });
    px = k[k.length - 2]; py = k[k.length - 1];
  }
  const out = [['M', px, py]];
  for (let i = segs.length - 1; i >= 0; i--) {
    const { k, de } = segs[i];
    if (k[0] === 'L') out.push(['L', de[0], de[1]]);
    else if (k[0] === 'Q') out.push(['Q', k[1], k[2], de[0], de[1]]);
    else if (k[0] === 'C') out.push(['C', k[3], k[4], k[1], k[2], de[0], de[1]]);
  }
  out.push(['Z']);
  return out;
}
function orientar(cmds, positivo = true) { return subtrazos(cmds).flatMap(s => (area(s) > 0) === positivo ? s : invertir(s)); }

const poligono = pts => [['M', pts[0][0], pts[0][1]], ...pts.slice(1).map(p => ['L', p[0], p[1]]), ['Z']];
function elipse(cx, cy, rx, ry) {
  const k = 0.5523;
  return [['M', cx + rx, cy], ['C', cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry],
    ['C', cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy], ['C', cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry],
    ['C', cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy], ['Z']];
}
function hoja(bx, by, ux, uy, L, A) {              // hoja desde (bx,by) hacia (ux,uy), largo L, ancho A
  const nx = -uy, ny = ux, mx = bx + ux * L * .5, my = by + uy * L * .5;
  return [['M', bx, by], ['Q', mx + nx * A, my + ny * A, bx + ux * L, by + uy * L], ['Q', mx - nx * A, my - ny * A, bx, by], ['Z']];
}

function resplandor() {
  const o = [], N = 36;
  for (let i = 0; i < N; i++) {
    const a = i / N * 2 * Math.PI - Math.PI / 2, r1 = 30, r2 = i % 2 ? 76 : 100, d = Math.PI / N * .55;
    o.push(...poligono([[Math.cos(a - d) * r1, Math.sin(a - d) * r1], [Math.cos(a) * r2, Math.sin(a) * r2], [Math.cos(a + d) * r1, Math.sin(a + d) * r1]]));
  }
  return orientar(o);
}

function laurel() {
  const o = [], R = 100, g = Math.PI / 180;
  for (const s of [1, -1]) {
    const th = t => (90 + s * (12 + t * 140)) * g;
    const P = (t, r = R) => [Math.cos(th(t)) * r, Math.sin(th(t)) * r];
    const ext = [], int = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, gr = 1.4 * (1 - .6 * t); ext.push(P(t, R + gr)); int.push(P(t, R - gr)); }
    o.push(...poligono(ext.concat(int.reverse())));
    for (let i = 0; i < 9; i++) {
      const t = .06 + i * .105, [x, y] = P(t), a = th(t);
      const gx = s * -Math.sin(a), gy = s * Math.cos(a), rx = Math.cos(a), ry = Math.sin(a);
      const L = 27 * (1 - .35 * t), A = 11 * (1 - .3 * t), ang = 36 * g;
      for (const lado of [1, -1]) {
        let ux = gx * Math.cos(ang) + rx * Math.sin(ang) * lado, uy = gy * Math.cos(ang) + ry * Math.sin(ang) * lado;
        const m = Math.hypot(ux, uy); o.push(...hoja(x, y, ux / m, uy / m, L, A));
      }
    }
    const [x, y] = P(1), a = th(1);
    o.push(...hoja(x, y, s * -Math.sin(a), s * Math.cos(a), 21, 9));
  }
  return orientar(o);
}

function olivo() {
  const o = [], g = Math.PI / 180;
  const P = t => [-100 + 200 * t, -14 * Math.sin(Math.PI * t)];
  const ext = [], int = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, gr = 1.5 * (1 - .55 * t), [x, y] = P(t); ext.push([x, y - gr]); int.push([x, y + gr]); }
  o.push(...poligono(ext.concat(int.reverse())));
  for (let i = 0; i < 8; i++) {
    const t = .1 + i * .11, [x, y] = P(t), dx = 200, dy = -14 * Math.PI * Math.cos(Math.PI * t);
    const m = Math.hypot(dx, dy), gx = dx / m, gy = dy / m, lado = i % 2 ? 1 : -1, ang = 42 * g;
    const ux = gx * Math.cos(ang) + (-gy) * Math.sin(ang) * lado, uy = gy * Math.cos(ang) + gx * Math.sin(ang) * lado;
    o.push(...hoja(x, y, ux, uy, 31 * (1 - .25 * t), 10));
  }
  for (const [t, l] of [[.28, 1], [.5, -1], [.72, 1]]) { const [x, y] = P(t); o.push(...elipse(x + 5, y + l * 7.5, 5, 6.5)); }
  const [x, y] = P(1);
  o.push(...hoja(x - 1, y, .99, -.12, 22, 9));
  return orientar(o);
}

function filete() {
  const o = [...poligono([[0, -6], [6, 0], [0, 6], [-6, 0]])];
  for (const s of [1, -1]) o.push(['M', s * 9, 0], ['Q', s * 52, -3, s * 100, 0], ['Q', s * 52, 3, s * 9, 0], ['Z']);
  return orientar(o);
}

function cruzFina() {
  const t = 4, w = 32, arm = 30, bot = 100;
  return orientar(poligono([[-t, 0], [t, 0], [t, arm - t], [w, arm - t], [w, arm + t], [t, arm + t], [t, bot], [-t, bot],
    [-t, arm + t], [-w, arm + t], [-w, arm - t], [-t, arm - t]]));
}

const ICONOS = {};
function prepararIconos() {
  for (const [k, v] of Object.entries(ICONOS_FA)) ICONOS[k] = { n: v.n, cmds: parseD(v.d) };
  ICONOS.cruzfina = { n: 'Cruz fina', cmds: cruzFina() };
  ICONOS.resplandor = { n: 'Resplandor', cmds: resplandor() };
  ICONOS.laurel = { n: 'Corona de laurel', cmds: laurel() };
  ICONOS.olivo = { n: 'Rama de olivo', cmds: olivo() };
  ICONOS.filete = { n: 'Filete con rombo', cmds: filete() };
  for (const v of Object.values(ICONOS)) v.bb = caja(v.cmds);
}

function rrect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2)); const k = .5523 * r;
  return [['M', x + r, y], ['L', x + w - r, y], ['C', x + w - r + k, y, x + w, y + r - k, x + w, y + r], ['L', x + w, y + h - r],
    ['C', x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h], ['L', x + r, y + h],
    ['C', x + r - k, y + h, x, y + h - r + k, x, y + h - r], ['L', x, y + r], ['C', x, y + r - k, x + r - k, y, x + r, y], ['Z']];
}
const anilloRect = (x, y, w, h, r, g) => orientar(rrect(x, y, w, h, r), true).concat(orientar(rrect(x + g, y + g, w - 2 * g, h - 2 * g, Math.max(0, r - g)), false));

function geomMarco(tipo, m, W, H) {
  if (tipo === 'simple') return anilloRect(m, m, W - 2 * m, H - 2 * m, 2.5, .7);
  if (tipo === 'doble') return anilloRect(m, m, W - 2 * m, H - 2 * m, 2.5, .9).concat(anilloRect(m + 2.2, m + 2.2, W - 2 * m - 4.4, H - 2 * m - 4.4, 1.3, .4));
  if (tipo === 'esquinas') {
    const L = Math.min(W, H) * .17, t = .9;
    const esquina = (sx, sy, ox, oy) => {
      const P = (x, y) => [ox + sx * x, oy + sy * y];
      return [poligono([P(0, 0), P(L, 0), P(L, t), P(t, t), P(t, L), P(0, L)]),
        poligono([P(2.4, 2.4), P(L * .62, 2.4), P(L * .62, 2.9), P(2.9, 2.9), P(2.9, L * .62), P(2.4, L * .62)]),
        poligono([P(5, 3.6), P(6.4, 5), P(5, 6.4), P(3.6, 5)])].flatMap(p => orientar(p, true));
    };
    return [...esquina(1, 1, m, m), ...esquina(-1, 1, W - m, m), ...esquina(1, -1, m, H - m), ...esquina(-1, -1, W - m, H - m)];
  }
  return [];
}

const textoVisible = el => { const s = String(el.s || ''); return el.up ? s.toLocaleUpperCase('es') : s; };

function geomTexto(el) {
  const font = F[el.f], meta = FUENTES[el.f];
  if (!font) return [];
  const size = el.mm / meta.cap;                   // tamaño de letra para que la MAYÚSCULA mida el.mm
  const lineas = textoVisible(el).split('\n');
  const inter = el.mm * (meta.script ? 2.4 : 1.95) * (el.lh || 1);
  const alto = el.mm + (lineas.length - 1) * inter;
  const arriba = el.y - alto / 2;
  const out = [];
  lineas.forEach((ln, i) => {
    if (!ln.trim()) return;
    const op = { kerning: true, letterSpacing: el.ls || 0 };
    const w = font.getAdvanceWidth(ln, size, op) - (el.ls || 0) * size;
    const p = font.getPath(ln, el.x - w / 2, arriba + el.mm + i * inter, size, op);
    for (const c of p.commands) {
      switch (c.type) {
        case 'M': out.push(['M', c.x, c.y]); break;
        case 'L': out.push(['L', c.x, c.y]); break;
        case 'Q': out.push(['Q', c.x1, c.y1, c.x, c.y]); break;
        case 'C': out.push(['C', c.x1, c.y1, c.x2, c.y2, c.x, c.y]); break;
        case 'Z': out.push(['Z']); break;
      }
    }
  });
  return out;
}

function geomElemento(el) {
  if (el.t === 'txt') return geomTexto(el);
  const ic = ICONOS[el.k];
  if (!ic) return [];
  const b = ic.bb, s = el.mm / Math.max(b.w, b.h), fx = el.fx ? -1 : 1;
  return mapear(ic.cmds, s * fx, 0, 0, s, el.x - b.cx * s * fx, el.y - b.cy * s);
}

function geomDiseno(d) {
  const out = [];
  if (d.marco && d.marco !== 'no') { const c = geomMarco(d.marco, d.mMarco, d.W, d.H); out.push({ el: null, i: -1, cmds: c, bb: caja(c) }); }
  d.el.forEach((el, i) => { const c = geomElemento(el); out.push({ el, i, cmds: c, bb: caja(c) }); });
  return out;
}

/* ───────────────────────── Color ───────────────────────── */

function hexRgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const rgbHex = a => '#' + a.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mezclar(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * t)); }
function luz(hex) { const [r, g, b] = hexRgb(hex).map(v => v / 255); return .2126 * r + .7152 * g + .0722 * b; }
function rgba(hex, a) { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
const colorLaser = base => luz(base) < .2 ? '#9b8a78' : mezclar(base, '#1b1009', .74);

/* ───────────────────────── Texturas ───────────────────────── */

function ruidoValor(escala, semilla) {
  const N = 64, t = new Float32Array(N * N); let s = semilla;
  for (let i = 0; i < N * N; i++) { s = (s * 16807) % 2147483647; t[i] = s / 2147483647 * 2 - 1; }
  const sm = x => x * x * (3 - 2 * x);
  return (x, y) => {
    const fx = x / escala, fy = y / escala, i = Math.floor(fx), j = Math.floor(fy), u = sm(fx - i), v = sm(fy - j);
    const a = t[(j & 63) * N + (i & 63)], b = t[(j & 63) * N + ((i + 1) & 63)], c = t[((j + 1) & 63) * N + (i & 63)], d = t[((j + 1) & 63) * N + ((i + 1) & 63)];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
}

const TEX = new Map();
function textura(wpx, hpx, k, color, tipo) {
  const key = [wpx, hpx, Math.round(k * 100), color, tipo].join('|');
  if (TEX.has(key)) return TEX.get(key);
  if (TEX.size > 8) TEX.clear();
  const c = document.createElement('canvas'); c.width = wpx; c.height = hpx;
  const g = c.getContext('2d'), img = g.createImageData(wpx, hpx), d = img.data;
  const [R, G, B] = hexRgb(color), L = luz(color), fuerza = L > .6 ? .5 : 1, suma = 95 * (1 - L) * (1 - L);
  const m1 = ruidoValor(Math.max(8, 9 * k), 777), m2 = ruidoValor(Math.max(4, 3.2 * k), 4242);
  const cel = Math.max(2.4, .8 * k), gx = Math.ceil(wpx / cel) + 1, gy = Math.ceil(hpx / cel) + 1;
  let sem = 12345; const rnd = () => ((sem = (sem * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const px = new Float32Array(gx * gy), py = new Float32Array(gx * gy);
  for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) { px[j * gx + i] = (i + rnd()) * cel; py[j * gx + i] = (j + rnd()) * cel; }
  for (let y = 0; y < hpx; y++) {
    for (let x = 0; x < wpx; x++) {
      let v = (m1(x, y) * .7 + m2(x, y) * .3) * .08 * fuerza + (rnd() - .5) * .03;
      if (tipo === 'grano') {
        let f1 = 1e9, f2 = 1e9; const ci = Math.floor(x / cel), cj = Math.floor(y / cel);
        for (let j = cj - 1; j <= cj + 1; j++) {
          if (j < 0 || j >= gy) continue;
          for (let i = ci - 1; i <= ci + 1; i++) {
            if (i < 0 || i >= gx) continue;
            const dx = px[j * gx + i] - x, dy = py[j * gx + i] - y, dd = dx * dx + dy * dy;
            if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
          }
        }
        f1 = Math.sqrt(f1); f2 = Math.sqrt(f2);
        const borde = Math.min(1, (f2 - f1) / (cel * .3));
        v += ((borde - 1) * .21 + (1 - f1 / cel) * .07) * fuerza;
      }
      const o = (y * wpx + x) * 4;
      d[o] = R * (1 + v) + v * suma; d[o + 1] = G * (1 + v) + v * suma; d[o + 2] = B * (1 + v) + v * suma; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  TEX.set(key, c);
  return c;
}

let GRANO_FOIL = null;
function granoFoil() {
  if (GRANO_FOIL) return GRANO_FOIL;
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d'), im = g.createImageData(96, 96);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  GRANO_FOIL = c;
  return c;
}

/* ───────────────────────── Dibujo ───────────────────────── */

function trazarRR(g, x, y, w, h, r) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }

function dibujarLibro(g, d, bx, by, k) {
  const W = d.W * k, H = d.H * k, r = 5 * k, col = d.col, L = luz(col);
  const oscuro = mezclar(col, '#000', .35);
  // sombra de apoyo
  g.save();
  g.shadowColor = 'rgba(45,30,10,.38)'; g.shadowBlur = 7 * k; g.shadowOffsetY = 3 * k; g.shadowOffsetX = 1 * k;
  g.fillStyle = oscuro; trazarRR(g, bx + 2.6 * k, by + 2.6 * k, W, H, r); g.fill();
  g.restore();
  // contratapa y canto (grosor del libro)
  g.fillStyle = oscuro; trazarRR(g, bx + 2.6 * k, by + 2.6 * k, W, H, r); g.fill();
  if (d.cierre) {
    g.fillStyle = mezclar(col, '#000', .5); trazarRR(g, bx + 1.6 * k, by + 1.6 * k, W, H, r); g.fill();
    g.save(); g.fillStyle = '#b8964f';
    for (let y = by + 8 * k; y < by + H; y += 1.05 * k) g.fillRect(bx + W + .35 * k, y, 1.5 * k, .55 * k);
    for (let x = bx + 12 * k; x < bx + W; x += 1.05 * k) g.fillRect(x, by + H + .35 * k, .55 * k, 1.5 * k);
    g.restore();
  } else {
    const pg = g.createLinearGradient(bx + W, by, bx + W + 2 * k, by + H);
    if (d.canto) { pg.addColorStop(0, '#9c7424'); pg.addColorStop(.35, '#f3dc93'); pg.addColorStop(.7, '#c29436'); pg.addColorStop(1, '#8a651f'); }
    else { pg.addColorStop(0, '#e9e1cf'); pg.addColorStop(1, '#cfc4ab'); }
    g.fillStyle = pg; trazarRR(g, bx + 1.7 * k, by + 1.7 * k, W - .4 * k, H - .4 * k, r * .6); g.fill();
    g.save(); g.strokeStyle = d.canto ? 'rgba(90,60,10,.25)' : 'rgba(120,105,80,.25)'; g.lineWidth = Math.max(.5, .12 * k);
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(bx + W + i * .35 * k, by + 4 * k); g.lineTo(bx + W + i * .35 * k, by + H); g.stroke();
      g.beginPath(); g.moveTo(bx + 4 * k, by + H + i * .35 * k); g.lineTo(bx + W, by + H + i * .35 * k); g.stroke();
    }
    g.restore();
  }
  // tapa
  g.save();
  trazarRR(g, bx, by, W, H, r); g.clip();
  g.drawImage(textura(Math.ceil(W), Math.ceil(H), k, col, d.tex), bx, by);
  let gr = g.createLinearGradient(bx, by, bx + W, by + H);
  gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.16)');
  g.fillStyle = gr; g.fillRect(bx, by, W, H);
  gr = g.createRadialGradient(bx + W * .5, by + H * .45, Math.min(W, H) * .35, bx + W * .5, by + H * .5, Math.max(W, H) * .75);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${L > .6 ? .12 : .28})`);
  g.fillStyle = gr; g.fillRect(bx, by, W, H);
  if (d.lomo) {
    const x = bx + 9 * k;
    gr = g.createLinearGradient(x - 1.4 * k, 0, x + 2 * k, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.4, 'rgba(0,0,0,.30)'); gr.addColorStop(.55, 'rgba(255,255,255,.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - 1.4 * k, by, 3.4 * k, H);
    gr = g.createLinearGradient(bx, 0, x, 0);
    gr.addColorStop(0, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(bx, by, 9 * k, H);
  }
  if (d.cierre) {                                  // cinta del cierre sobre el borde
    g.strokeStyle = rgba(mezclar(col, '#000', .3), .9); g.lineWidth = 2.2 * k;
    g.beginPath(); g.moveTo(bx + 12 * k, by + 1.1 * k); g.lineTo(bx + W - 1.1 * k, by + 1.1 * k); g.lineTo(bx + W - 1.1 * k, by + H - 1.1 * k); g.lineTo(bx + 12 * k, by + H - 1.1 * k); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = .3 * k;
    g.beginPath(); g.moveTo(bx + 12 * k, by + 2.3 * k); g.lineTo(bx + W - 2.3 * k, by + 2.3 * k); g.lineTo(bx + W - 2.3 * k, by + H - 2.3 * k); g.lineTo(bx + 12 * k, by + H - 2.3 * k); g.stroke();
  }
  g.restore();
  // bisel del borde
  g.save();
  g.lineWidth = .7 * k; g.strokeStyle = 'rgba(255,255,255,.10)'; trazarRR(g, bx + .5 * k, by + .5 * k, W - k, H - k, r * .9); g.stroke();
  g.lineWidth = .45 * k; g.strokeStyle = 'rgba(0,0,0,.45)'; trazarRR(g, bx, by, W, H, r); g.stroke();
  g.restore();
  // costura
  if (d.costura) {
    const ins = (d.cierre ? 5.2 : 3.3) * k, hilo = L > .55 ? mezclar(col, '#000', .32) : mezclar(col, '#fff', .28);
    g.save(); g.setLineDash([2.3 * k, 1.25 * k]); g.lineCap = 'round';
    g.lineWidth = .45 * k; g.strokeStyle = 'rgba(0,0,0,.35)'; trazarRR(g, bx + ins, by + ins + .18 * k, W - 2 * ins, H - 2 * ins, r * .6); g.stroke();
    g.lineWidth = .36 * k; g.strokeStyle = hilo; trazarRR(g, bx + ins, by + ins, W - 2 * ins, H - 2 * ins, r * .6); g.stroke();
    g.restore();
  }
  // tirador del cierre
  if (d.cierre) {
    g.save(); g.translate(bx + W - 3 * k, by + 5 * k); g.rotate(-.5);
    const tg = g.createLinearGradient(-2.5 * k, 0, 2.5 * k, 0);
    tg.addColorStop(0, '#8a6a2c'); tg.addColorStop(.45, '#f0d895'); tg.addColorStop(1, '#9c7a35');
    g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 1.2 * k; g.shadowOffsetY = .6 * k;
    g.fillStyle = tg; trazarRR(g, -2.3 * k, 0, 4.6 * k, 10 * k, 1.6 * k); g.fill();
    g.shadowColor = 'transparent'; g.fillStyle = mezclar(col, '#000', .4); trazarRR(g, -.9 * k, 6.3 * k, 1.8 * k, 2.4 * k, .9 * k); g.fill();
    g.restore();
  }
}

function sombraInterior(o, pathMm, d, k, color, dyMm, blurMm) {
  const inv = new Path2D(); inv.rect(-60, -60, d.W + 120, d.H + 120); inv.addPath(pathMm);
  o.save();
  o.shadowColor = color; o.shadowBlur = blurMm * k; o.shadowOffsetY = dyMm * k; o.shadowOffsetX = 0;
  o.fillStyle = color; o.fill(inv, 'evenodd');
  o.restore();
}

let LIENZO = null;
function dibujarArte(g, d, geo, bx, by, k, base) {
  const piezas = geo.filter(x => x.cmds.length);
  if (!piezas.length) return;
  const cw = g.canvas.width, ch = g.canvas.height, fin = ACABADOS[d.fin] || ACABADOS.oro;
  const paths = piezas.map(x => aPath2D(x.cmds));
  const todo = new Path2D(); paths.forEach(p => todo.addPath(p));
  // huella del golpe sobre la tapa (salvo láser)
  if (fin.tipo !== 'laser') {
    g.save(); g.setTransform(k, 0, 0, k, bx, by);
    g.shadowColor = 'rgba(255,255,255,.18)'; g.shadowOffsetY = .28 * k; g.shadowBlur = .25 * k;
    g.fillStyle = 'rgba(0,0,0,.35)'; paths.forEach(p => g.fill(p));
    g.restore();
  }
  if (!LIENZO) LIENZO = document.createElement('canvas');
  const off = LIENZO; off.width = cw; off.height = ch;
  const o = off.getContext('2d');
  o.setTransform(k, 0, 0, k, bx, by);
  if (fin.tipo === 'foil') {
    const gr = o.createLinearGradient(0, 0, d.W * .8, d.H);
    fin.stops.forEach((c, i) => gr.addColorStop(i / (fin.stops.length - 1), c));
    o.fillStyle = gr;
  } else if (fin.tipo === 'pig') o.fillStyle = fin.col;
  else if (fin.tipo === 'relieve') o.fillStyle = mezclar(base, '#000', luz(base) < .12 ? .55 : .42);
  else o.fillStyle = colorLaser(base);
  paths.forEach(p => o.fill(p));
  o.globalCompositeOperation = 'source-atop';
  if (fin.tipo === 'foil') {
    const b = o.createLinearGradient(0, d.H * .15, d.W, d.H * .55);
    b.addColorStop(0, 'rgba(255,255,255,0)'); b.addColorStop(.47, 'rgba(255,255,255,.30)'); b.addColorStop(.53, 'rgba(255,255,255,.05)'); b.addColorStop(1, 'rgba(255,255,255,0)');
    o.fillStyle = b; o.fillRect(-10, -10, d.W + 20, d.H + 20);
  }
  o.save(); o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = fin.tipo === 'laser' ? .22 : fin.tipo === 'foil' ? .10 : .07;
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = o.createPattern(granoFoil(), 'repeat'); o.fillRect(0, 0, cw, ch);
  o.restore();
  if (fin.tipo === 'relieve') {
    sombraInterior(o, todo, d, k, 'rgba(0,0,0,.85)', .45, .5);
    sombraInterior(o, todo, d, k, 'rgba(255,255,255,.32)', -.32, .35);
  } else if (fin.tipo !== 'laser') {
    sombraInterior(o, todo, d, k, 'rgba(0,0,0,.5)', .28, .3);
    sombraInterior(o, todo, d, k, 'rgba(255,255,255,.18)', -.2, .2);
  }
  o.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (fin.tipo === 'laser') { g.shadowColor = rgba(colorLaser(base), .5); g.shadowBlur = .5 * k; }
  g.drawImage(off, 0, 0);
  g.restore();
}

function layoutFoto(cw, ch, d) {
  const im = FOTO.img, iw = im.width, ih = im.height, s = Math.min(cw / iw, ch / ih);
  const ox = (cw - iw * s) / 2, oy = (ch - ih * s) / 2;
  return { s, ox, oy, iw: iw * s, ih: ih * s, k: FOTO.r.w * s / d.W, bx: ox + FOTO.r.x * s, by: oy + FOTO.r.y * s };
}

// Dibuja la escena completa en un lienzo de cw×ch px. Devuelve la escala para tocar y medir.
function escena(g, cw, ch, d, opt = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
  let bx, by, k, base = d.col, lf = null;
  if (FOTO && !opt.sinFoto) {
    lf = layoutFoto(cw, ch, d); ({ bx, by, k } = lf);
    g.drawImage(FOTO.img, lf.ox, lf.oy, lf.iw, lf.ih);
    base = FOTO.prom || base;
  } else {
    const pad = opt.pad != null ? opt.pad : Math.min(cw, ch) * .07, ext = 2.6;
    k = Math.min((cw - 2 * pad) / (d.W + ext), (ch - 2 * pad) / (d.H + ext));
    bx = (cw - (d.W + ext) * k) / 2; by = (ch - (d.H + ext) * k) / 2;
    dibujarLibro(g, d, bx, by, k);
  }
  const geo = geomDiseno(d);
  dibujarArte(g, d, geo, bx, by, k, base);
  g.restore();
  return { bx, by, k, geo, lf };
}

/* ───────────────────────── Estado ───────────────────────── */

let st = null, sel = -1, sucio = false, FOTO = null, ajustando = false, MODO_CLIENTE = false, CLI_PUBLICO = false;
let aj = Object.assign({ wa: WA_JOHANA, taller: '', tallerTel: '', anticipo: 50, medidas: {} }, lsGet(LS_AJ, {}));
const guardarAjustes = () => lsSet(LS_AJ, aj);

const pad2 = n => String(n).padStart(2, '0');
function nuevoId() {
  const d = new Date(), ymd = String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate());
  const c = lsGet(LS_CONT, {}); c[ymd] = (c[ymd] || 0) + 1;
  for (const key of Object.keys(c)) if (key !== ymd) delete c[key];
  lsSet(LS_CONT, c);
  return `LG-${ymd}-${pad2(c[ymd])}`;
}

const T = (r, s, f, mm, x, y, ls = 0) => ({ t: 'txt', r, s, f, mm, x, y, ls, lh: 1 });
const I = (k, mm, x, y) => ({ t: 'ico', k, mm, x, y });

const PLANTILLAS = [
  { k: 'clasica', n: 'Clásica', f: (W, H, e) => [T('titulo', 'SANTA BIBLIA', 'cinzel', 6 * e.z, W / 2, H * .2, .14), I('cruzfina', 21 * e.z, W / 2, H * .43), T('nombre', e.nom, 'pinyon', 9.5 * e.z, W / 2, H * .8)] },
  { k: 'nombre', n: 'Solo nombre', f: (W, H, e) => [T('nombre', e.nom, 'cormorant', 6 * e.z, W / 2, H * .86, .04)] },
  { k: 'bautizo', n: 'Bautizo', f: (W, H, e) => [I('paloma', 24 * e.z, W / 2, H * .3), T('nombre', e.nom, 'greatvibes', 10 * e.z, W / 2, H * .6), T('fecha', e.fecha || 'Bautizo · 12 de octubre de 2026', 'cormorant', 3.8 * e.z, W / 2, H * .7, .04)] },
  { k: 'pastor', n: 'Pastor', f: (W, H, e) => [I('laurel', W * .44, W / 2, H * .36), I('cruzfina', W * .15, W / 2, H * .355), T('titulo', 'PASTOR', 'cinzel', 4.2 * e.z, W / 2, H * .7, .32), T('nombre', e.nom, 'cinzel', 6.5 * e.z, W / 2, H * .78, .06)] },
  { k: 'boda', n: 'Boda', marco: 'doble', f: (W, H, e) => [I('infinito', 20 * e.z, W / 2, H * .33), T('nombre', e.nom === 'Ana María' ? 'Juan & María' : e.nom, 'greatvibes', 10 * e.z, W / 2, H * .55), T('fecha', e.fecha || '12 · 10 · 2026', 'cinzel', 3.8 * e.z, W / 2, H * .65, .2)] },
  { k: 'quince', n: 'Quinceaños', f: (W, H, e) => [I('corona', 17 * e.z, W / 2, H * .3), T('nombre', e.nom, 'parisienne', 11 * e.z, W / 2, H * .55), T('titulo', 'MIS XV AÑOS', 'cinzel', 4 * e.z, W / 2, H * .645, .25)] },
  { k: 'versiculo', n: 'Versículo', f: (W, H, e) => [T('nombre', e.nom, 'pinyon', 9 * e.z, W / 2, H * .26), I('filete', W * .46, W / 2, H * .335), T('versiculo', 'Lámpara es a mis pies tu palabra,\ny lumbrera a mi camino.', 'cormorant', 3.6 * e.z, W / 2, H * .74), T('cita', 'SALMO 119:105', 'cinzel', 2.9 * e.z, W / 2, H * .835, .2)] },
  { k: 'marco', n: 'Con marco', marco: 'esquinas', f: (W, H, e) => [T('titulo', 'SANTA BIBLIA', 'cinzel', 6.5 * e.z, W / 2, H * .4, .12), I('filete', W * .4, W / 2, H * .47), T('nombre', e.nom, 'playfair', 6.5 * e.z, W / 2, H * .56)] },
];

function aplicarPlantilla(p, d = st) {
  const viejo = r => (d.el || []).find(e => e.t === 'txt' && e.r === r);
  const e = { nom: (viejo('nombre') || {}).s || 'Ana María', fecha: (viejo('fecha') || {}).s || '', z: clamp(d.W / 145, .72, 1.2) };
  d.el = p.f(d.W, d.H, e);
  d.marco = p.marco || 'no';
  d.plantilla = p.k;
}

function disenoNuevo(base) {
  const d = {
    v: 1, id: nuevoId(), m: 'otra', W: 145, H: 210, col: '#1d1d20', tex: 'grano', cierre: false, canto: true, costura: true, lomo: true,
    fin: 'oro', marco: 'no', mMarco: 8, el: [],
    ped: { cli: '', tel: '', oc: '', cant: 1, precio: 0, extra: 0, ant: aj.anticipo, entrega: '', notas: '', estado: 'cotizado', ver: true },
  };
  if (base) Object.assign(d, { m: base.m, W: base.W, H: base.H, col: base.col, tex: base.tex, cierre: base.cierre, canto: base.canto, costura: base.costura, lomo: base.lomo, fin: base.fin });
  const mod = CATALOGO.find(x => x.id === d.m);
  if (mod) d.ped.precio = mod.precio;
  aplicarPlantilla(PLANTILLAS[0], d);
  return d;
}

const total = () => (st.ped.cant || 0) * ((+st.ped.precio || 0) + (+st.ped.extra || 0));
const anticipo = () => Math.round(total() * (+st.ped.ant || 0) / 100 / 100) * 100;
const modelo = () => CATALOGO.find(x => x.id === st.m);
function nombreModelo(d = st) {
  const m = CATALOGO.find(x => x.id === d.m);
  return m ? m.n : (d.tex === 'liso' ? 'Biblia lisa' : 'Biblia en símil piel');
}
function nombreColor(d = st) {
  const c = COLORES.find(c => c[0] === d.col); if (c) return c[1];
  const m = CATALOGO.find(x => x.id === d.m); return m && m.color === d.col ? m.ncolor : `color ${d.col}`;
}

let tGuardar = 0;
function cambio(opts = {}) {
  sucio = true;
  pintar();
  if (!MODO_CLIENTE) { clearTimeout(tGuardar); tGuardar = setTimeout(() => lsSet(LS_ACTUAL, st), 400); }
  if (opts.listas) renderListas();
}

/* ───────────────────────── Vista previa ───────────────────────── */

const cv = $('#cv');
let L = null, guiaX = false, rafPend = false;

function pintar() {
  if (rafPend) return; rafPend = true;
  requestAnimationFrame(() => { rafPend = false; pintarYa(); });
}
function pintarYa() {
  if (!st) return;
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d');
  L = escena(g, w, h, st, { sinFoto: MODO_CLIENTE });
  // capas de ayuda (no salen en los archivos)
  g.save();
  if (ajustando && FOTO && L.lf) {
    const x = L.bx, y = L.by, W = st.W * L.k, H = st.H * L.k;
    g.fillStyle = 'rgba(10,14,28,.45)';
    g.beginPath(); g.rect(0, 0, w, h); g.rect(x, y, W, H); g.fill('evenodd');
    g.strokeStyle = '#e3c27e'; g.lineWidth = 2 * dpr; g.setLineDash([8 * dpr, 6 * dpr]); g.strokeRect(x, y, W, H);
    g.setLineDash([]); g.fillStyle = '#e3c27e';
    g.beginPath(); g.arc(x + W, y + H, 11 * dpr, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a2238'; g.font = `600 ${12 * dpr}px Jost,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('↘', x + W, y + H);
  } else if (!MODO_CLIENTE && sel >= 0) {
    const it = L.geo.find(x => x.i === sel);
    if (it && it.bb) {
      const b = it.bb, m = 1.2;
      g.strokeStyle = 'rgba(227,194,126,.95)'; g.lineWidth = 1.5 * dpr; g.setLineDash([5 * dpr, 4 * dpr]);
      g.strokeRect(L.bx + (b.x1 - m) * L.k, L.by + (b.y1 - m) * L.k, (b.w + 2 * m) * L.k, (b.h + 2 * m) * L.k);
    }
    if (guiaX) {
      g.strokeStyle = 'rgba(200,154,59,.9)'; g.lineWidth = 1 * dpr; g.setLineDash([3 * dpr, 3 * dpr]);
      g.beginPath(); g.moveTo(L.bx + st.W / 2 * L.k, L.by); g.lineTo(L.bx + st.W / 2 * L.k, L.by + st.H * L.k); g.stroke();
    }
  }
  g.restore();
  $('#badge').textContent = MODO_CLIENTE ? 'Vista previa' : `${ACABADOS[st.fin].n} · ${st.W} × ${st.H} mm${FOTO ? ' · foto real' : ''}`;
  if (!MODO_CLIENTE) mostrarAvisos();
}

function avisos() {
  const a = [], mS = st.cierre ? 7 : 5, lomo = st.lomo ? 11 : 4, fin = ACABADOS[st.fin];
  for (const it of L.geo) {
    if (!it.el || !it.bb) continue;
    const b = it.bb, nom = it.el.t === 'txt' ? `«${recorte(textoVisible(it.el))}»` : (ICONOS[it.el.k] || {}).n;
    if (b.x1 < lomo) a.push(`${nom} queda sobre la bisagra del lomo: muévelo a la derecha.`);
    else if (b.x1 < mS || b.x2 > st.W - mS || b.y1 < mS || b.y2 > st.H - mS) a.push(`${nom} queda muy cerca del borde${st.cierre ? ' o del cierre' : ''}: deja al menos ${mS} mm.`);
    if (it.el.t === 'txt') {
      if (FUENTES[it.el.f].script && it.el.mm < 5.5 && fin.tipo !== 'laser') a.push(`${nom}: caligrafía de ${fmtMm(it.el.mm)} mm en ${fin.n.toLowerCase()} puede empastarse; súbela a 6 mm o usa láser.`);
      else if (it.el.mm < 2.8) a.push(`${nom}: letra de menos de 3 mm, difícil de leer y de marcar.`);
    }
  }
  const Lb = luz(FOTO ? (FOTO.prom || st.col) : st.col);
  if (fin.tipo === 'relieve' && Lb > .55) a.push('El bajo relieve casi no se ve en tapas claras: mejor dorado o láser.');
  if (st.fin === 'blanco' && Lb > .7) a.push('Blanco sobre tapa clara casi no se ve.');
  if (st.fin === 'negro' && Lb < .15) a.push('Negro sobre tapa negra casi no se ve.');
  return a;
}
function mostrarAvisos() {
  const box = $('#avisos'); box.textContent = '';
  if (ajustando) return;
  avisos().slice(0, 2).forEach(t => { const d = document.createElement('div'); d.className = 'aviso'; d.textContent = '⚠︎ ' + t; box.appendChild(d); });
}
const recorte = s => { s = String(s).replace(/\n/g, ' '); return s.length > 22 ? s.slice(0, 21) + '…' : s; };

/* ───────────────────────── Tocar y arrastrar ───────────────────────── */

let drag = null;
function pto(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }

cv.addEventListener('pointerdown', e => {
  if (!L || MODO_CLIENTE) return;
  const p = pto(e), dpr = cv.width / cv.getBoundingClientRect().width;
  if (ajustando && FOTO && L.lf) {
    const W = st.W * L.k, H = st.H * L.k, hx = L.bx + W, hy = L.by + H;
    if (Math.hypot(p.x - hx, p.y - hy) < 26 * dpr) drag = { tipo: 'tam', x0: p.x, w0: FOTO.r.w };
    else drag = { tipo: 'mover', x0: p.x, y0: p.y, rx: FOTO.r.x, ry: FOTO.r.y };
    cv.setPointerCapture(e.pointerId);
    return;
  }
  const mm = [(p.x - L.bx) / L.k, (p.y - L.by) / L.k];
  for (let n = L.geo.length - 1; n >= 0; n--) {
    const it = L.geo[n];
    if (!it.el || !it.bb) continue;
    const m = 3;
    if (mm[0] >= it.bb.x1 - m && mm[0] <= it.bb.x2 + m && mm[1] >= it.bb.y1 - m && mm[1] <= it.bb.y2 + m) {
      sel = it.i;
      drag = { tipo: 'el', i: it.i, dx: mm[0] - it.el.x, dy: mm[1] - it.el.y, x0: p.x, y0: p.y, movio: false };
      cv.setPointerCapture(e.pointerId);
      marcarTarjetas(); pintar();
      return;
    }
  }
  sel = -1; marcarTarjetas(); pintar();
});

cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const p = pto(e);
  if (drag.tipo === 'tam') {
    const s = L.lf.s; FOTO.r.w = clamp(drag.w0 + (p.x - drag.x0) / s, 40, FOTO.img.width * 1.5); pintar(); return;
  }
  if (drag.tipo === 'mover') {
    const s = L.lf.s; FOTO.r.x = drag.rx + (p.x - drag.x0) / s; FOTO.r.y = drag.ry + (p.y - drag.y0) / s; pintar(); return;
  }
  if (Math.hypot(p.x - drag.x0, p.y - drag.y0) > 4) drag.movio = true;
  if (!drag.movio) return;
  const el = st.el[drag.i];
  let x = (p.x - L.bx) / L.k - drag.dx, y = (p.y - L.by) / L.k - drag.dy;
  guiaX = Math.abs(x - st.W / 2) < 1.6;
  if (guiaX) x = st.W / 2;
  el.x = clamp(Math.round(x * 10) / 10, 0, st.W); el.y = clamp(Math.round(y * 10) / 10, 0, st.H);
  cambio();
});

function soltar() {
  if (!drag) return;
  if (drag.tipo === 'tam' || drag.tipo === 'mover') { FOTO.prom = promedioFoto(); drag = null; pintar(); return; }
  const tap = !drag.movio, el = st.el[drag.i];
  drag = null; guiaX = false; pintar();
  if (tap && el) {
    irATab(el.t === 'txt' ? 'texto' : 'adornos');
    const c = document.querySelector(`.card.el[data-i="${sel}"]`);
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
cv.addEventListener('pointerup', soltar);
cv.addEventListener('pointercancel', soltar);

/* ───────────────────────── Foto real ───────────────────────── */

function promedioFoto() {
  if (!FOTO) return null;
  const c = document.createElement('canvas'); c.width = c.height = 24;
  const g = c.getContext('2d'), h = FOTO.r.w * st.H / st.W;
  g.drawImage(FOTO.img, FOTO.r.x + FOTO.r.w * .15, FOTO.r.y + h * .15, FOTO.r.w * .7, h * .7, 0, 0, 24, 24);
  const d = g.getImageData(0, 0, 24, 24).data; let r = 0, gg = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return rgbHex([r / n, gg / n, b / n]);
}

async function ponerFoto(src) {
  const img = await cargarImg(src);
  const max = 2000, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const w = Math.min(c.width * .6, c.height * .75 * st.W / st.H);
  FOTO = { img: c, r: { x: (c.width - w) / 2, y: (c.height - w * st.H / st.W) / 2, w } };
  FOTO.prom = promedioFoto();
  ajustando = true;
  actualizarFotoUI();
  pintar();
  toast('Arrastra el recuadro sobre la tapa y agrándalo desde la esquina. Luego toca «Listo».');
}
function actualizarFotoUI() {
  $('#fotoCtl').hidden = !FOTO;
  $('#bAjTapa').textContent = ajustando ? 'Listo' : 'Ajustar tapa';
  $('#hint').textContent = ajustando ? 'Mueve el recuadro · agranda desde ↘' : 'Toca un texto o adorno y arrástralo';
  const m = modelo();
  $('#bFotoCat').hidden = !(m && m.img);
}
function cargarImg(src) {
  return new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error('No se pudo abrir la imagen')); i.src = src; });
}

/* ───────────────────────── Interfaz: Biblia ───────────────────────── */

function construirBiblia() {
  const sm = $('#selModelo');
  sm.innerHTML = '';
  const o0 = document.createElement('option'); o0.value = 'otra'; o0.textContent = 'Biblia lisa en símil piel (otra referencia)'; sm.appendChild(o0);
  CATALOGO.forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = `${m.n} · ${pesos(m.precio)}`; sm.appendChild(o); });
  sm.onchange = () => {
    const m = CATALOGO.find(x => x.id === sm.value), antes = modelo();
    st.m = sm.value;
    if (m) {
      st.col = m.color; st.cierre = m.cierre; st.canto = m.canto;
      if (!st.ped.precio || (antes && st.ped.precio === antes.precio)) st.ped.precio = m.precio;
    }
    const med = aj.medidas[st.m]; if (med) { st.W = med[0]; st.H = med[1]; }
    sincronizarBiblia(); sincronizarPedido(); cambio();
  };
  const ct = $('#chTam'); ct.innerHTML = '';
  TAMANOS.forEach(([n, w, h]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.dataset.w = w; b.dataset.h = h;
    b.innerHTML = `${n}<small>${w / 10}×${h / 10}</small>`;
    b.onclick = () => { st.W = w; st.H = h; guardarMedida(); sincronizarBiblia(); cambio(); };
    ct.appendChild(b);
  });
  for (const id of ['inW', 'inH']) {
    $('#' + id).onchange = e => {
      const v = clamp(Math.round(+e.target.value || 0), id === 'inW' ? 60 : 80, id === 'inW' ? 320 : 420);
      if (id === 'inW') st.W = v; else st.H = v;
      guardarMedida(); sincronizarBiblia(); cambio();
    };
  }
  const sw = $('#sw'); sw.innerHTML = '';
  COLORES.forEach(([c, n]) => {
    const b = document.createElement('button'); b.style.background = c; b.title = n; b.setAttribute('aria-label', n); b.dataset.c = c;
    b.onclick = () => { st.col = c; sincronizarBiblia(); cambio(); };
    sw.appendChild(b);
  });
  const lab = document.createElement('label'); lab.title = 'Otro color';
  lab.innerHTML = '<input type="color" aria-label="Otro color">';
  lab.querySelector('input').oninput = e => { st.col = e.target.value; sincronizarBiblia(); cambio(); };
  sw.appendChild(lab);
  const tx = $('#chTex'); tx.innerHTML = '';
  [['grano', 'Símil piel con grano'], ['liso', 'Lisa']].forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.dataset.k = k; b.textContent = n;
    b.onclick = () => { st.tex = k; sincronizarBiblia(); cambio(); };
    tx.appendChild(b);
  });
  [['tgCierre', 'cierre'], ['tgCanto', 'canto'], ['tgCostura', 'costura'], ['tgLomo', 'lomo']].forEach(([id, k]) => {
    $('#' + id).onchange = e => { st[k] = e.target.checked; cambio(); };
  });
  $('#inFoto').onchange = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f);
    try { await ponerFoto(url); } catch (err) { toast(err.message); } finally { URL.revokeObjectURL(url); }
  };
  $('#bFotoCat').onclick = async () => { const m = modelo(); if (m && m.img) { try { await ponerFoto(m.img); } catch (err) { toast(err.message); } } };
  $('#bAjTapa').onclick = () => { ajustando = !ajustando; if (!ajustando && FOTO) FOTO.prom = promedioFoto(); actualizarFotoUI(); pintar(); };
  $('#bQuitarFoto').onclick = () => { FOTO = null; ajustando = false; actualizarFotoUI(); pintar(); };
}
function guardarMedida() { aj.medidas[st.m] = [st.W, st.H]; guardarAjustes(); }

function sincronizarBiblia() {
  $('#selModelo').value = st.m;
  const m = modelo();
  $('#modeloInfo').textContent = m
    ? `Precio de venta ${pesos(m.precio)} con el grabado incluido. Este modelo trae diseño de fábrica en la tapa: para mostrarla exacta, usa la foto real.`
    : 'Biblia lisa: el diseño se muestra sobre una tapa de símil piel del color que elijas.';
  $('#inW').value = st.W; $('#inH').value = st.H;
  $$('#chTam .chip').forEach(b => b.classList.toggle('on', +b.dataset.w === st.W && +b.dataset.h === st.H));
  $$('#sw button').forEach(b => b.classList.toggle('on', b.dataset.c === st.col));
  $$('#chTex .chip').forEach(b => b.classList.toggle('on', b.dataset.k === st.tex));
  $('#tgCierre').checked = !!st.cierre; $('#tgCanto').checked = !!st.canto; $('#tgCostura').checked = !!st.costura; $('#tgLomo').checked = !!st.lomo;
  actualizarFotoUI();
}

/* ───────────────────────── Interfaz: Texto ───────────────────────── */

function construirTexto() {
  const cf = $('#chFin'); cf.innerHTML = '';
  Object.entries(ACABADOS).forEach(([k, a]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.dataset.k = k; b.textContent = a.n;
    b.onclick = () => { st.fin = k; sincronizarTexto(); cambio(); };
    cf.appendChild(b);
  });
  $$('#addTxt [data-add]').forEach(b => b.onclick = () => {
    const r = b.dataset.add, W = st.W, H = st.H, z = clamp(W / 145, .72, 1.2);
    const nuevo = {
      nombre: T('nombre', 'Nombre', 'pinyon', 9 * z, W / 2, H * .8),
      fecha: T('fecha', '12 de octubre de 2026', 'cormorant', 4 * z, W / 2, H * .88, .03),
      versiculo: T('versiculo', 'Lámpara es a mis pies tu palabra,\ny lumbrera a mi camino.\nSalmo 119:105', 'cormorant', 3.6 * z, W / 2, H * .68),
      titulo: T('titulo', 'SANTA BIBLIA', 'cinzel', 6 * z, W / 2, H * .2, .14),
      libre: T('libre', 'Texto', 'cormorant', 5 * z, W / 2, H * .5),
    }[r];
    st.el.push(nuevo); sel = st.el.length - 1;
    cambio({ listas: true });
    setTimeout(() => { const c = document.querySelector(`.card.el[data-i="${sel}"]`); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.querySelector('textarea').select(); } }, 60);
  });
}

function construirPlantillas() {
  const box = $('#plant'); box.innerHTML = '';
  PLANTILLAS.forEach(p => {
    const b = document.createElement('button');
    const c = document.createElement('canvas'); c.width = 144; c.height = 192;
    const d = JSON.parse(JSON.stringify(st)); aplicarPlantilla(p, d);
    escena(c.getContext('2d'), 144, 192, d, { sinFoto: true, pad: 8 });
    b.appendChild(c); b.appendChild(document.createTextNode(p.n));
    b.onclick = () => { aplicarPlantilla(p); sel = -1; cambio({ listas: true }); toast(`Plantilla «${p.n}» aplicada`); };
    box.appendChild(b);
  });
}

function sincronizarTexto() {
  $$('#chFin .chip').forEach(b => b.classList.toggle('on', b.dataset.k === st.fin));
  $('#finDesc').textContent = DESC_ACABADO[ACABADOS[st.fin].tipo];
}

function rango(etq, min, max, paso, val, fmt, onv) {
  const d = document.createElement('div'); d.className = 'rng';
  d.innerHTML = `<span>${etq}</span><input type="range" min="${min}" max="${max}" step="${paso}"><output></output>`;
  const i = d.querySelector('input'), o = d.querySelector('output');
  i.value = val; o.textContent = fmt(val);
  i.oninput = () => { const v = +i.value; o.textContent = fmt(v); onv(v); };
  return d;
}

function botonesMover(el) {
  const d = document.createElement('div'); d.className = 'nudge';
  [['←', -.5, 0], ['↑', 0, -.5], ['↓', 0, .5], ['→', .5, 0]].forEach(([t, dx, dy]) => {
    const b = document.createElement('button'); b.textContent = t; b.setAttribute('aria-label', 'Mover');
    b.onclick = () => { el.x = clamp(el.x + dx, 0, st.W); el.y = clamp(el.y + dy, 0, st.H); cambio(); };
    d.appendChild(b);
  });
  const c = document.createElement('button'); c.textContent = 'Centrar'; c.onclick = () => { el.x = st.W / 2; cambio(); };
  d.appendChild(c);
  return d;
}

function cabecera(i, titulo, extras) {
  const h = document.createElement('div'); h.className = 'elhead';
  h.innerHTML = '<span class="num"></span><b></b>';
  h.querySelector('.num').textContent = i + 1; h.querySelector('b').textContent = titulo;
  extras.forEach(([t, fn, cls]) => { const b = document.createElement('button'); b.className = 'mini' + (cls ? ' ' + cls : ''); b.textContent = t; b.onclick = fn; h.appendChild(b); });
  return h;
}

function tarjetaTexto(el, i) {
  const c = document.createElement('div'); c.className = 'card el' + (i === sel ? ' sel' : ''); c.dataset.i = i;
  c.onclick = () => { if (sel !== i) { sel = i; marcarTarjetas(); pintar(); } };
  c.appendChild(cabecera(i, ROLES[el.r] || 'Texto', [
    ['Duplicar', () => { const n = JSON.parse(JSON.stringify(el)); n.y = Math.min(st.H - 8, el.y + el.mm * 2.2); st.el.splice(i + 1, 0, n); sel = i + 1; cambio({ listas: true }); }],
    ['Quitar', () => { st.el.splice(i, 1); sel = -1; cambio({ listas: true }); }, 'del'],
  ]));
  const ta = document.createElement('textarea'); ta.rows = Math.max(1, el.s.split('\n').length); ta.value = el.s; ta.spellcheck = true;
  ta.setAttribute('aria-label', 'Texto a grabar');
  const fonts = document.createElement('div'); fonts.className = 'scroll'; fonts.style.marginTop = '8px';
  const muestras = () => {
    const txt = recorte(textoVisible(el).split('\n')[0] || 'Nombre');
    fonts.querySelectorAll('.fch').forEach(b => { b.firstChild.textContent = txt; });
  };
  Object.entries(FUENTES).forEach(([k, f]) => {
    const b = document.createElement('button'); b.className = 'fch' + (el.f === k ? ' on' : ''); b.style.fontFamily = `lg-${k},serif`;
    b.appendChild(document.createTextNode('')); const sm = document.createElement('small'); sm.textContent = f.n; b.appendChild(sm);
    b.onclick = () => { el.f = k; fonts.querySelectorAll('.fch').forEach(x => x.classList.toggle('on', x === b)); cambio(); };
    fonts.appendChild(b);
  });
  ta.oninput = () => { el.s = ta.value; ta.rows = Math.max(1, ta.value.split('\n').length); muestras(); cambio(); };
  c.appendChild(ta); c.appendChild(fonts); muestras();
  c.appendChild(rango('Tamaño', 2.5, 30, .5, el.mm, v => fmtMm(v) + ' mm', v => { el.mm = v; cambio(); }));
  c.appendChild(rango('Espaciado', -.05, .5, .01, el.ls || 0, v => Math.round(v * 100) + ' %', v => { el.ls = v; cambio(); }));
  if (el.s.includes('\n')) c.appendChild(rango('Interlínea', .6, 1.8, .05, el.lh || 1, v => '×' + v.toFixed(2).replace('.', ','), v => { el.lh = v; cambio(); }));
  const may = document.createElement('div'); may.className = 'tg'; may.style.cssText = 'grid-template-columns:1fr;margin-top:8px';
  may.innerHTML = '<label><input type="checkbox">Todo en MAYÚSCULAS</label>';
  const cb = may.querySelector('input'); cb.checked = !!el.up; cb.onchange = () => { el.up = cb.checked; muestras(); cambio(); };
  c.appendChild(may);
  c.appendChild(botonesMover(el));
  return c;
}

function tarjetaIcono(el, i) {
  const c = document.createElement('div'); c.className = 'card el' + (i === sel ? ' sel' : ''); c.dataset.i = i;
  c.onclick = () => { if (sel !== i) { sel = i; marcarTarjetas(); pintar(); } };
  c.appendChild(cabecera(i, (ICONOS[el.k] || {}).n || 'Adorno', [
    ['Voltear', () => { el.fx = !el.fx; cambio(); }],
    ['Quitar', () => { st.el.splice(i, 1); sel = -1; cambio({ listas: true }); }, 'del'],
  ]));
  c.appendChild(rango('Tamaño', 5, 140, .5, el.mm, v => fmtMm(v) + ' mm', v => { el.mm = v; cambio(); }));
  c.appendChild(botonesMover(el));
  return c;
}

function renderListas() {
  const lt = $('#listaTxt'), li = $('#listaIco');
  lt.innerHTML = ''; li.innerHTML = '';
  st.el.forEach((el, i) => { (el.t === 'txt' ? lt : li).appendChild(el.t === 'txt' ? tarjetaTexto(el, i) : tarjetaIcono(el, i)); });
  if (!lt.children.length) lt.innerHTML = '<p class="sub">Sin texto. Añade una línea o elige una plantilla.</p>';
  if (li.children.length) { const h = document.createElement('label'); h.className = 'lbl'; h.textContent = 'Adornos en la tapa'; li.prepend(h); }
}
function marcarTarjetas() { $$('.card.el').forEach(c => c.classList.toggle('sel', +c.dataset.i === sel)); }

/* ───────────────────────── Interfaz: Adornos ───────────────────────── */

const dSvg = cmds => cmds.map(k => k[0] + (k.length > 1 ? k.slice(1).map(v => +v.toFixed(2)).join(' ') : '')).join('');
function construirAdornos() {
  const gi = $('#gridIco'); gi.innerHTML = '';
  ORDEN_ICONOS.filter(k => ICONOS[k]).forEach(k => {
    const ic = ICONOS[k], b = ic.bb, m = Math.max(b.w, b.h) * .06;
    const bt = document.createElement('button');
    bt.innerHTML = `<svg viewBox="${b.x1 - m} ${b.y1 - m} ${b.w + 2 * m} ${b.h + 2 * m}" aria-hidden="true"><path d="${dSvg(ic.cmds)}"/></svg>`;
    bt.appendChild(document.createTextNode(ic.n));
    bt.onclick = () => {
      const ancho = ['laurel', 'olivo', 'filete', 'resplandor'].includes(k);
      st.el.push(I(k, ancho ? st.W * .45 : 18 * clamp(st.W / 145, .72, 1.2), st.W / 2, st.H * .45));
      sel = st.el.length - 1; cambio({ listas: true });
      toast(`${ic.n} añadido: arrástralo en la tapa`);
    };
    gi.appendChild(bt);
  });
  const cm = $('#chMarco'); cm.innerHTML = '';
  MARCOS.forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.dataset.k = k; b.textContent = n;
    b.onclick = () => { st.marco = k; sincronizarAdornos(); cambio(); };
    cm.appendChild(b);
  });
  $('#inMarco').oninput = e => { st.mMarco = +e.target.value; $('#outMarco').textContent = fmtMm(st.mMarco) + ' mm'; cambio(); };
}
function sincronizarAdornos() {
  $$('#chMarco .chip').forEach(b => b.classList.toggle('on', b.dataset.k === (st.marco || 'no')));
  $('#rngMarco').hidden = !st.marco || st.marco === 'no';
  $('#inMarco').value = st.mMarco; $('#outMarco').textContent = fmtMm(st.mMarco) + ' mm';
}

/* ───────────────────────── Interfaz: Pedido ───────────────────────── */

function construirPedido() {
  const se = $('#pEstado'); se.innerHTML = '';
  ESTADOS.forEach(([k, n]) => { const o = document.createElement('option'); o.value = k; o.textContent = n; se.appendChild(o); });
  const campos = { pCli: 'cli', pTel: 'tel', pOc: 'oc', pCant: 'cant', pPrecio: 'precio', pExtra: 'extra', pAnt: 'ant', pEntrega: 'entrega', pNotas: 'notas', pEstado: 'estado' };
  Object.entries(campos).forEach(([id, k]) => {
    $('#' + id).addEventListener('input', e => {
      const num = ['cant', 'precio', 'extra', 'ant'].includes(k);
      st.ped[k] = num ? Math.max(0, +e.target.value || 0) : e.target.value;
      if (k === 'cant' && st.ped.cant < 1) st.ped.cant = 1;
      totales(); cambio();
    });
  });
  $('#pId').addEventListener('change', e => { st.id = e.target.value.trim() || st.id; cambio(); });
  $('#pMostrarPrecio').onchange = e => { st.ped.ver = e.target.checked; cambio(); };
  $('#bGuardar').onclick = () => guardarDiseno(true);
  $('#bEnlace').onclick = enviarEnlace;
  $('#bArchivos').onclick = descargarTodo;
}
function sincronizarPedido() {
  const p = st.ped;
  $('#pId').value = st.id; $('#pEstado').value = p.estado; $('#pCli').value = p.cli; $('#pTel').value = p.tel; $('#pOc').value = p.oc;
  $('#pCant').value = p.cant; $('#pPrecio').value = p.precio || ''; $('#pExtra').value = p.extra || ''; $('#pAnt').value = p.ant;
  $('#pEntrega').value = p.entrega; $('#pNotas').value = p.notas; $('#pMostrarPrecio').checked = p.ver !== false;
  totales();
}
function totales() {
  const t = total();
  $('#totVal').textContent = t ? pesos(t) : '—';
  $('#totAnt').textContent = t ? `Anticipo ${st.ped.ant} %: ${pesos(anticipo())}` : 'Escribe el valor unitario';
}

function sincronizarTodo() { sincronizarBiblia(); sincronizarTexto(); sincronizarAdornos(); sincronizarPedido(); renderListas(); }

function irATab(t) {
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  $$('.pn').forEach(p => p.hidden = p.dataset.p !== t);
  if (t === 'texto') construirPlantillas();
}
$$('#tabs button').forEach(b => b.onclick = () => irATab(b.dataset.t));

/* ───────────────────────── Archivos ───────────────────────── */

const aBlob = (c, tipo = 'image/png', q) => new Promise(ok => c.toBlob(ok, tipo, q));
function envolver(g, txt, x, y, maxW, lh, maxL = 3) {
  const pal = String(txt).split(/\s+/); let lin = '', n = 0;
  for (let i = 0; i < pal.length; i++) {
    const prueba = lin ? lin + ' ' + pal[i] : pal[i];
    if (g.measureText(prueba).width > maxW && lin) {
      n++; if (n >= maxL) { g.fillText(lin + '…', x, y); return y + lh; }
      g.fillText(lin, x, y); y += lh; lin = pal[i];
    } else lin = prueba;
  }
  if (lin) { g.fillText(lin, x, y); y += lh; }
  return y;
}
function espaciado(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) { } }
const lineasTexto = (d = st) => d.el.filter(e => e.t === 'txt' && String(e.s).trim()).map(e => `«${textoVisible(e).replace(/\n/g, ' / ')}»`);

async function imagenCliente() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 1350); bg.addColorStop(0, '#fcf9f3'); bg.addColorStop(1, '#efe4ce');
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
  try { const logo = await cargarImg('corazon.png'); g.drawImage(logo, 58, 40, 72, 69); } catch (e) { }
  g.fillStyle = '#1a2238'; g.font = '600 italic 46px lg-playfair, Georgia, serif'; g.textBaseline = 'alphabetic';
  g.fillText('Luz y Gracia', 142, 90);
  g.fillStyle = '#c89a3b'; g.font = '600 16px lg-montserrat, sans-serif'; espaciado(g, 3.2);
  g.fillText('PROPUESTA DE PERSONALIZACIÓN', 144, 120); espaciado(g, 0);
  g.fillStyle = '#6b7189'; g.font = '600 18px lg-montserrat, sans-serif'; g.textAlign = 'right'; g.fillText(st.id, 1020, 90); g.textAlign = 'left';
  const m = document.createElement('canvas'); m.width = 960; m.height = 860;
  escena(m.getContext('2d'), 960, 860, st, { pad: 46 });
  g.drawImage(m, 60, 142);
  // ficha
  const y0 = 1004, conPrecio = st.ped.ver !== false && total() > 0;
  g.fillStyle = '#ffffff'; trazarRR(g, 60, y0, 960, 200, 22); g.fill();
  g.strokeStyle = '#e7ddc9'; g.lineWidth = 2; g.stroke();
  const colW = conPrecio ? 610 : 900;
  const fila = (et, val, y) => {
    g.fillStyle = '#c89a3b'; g.font = '600 13px lg-montserrat, sans-serif'; espaciado(g, 2); g.fillText(et, 92, y); espaciado(g, 0);
    g.fillStyle = '#1a2238'; g.font = '600 25px lg-cormorant, Georgia, serif';
    return envolver(g, val, 92, y + 29, colW, 28, 1);
  };
  fila('BIBLIA', `${nombreModelo()} · ${nombreColor()}`, y0 + 36);
  fila('ACABADO', ACABADOS[st.fin].cli[0].toUpperCase() + ACABADOS[st.fin].cli.slice(1), y0 + 94);
  fila('TEXTO', lineasTexto().join('  ·  ') || '—', y0 + 152);
  if (conPrecio) {
    g.strokeStyle = '#efe6d4'; g.beginPath(); g.moveTo(730, y0 + 26); g.lineTo(730, y0 + 162); g.stroke();
    g.textAlign = 'right';
    g.fillStyle = '#c89a3b'; g.font = '600 13px lg-montserrat, sans-serif'; espaciado(g, 2); g.fillText(st.ped.cant > 1 ? `VALOR · ${st.ped.cant} UNIDADES` : 'VALOR', 990, y0 + 52); espaciado(g, 0);
    g.fillStyle = '#1a2238'; g.font = '600 46px lg-cormorant, Georgia, serif'; g.fillText(pesos(total()), 990, y0 + 104);
    g.fillStyle = '#6b7189'; g.font = '600 15px lg-montserrat, sans-serif'; g.fillText(`Anticipo para empezar: ${pesos(anticipo())}`, 990, y0 + 142);
    g.textAlign = 'left';
  }
  // pie
  g.fillStyle = '#1a2238'; g.fillRect(0, 1222, 1080, 128);
  g.textAlign = 'center';
  g.fillStyle = '#e3c27e'; g.font = '600 italic 30px lg-playfair, Georgia, serif';
  g.fillText('Si todo está bien, responde APRUEBO', 540, 1270);
  g.fillStyle = 'rgba(255,255,255,.78)'; g.font = '600 15px lg-montserrat, sans-serif';
  g.fillText('Nada se graba sin tu visto bueno · Revisa ortografía, tildes y fecha', 540, 1303);
  g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '600 12.5px lg-montserrat, sans-serif';
  g.fillText('Imagen de referencia: el tono de la tapa y el brillo del acabado pueden variar levemente.', 540, 1328);
  g.textAlign = 'left';
  return aBlob(c, 'image/jpeg', .92);
}

function describirPos(it) {
  const b = it.bb, cent = Math.abs(b.cx - st.W / 2) < .6;
  const h = cent ? 'centrado' : `a ${fmtMm(b.x1)} mm del lomo y ${fmtMm(st.W - b.x2)} mm del borde derecho`;
  return `${h} · arriba a ${fmtMm(b.y1)} mm del borde superior (${fmtMm(st.H - b.y2)} mm sobre el borde inferior)`;
}
function describirEl(it) {
  const el = it.el;
  if (el.t === 'txt') return { tit: `«${textoVisible(el).replace(/\n/g, ' / ')}»`, det: `${FUENTES[el.f].fam} · mayúscula ${fmtMm(el.mm)} mm · ocupa ${fmtMm(it.bb.w)} × ${fmtMm(it.bb.h)} mm` };
  return { tit: `${(ICONOS[el.k] || {}).n || 'Adorno'}${el.fx ? ' (volteado)' : ''}`, det: `ocupa ${fmtMm(it.bb.w)} × ${fmtMm(it.bb.h)} mm` };
}
function fechaCorta(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }

async function fichaTaller() {
  const geo = geomDiseno(st).filter(x => x.el && x.bb), marco = st.marco && st.marco !== 'no';
  const Wc = 1240, filas = geo.length + (marco ? 1 : 0) + (st.ped.notas ? 1 : 0);
  const Hc = Math.max(1754, 1330 + filas * 118 + 120);
  const c = document.createElement('canvas'); c.width = Wc; c.height = Hc;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, Wc, Hc);
  g.fillStyle = '#c89a3b'; g.font = '600 20px lg-montserrat, sans-serif'; espaciado(g, 3); g.fillText('ORDEN DE MARCACIÓN', 70, 86); espaciado(g, 0);
  g.fillStyle = '#1a2238'; g.font = '600 56px lg-montserrat, sans-serif'; g.fillText(st.id, 70, 150);
  g.textAlign = 'right'; g.font = '600 italic 34px lg-playfair, Georgia, serif'; g.fillText('Luz y Gracia', 1170, 92);
  g.fillStyle = '#555'; g.font = '600 19px lg-montserrat, sans-serif';
  g.fillText('Emitida: ' + fechaCorta(new Date().toISOString().slice(0, 10)), 1170, 124);
  if (st.ped.entrega) { g.fillStyle = '#b3261e'; g.fillText('Entrega: ' + fechaCorta(st.ped.entrega), 1170, 152); }
  g.textAlign = 'left';
  g.fillStyle = '#1a2238'; g.fillRect(70, 178, 1100, 3);
  const dato = (et, val, x, y, w) => {
    g.fillStyle = '#888'; g.font = '600 14px lg-montserrat, sans-serif'; espaciado(g, 1.5); g.fillText(et, x, y); espaciado(g, 0);
    g.fillStyle = '#111'; g.font = '600 21px lg-montserrat, sans-serif'; return envolver(g, val, x, y + 30, w, 27, 2);
  };
  const det = [st.cierre && 'con cierre', st.canto && 'canto dorado'].filter(Boolean).join(', ');
  dato('BIBLIA', nombreModelo(), 70, 222, 700);
  dato('CANTIDAD', String(st.ped.cant), 820, 222, 350);
  dato('TAPA', `${st.W} × ${st.H} mm · ${nombreColor()}${det ? ' · ' + det : ''}`, 70, 300, 700);
  dato('TÉCNICA', ACABADOS[st.fin].tec, 820, 300, 350);
  // plano a escala
  const ax = 70, ay = 400, aw = 700, ah = 860;
  const s = Math.min((aw - 120) / st.W, (ah - 80) / st.H), ox = ax + 60 + ((aw - 120) - st.W * s) / 2, oy = ay + 40;
  g.fillStyle = '#f6f6f4'; trazarRR(g, ox, oy, st.W * s, st.H * s, 5 * s); g.fill();
  g.strokeStyle = '#333'; g.lineWidth = 2; g.stroke();
  g.save(); g.setLineDash([6, 6]); g.strokeStyle = '#bbb'; g.lineWidth = 1.2;
  if (st.lomo) { g.beginPath(); g.moveTo(ox + 9 * s, oy); g.lineTo(ox + 9 * s, oy + st.H * s); g.stroke(); }
  g.strokeStyle = '#ddd'; g.beginPath(); g.moveTo(ox + st.W / 2 * s, oy); g.lineTo(ox + st.W / 2 * s, oy + st.H * s); g.stroke();
  g.restore();
  g.save(); g.setTransform(s, 0, 0, s, ox, oy); g.fillStyle = '#000';
  geomDiseno(st).forEach(x => { if (x.cmds.length) g.fill(aPath2D(x.cmds)); });
  g.restore();
  const cota = (x1, y1, x2, y2, txt, vert) => {
    g.strokeStyle = '#c89a3b'; g.fillStyle = '#c89a3b'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    const fl = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.lineTo(-10, -5); g.lineTo(-10, 5); g.fill(); g.restore(); };
    const a = Math.atan2(y2 - y1, x2 - x1); fl(x2, y2, a); fl(x1, y1, a + Math.PI);
    g.save(); g.font = '600 17px lg-montserrat, sans-serif'; g.textAlign = 'center';
    if (vert) { g.translate(x1 - 12, (y1 + y2) / 2); g.rotate(-Math.PI / 2); g.fillText(txt, 0, 0); } else g.fillText(txt, (x1 + x2) / 2, y1 - 10);
    g.restore();
  };
  cota(ox, oy - 14, ox + st.W * s, oy - 14, `${st.W} mm`, false);
  cota(ox - 22, oy, ox - 22, oy + st.H * s, `${st.H} mm`, true);
  const gx = ox + st.W * s + 30;
  let ultimo = -1e9;
  geo.slice().sort((a, b) => a.bb.cy - b.bb.cy).forEach(it => {
    const n = st.el.indexOf(it.el) + 1, y = Math.max(oy + it.bb.cy * s, ultimo + 32); ultimo = y;
    g.strokeStyle = '#1a2238'; g.lineWidth = 1.2; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(ox + it.bb.x2 * s + 4, oy + it.bb.cy * s); g.lineTo(gx - 14, y); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#1a2238'; g.beginPath(); g.arc(gx, y, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '600 15px lg-montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(n), gx, y + 1); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  });
  g.fillStyle = '#888'; g.font = '600 14px lg-montserrat, sans-serif';
  g.fillText(st.lomo ? 'Plano a escala · línea punteada izquierda = bisagra del lomo' : 'Plano a escala', ax, ay + ah - 6);
  // vista de referencia
  const m = document.createElement('canvas'); m.width = 360; m.height = 480;
  escena(m.getContext('2d'), 360, 480, st, { pad: 22 });
  g.fillStyle = '#faf6ef'; trazarRR(g, 810, 400, 360, 480, 18); g.fill();
  g.drawImage(m, 810, 400);
  g.fillStyle = '#888'; g.font = '600 14px lg-montserrat, sans-serif'; g.fillText('Referencia de color y acabado', 820, 906);
  // tabla
  let y = 1310;
  g.fillStyle = '#1a2238'; g.fillRect(70, y - 34, 1100, 2);
  const fila = (n, tit, det1, det2) => {
    g.fillStyle = '#1a2238'; g.beginPath(); g.arc(88, y - 8, 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '600 16px lg-montserrat, sans-serif'; g.textAlign = 'center'; g.fillText(n, 88, y - 2); g.textAlign = 'left';
    g.fillStyle = '#111'; g.font = '600 28px lg-cormorant, Georgia, serif'; envolver(g, tit, 122, y, 1040, 30, 1);
    g.fillStyle = '#444'; g.font = '600 17px lg-montserrat, sans-serif';
    let yy = envolver(g, det1, 122, y + 30, 1040, 24, 2);
    if (det2) yy = envolver(g, det2, 122, yy, 1040, 24, 2);
    y = yy + 34;
  };
  geo.forEach(it => { const d = describirEl(it); fila(String(st.el.indexOf(it.el) + 1), d.tit, d.det, 'Posición: ' + describirPos(it)); });
  if (marco) fila('M', 'Marco: ' + MARCOS.find(x => x[0] === st.marco)[1], `a ${fmtMm(st.mMarco)} mm de los bordes de la tapa`, '');
  if (st.ped.notas) fila('!', 'Notas', st.ped.notas, '');
  g.fillStyle = '#888'; g.font = '600 15px lg-montserrat, sans-serif';
  envolver(g, 'Medidas en milímetros sobre la tapa. «Mayúscula» = alto de la letra mayúscula. Archivo vectorial a escala 1:1 adjunto (PDF y SVG): usarlo tal cual, sin reescalar.', 70, Hc - 70, 1100, 22, 2);
  return aBlob(c, 'image/png');
}

/* PDF 1:1 escrito a mano (sin librerías): página 1 = solo el arte, lista para
   placa o láser; página 2 = el arte sobre el contorno de la tapa, para ubicarlo. */
function pdfArte() {
  const pt = 72 / 25.4, piezas = geomDiseno(st).filter(x => x.cmds.length);
  const n = v => (Math.round(v * 1000) / 1000).toString();
  const trazos = (ox, oy, Hp) => piezas.map(x => {
    let s = '', px = 0, py = 0;
    const X = v => n((v + ox) * pt), Y = v => n(Hp - (v + oy) * pt);
    for (const k of x.cmds) {
      if (k[0] === 'M') { s += `${X(k[1])} ${Y(k[2])} m\n`; px = k[1]; py = k[2]; }
      else if (k[0] === 'L') { s += `${X(k[1])} ${Y(k[2])} l\n`; px = k[1]; py = k[2]; }
      else if (k[0] === 'Q') {
        const c1x = px + 2 / 3 * (k[1] - px), c1y = py + 2 / 3 * (k[2] - py), c2x = k[3] + 2 / 3 * (k[1] - k[3]), c2y = k[4] + 2 / 3 * (k[2] - k[4]);
        s += `${X(c1x)} ${Y(c1y)} ${X(c2x)} ${Y(c2y)} ${X(k[3])} ${Y(k[4])} c\n`; px = k[3]; py = k[4];
      } else if (k[0] === 'C') { s += `${X(k[1])} ${Y(k[2])} ${X(k[3])} ${Y(k[4])} ${X(k[5])} ${Y(k[6])} c\n`; px = k[5]; py = k[6]; }
      else s += 'h\n';
    }
    return s + 'f\n';
  }).join('');
  const txt = s => String(s).replace(/[^\x20-\xff]/g, '-').replace(/[\\()]/g, m => '\\' + m);
  const p1 = { w: st.W * pt, h: st.H * pt, c: '0 0 0 rg\n' + trazos(0, 0, st.H * pt) };
  const mg = 22, W2 = st.W + 2 * mg, H2 = st.H + 2 * mg + 10, H2p = H2 * pt;
  let c2 = '0.55 G 0.4 w\n' + `${n(mg * pt)} ${n(H2p - (mg + 10 + st.H) * pt)} ${n(st.W * pt)} ${n(st.H * pt)} re S\n`;
  c2 += '0 0 0 rg\n' + trazos(mg, mg + 10, H2p);
  const linea = (s, y, tam) => `BT /F1 ${tam} Tf ${n(mg * pt)} ${n(H2p - y * pt)} Td (${txt(s)}) Tj ET\n`;
  c2 += '0.3 0.3 0.3 rg\n' + linea(`${st.id} - Tapa ${st.W} x ${st.H} mm - Escala 1:1 - ${ACABADOS[st.fin].tec.replace('·', '-')}`, 9, 8);
  c2 += linea('La linea gris es el borde de la tapa: NO se marca. Imprimir al 100 %, sin ajustar a la pagina.', 14, 7);
  const p2 = { w: W2 * pt, h: H2p, c: c2 };
  const objs = [], kids = []; let id = 4;
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  for (const p of [p1, p2]) {
    const pid = id++, cid = id++; kids.push(pid + ' 0 R');
    objs[pid] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(p.w)} ${n(p.h)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${cid} 0 R >>`;
    objs[cid] = `<< /Length ${p.c.length} >>\nstream\n${p.c}\nendstream`;
  }
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'; const offs = [];
  for (let i = 1; i < objs.length; i++) { offs[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const u = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255;
  return new Blob([u], { type: 'application/pdf' });
}

function svgArte() {
  const d = cmds => cmds.map(k => k[0] + (k.length > 1 ? ' ' + k.slice(1).map(v => +v.toFixed(3)).join(' ') : '')).join(' ');
  const esc = s => String(s).replace(/[<&>"]/g, c => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[c]));
  const paths = geomDiseno(st).filter(x => x.cmds.length).map(x => `  <path d="${d(x.cmds)}"/>`).join('\n');
  const s = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${st.W}mm" height="${st.H}mm" viewBox="0 0 ${st.W} ${st.H}">\n<title>${esc(st.id)} · arte 1:1 en milímetros (tapa ${st.W} × ${st.H} mm)</title>\n<g id="arte" fill="#000000">\n${paths}\n</g>\n</svg>\n`;
  return new Blob([s], { type: 'image/svg+xml' });
}

const archivo = (blob, nombre) => new File([blob], nombre, { type: blob.type });
function descargar(f) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function telWa(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.length === 10 && d[0] === '3') d = '57' + d;
  return d;
}
// wa.me, cuando pasa por su redirección web, cambia los emojis por «�» (probado
// el 25-sep-2026): en los enlaces van sin emojis; al compartir con la hoja nativa sí van.
const sinEmoji = t => t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/ ([,.])/g, '$1');
const waLink = (tel, texto) => `https://wa.me/${telWa(tel)}?text=${encodeURIComponent(sinEmoji(texto))}`;

// Compartir con la hoja nativa del teléfono (WhatsApp con archivos). Si el
// navegador no deja, se descargan los archivos y se abre WhatsApp con el texto.
async function compartir(archivos, texto, tel) {
  try { await navigator.clipboard.writeText(texto); } catch (e) { }
  if (navigator.canShare && navigator.canShare({ files: archivos })) {
    try { await navigator.share({ files: archivos, text: texto }); return true; }
    catch (e) {
      if (e.name === 'AbortError') return false;
      if (e.name === 'NotAllowedError') return pedirToque(archivos, texto);
    }
  }
  archivos.forEach(descargar);
  toast('Archivos descargados. Se abre WhatsApp con el mensaje: adjúntalos desde Descargas.');
  setTimeout(() => window.open(waLink(tel, texto), '_blank'), 600);
  return true;
}
function pedirToque(archivos, texto) {
  return new Promise(ok => {
    const sh = $('#shListo') || (() => {
      const d = document.createElement('div'); d.className = 'sheet'; d.id = 'shListo';
      d.innerHTML = '<div class="in"><header><h3>Archivos listos</h3><button data-cerrar>✕</button></header><p class="sub" style="margin-bottom:12px">Toca para abrir WhatsApp con los archivos.</p><button class="btn" style="width:100%" id="bListo">Compartir ahora</button></div>';
      document.body.appendChild(d); d.querySelector('[data-cerrar]').onclick = () => d.classList.remove('on'); return d;
    })();
    sh.classList.add('on');
    $('#bListo').onclick = async () => { sh.classList.remove('on'); try { await navigator.share({ files: archivos, text: texto }); ok(true); } catch (e) { ok(false); } };
  });
}

/* ───────────────────────── Enlace del cliente ───────────────────────── */

function b64u(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
async function codificar(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'z' + b64u(new Uint8Array(await new Response(cs).arrayBuffer()));
  }
  return 'j' + b64u(bytes);
}
async function decodificar(s) {
  let u = unb64u(s.slice(1));
  if (s[0] === 'z') u = new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  return JSON.parse(new TextDecoder().decode(u));
}
function paraEnlace(d = st, ver = true) {
  const p = d.ped;
  return {
    v: 1, id: CLI_PUBLICO ? '' : d.id, m: d.m, W: d.W, H: d.H, col: d.col, tex: d.tex, ci: +!!d.cierre, ca: +!!d.canto, co: +!!d.costura, lo: +!!d.lomo,
    fin: d.fin, mar: d.marco || 'no', mm: d.mMarco,
    el: d.el.map(e => e.t === 'txt' ? [0, e.r || '', e.s, e.f, e.mm, +(e.ls || 0), +(e.lh || 1), +e.x.toFixed(1), +e.y.toFixed(1), +!!e.up] : [1, e.k, e.mm, +e.x.toFixed(1), +e.y.toFixed(1), +!!e.fx]),
    cli: String(p.cli || '').trim().split(/\s+/)[0] || '', p: ver && p.ver !== false && total() > 0 ? [p.cant, +p.precio || 0, +p.extra || 0, +p.ant || 0] : 0,
    wa: telWa(aj.wa) || WA_JOHANA,
  };
}
function desdeEnlace(o) {
  const num = (v, a, b, def) => { v = +v; return isFinite(v) ? clamp(v, a, b) : def; };
  const hex = v => /^#[0-9a-f]{6}$/i.test(v) ? v : '#1d1d20';
  const d = disenoNuevoSinId();
  Object.assign(d, {
    id: String(o.id || '').slice(0, 30), m: CATALOGO.some(x => x.id === o.m) ? o.m : 'otra', W: num(o.W, 60, 320, 145), H: num(o.H, 80, 420, 210),
    col: hex(o.col), tex: o.tex === 'liso' ? 'liso' : 'grano', cierre: !!o.ci, canto: !!o.ca, costura: !!o.co, lomo: !!o.lo,
    fin: ACABADOS[o.fin] ? o.fin : 'oro', marco: MARCOS.some(x => x[0] === o.mar) ? o.mar : 'no', mMarco: num(o.mm, 4, 20, 8),
  });
  d.el = (Array.isArray(o.el) ? o.el : []).slice(0, 24).map(e => e[0] === 0
    ? { t: 'txt', r: ROLES[e[1]] ? e[1] : 'libre', s: String(e[2] || '').slice(0, 240), f: FUENTES[e[3]] ? e[3] : 'cormorant', mm: num(e[4], 2, 40, 6), ls: num(e[5], -.1, .6, 0), lh: num(e[6], .5, 2, 1), x: num(e[7], 0, d.W, d.W / 2), y: num(e[8], 0, d.H, d.H / 2), up: !!e[9] }
    : { t: 'ico', k: ICONOS[e[1]] ? e[1] : 'cruz', mm: num(e[2], 3, 200, 18), x: num(e[3], 0, d.W, d.W / 2), y: num(e[4], 0, d.H, d.H / 2), fx: !!e[5] });
  d.ped.cli = String(o.cli || '').slice(0, 40);
  if (Array.isArray(o.p)) { d.ped.cant = num(o.p[0], 1, 999, 1); d.ped.precio = num(o.p[1], 0, 1e8, 0); d.ped.extra = num(o.p[2], 0, 1e8, 0); d.ped.ant = num(o.p[3], 0, 100, 50); d.ped.ver = true; }
  else d.ped.ver = false;
  d.wa = telWa(o.wa) || WA_JOHANA;
  return d;
}
function disenoNuevoSinId() {
  return { v: 1, id: '', m: 'otra', W: 145, H: 210, col: '#1d1d20', tex: 'grano', cierre: false, canto: true, costura: true, lomo: true, fin: 'oro', marco: 'no', mMarco: 8, el: [],
    ped: { cli: '', tel: '', oc: '', cant: 1, precio: 0, extra: 0, ant: 50, entrega: '', notas: '', estado: 'cotizado', ver: true } };
}
async function enlaceCliente(d = st) { return `${location.origin}/estudio/#c=${await codificar(paraEnlace(d))}`; }

/* ───────────────────────── Mensajes ───────────────────────── */

function mensajeCliente(link) {
  const p = st.ped, nom = String(p.cli || '').trim().split(/\s+/)[0], a = ACABADOS[st.fin];
  let t = `Hola${nom ? ' ' + nom : ''} 🕊️ Te comparto la propuesta de tu biblia personalizada (${st.id}):\n\n`;
  t += `• Biblia: ${nombreModelo()} · ${nombreColor()}\n• Acabado: ${a.cli}\n• Texto: ${lineasTexto().join(', ') || '—'}\n`;
  if (p.ver !== false && total() > 0) t += `• Valor: ${pesos(total())}${p.cant > 1 ? ` (${p.cant} unidades)` : ''}\n• Anticipo para empezar el grabado: ${pesos(anticipo())}\n`;
  t += `\nPuedes verla y corregir el texto aquí: ${link}\n\nRevisa con calma la ortografía, las tildes y la fecha: una vez grabada no se puede corregir. Si todo está bien, respóndeme *APRUEBO* y la mando a producir.`;
  return t;
}
function mensajeTaller() {
  const p = st.ped, geo = geomDiseno(st).filter(x => x.el && x.bb);
  let t = `Hola${aj.taller ? ' ' + aj.taller : ''}, le envío una orden de marcación (${st.id}):\n\n`;
  t += `• ${p.cant} biblia${p.cant > 1 ? 's' : ''}: ${nombreModelo()} — tapa ${st.W} × ${st.H} mm, ${nombreColor().toLowerCase()}\n`;
  t += `• Técnica: ${ACABADOS[st.fin].tec}\n`;
  geo.forEach(it => { const d = describirEl(it); t += `• ${st.el.indexOf(it.el) + 1}) ${d.tit} — ${d.det}\n`; });
  if (st.marco && st.marco !== 'no') t += `• Marco: ${MARCOS.find(x => x[0] === st.marco)[1].toLowerCase()} a ${fmtMm(st.mMarco)} mm del borde\n`;
  if (p.entrega) t += `• Entrega: ${fechaCorta(p.entrega)}\n`;
  if (p.notas) t += `• Notas: ${p.notas}\n`;
  t += `\nAdjunto la ficha con las medidas y el archivo a escala 1:1 (PDF). ¿Me confirma el valor y la fecha de entrega, por favor?`;
  return t;
}

/* ───────────────────────── Acciones ───────────────────────── */

let ocupado = false;
async function conCarga(fn) {
  if (ocupado) return; ocupado = true; document.body.style.cursor = 'progress';
  try { await fn(); } catch (e) { console.error(e); toast('No se pudo: ' + (e.message || e)); }
  finally { ocupado = false; document.body.style.cursor = ''; }
}

$('#bCliente').onclick = () => conCarga(async () => {
  if (!lineasTexto().length) { toast('Escribe al menos el nombre antes de enviar.'); irATab('texto'); return; }
  const [img, link] = await Promise.all([imagenCliente(), enlaceCliente()]);
  guardarDiseno(false);
  await compartir([archivo(img, `${st.id}_propuesta.jpg`)], mensajeCliente(link), st.ped.tel);
});

$('#bTaller').onclick = () => conCarga(async () => {
  if (!st.el.length) { toast('El diseño está vacío.'); return; }
  const ficha = await fichaTaller();
  guardarDiseno(false);
  await compartir([archivo(ficha, `${st.id}_ficha.png`), archivo(pdfArte(), `${st.id}_arte_1a1.pdf`)], mensajeTaller(), aj.tallerTel);
  if (!aj.tallerTel) toast('Tip: guarda el WhatsApp del taller en ⚙︎ Ajustes.');
});

async function enviarEnlace() {
  await conCarga(async () => {
    const link = await enlaceCliente();
    guardarDiseno(false);
    window.open(waLink(st.ped.tel, mensajeCliente(link)), '_blank');
  });
}

async function descargarTodo() {
  await conCarga(async () => {
    const [img, ficha] = await Promise.all([imagenCliente(), fichaTaller()]);
    [archivo(img, `${st.id}_propuesta.jpg`), archivo(ficha, `${st.id}_ficha.png`), archivo(pdfArte(), `${st.id}_arte_1a1.pdf`), archivo(svgArte(), `${st.id}_arte_1a1.svg`)]
      .forEach((f, i) => setTimeout(() => descargar(f), i * 350));
    toast('Descargando 4 archivos…');
  });
}

/* ───────────────────────── Mis diseños ───────────────────────── */

function miniatura() {
  const c = document.createElement('canvas'); c.width = 150; c.height = 150;
  escena(c.getContext('2d'), 150, 150, st, { pad: 8 });
  const f = document.createElement('canvas'); f.width = f.height = 150;
  const g = f.getContext('2d'); g.fillStyle = '#f2e9d8'; g.fillRect(0, 0, 150, 150); g.drawImage(c, 0, 0);
  return f.toDataURL('image/jpeg', .78);
}
function guardarDiseno(aviso) {
  const lista = lsGet(LS_DIS, []);
  const item = { id: st.id, t: Date.now(), cli: st.ped.cli, estado: st.ped.estado, total: total(), st: JSON.parse(JSON.stringify(st)), th: miniatura() };
  const i = lista.findIndex(x => x.id === st.id);
  if (i >= 0) lista.splice(i, 1);
  lista.unshift(item);
  if (!lsSet(LS_DIS, lista)) { toast('El teléfono no tiene espacio: haz copia de seguridad y borra diseños viejos.'); return; }
  sucio = false;
  if (aviso) toast('Guardado en Mis diseños');
}
function abrirDisenos() {
  const box = $('#listaDis'), lista = lsGet(LS_DIS, []);
  box.innerHTML = '';
  if (!lista.length) box.innerHTML = '<div class="vacio">Todavía no hay diseños guardados.</div>';
  lista.forEach(it => {
    const d = document.createElement('div'); d.className = 'dis';
    d.innerHTML = '<img alt=""><div><b></b><span></span></div><div class="stack" style="gap:6px;align-items:flex-end"><span class="est"></span><button class="mini">Duplicar</button><button class="mini del">Borrar</button></div>';
    d.querySelector('img').src = it.th || '';
    d.querySelector('b').textContent = `${it.id}${it.cli ? ' · ' + it.cli : ''}`;
    d.querySelector('div span').textContent = `${new Date(it.t).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}${it.total ? ' · ' + pesos(it.total) : ''}`;
    const e = d.querySelector('.est'); e.textContent = (ESTADOS.find(x => x[0] === it.estado) || ESTADOS[0])[1]; e.classList.add(it.estado);
    const [bDup, bDel] = d.querySelectorAll('.mini');
    d.onclick = ev => {
      if (ev.target === bDup || ev.target === bDel) return;
      if (sucio && st.id !== it.id && !confirm('El diseño abierto tiene cambios sin guardar en Mis diseños. ¿Abrir este de todos modos?')) return;
      st = normalizar(it.st); sel = -1; FOTO = null; ajustando = false; sucio = false; lsSet(LS_ACTUAL, st);
      sincronizarTodo(); pintar(); $('#shDisenos').classList.remove('on'); toast(`Abierto ${st.id}`);
    };
    bDup.onclick = () => { const c = normalizar(JSON.parse(JSON.stringify(it.st))); c.id = nuevoId(); c.ped.estado = 'cotizado'; st = c; sel = -1; sucio = true; sincronizarTodo(); pintar(); $('#shDisenos').classList.remove('on'); toast(`Copia creada: ${st.id}`); };
    bDel.onclick = () => { if (!confirm(`¿Borrar ${it.id} de este teléfono?`)) return; lsSet(LS_DIS, lsGet(LS_DIS, []).filter(x => x.id !== it.id)); abrirDisenos(); };
    box.appendChild(d);
  });
  $('#shDisenos').classList.add('on');
}
function normalizar(d) {
  const b = disenoNuevoSinId();
  const o = Object.assign(b, d); o.ped = Object.assign(disenoNuevoSinId().ped, d.ped || {}); o.el = (d.el || []).filter(e => e.t === 'txt' ? FUENTES[e.f] : ICONOS[e.k]);
  return o;
}

$('#bDisenos').onclick = abrirDisenos;
$('#bNuevo').onclick = () => {
  if (sucio && !confirm('¿Empezar un diseño nuevo? El actual tiene cambios sin guardar en Mis diseños.')) return;
  st = disenoNuevo(st); sel = -1; FOTO = null; ajustando = false; sucio = false; lsSet(LS_ACTUAL, st);
  sincronizarTodo(); pintar(); irATab('pedido'); toast(`Nuevo diseño ${st.id}`);
};
$('#bRespaldo').onclick = () => {
  const blob = new Blob([JSON.stringify({ app: 'estudio-luzygracia', fecha: new Date().toISOString(), disenos: lsGet(LS_DIS, []), ajustes: aj }, null, 1)], { type: 'application/json' });
  descargar(archivo(blob, `estudio-luzygracia-${new Date().toISOString().slice(0, 10)}.json`));
};
$('#inRespaldo').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const o = JSON.parse(await f.text()); if (!Array.isArray(o.disenos)) throw new Error('archivo no válido');
    const lista = lsGet(LS_DIS, []), ids = new Set(lista.map(x => x.id)); let n = 0;
    o.disenos.forEach(x => { if (x && x.id && x.st && !ids.has(x.id)) { lista.push(x); n++; } });
    lista.sort((a, b) => b.t - a.t); lsSet(LS_DIS, lista); abrirDisenos(); toast(`${n} diseño(s) restaurado(s)`);
  } catch (err) { toast('No se pudo restaurar: ' + err.message); }
};

/* ───────────────────────── Ajustes ───────────────────────── */

$('#bAjustes').onclick = () => {
  $('#ajWa').value = aj.wa; $('#ajAnt').value = aj.anticipo; $('#ajTaller').value = aj.taller; $('#ajTallerTel').value = aj.tallerTel;
  $('#shAjustes').classList.add('on');
};
[['ajWa', 'wa'], ['ajAnt', 'anticipo'], ['ajTaller', 'taller'], ['ajTallerTel', 'tallerTel']].forEach(([id, k]) => {
  $('#' + id).addEventListener('change', e => { aj[k] = k === 'anticipo' ? clamp(+e.target.value || 0, 0, 100) : e.target.value.trim(); guardarAjustes(); toast('Ajuste guardado'); });
});
$$('.sheet [data-cerrar]').forEach(b => b.onclick = () => b.closest('.sheet').classList.remove('on'));
$$('.sheet').forEach(s => s.addEventListener('click', e => { if (e.target === s) s.classList.remove('on'); }));

/* ───────────────────────── Modo cliente ───────────────────────── */

function construirCliente() {
  const nom = st.ped.cli;
  $('#cliSaludo').textContent = nom ? `Hola ${nom}, esta es tu biblia` : 'Diseña tu biblia personalizada';
  $('#cliTexto').textContent = CLI_PUBLICO
    ? 'Escribe el nombre, elige la letra y el acabado. Cuando te guste, envíanoslo por WhatsApp y te confirmamos el valor.'
    : 'Así quedaría tu biblia. Si algo no está bien escrito, corrígelo aquí abajo y toca «Enviar cambios».';
  const pr = $('#cliPrecio');
  if (st.ped.ver && total() > 0) {
    pr.hidden = false;
    pr.innerHTML = '<span></span><b></b>';
    pr.querySelector('span').textContent = `Anticipo para empezar: ${pesos(anticipo())}`;
    pr.querySelector('b').textContent = pesos(total());
  } else pr.hidden = true;
  const box = $('#cliLineas'); box.innerHTML = '';
  st.el.forEach((el, i) => {
    if (el.t !== 'txt') return;
    const c = document.createElement('div'); c.className = 'card';
    const et = document.createElement('label'); et.textContent = ROLES[el.r] || 'Texto'; et.style.cssText = 'display:block;font-size:.8rem;color:var(--suave);margin-bottom:4px';
    const ta = document.createElement('textarea'); ta.rows = Math.max(1, el.s.split('\n').length); ta.value = el.s;
    const fonts = document.createElement('div'); fonts.className = 'scroll'; fonts.style.marginTop = '8px';
    const muestras = () => { const t = recorte(textoVisible(el).split('\n')[0] || 'Nombre'); fonts.querySelectorAll('.fch').forEach(b => { b.firstChild.textContent = t; }); };
    Object.entries(FUENTES).forEach(([k, f]) => {
      const b = document.createElement('button'); b.className = 'fch' + (el.f === k ? ' on' : ''); b.style.fontFamily = `lg-${k},serif`;
      b.appendChild(document.createTextNode('')); const sm = document.createElement('small'); sm.textContent = f.n; b.appendChild(sm);
      b.onclick = () => { el.f = k; fonts.querySelectorAll('.fch').forEach(x => x.classList.toggle('on', x === b)); cambio(); };
      fonts.appendChild(b);
    });
    ta.oninput = () => { el.s = ta.value; ta.rows = Math.max(1, ta.value.split('\n').length); muestras(); cambio(); };
    c.append(et, ta, fonts); muestras();
    box.appendChild(c);
  });
  const cf = $('#cliFin'); cf.innerHTML = '';
  ['oro', 'plata', 'rosa', 'blanco', 'relieve', 'laser'].forEach(k => {
    const b = document.createElement('button'); b.className = 'chip' + (st.fin === k ? ' on' : ''); b.textContent = ACABADOS[k].n;
    b.onclick = () => { st.fin = k; cf.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); cambio(); };
    cf.appendChild(b);
  });
  if (!CLI_PUBLICO && !$('#bAlEstudio')) {
    const b = document.createElement('button'); b.id = 'bAlEstudio'; b.className = 'mini'; b.style.marginTop = '18px';
    b.textContent = '¿Eres de Luz y Gracia? Abrir en el estudio';
    b.onclick = abrirEnEstudio;
    $('#cliLineas').parentElement.appendChild(b);
  }
  $('#bCambios').textContent = CLI_PUBLICO ? 'Pedirla por WhatsApp' : '✏️ Enviar cambios';
  if (CLI_PUBLICO) $('#bCambios').className = 'btnwa cli-only';
  $('#bAprobar').hidden = CLI_PUBLICO;
}

function abrirEnEstudio() {
  const guardado = lsGet(LS_DIS, []).find(x => x.id === st.id);
  const base = guardado ? normalizar(guardado.st) : normalizar(st);
  ['m', 'W', 'H', 'col', 'tex', 'cierre', 'canto', 'costura', 'lomo', 'fin', 'marco', 'mMarco', 'el'].forEach(k => { base[k] = st[k]; });
  if (!base.id) base.id = nuevoId();
  lsSet(LS_ACTUAL, base);
  location.replace('/estudio/');
}

$('#bAprobar').onclick = async () => {
  if (!confirm('¿Confirmas que el texto está bien escrito (nombre, tildes y fecha)? Una vez grabado no se puede corregir.')) return;
  const link = await enlaceCliente();
  const t = `Hola Johana 🕊️ APRUEBO el diseño ${st.id} de mi biblia: ${lineasTexto().join(', ')} · ${ACABADOS[st.fin].n.toLowerCase()}.\n${link}`;
  window.open(waLink(st.wa || WA_JOHANA, t), '_blank');
};
$('#bCambios').onclick = async () => {
  const link = await enlaceCliente();
  const t = CLI_PUBLICO
    ? `Hola Johana 🕊️ Diseñé mi biblia personalizada: ${lineasTexto().join(', ')} · ${ACABADOS[st.fin].n.toLowerCase()}. ¿Me ayudas a pedirla?\n${link}`
    : `Hola Johana 🕊️ Hice unos ajustes al diseño ${st.id}: ${lineasTexto().join(', ')} · ${ACABADOS[st.fin].n.toLowerCase()}. ¿Lo revisas?\n${link}`;
  window.open(waLink(st.wa || WA_JOHANA, t), '_blank');
};

/* ───────────────────────── Arranque ───────────────────────── */

let tToast = 0;
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tToast); tToast = setTimeout(() => e.classList.remove('on'), 3200); }

async function iniciar() {
  try { await cargarFuentes(); }
  catch (e) { $('#cargando').innerHTML = '<div><b>Sin conexión</b>Abre el estudio una vez con internet para descargar las letras.</div>'; return; }
  prepararIconos();
  const h = location.hash;
  if (h.startsWith('#c=')) {
    try { st = desdeEnlace(await decodificar(h.slice(3))); MODO_CLIENTE = true; CLI_PUBLICO = !st.id; }
    catch (e) { console.error(e); toast('El enlace está incompleto: pídele a Luz y Gracia que te lo reenvíe.'); }
  }
  if (!MODO_CLIENTE && new URLSearchParams(location.search).get('modo') === 'cliente') {
    st = disenoNuevoSinId(); aplicarPlantilla(PLANTILLAS[0], st); st.ped.ver = false; st.wa = WA_JOHANA; MODO_CLIENTE = CLI_PUBLICO = true;
  }
  if (MODO_CLIENTE) {
    document.body.classList.add('cliente');
    document.title = 'Tu biblia personalizada · Luz y Gracia';
    $('.brand b').textContent = 'Luz y Gracia'; $('.brand span').textContent = 'Biblias personalizadas';
    $('#hint').hidden = true;
    construirCliente();
  } else {
    const guardado = lsGet(LS_ACTUAL, null);
    st = guardado && guardado.el ? normalizar(guardado) : disenoNuevo();
    if (!st.id) st.id = nuevoId();
    construirBiblia(); construirTexto(); construirAdornos(); construirPedido();
    sincronizarTodo();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => { });
  }
  pintarYa();
  $('#cargando').remove();
  new ResizeObserver(() => pintar()).observe($('#stage'));
}
window.addEventListener('hashchange', () => location.reload());
// Con el teclado abierto la barra de abajo estorba: se esconde mientras se escribe.
const escribe = e => e.target.matches && e.target.matches('textarea, input:not([type=checkbox]):not([type=range]):not([type=file]):not([type=color])');
document.addEventListener('focusin', e => { if (escribe(e)) document.body.classList.add('tecleando'); });
document.addEventListener('focusout', e => { if (escribe(e)) document.body.classList.remove('tecleando'); });
window.addEventListener('error', e => toast('Error: ' + (e.message || 'inesperado')));
iniciar();
