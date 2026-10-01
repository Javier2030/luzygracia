/* Luz y Gracia · Eventos — «Arma tu evento».
 *
 * El cliente escoge tipo de evento, municipio, fecha, invitados, estilo y servicios;
 * la herramienta calcula las cantidades (sillas, mesas, manteles, meseros, pasabocas,
 * platos, porciones de torta) con reglas de uso común en eventos y arma la solicitud
 * completa para WhatsApp. No muestra precios: el precio lo confirma Johana por escrito.
 *
 * Se monta en cualquier <div data-lg-cotizador> y admite valores iniciales:
 *   <div data-lg-cotizador data-tipo="quinceanera" data-servicios="decoracion,sillas"></div>
 */
(function () {
  'use strict';
  var WA = '573126295392';
  var TIPOS = [
    ['quinceanera', 'Quinceañera', 'Mis XV'], ['boda', 'Boda', 'Nuestra boda'], ['bautizo', 'Bautizo o presentación de niños', ''],
    ['cumpleanos', 'Cumpleaños', ''], ['grado', 'Grado', ''], ['empresa', 'Evento de empresa o iglesia', ''], ['otro', 'Otro', '']];
  var MUNICIPIOS = ['Girardot', 'Ricaurte (Peñalisa)', 'Flandes', 'Melgar', 'Carmen de Apicalá', 'Nilo', 'Agua de Dios', 'Tocaima', 'Espinal', 'Otro'];
  var LUGARES = ['Finca o casa de recreo', 'Salón de eventos', 'Condominio o club', 'Hotel', 'Casa', 'Aún no tengo lugar'];
  var SERVICIOS = [
    ['decoracion', 'Decoración completa', 'Fondo, mesa principal, centros de mesa y detalles'],
    ['flores', 'Ramo y flores', 'Ramo de novia o de quinceañera, arreglos y boutonniere'],
    ['globos', 'Globos', 'Arco, columnas o centros con globos'],
    ['sillas', 'Sillas', 'Tiffany, crossback o con forro y moño'],
    ['mesas', 'Mesas', 'Redondas para 10 o imperiales'],
    ['manteleria', 'Mantelería y menaje', 'Manteles, caminos, vajilla, cubiertos y copas'],
    ['carpa', 'Carpa', 'Para sol o lluvia en fincas y jardines'],
    ['meseros', 'Meseros', 'Servicio a la mesa, buffet o cóctel'],
    ['comida', 'Comida', 'Plato servido, buffet o asado'],
    ['pasabocas', 'Pasabocas', 'De sal y de dulce'],
    ['torta', 'Torta y mesa de postres', 'Porciones según invitados'],
  ];
  var SERVICIO_COMIDA = [['servido', 'Plato servido a la mesa'], ['buffet', 'Buffet'], ['coctel', 'Solo pasabocas (cóctel)']];

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[<&>"]/g, function (c) { return { '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var n = function (x) { return Math.round(x).toLocaleString('es-CO'); };

  // Reglas de uso común (estimado orientativo, no un contrato):
  function cantidades(st) {
    var inv = st.invitados, q = {};
    q.mesas = Math.ceil(inv / 10);                      // mesa redonda de 1,50 m = 10 puestos
    q.sillas = inv + Math.max(2, Math.ceil(inv * .03)); // algunas de reserva
    q.manteles = q.mesas + 2;                           // + mesa principal y mesa de torta/regalos
    var porMesero = st.servicioComida === 'servido' ? 12 : st.servicioComida === 'buffet' ? 20 : 25;
    q.meseros = Math.max(2, Math.ceil(inv / porMesero));
    q.porMesero = porMesero;
    q.pasabocasPP = st.servicioComida === 'coctel' ? 12 : 5;
    q.pasabocas = inv * q.pasabocasPP;
    q.platos = inv;
    q.torta = inv;
    return q;
  }

  function montar(raiz) {
    var tipo0 = raiz.getAttribute('data-tipo') || 'quinceanera';
    var serv0 = (raiz.getAttribute('data-servicios') || 'decoracion,sillas,mesas,manteleria').split(',');
    var compacto = raiz.hasAttribute('data-compacto');
    var st = {
      tipo: tipo0, municipio: raiz.getAttribute('data-municipio') || 'Girardot', lugar: LUGARES[0], fecha: '', invitados: 100, servicioComida: 'servido',
      paleta: raiz.getAttribute('data-paleta') || (tipo0 === 'boda' ? 'blanco' : tipo0 === 'bautizo' ? 'celeste' : 'rosa'),
      silla: tipo0 === 'boda' ? 'crossback' : 'tiffany-dorada', mantel: 'blanco', centro: 'flores',
      fondo: tipo0 === 'boda' ? 'flores' : 'globos', letrero: '', servicios: {}, notas: '', nombre: '',
    };
    serv0.forEach(function (s) { st.servicios[s] = true; });

    raiz.classList.add('cz');
    raiz.innerHTML =
      '<div class="cz-vista"><div class="cz-svg" aria-live="polite"></div><p class="cz-nota">Ilustración de referencia: así se vería tu montaje. El montaje real se ajusta al lugar.</p></div>' +
      '<div class="cz-form">' +
      '<div class="cz-paso"><span>1</span><b>Tu evento</b></div>' +
      '<div class="cz-chips" data-k="tipo"></div>' +
      '<div class="cz-g2"><label>Municipio<select data-k="municipio"></select></label><label>Fecha<input type="date" data-k="fecha"></label></div>' +
      '<div class="cz-g2"><label>Lugar<select data-k="lugar"></select></label><label>Nombre en el letrero <small>(opcional)</small><input type="text" maxlength="24" data-k="letrero" placeholder="Ej.: Mis XV · Valentina"></label></div>' +
      '<label class="cz-rng">Invitados <output></output><input type="range" min="20" max="400" step="5" data-k="invitados"></label>' +
      '<div class="cz-paso"><span>2</span><b>Estilo</b></div>' +
      '<div class="cz-sw" data-k="paleta"></div>' +
      '<div class="cz-g2"><label>Sillas<select data-k="silla"></select></label><label>Mantel<select data-k="mantel"></select></label></div>' +
      '<div class="cz-g2"><label>Centro de mesa<select data-k="centro"></select></label><label>Fondo<select data-k="fondo"></select></label></div>' +
      '<div class="cz-paso"><span>3</span><b>¿Qué necesitas?</b></div>' +
      '<div class="cz-serv"></div>' +
      '<div class="cz-comida"><label>Servicio de comida<select data-k="servicioComida"></select></label></div>' +
      '<div class="cz-res"></div>' +
      '<label>Algo más que debamos saber <small>(opcional)</small><textarea rows="2" data-k="notas" placeholder="Horario, si el lugar tiene mesas propias, colores exactos…"></textarea></label>' +
      '<label>Tu nombre<input type="text" data-k="nombre" autocomplete="name" placeholder="Para saludarte"></label>' +
      '<button type="button" class="btn wa cz-enviar">Enviar mi evento a Johana por WhatsApp</button>' +
      '<p class="cz-pie">Te responde Johana con la cotización por escrito, ítem por ítem. Sin compromiso.</p>' +
      '</div>';
    if (compacto) raiz.classList.add('cz-compacto');

    var q = function (s) { return raiz.querySelector(s); };
    var chips = q('[data-k="tipo"]');
    TIPOS.forEach(function (t) {
      var b = el('button', { type: 'button', 'class': 'cz-chip' }, esc(t[1])); b.dataset.v = t[0];
      b.onclick = function () { st.tipo = t[0]; pintar(); };
      chips.appendChild(b);
    });
    function opciones(sel, lista) { lista.forEach(function (o) { var op = el('option', { value: o[0] }, esc(o[1])); sel.appendChild(op); }); }
    opciones(q('[data-k="municipio"]'), MUNICIPIOS.map(function (m) { return [m, m]; }));
    opciones(q('[data-k="lugar"]'), LUGARES.map(function (m) { return [m, m]; }));
    var E = window.LGEscena;
    opciones(q('[data-k="silla"]'), Object.keys(E.SILLAS).map(function (k) { return [k, E.SILLAS[k]]; }));
    opciones(q('[data-k="mantel"]'), Object.keys(E.MANTELES).map(function (k) { return [k, E.MANTELES[k]]; }));
    opciones(q('[data-k="centro"]'), Object.keys(E.CENTROS).map(function (k) { return [k, E.CENTROS[k]]; }));
    opciones(q('[data-k="fondo"]'), Object.keys(E.FONDOS).map(function (k) { return [k, E.FONDOS[k]]; }));
    opciones(q('[data-k="servicioComida"]'), SERVICIO_COMIDA);
    var sw = q('[data-k="paleta"]');
    Object.keys(E.PALETAS).forEach(function (k) {
      var P = E.PALETAS[k], b = el('button', { type: 'button', 'class': 'cz-pal', title: P.n, 'aria-label': P.n });
      b.style.background = 'linear-gradient(135deg,' + P.a + ' 0 50%,' + (P.m === 'oro' ? '#d9b65c' : '#c7cace') + ' 50% 100%)';
      b.dataset.v = k; b.onclick = function () { st.paleta = k; pintar(); };
      sw.appendChild(b);
    });
    var sv = q('.cz-serv');
    SERVICIOS.forEach(function (s) {
      var l = el('label', { 'class': 'cz-s' }, '<input type="checkbox"><span><b>' + esc(s[1]) + '</b><small>' + esc(s[2]) + '</small></span>');
      var c = l.querySelector('input'); c.checked = !!st.servicios[s[0]];
      c.onchange = function () { st.servicios[s[0]] = c.checked; pintar(); };
      sv.appendChild(l);
    });
    raiz.querySelectorAll('[data-k]').forEach(function (f) {
      if (f.tagName === 'DIV') return;
      var k = f.getAttribute('data-k');
      f.value = st[k];
      f.addEventListener('input', function () { st[k] = k === 'invitados' ? +f.value : f.value; pintar(); });
    });

    var tVista = 0;
    function pintar() {
      chips.querySelectorAll('.cz-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.v === st.tipo); });
      sw.querySelectorAll('.cz-pal').forEach(function (b) { b.classList.toggle('on', b.dataset.v === st.paleta); });
      q('.cz-rng output').textContent = st.invitados;
      var hayComida = st.servicios.comida || st.servicios.pasabocas || st.servicios.meseros;
      q('.cz-comida').hidden = !hayComida;
      var c = cantidades(st), filas = [];
      if (st.servicios.sillas) filas.push(['Sillas', n(c.sillas), 'invitados + algunas de reserva']);
      if (st.servicios.mesas) filas.push(['Mesas redondas', n(c.mesas), '10 puestos por mesa']);
      if (st.servicios.manteleria) filas.push(['Manteles', n(c.manteles), 'una por mesa + mesa principal y de torta']);
      if (st.servicios.meseros) filas.push(['Meseros', n(c.meseros), '1 por cada ' + c.porMesero + ' invitados']);
      if (st.servicios.pasabocas) filas.push(['Pasabocas', n(c.pasabocas), c.pasabocasPP + ' por invitado' + (st.servicioComida === 'coctel' ? ' (sin cena)' : ' (antes de la comida)')]);
      if (st.servicios.comida && st.servicioComida !== 'coctel') filas.push(['Platos de comida', n(c.platos), 'uno por invitado']);
      if (st.servicios.torta) filas.push(['Porciones de torta', n(c.torta), 'una por invitado']);
      q('.cz-res').innerHTML = filas.length
        ? '<div class="cz-rt">Para ' + n(st.invitados) + ' invitados necesitarías:</div><table>' + filas.map(function (f) { return '<tr><td>' + f[0] + '</td><td><b>' + f[1] + '</b></td><td>' + f[2] + '</td></tr>'; }).join('') + '</table><p class="cz-pie">Cantidades orientativas. Johana las ajusta contigo según el lugar y el tipo de servicio.</p>'
        : '';
      clearTimeout(tVista);
      tVista = setTimeout(function () {
        q('.cz-svg').innerHTML = E.svg({ paleta: st.paleta, silla: st.silla, mantel: st.mantel, centro: st.centro, fondo: st.fondo, letrero: st.letrero });
      }, 30);
    }

    function mensaje() {
      var c = cantidades(st), t = TIPOS.find(function (x) { return x[0] === st.tipo; })[1];
      var P = E.PALETAS[st.paleta], L = [];
      L.push('Hola Johana, quiero cotizar un evento con Luz y Gracia:');
      L.push('');
      L.push('• Evento: ' + t);
      L.push('• Municipio: ' + st.municipio + ' · Lugar: ' + st.lugar);
      if (st.fecha) { var f = st.fecha.split('-'); L.push('• Fecha: ' + f[2] + '/' + f[1] + '/' + f[0]); }
      L.push('• Invitados: ' + st.invitados);
      L.push('• Estilo: ' + P.n + ', ' + E.SILLAS[st.silla].toLowerCase() + ', mantel ' + E.MANTELES[st.mantel].toLowerCase() + ', centro ' + E.CENTROS[st.centro].toLowerCase() + ', fondo ' + E.FONDOS[st.fondo].toLowerCase() + (st.letrero ? ', letrero «' + st.letrero + '»' : ''));
      var s = [];
      if (st.servicios.decoracion) s.push('decoración completa');
      if (st.servicios.flores) s.push('ramo y flores');
      if (st.servicios.globos) s.push('globos');
      if (st.servicios.sillas) s.push(c.sillas + ' sillas');
      if (st.servicios.mesas) s.push(c.mesas + ' mesas');
      if (st.servicios.manteleria) s.push('mantelería y menaje (' + c.manteles + ' manteles)');
      if (st.servicios.carpa) s.push('carpa');
      if (st.servicios.meseros) s.push(c.meseros + ' meseros');
      if (st.servicios.comida) s.push('comida (' + SERVICIO_COMIDA.find(function (x) { return x[0] === st.servicioComida; })[1].toLowerCase() + ')');
      if (st.servicios.pasabocas) s.push(c.pasabocas + ' pasabocas');
      if (st.servicios.torta) s.push('torta para ' + c.torta);
      L.push('• Necesito: ' + (s.join(', ') || 'asesoría'));
      if (st.notas.trim()) L.push('• Notas: ' + st.notas.trim());
      L.push('');
      L.push((st.nombre.trim() ? 'Mi nombre es ' + st.nombre.trim() + '. ' : '') + '¿Me envías la cotización?');
      return L.join('\n');
    }
    // «Cotizar este estilo» desde la galería de ideas
    document.addEventListener('lg-estilo', function (e) {
      var d = e.detail || {};
      ['paleta', 'silla', 'mantel', 'centro', 'fondo', 'tipo'].forEach(function (k) { if (d[k]) st[k] = d[k]; });
      raiz.querySelectorAll('select[data-k]').forEach(function (f) { f.value = st[f.getAttribute('data-k')]; });
      pintar();
      raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    q('.cz-enviar').onclick = function () {
      var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(mensaje());
      try { if (window.gtag) gtag('event', 'cotizar_evento', { tipo: st.tipo, municipio: st.municipio, invitados: st.invitados }); } catch (e) { }
      try { if (window.clarity) clarity('event', 'cotizar_evento'); } catch (e) { }
      window.open(url, '_blank');
    };
    pintar();
  }

  function iniciar() { document.querySelectorAll('[data-lg-cotizador]').forEach(montar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
