/* Luz y Gracia · Eventos — ilustración del montaje (SVG generado en el navegador).
 *
 * Dibuja una mesa de evento completa con lo que el cliente escoge: paleta, sillas,
 * mantel, centro de mesa y fondo (arco de globos, pared de flores o telas con luces).
 * Es una ILUSTRACIÓN, no una foto: sirve para que el cliente diga «así lo quiero»
 * y para que la cotización llegue con el estilo ya definido. Sin dependencias.
 *
 *   LGEscena.svg({paleta:'rosa', silla:'tiffany-dorada', mantel:'blanco',
 *                 centro:'flores', fondo:'globos', letrero:'Mis XV · Valentina'})
 */
(function (w) {
  'use strict';

  var PALETAS = {
    rosa:      { n: 'Rosa palo y dorado',   a: '#e7aeb4', c: '#f8e4e3', d: '#b9707d', m: 'oro' },
    lila:      { n: 'Lila y plateado',      a: '#b9a3d6', c: '#ece3f6', d: '#7e64a8', m: 'plata' },
    azul:      { n: 'Azul rey y plateado',  a: '#3657b8', c: '#dbe4f8', d: '#1f3a85', m: 'plata' },
    rojo:      { n: 'Rojo y dorado',        a: '#b3202f', c: '#f3d7d5', d: '#7c1320', m: 'oro' },
    champana:  { n: 'Champaña y dorado',    a: '#e3cfa8', c: '#f7efe0', d: '#b39563', m: 'oro' },
    esmeralda: { n: 'Esmeralda y dorado',   a: '#1f7a5a', c: '#d8eee4', d: '#11523b', m: 'oro' },
    blanco:    { n: 'Blanco y verde',       a: '#f4f1ea', c: '#ffffff', d: '#7f9c7a', m: 'oro', verde: 1 },
    celeste:   { n: 'Celeste y blanco',     a: '#9cc8e8', c: '#eaf4fb', d: '#5b93bf', m: 'plata' },
    fucsia:    { n: 'Fucsia y dorado',      a: '#d9367f', c: '#f9dcea', d: '#9b1b56', m: 'oro' },
    terracota: { n: 'Terracota boho',       a: '#c46a45', c: '#f1dfcf', d: '#8a4428', m: 'oro', verde: 1 },
    negro:     { n: 'Negro y dorado',       a: '#22232a', c: '#ece6d8', d: '#0f0f13', m: 'oro' },
  };
  var METAL = {
    oro:   ['#8a6420', '#e9cf7a', '#b8892e', '#f6e7a8', '#9c7426'],
    plata: ['#7b7e82', '#e5e7ea', '#a3a6aa', '#f8f9fb', '#85888c'],
  };
  var SILLAS = {
    'tiffany-dorada': 'Tiffany dorada', 'tiffany-blanca': 'Tiffany blanca', 'tiffany-cristal': 'Tiffany transparente',
    'crossback': 'Crossback de madera', 'forrada': 'Silla con forro y moño',
  };
  var MANTELES = { blanco: 'Blanco', color: 'Del color de la paleta', sobremantel: 'Blanco con sobremantel', dorado: 'Lentejuela metálica' };
  var CENTROS = { flores: 'Flores en base alta', bajo: 'Arreglo bajo de flores', velas: 'Candelabro con velas', globos: 'Globos' };
  var FONDOS = { globos: 'Arco de globos', flores: 'Pared de flores', telas: 'Telas y luces' };

  // aleatorio con semilla: la misma combinación siempre dibuja la misma escena
  function azar(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mezcla(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join('');
  }
  function esc(s) { return String(s).replace(/[<&>"]/g, function (c) { return { '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var uid = 0;

  function svg(o) {
    o = o || {};
    var P = PALETAS[o.paleta] || PALETAS.rosa;
    var M = METAL[P.m];
    var id = 'lg' + (++uid);
    var r = azar(7 + Object.keys(PALETAS).indexOf(o.paleta || 'rosa') * 31 + (o.fondo || '').length * 7);
    var defs = [], s = [];

    // ── degradados comunes
    function grad(nombre, stops, x2, y2) {
      defs.push('<linearGradient id="' + id + nombre + '" x1="0" y1="0" x2="' + (x2 == null ? 1 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
        stops.map(function (c, i) { return '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>'; }).join('') + '</linearGradient>');
      return 'url(#' + id + nombre + ')';
    }
    var hechos = {};
    function radial(nombre, c, claro) {
      if (hechos[nombre]) return 'url(#' + id + nombre + ')';
      hechos[nombre] = 1;
      defs.push('<radialGradient id="' + id + nombre + '" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="' + (claro || mezcla(c, '#ffffff', .55)) + '"/>' +
        '<stop offset=".55" stop-color="' + c + '"/><stop offset="1" stop-color="' + mezcla(c, '#000000', .28) + '"/></radialGradient>');
      return 'url(#' + id + nombre + ')';
    }
    var metal = grad('met', M);
    var pared = grad('pared', ['#fbf6ee', '#f1e5d3'], 0, 1);
    var piso = grad('piso', ['#e2d2b6', '#cdb894'], 0, 1);
    defs.push('<filter id="' + id + 'gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>');
    defs.push('<filter id="' + id + 'som" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>');
    defs.push('<radialGradient id="' + id + 'luz" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#fff6dc" stop-opacity=".55"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>');

    // ── pared y piso
    s.push('<rect width="800" height="370" fill="' + pared + '"/>');
    s.push('<rect y="370" width="800" height="130" fill="' + piso + '"/>');
    for (var i = 0; i < 9; i++) s.push('<path d="M0 ' + (378 + i * i * 1.6) + 'H800" stroke="#b9a37d" stroke-opacity=".18"/>');
    s.push('<rect y="366" width="800" height="6" fill="#d8c6a6" opacity=".7"/>');

    // ── fondo
    var fondo = o.fondo || 'globos';
    if (fondo === 'telas') {
      var tela = grad('tela', [mezcla(P.c, '#ffffff', .3), P.c, mezcla(P.a, P.c, .5)], 1, 0);
      s.push('<path d="M120 40 Q400 120 680 40 L680 368 L120 368 Z" fill="' + mezcla(P.c, '#fff', .45) + '" opacity=".75"/>');
      for (var k = 0; k < 2; k++) {
        var x0 = k ? 680 : 120, dir = k ? -1 : 1;
        s.push('<path d="M' + x0 + ' 30 Q' + (x0 + dir * 130) + ' 70 ' + (x0 + dir * 70) + ' 200 Q' + (x0 + dir * 40) + ' 300 ' + (x0 + dir * 90) + ' 368 L' + x0 + ' 368 Z" fill="' + tela + '"/>');
        for (var f = 1; f < 5; f++) s.push('<path d="M' + (x0 + dir * f * 14) + ' 40 Q' + (x0 + dir * (f * 18 + 40)) + ' 200 ' + (x0 + dir * f * 20) + ' 366" stroke="' + P.d + '" stroke-opacity=".14" fill="none" stroke-width="2"/>');
      }
      s.push('<path d="M100 34 Q400 110 700 34" stroke="' + metal + '" stroke-width="7" fill="none"/>');
      // cortina de luces
      for (var c2 = 0; c2 < 22; c2++) {
        var xx = 170 + c2 * 21.5, largo = 120 + r() * 170;
        s.push('<path d="M' + xx + ' ' + (60 + Math.abs(c2 - 10.5) * -2.4 + 26) + ' V' + largo + '" stroke="#e9dcc2" stroke-width=".8" opacity=".8"/>');
        for (var b2 = 70; b2 < largo; b2 += 26) s.push('<circle class="lgb" style="animation-delay:' + (r() * 3).toFixed(2) + 's" cx="' + xx + '" cy="' + b2 + '" r="2.4" fill="#fff4cf"/>');
      }
    } else if (fondo === 'flores') {
      var verde = grad('verde', ['#5d7d55', '#3f5f3c']);
      s.push('<path d="M190 368 V150 Q190 40 400 40 Q610 40 610 150 V368 Z" fill="' + verde + '"/>');
      var cols = [P.a, P.c, '#ffffff', mezcla(P.a, '#ffffff', .4), P.d];
      for (var n = 0; n < 340; n++) {
        var fx = 196 + r() * 408, fy = 46 + r() * 320;
        var dentro = fy > 150 || Math.pow((fx - 400) / 210, 2) + Math.pow((fy - 150) / 110, 2) < 1;
        if (!dentro) continue;
        var rr = 9 + r() * 9, cc = cols[Math.floor(r() * cols.length)];
        s.push('<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="' + rr.toFixed(1) + '" fill="' + cc + '"/>');
        s.push('<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="' + (rr * .55).toFixed(1) + '" fill="none" stroke="' + mezcla(cc, '#000', .18) + '" stroke-width="1.4" opacity=".55"/>');
        s.push('<circle cx="' + (fx - rr * .25).toFixed(1) + '" cy="' + (fy - rr * .3).toFixed(1) + '" r="' + (rr * .22).toFixed(1) + '" fill="#fff" opacity=".35"/>');
      }
    } else {
      // arco orgánico de globos
      var colores = [P.a, P.c, P.d, 'met', P.a, P.c];
      var hojas = [];
      for (var t = 0; t <= 1.0001; t += 0.012) {
        var ang = Math.PI * (1 - t);
        var cx = 400 + Math.cos(ang) * 255, cy = 368 - Math.sin(ang) * 300;
        for (var j = 0; j < 2; j++) {
          var off = (r() - .5) * 46, rad = 13 + r() * 21;
          var px = cx + Math.cos(ang) * off, py = cy - Math.sin(ang) * off;
          var col = colores[Math.floor(r() * colores.length)];
          var fill = col === 'met' ? radial('gm' + Math.floor(t * 1000) + j, M[1], M[3]) : radial('g' + col.slice(1), col);
          s.push('<g class="lgf" style="animation-delay:' + (r() * 4).toFixed(2) + 's"><circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + rad.toFixed(1) + '" fill="' + fill + '"/></g>');
          if (r() < .35) hojas.push([px + (r() - .5) * 40, py + (r() - .5) * 40, r() * 360]);
        }
      }
      hojas.forEach(function (h) {
        s.push('<ellipse cx="' + h[0].toFixed(1) + '" cy="' + h[1].toFixed(1) + '" rx="9" ry="4" fill="#6f8f68" transform="rotate(' + h[2].toFixed(0) + ' ' + h[0].toFixed(1) + ' ' + h[1].toFixed(1) + ')" opacity=".9"/>');
      });
    }

    // letrero personalizado
    if (o.letrero) {
      // letrero en placa acrílica: legible sobre globos, flores o telas
      var fs = o.letrero.length > 16 ? 34 : 42, ly = fondo === 'telas' ? 150 : 132;
      var lw = Math.min(380, o.letrero.length * fs * .44 + 56);
      s.push('<rect x="' + (400 - lw / 2) + '" y="' + (ly - fs * .95) + '" width="' + lw + '" height="' + (fs * 1.32) + '" rx="' + (fs * .66) + '" fill="#ffffff" fill-opacity=".86" stroke="' + metal + '" stroke-width="2.4"/>');
      s.push('<text x="400" y="' + ly + '" text-anchor="middle" font-family="\'Great Vibes\',\'Pinyon Script\',cursive" font-size="' + fs + '" fill="' + (P.m === 'oro' ? '#a87a24' : '#6d7075') + '">' + esc(o.letrero) + '</text>');
    }

    // guirnalda de bombillos
    s.push('<path d="M-10 18 Q200 95 410 22 Q610 95 810 18" stroke="#5a4a32" stroke-width="1.3" fill="none" opacity=".6"/>');
    for (var q = 0; q <= 1; q += 0.045) {
      var bx = -10 + q * 820, by = q < .5 ? 18 + Math.sin(q * 2 * Math.PI) * 52 : 18 + Math.sin((q - .5) * 2 * Math.PI) * 52;
      s.push('<circle cx="' + bx.toFixed(1) + '" cy="' + (by + 9).toFixed(1) + '" r="9" fill="#ffd98a" filter="url(#' + id + 'gl)" opacity=".7" class="lgb" style="animation-delay:' + (q * 5).toFixed(2) + 's"/>');
      s.push('<circle cx="' + bx.toFixed(1) + '" cy="' + (by + 9).toFixed(1) + '" r="3.6" fill="#fff6d8"/>');
    }

    // ── sombra de la mesa
    s.push('<ellipse cx="400" cy="446" rx="215" ry="24" fill="#5a4426" opacity=".35" filter="url(#' + id + 'som)"/>');

    // ── mantel
    var mantel = o.mantel || 'blanco';
    var baseMantel = mantel === 'color' ? P.a : mantel === 'dorado' ? M[1] : '#fbfaf7';
    var mantelG = mantel === 'dorado' ? grad('mant', [M[0], M[3], M[2], M[1], M[0]], 1, 0)
      : grad('mant', [mezcla(baseMantel, '#000', .16), baseMantel, mezcla(baseMantel, '#fff', .35), baseMantel, mezcla(baseMantel, '#000', .2)], 1, 0);
    s.push('<path d="M206 300 C206 360 214 410 222 444 Q400 470 578 444 C586 410 594 360 594 300 Z" fill="' + mantelG + '"/>');
    for (var p = 0; p < 13; p++) {
      var fxp = 226 + p * 29;
      s.push('<path d="M' + fxp + ' 318 Q' + (fxp + 5) + ' 390 ' + (fxp + (fxp - 400) * .04) + ' 452" stroke="' + mezcla(baseMantel, '#000', .25) + '" stroke-opacity=".22" stroke-width="3" fill="none"/>');
    }
    if (mantel === 'dorado') for (var lz = 0; lz < 140; lz++) s.push('<circle cx="' + (224 + r() * 352).toFixed(1) + '" cy="' + (306 + r() * 140).toFixed(1) + '" r="1.3" fill="#fff8d9" opacity="' + (.3 + r() * .6).toFixed(2) + '"/>');
    if (mantel === 'sobremantel') {
      var sob = grad('sob', [P.d, P.a, mezcla(P.a, '#fff', .35), P.a, P.d], 1, 0);
      var bordeS = '';
      for (var z = 0; z <= 8; z++) { var zx = 214 + z * 46.5; bordeS += (z ? ' Q' + (zx - 23) + ' 392 ' : 'M') + zx + ' 372'; }
      s.push('<path d="M206 300 C206 330 209 352 214 372 ' + bordeS.slice(bordeS.indexOf('Q')) + ' C592 352 594 330 594 300 Z" fill="' + sob + '" opacity=".95"/>');
    }
    // tapa de la mesa
    s.push('<ellipse cx="400" cy="300" rx="194" ry="36" fill="' + (mantel === 'dorado' ? M[3] : mezcla(baseMantel, '#fff', .25)) + '"/>');
    if (mantel !== 'dorado') s.push('<path d="M262 292 Q400 334 538 292" stroke="' + (mantel === 'color' ? P.d : metal) + '" stroke-width="16" fill="none" opacity=".85"/>');

    // ── puestos (platos, servilletas, copas)
    function puesto(ang, esc2) {
      var x = 400 + Math.cos(ang) * 150, y = 300 + Math.sin(ang) * 25;
      var out = '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + esc2 + ')">';
      out += '<ellipse rx="27" ry="7.5" fill="' + metal + '"/><ellipse rx="23" ry="6" fill="#ffffff"/><ellipse rx="15" ry="3.8" fill="#f1efea"/>';
      out += '<path d="M-6 -2 L0 -16 L6 -2 Z" fill="' + P.a + '" stroke="' + P.d + '" stroke-width=".8"/>';
      out += '<path d="M20 -6 v-15 q5 -6 10 0 v15 z" fill="#ffffff" fill-opacity=".55" stroke="#c9d3da" stroke-width=".9"/><path d="M25 -6 v6" stroke="#c9d3da"/>';
      return out + '</g>';
    }
    [200, 230, 260, 290, 320, 340].forEach(function (g) { s.push(puesto(g * Math.PI / 180, .62)); });
    [25, 60, 90, 120, 155].forEach(function (g) { s.push(puesto(g * Math.PI / 180, .85)); });

    // ── centro de mesa
    var centro = o.centro || 'flores';
    if (centro === 'flores' || centro === 'bajo') {
      var alto = centro === 'flores';
      if (alto) {
        s.push('<path d="M393 296 L396 222 L404 222 L407 296 Z" fill="' + metal + '"/><ellipse cx="400" cy="296" rx="18" ry="5" fill="' + metal + '"/>');
        s.push('<path d="M380 222 h40 l-6 9 h-28 z" fill="' + metal + '"/>');
      }
      var cy0 = alto ? 198 : 282, ancho = alto ? 56 : 120, altoF = alto ? 40 : 20;
      var colsF = [P.a, P.c, '#ffffff', P.d, mezcla(P.a, '#fff', .45)];
      for (var v = 0; v < 26; v++) { var vx = 400 + (r() - .5) * ancho * 2.1, vy = cy0 + (r() - .5) * altoF * 1.4; s.push('<ellipse cx="' + vx.toFixed(1) + '" cy="' + vy.toFixed(1) + '" rx="12" ry="5" fill="#6f8f68" transform="rotate(' + (r() * 180).toFixed(0) + ' ' + vx.toFixed(1) + ' ' + vy.toFixed(1) + ')"/>'); }
      for (var u = 0; u < (alto ? 46 : 40); u++) {
        var a2 = r() * Math.PI * 2, d2 = Math.sqrt(r());
        var ux = 400 + Math.cos(a2) * d2 * ancho, uy = cy0 + Math.sin(a2) * d2 * altoF, ur = 8 + r() * 7, uc = colsF[Math.floor(r() * colsF.length)];
        s.push('<circle cx="' + ux.toFixed(1) + '" cy="' + uy.toFixed(1) + '" r="' + ur.toFixed(1) + '" fill="' + uc + '"/><circle cx="' + ux.toFixed(1) + '" cy="' + uy.toFixed(1) + '" r="' + (ur * .5).toFixed(1) + '" fill="none" stroke="' + mezcla(uc, '#000', .2) + '" stroke-opacity=".5" stroke-width="1.2"/>');
      }
    } else if (centro === 'velas') {
      s.push('<path d="M396 296 L398 214 h4 L404 296 Z" fill="' + metal + '"/><ellipse cx="400" cy="296" rx="22" ry="6" fill="' + metal + '"/>');
      s.push('<path d="M340 222 Q400 258 460 222" stroke="' + metal + '" stroke-width="6" fill="none"/><path d="M370 214 Q400 236 430 214" stroke="' + metal + '" stroke-width="5" fill="none"/>');
      [[340, 222], [370, 214], [400, 210], [430, 214], [460, 222]].forEach(function (c3) {
        s.push('<rect x="' + (c3[0] - 6) + '" y="' + (c3[1] - 44) + '" width="12" height="44" rx="2" fill="#fbf7ee"/>');
        s.push('<ellipse class="lgv" cx="' + c3[0] + '" cy="' + (c3[1] - 52) + '" rx="4.5" ry="9" fill="#ffcf6a"/><circle cx="' + c3[0] + '" cy="' + (c3[1] - 52) + '" r="16" fill="#ffd98a" opacity=".35" filter="url(#' + id + 'gl)"/>');
      });
      for (var pv = 0; pv < 18; pv++) { var pvx = 300 + r() * 200; s.push('<circle cx="' + pvx.toFixed(1) + '" cy="' + (290 + r() * 12).toFixed(1) + '" r="5" fill="' + [P.a, '#fff', P.c][pv % 3] + '"/>'); }
    } else {
      s.push('<path d="M400 296 C396 260 404 230 400 190 M400 296 C420 260 430 230 440 176 M400 296 C380 262 368 236 358 182" stroke="#d9c8a3" stroke-width="1.2" fill="none"/>');
      s.push('<path d="M386 296 h28 l-4 -14 h-20 z" fill="' + metal + '"/>');
      [[400, 172, 30, P.a], [442, 160, 26, 'met'], [356, 164, 27, P.c], [420, 128, 22, P.d], [378, 130, 20, P.a]].forEach(function (g2, ii) {
        var fg = g2[3] === 'met' ? radial('cgm' + ii, M[1], M[3]) : radial('cg' + g2[3].slice(1), g2[3]);
        s.push('<g class="lgf" style="animation-delay:' + ii * .6 + 's"><ellipse cx="' + g2[0] + '" cy="' + g2[1] + '" rx="' + g2[2] + '" ry="' + (g2[2] * 1.12) + '" fill="' + fg + '"/></g>');
      });
    }

    // ── sillas (de espaldas, delante de la mesa)
    var silla = o.silla || 'tiffany-dorada';
    function sillaSVG(x, y, e) {
      var out = '<g transform="translate(' + x + ' ' + y + ') scale(' + e + ')">';
      if (silla === 'forrada') {
        var forro = grad('forro', ['#e9e6df', '#ffffff', '#f3f1ec', '#dcd8cf'], 1, 0);
        out += '<path d="M-29 -132 Q-29 -164 0 -164 Q29 -164 29 -132 L38 -4 Q46 60 56 118 L-56 118 Q-46 60 -38 -4 Z" fill="' + forro + '"/>';
        out += '<path d="M-38 -10 Q0 2 38 -10 L40 12 Q0 24 -40 12 Z" fill="' + P.a + '"/>';
        out += '<path d="M0 8 C-30 -14 -40 22 -10 18 C-34 40 -18 60 0 22 C18 60 34 40 10 18 C40 22 30 -14 0 8 Z" fill="' + P.a + '" stroke="' + P.d + '" stroke-width="1.2"/>';
        out += '<path d="M-6 22 L-16 70 M6 22 L18 72" stroke="' + P.a + '" stroke-width="7" stroke-linecap="round"/>';
        for (var fz = -30; fz <= 30; fz += 15) out += '<path d="M' + fz + ' 30 Q' + (fz * 1.1) + ' 80 ' + (fz * 1.2) + ' 116" stroke="#000" stroke-opacity=".05" stroke-width="3" fill="none"/>';
      } else if (silla === 'crossback') {
        var mad = grad('mad', ['#7a4f2c', '#a5713f', '#6b4425'], 1, 0);
        out += '<rect x="-36" y="-150" width="8" height="268" rx="3" fill="' + mad + '"/><rect x="28" y="-150" width="8" height="268" rx="3" fill="' + mad + '"/>';
        out += '<rect x="-36" y="-152" width="72" height="12" rx="4" fill="' + mad + '"/><rect x="-34" y="-8" width="68" height="10" rx="3" fill="' + mad + '"/>';
        out += '<path d="M-30 -140 L30 -10 M30 -140 L-30 -10" stroke="#8b5b33" stroke-width="7"/><path d="M-30 -140 L30 -10 M30 -140 L-30 -10" stroke="#b07a46" stroke-width="2.4" opacity=".7"/>';
        out += '<rect x="-36" y="44" width="72" height="5" fill="#6b4425"/>';
      } else {
        var col2 = silla === 'tiffany-blanca' ? '#f7f5f1' : silla === 'tiffany-cristal' ? 'rgba(220,232,240,.55)' : null;
        var mt = col2 || metal, borde = silla === 'tiffany-cristal' ? '#b9cad6' : 'none';
        out += '<path d="M-31 -150 Q-35 -40 -36 118 h8 Q-26 -40 -23 -150 Z" fill="' + mt + '" stroke="' + borde + '"/>';
        out += '<path d="M31 -150 Q35 -40 36 118 h-8 Q26 -40 23 -150 Z" fill="' + mt + '" stroke="' + borde + '"/>';
        out += '<rect x="-33" y="-154" width="66" height="10" rx="5" fill="' + mt + '" stroke="' + borde + '"/>';
        [-118, -96].forEach(function (yy) { out += '<rect x="-31" y="' + yy + '" width="62" height="5" rx="2" fill="' + mt + '" stroke="' + borde + '"/>'; });
        for (var sp = -18; sp <= 18; sp += 12) out += '<rect x="' + (sp - 2) + '" y="-96" width="4" height="88" fill="' + mt + '" stroke="' + borde + '"/>';
        out += '<rect x="-34" y="-10" width="68" height="8" rx="3" fill="' + mt + '" stroke="' + borde + '"/>';
        out += '<path d="M-34 -6 Q0 6 34 -6 L34 2 Q0 14 -34 2 Z" fill="' + P.c + '" opacity=".95"/>';
        [40, 76].forEach(function (yy) { out += '<rect x="-34" y="' + yy + '" width="68" height="4" fill="' + mt + '" stroke="' + borde + '"/>'; });
      }
      return out + '</g>';
    }
    s.push('<ellipse cx="290" cy="478" rx="44" ry="8" fill="#4d3a20" opacity=".3" filter="url(#' + id + 'som)"/><ellipse cx="510" cy="478" rx="44" ry="8" fill="#4d3a20" opacity=".3" filter="url(#' + id + 'som)"/>');
    s.push(sillaSVG(190, 352, .5));
    s.push(sillaSVG(610, 352, .5));
    s.push(sillaSVG(292, 392, .72));
    s.push(sillaSVG(508, 392, .72));

    // ── luz cálida general
    s.push('<rect width="800" height="500" fill="url(#' + id + 'luz)"/>');

    var css = '<style>.lgb{animation:lgb 3.2s ease-in-out infinite}@keyframes lgb{50%{opacity:.35}}' +
      '.lgf{animation:lgf 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes lgf{50%{transform:translateY(-3px)}}' +
      '.lgv{animation:lgv 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom}@keyframes lgv{50%{transform:scaleY(.82) skewX(4deg)}}' +
      '@media (prefers-reduced-motion:reduce){.lgb,.lgf,.lgv{animation:none}}</style>';
    return '<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustración del montaje: ' +
      esc(P.n + ', ' + (SILLAS[silla] || '') + ', ' + (FONDOS[fondo] || '')) + '">' + css + '<defs>' + defs.join('') + '</defs>' + s.join('') + '</svg>';
  }

  w.LGEscena = { svg: svg, PALETAS: PALETAS, SILLAS: SILLAS, MANTELES: MANTELES, CENTROS: CENTROS, FONDOS: FONDOS };
})(window);
