/* =====================================================================
   APLICACIÓN — Grupo Pana · Gestión Digital SST · v07.2
   ATS y PETAR de trabajos de alto riesgo. Pantallas, navegación y acciones.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.SST_CONFIG, M = window.Modelo, UI = window.UI;
  var esc = UI.esc, $ = UI.$;

  var st = {
    usuario: null, pantalla: 'sede', doc: null, paso: 0,
    errores: [], lista: [], filtroTipo: '', pads: {}, volverA: 'inicio',
    sstAutorizado: false, claveAjustesHash: '', fotosDisponibles: true
  };
  var app, titulo, sub, atras, tGuardar = null;

  /* ============================ Utilidades ========================== */
  function setPath(o, ruta, v) {
    var p = ruta.split('.');
    for (var i = 0; i < p.length - 1; i++) { if (o[p[i]] === undefined) o[p[i]] = {}; o = o[p[i]]; }
    o[p[p.length - 1]] = v;
  }
  function getPath(o, ruta) {
    return ruta.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o);
  }
  function guardarLuego() {
    if (!st.doc) return;
    clearTimeout(tGuardar);
    var documento = st.doc;
    tGuardar = setTimeout(function () { window.Store.guardar(documento).then(UI.marcarGuardado).catch(errorGuardado); }, 300);
  }
  function errorGuardado() {
    var el = $('#guardado');
    if (el) { el.textContent = 'No se pudo guardar. Mantén esta página abierta y reintenta.'; el.classList.add('guardado--visible'); }
    UI.aviso('Error de guardado. Los últimos cambios pueden no estar guardados.', 'mal');
  }
  function guardarYa() { clearTimeout(tGuardar); return st.doc ? window.Store.guardar(st.doc) : Promise.resolve(); }
  function quieto() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  function buscarSede(codigo) {
    return (C.sedes || []).find(function (s) { return s.codigo === codigo; }) || null;
  }
  function aplicarSede(codigo) {
    var s = buscarSede(codigo);
    if (!s) return false;
    C.sede = s.nombre;
    C.sedeCodigo = s.codigo;
    return true;
  }
  function esSedeActual(d) {
    M.normalizar(d);
    return M.sede(d) === C.sede;
  }
  function opcionesSede(actual) {
    return '<option value="">Selecciona una sede</option>' + (C.sedes || []).map(function (s) {
      return '<option value="' + esc(s.codigo) + '"' + (s.codigo === actual ? ' selected' : '') + '>' + esc(s.nombre) + '</option>';
    }).join('');
  }

  /* Un PETAR solo puede editarse, revisarse o autorizarse si conserva
     un vínculo real con un ATS existente y ya REGISTRADO en este dispositivo. */
  function atsRegistradoParaPetar(d) {
    if (!d || d.tipo !== 'PETAR') return Promise.resolve(true);
    var s = d.descripcion || {};
    if (!s.atsId || !s.atsRef) return Promise.resolve(false);
    var sedePetar = M.sede(d);
    return window.Store.obtener(s.atsId).then(function (ats) {
      if (ats) M.normalizar(ats);
      return !!(ats && ats.tipo === 'ATS' && ats.estado === 'REGISTRADO' && ats.numero === s.atsRef &&
        M.sede(ats) === sedePetar && sedePetar === C.sede);
    }).catch(function () { return false; });
  }
  function avisoATSObligatorio() {
    UI.aviso('Para continuar con el PETAR primero debes registrar un ATS y crear el PETAR desde ese ATS.', 'mal');
  }

  function ir(p, paso, vinculoATSComprobado) {
    if (!vinculoATSComprobado && st.doc && st.doc.tipo === 'PETAR' && ['form', 'revision', 'firmas'].indexOf(p) >= 0) {
      atsRegistradoParaPetar(st.doc).then(function (ok) {
        if (!ok) {
          avisoATSObligatorio();
          if (st.pantalla !== 'detalle') ir('detalle');
          return;
        }
        ir(p, paso, true);
      });
      return;
    }
    if (p === 'form' && st.doc) {
      if (!M.editable(st.doc)) { UI.aviso('Solo se editan borradores.', 'mal'); return; }
      if (M.tieneFirmas(st.doc)) {
        UI.confirmar({ titulo: 'Volver a editar', texto: 'Al volver al formulario se borrarán las firmas. Todos deberán firmar nuevamente.', aceptar: 'Editar y borrar firmas', peligro: true }).then(function (ok) {
          if (!ok) return;
          M.limpiarFirmas(st.doc); guardarYa().then(function () { ir(p, paso); });
        });
        return;
      }
    }
    if (st.pantalla === 'ajustes' && p !== 'ajustes') st.sstAutorizado = false;
    st.pantalla = p; if (paso !== undefined) st.paso = paso;
    st.errores = []; window.scrollTo(0, 0); render();
  }

  function campo(etq, control, ayuda) {
    var existente = control.match(/^\s*<(?:input|select|textarea)[^>]*\sid="([^"]+)"/);
    var id = existente ? existente[1] : 'c' + Math.random().toString(36).slice(2, 7);
    return '<div class="campo"><label for="' + id + '">' + esc(etq) + '</label>' +
      (existente ? control : control.replace(/<(input|select|textarea)/, '<$1 id="' + id + '"')) +
      (ayuda ? '<small class="ayuda">' + esc(ayuda) + '</small>' : '') + '</div>';
  }
  function txt(ruta, v, ph, tipo, extra) {
    return '<input type="' + (tipo || 'text') + '" data-campo="' + ruta + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '"' + (extra || '') + '>';
  }
  function area(ruta, v, ph, filas) {
    return '<textarea rows="' + (filas || 3) + '" data-campo="' + ruta + '" placeholder="' + esc(ph || '') + '">' + esc(v || '') + '</textarea>';
  }
  var ESC_SN = [{ v: 'si', e: 'Sí', t: 'ok' }, { v: 'no', e: 'No', t: 'mal' }];
  var ESC_SNNA = ESC_SN.concat([{ v: 'na', e: 'N/A', t: 'neutro' }]);
  var ESC_SINA = [{ v: 'si', e: 'Sí', t: 'ok' }, { v: 'na', e: 'N/A', t: 'neutro' }];
  function seg(ruta, valor, escala) {
    return '<div class="seg' + (escala.length === 2 ? ' seg--2' : '') + '">' + escala.map(function (o) {
      return '<button type="button" class="seg__btn seg__btn--' + o.t + (valor === o.v ? ' es-activo' : '') + '" data-accion="resp" data-ruta="' + ruta + '" data-valor="' + o.v + '">' + o.e + '</button>';
    }).join('') + '</div>';
  }
  function pregunta(texto, ruta, valor, escala, marcasHtml, alerta, extra) {
    return '<div class="preg"><p class="preg__texto">' + esc(texto) + (marcasHtml || '') + '</p>' + seg(ruta, valor, escala) +
      (alerta ? '<div class="alerta alerta--' + alerta[0] + '">' + esc(alerta[1]) + '</div>' : '') + (extra || '') + '</div>';
  }

  /* ---------------- Evidencias fotográficas optimizadas ---------------- */
  function preguntaV(d, seccion, it, alertaNo) {
    var ruta = seccion + '.' + it.id, v = d[seccion][it.id];
    return pregunta(it.label, ruta, v, it.admiteNA ? ESC_SNNA : ESC_SN, marca(it.nivel),
      v === 'no' ? (it.nivel === 'critico' ? ['mal', alertaNo || 'Control crítico sin cumplir: el permiso no puede autorizarse.'] : ['aviso', 'Registra la medida adoptada en Observaciones.']) : null);
  }

  function evidenciaHTML(d, ev) {
    var fotos = M.fotosDe(d, ev.ruta), cfg = C.petar.fotos;
    var lleno = fotos.length >= cfg.maxPorEvidencia || M.totalFotos(d) >= cfg.maxTotal;
    var mini = fotos.map(function (f, i) {
      return '<figure class="ev-foto"><button type="button" class="ev-foto__abrir" data-accion="ver-foto" data-id="' + esc(f.id) + '">' +
        '<img data-mini-foto="' + esc(f.id) + '" alt="Evidencia ' + (i + 1) + '"></button>' +
        '<button type="button" class="ev-foto__quitar" data-accion="quitar-foto" data-ruta="' + esc(ev.ruta) + '" data-id="' + esc(f.id) + '" aria-label="Quitar foto">×</button></figure>';
    }).join('');
    var boton = lleno ? '<small class="nota">Límite de fotografías alcanzado.</small>' :
      '<label class="btn btn--fantasma btn--foto">' + (fotos.length ? '+ Foto adicional' : 'Tomar foto') +
      '<input type="file" accept="image/*" capture="environment" hidden data-foto="' + esc(ev.ruta) + '" data-texto="' + esc(ev.texto) + '"></label>';
    return '<article class="evidencia' + (!fotos.length ? ' evidencia--falta' : '') + '"><p class="evidencia__txt"><strong>' + esc(ev.texto) + '</strong></p>' +
      (ev.ayuda ? '<p class="nota">' + esc(ev.ayuda) + '</p>' : '') + (mini ? '<div class="ev-fotos">' + mini + '</div>' : '') + boton + '</article>';
  }

  function montarMiniaturas() {
    if (!window.Store || !window.Store.obtenerFoto || !document.querySelectorAll) return;
    Array.prototype.forEach.call(document.querySelectorAll('img[data-mini-foto]'), function (img) {
      if (img.dataset.cargada) return;
      img.dataset.cargada = '1';
      window.Store.obtenerFoto(img.dataset.miniFoto).then(function (r) {
        if (!r || !(r.mini || r.blob)) return;
        var u = URL.createObjectURL(r.mini || r.blob); img.src = u;
        img.onload = img.onerror = function () { URL.revokeObjectURL(u); };
      }).catch(function () {});
    });
  }

  function canvasBlob(c, calidad) {
    return new Promise(function (ok, mal) { c.toBlob(function (b) { b ? ok(b) : mal(new Error('No se pudo comprimir la foto.')); }, 'image/jpeg', calidad); });
  }

  function tomarFoto(input) {
    var d = st.doc, ruta = input.dataset.foto, texto = input.dataset.texto || '', file = input.files && input.files[0];
    input.value = '';
    if (!d || !file) return;
    if (!window.Store.fotosSoportadas()) { UI.aviso('Este dispositivo no dispone de IndexedDB para guardar fotos.', 'mal'); return; }
    if (!/^image\//.test(file.type)) { UI.aviso('Solo se admiten imágenes.', 'mal'); return; }
    var cfg = C.petar.fotos;
    if (M.totalFotos(d) >= cfg.maxTotal) { UI.aviso('Se alcanzó el máximo de ' + cfg.maxTotal + ' fotos por PETAR.', 'mal'); return; }
    UI.aviso('Optimizando foto…');

    function procesar(img, cerrar) {
      var iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      var escala = Math.min(1, cfg.anchoMaximoPx / Math.max(iw, ih));
      var w = Math.max(1, Math.round(iw * escala)), h = Math.max(1, Math.round(ih * escala));
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); if (cerrar) cerrar();
      var ahora = new Date(), sello = d.numero + ' · ' + UI.fechaHora(ahora.toISOString()) + ' · ' + texto;
      var fs = Math.max(14, Math.round(w / 52)), banda = Math.round(fs * 1.9);
      x.fillStyle = 'rgba(0,0,0,.62)'; x.fillRect(0, h - banda, w, banda);
      x.fillStyle = '#fff'; x.font = 'bold ' + fs + 'px sans-serif'; x.textBaseline = 'middle';
      while (x.measureText(sello).width > w - fs && sello.length > 14) sello = sello.slice(0, -2);
      x.fillText(sello, Math.round(fs / 2), h - banda / 2);
      var tw = Math.min(cfg.miniaturaPx, w), th = Math.max(1, Math.round(h * tw / w));
      var mini = document.createElement('canvas'); mini.width = tw; mini.height = th; mini.getContext('2d').drawImage(c, 0, 0, tw, th);
      Promise.all([canvasBlob(c, cfg.calidadJpeg), canvasBlob(mini, cfg.calidadMiniatura)]).then(function (blobs) {
        var id = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        return window.Store.guardarFoto({ id: id, docId: d.id, blob: blobs[0], mini: blobs[1], fechaHora: ahora.toISOString(), texto: texto, ancho: w, alto: h }).then(function () {
          d.evidencias = d.evidencias || {}; d.evidencias[ruta] = d.evidencias[ruta] || [];
          d.evidencias[ruta].push({ id: id, fechaHora: ahora.toISOString(), texto: texto, ancho: w, alto: h });
          return guardarYa();
        });
      }).then(function () { UI.aviso('Foto optimizada y guardada'); quieto(); }).catch(function (e) { UI.aviso(e.message || 'No se pudo guardar la foto.', 'mal'); });
    }

    if (window.createImageBitmap) {
      window.createImageBitmap(file).then(function (bmp) { procesar(bmp, function () { if (bmp.close) bmp.close(); }); })
        .catch(function () { UI.aviso('No se pudo leer la imagen.', 'mal'); });
      return;
    }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () { procesar(img, function () { URL.revokeObjectURL(url); }); };
    img.onerror = function () { URL.revokeObjectURL(url); UI.aviso('No se pudo leer la imagen.', 'mal'); };
    img.src = url;
  }

  function verFoto(id) {
    window.Store.obtenerFoto(id).then(function (r) {
      if (!r || !r.blob) { UI.aviso('La foto no está disponible en este dispositivo.', 'mal'); return; }
      var u = URL.createObjectURL(r.blob), fondo = document.createElement('div'); fondo.className = 'modal modal--foto';
      fondo.innerHTML = '<div class="modal__caja foto-grande"><img src="' + u + '" alt="Evidencia fotográfica"><button class="btn btn--fantasma btn--ancho" data-cerrar>Cerrar</button></div>';
      document.body.appendChild(fondo);
      fondo.addEventListener('click', function (ev) { if (ev.target === fondo || ev.target.hasAttribute('data-cerrar')) { URL.revokeObjectURL(u); fondo.remove(); } });
    });
  }

  function ficha(accion, ruta, activo, etiqueta, deshab) {
    return '<button type="button" class="ficha' + (activo ? ' es-activo' : '') + (deshab ? ' ficha--off' : '') + '" data-accion="' + accion + '" data-ruta="' + ruta + '"' + (deshab ? ' disabled' : '') + '>' + esc(etiqueta) + '</button>';
  }
  function pastilla(d) {
    var e = M.estadoVisible(d), t = (C.estados[e] || {}).tono || 'neutro';
    return '<span class="pastilla pastilla--' + t + '">' + esc(M.etiquetaEstado(e)) + '</span>';
  }
  function etiquetaTipo(d) { return '<span class="tipo tipo--' + d.tipo.toLowerCase() + '">' + d.tipo + '</span>'; }
  function fecha(iso) { return UI.fechaLarga(iso); }
  function vacio(t) { return '<p class="vacio">' + esc(t) + '</p>'; }

  /* ============================ Render ============================== */
  function render() {
    var v = {
      sede: vSede, usuario: vUsuario, accesoSST: vAccesoSST, inicio: vInicio, historial: vHistorial, elegirATS: vElegirATS,
      form: vForm, revision: vRevision, firmas: vFirmas, detalle: vDetalle,
      verificacion: vVerificacion, cierre: vCierre, ajustes: vAjustes
    };
    (v[st.pantalla] || vInicio)();
    cabecera();
    $('#pruebaBanner').hidden = !C.modoPrueba;
    if (['firmas', 'verificacion', 'cierre'].indexOf(st.pantalla) >= 0) montarFirmas();
    montarMiniaturas();
  }

  function cabecera() {
    var d = st.doc, pasos = d ? M.pasos(d) : [];
    var m = {
      sede: ['Configurar sede', 'Este celular quedará asociado a una sede'],
      usuario: ['Bienvenido', '¿Quién usa este celular?'],
      accesoSST: ['Área SST', 'Acceso restringido a Ajustes'],
      inicio: ['ATS y PETAR', 'B&P · Sede ' + C.sede],
      historial: ['Historial', 'Sede ' + C.sede],
      elegirATS: ['Nuevo PETAR', 'ATS de referencia'],
      form: [d ? d.numero : '', pasos[st.paso] ? pasos[st.paso].titulo : ''],
      revision: ['Revisión', d ? d.numero : ''],
      firmas: [d && d.tipo === 'ATS' ? 'Firmas del ATS' : 'Firmas y autorización', d ? d.numero : ''],
      detalle: [d ? d.numero : '', d ? (d.tipo === 'ATS' ? 'Análisis de trabajo seguro' : 'Permiso de trabajo de alto riesgo') : ''],
      verificacion: ['Verificación durante el trabajo', d ? d.numero : ''],
      cierre: ['Cierre del permiso', d ? d.numero : ''],
      ajustes: ['Ajustes', 'Conexión con SST']
    }[st.pantalla] || ['', ''];
    titulo.textContent = m[0]; sub.textContent = m[1];
    atras.hidden = (st.pantalla === 'sede' || st.pantalla === 'inicio' || st.pantalla === 'usuario');
    $('#modulo').textContent = d && ['inicio', 'historial', 'ajustes', 'usuario'].indexOf(st.pantalla) < 0 ? d.tipo : 'ATS · PETAR';
  }

  function marcaHTML() {
    return '<div class="marca"><img src="logo_isotipo.png" alt=""><div class="marca__texto"><span>GRUPO</span><span class="rojo">PANA</span></div>' +
      '<div class="marca__sub">' + esc(C.sistema) + '<br>' + (C.sede ? 'Sede ' + esc(C.sede) : 'Configuración multisede') + '</div></div>';
  }

  /* =========================== Pantalla: sede ======================= */
  function vSede() {
    app.innerHTML = '<section class="bloque">' + marcaHTML() +
      '<h2 class="h-seccion">Selecciona la sede de este dispositivo</h2>' +
      '<p class="intro">Los ATS y PETAR nuevos quedarán asociados a esta sede. Después, el cambio de sede estará disponible únicamente desde Ajustes del Área SST.</p>' +
      campo('Sede *', '<select id="sedeSeleccion">' + opcionesSede(C.sedeCodigo) + '</select>') +
      '<button class="btn btn--principal btn--ancho" data-accion="guardar-sede">Guardar sede y continuar</button>' +
      '<p class="nota">Sedes habilitadas: Montero, Surquillo, Surco, San Miguel, Callao, Ate, Moquegua y Tacna.</p></section>';
  }

  /* ========================= Pantalla: usuario ====================== */
  function vUsuario() {
    var u = st.usuario || { nombre: '', cargo: '' };
    app.innerHTML = '<section class="bloque">' + marcaHTML() +
      '<p class="intro">Tu nombre queda registrado como emisor de los documentos que crees en este celular.</p>' +
      campo('Nombres y apellidos *', '<input id="uNombre" type="text" autocomplete="name" value="' + esc(u.nombre) + '" placeholder="Ej. María Salazar Torres">') +
      campo('Cargo *', '<input id="uCargo" type="text" value="' + esc(u.cargo) + '" placeholder="Ej. Supervisor de planchado y pintura">') +
      '<button class="btn btn--principal btn--ancho" data-accion="guardar-usuario">Continuar</button>' +
      '<p class="nota">Piloto operativo. La identificación sigue siendo local y no equivale a inicio de sesión corporativo.</p>' +
      '<h2 class="h-seccion">Área SST</h2><p class="nota">Acceso restringido para configurar la conexión y los ajustes de este dispositivo.</p>' +
      '<button class="btn btn--fantasma btn--ancho" data-accion="ir-acceso-sst">Ingresar como Área SST</button></section>';
  }

  function hashClaveAjustes(clave) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) return Promise.reject(new Error('Este navegador no permite proteger la clave local.'));
    var datos = new window.TextEncoder().encode('sst-ajustes-v07|' + clave);
    return window.crypto.subtle.digest('SHA-256', datos).then(function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); });
  }
  function vAccesoSST() {
    var existe = !!st.claveAjustesHash;
    app.innerHTML = '<section class="bloque">' + marcaHTML() + '<h2 class="h-seccion">' + (existe ? 'Acceso Área SST' : 'Crear acceso Área SST') + '</h2>' +
      '<p class="intro">' + (existe ? 'Ingresa la clave SST de este dispositivo para abrir Ajustes.' : 'Primera configuración: crea una clave local para proteger Ajustes en este dispositivo.') + '</p>' +
      campo(existe ? 'Clave SST *' : 'Nueva clave SST *', '<input id="sstClave" type="password" autocomplete="' + (existe ? 'current-password' : 'new-password') + '" placeholder="Mínimo 6 caracteres">') +
      (existe ? '' : campo('Confirmar clave SST *', '<input id="sstClave2" type="password" autocomplete="new-password" placeholder="Repite la clave">')) +
      '<button class="btn btn--principal btn--ancho" data-accion="' + (existe ? 'validar-clave-sst' : 'crear-clave-sst') + '">' + (existe ? 'Ingresar a Ajustes' : 'Crear clave e ingresar') + '</button>' +
      '<p class="nota">Es una barrera local del piloto y es distinta de la clave del flujo de Power Automate.</p></section>';
  }

  /* ========================== Pantalla: inicio ====================== */
  function vInicio() {
    app.innerHTML = '<section class="bloque"><p class="intro">Cargando…</p></section>';
    window.Store.todos().then(function (l) {
      l = l.filter(esSedeActual);
      st.lista = l;
      var petarVig = l.filter(function (d) { return d.tipo === 'PETAR' && M.estadoVisible(d) === 'AUTORIZADO'; });
      var vencidos = l.filter(function (d) { return M.estadoVisible(d) === 'VENCIDO'; });
      var atsHoy = l.filter(function (d) { return d.tipo === 'ATS' && d.estado !== 'BORRADOR' && d.generales.fecha === M.hoy(); });
      var pend = l.filter(function (d) { var e = window.Envio.ultimo(d); return e && ['pendiente', 'no_confirmado', 'rechazado', 'error'].indexOf(e.resultado) >= 0; });
      var borr = l.filter(function (d) { return d.estado === 'BORRADOR'; });

      app.innerHTML = '<section class="bloque">' + marcaHTML() +
        '<div class="saludo"><div><strong>' + esc(st.usuario.nombre) + '</strong><small>' + esc(st.usuario.cargo) + '</small></div>' +
        '<button class="enlace" data-accion="cambiar-usuario">Cambiar</button></div>' +
        (window.Envio.configurado() ? '' :
          '<div class="alerta alerta--aviso">Envío a SST no configurado: los documentos se generan, pero no se envían por correo ni se guardan en SharePoint. <button class="enlace" data-accion="ir-ajustes">Configurar</button></div>') +
        '<div class="dos-botones">' +
          '<button class="btn-nuevo" data-accion="nuevo-ats"><span class="btn-nuevo__signo">+</span><span class="btn-nuevo__txt"><strong>Nuevo ATS</strong><small>Análisis de trabajo seguro</small></span></button>' +
          '<button class="btn-nuevo btn-nuevo--petar" data-accion="nuevo-petar"><span class="btn-nuevo__signo">+</span><span class="btn-nuevo__txt"><strong>Nuevo PETAR</strong><small>Permiso de trabajo de alto riesgo</small></span></button>' +
        '</div>' +
        (vencidos.length ? '<div class="alerta alerta--mal">' + vencidos.length + ' PETAR superó su horario sin registrar el cierre.</div>' : '') +
        '<div class="cifras">' + cifra(petarVig.length, 'PETAR vigentes') + cifra(atsHoy.length, 'ATS de hoy') + cifra(pend.length, 'Envíos pendientes') + '</div>' +
        (borr.length ? '<div class="titulo-fila"><h2>Sin terminar</h2></div>' + borr.slice(0, 3).map(tarjeta).join('') : '') +
        '<div class="titulo-fila"><h2>Últimos documentos</h2><button class="enlace" data-accion="ir-historial">Ver historial</button></div>' +
        (l.filter(function (d) { return d.estado !== 'BORRADOR'; }).slice(0, 5).map(tarjeta).join('') || vacio('Aún no hay documentos registrados.')) +
        '<p class="centro"><button class="enlace" data-accion="ir-ajustes">Ajustes y conexión con SST</button></p>' +
        '</section>';
    });
  }
  function cifra(n, t) { return '<div class="cifra"><strong>' + n + '</strong><span>' + esc(t) + '</span></div>'; }

  function textoEnvio(e) {
    if (!e) return '';
    return ({ confirmado: 'confirmado ✓', no_confirmado: 'sin confirmar', enviado: 'sin confirmar',
      rechazado: 'rechazado', pendiente: 'pendiente', error: 'pendiente', sin_flujo: 'pendiente',
      prueba: 'prueba local' }[e.resultado] || e.resultado);
  }

  function tarjeta(d) {
    var e = window.Envio.ultimo(d), env = textoEnvio(e);
    return '<button class="tarjeta" data-accion="abrir" data-id="' + esc(d.id) + '">' +
      '<div class="tarjeta__fila"><strong>' + etiquetaTipo(d) + ' ' + esc(d.numero) + '</strong>' + pastilla(d) + '</div>' +
      '<div class="tarjeta__meta">' + esc(M.titulo(d)) + '</div>' +
      '<div class="tarjeta__meta">' + esc(fecha(M.fecha(d))) + ' · ' + esc(M.lugar(d) || 'Sin lugar') + (env ? ' · ' + esc(env) : '') + '</div></button>';
  }

  /* ========================= Pantalla: historial ==================== */
  function vHistorial() {
    window.Store.todos().then(function (l) {
      l = l.filter(esSedeActual);
      st.lista = l;
      var f = l.filter(function (d) { return !st.filtroTipo || d.tipo === st.filtroTipo; });
      app.innerHTML = '<section class="bloque">' +
        '<div class="fichas">' + ['', 'ATS', 'PETAR'].map(function (t) {
          return '<button class="ficha' + (st.filtroTipo === t ? ' es-activo' : '') + '" data-accion="filtro" data-valor="' + t + '">' + (t || 'Todos') + '</button>';
        }).join('') + '</div>' +
        '<div class="titulo-fila"><h2>' + f.length + ' documento(s)</h2></div>' +
        (f.map(tarjeta).join('') || vacio('No hay documentos.')) + '</section>';
    });
  }

  /* ======================= Pantalla: elegir ATS ===================== */
  function vElegirATS() {
    var ats = st.lista.filter(esSedeActual).filter(function (d) { return d.tipo === 'ATS' && d.estado === 'REGISTRADO'; });
    app.innerHTML = '<section class="bloque">' +
      '<p class="intro">El PETAR requiere un ATS registrado. Selecciona el ATS que corresponde al trabajo; se copiarán la tarea, el lugar y el personal.</p>' +
      (ats.length ? ats.slice(0, 10).map(function (d) {
        return '<button class="tarjeta" data-accion="petar-desde" data-id="' + esc(d.id) + '"><div class="tarjeta__fila"><strong>' + esc(d.numero) + '</strong>' + pastilla(d) + '</div>' +
          '<div class="tarjeta__meta">' + esc(d.generales.tarea) + '</div><div class="tarjeta__meta">' + esc(fecha(d.generales.fecha)) + ' · ' + d.personal.length + ' persona(s)</div></button>';
      }).join('') : '<div class="alerta alerta--aviso"><strong>No hay ATS registrados.</strong><div>Primero registra el ATS del trabajo y luego genera el PETAR.</div></div>' +
        '<button class="btn btn--principal btn--ancho" data-accion="nuevo-ats">Crear ATS</button>') +
      '</section>';
  }

  /* ========================= Pantalla: formulario =================== */
  function vForm() {
    M.normalizar(st.doc);
    var d = st.doc, pasos = M.pasos(d), id = pasos[st.paso].id;
    var cuerpo = d.tipo === 'ATS'
      ? { generales: fAtsGenerales, pasos: fAtsPasos, epp: fAtsEpp }[id](d)
      : { descripcion: fPDescripcion, epp: fPEpp, requisitos: fPRequisitos, caliente: fPCaliente, altura: fPAltura, peligrosos: fPPeligrosos, evidencias: fPEvidencias, emergencia: fPEmergencia }[id](d);
    app.innerHTML =
      '<div class="progreso"><div class="progreso__puntos">' + pasos.map(function (p, i) {
        return '<span class="punto ' + (i < st.paso ? 'hecho' : i === st.paso ? 'actual' : '') + '"></span>';
      }).join('') + '</div><div class="progreso__txt">Paso ' + (st.paso + 1) + ' de ' + pasos.length + ' · ' + esc(pasos[st.paso].titulo) + '</div></div>' +
      UI.listaErrores(st.errores.map(function (m) { return { mensaje: m }; })) +
      '<section class="bloque">' + cuerpo + '</section>' +
      '<div class="barra-pie"><button class="btn btn--fantasma" data-accion="paso-atras">' + (st.paso === 0 ? 'Guardar y salir' : 'Atrás') + '</button>' +
      '<button class="btn btn--principal" data-accion="paso-sig">' + (st.paso === pasos.length - 1 ? 'Ir a revisión' : 'Siguiente') + '</button></div>';
  }

  /* --- ATS --- */
  function fAtsGenerales(d) {
    var g = d.generales;
    return numeroFijo(d) +
      campo('Tarea *', txt('generales.tarea', g.tarea, 'Ej. Reparación de soporte metálico con soldadura')) +
      campo('Ubicación *', txt('generales.ubicacion', g.ubicacion, 'Ej. Bahía 3 de planchado')) +
      campo('Área de Grupo Pana *', txt('generales.areaContratista', g.areaContratista, 'Ej. Planchado y pintura')) +
      campo('Sede', '<input type="text" value="' + esc(M.sede(d)) + '" disabled>') +
      '<div class="par">' + campo('Fecha *', txt('generales.fecha', g.fecha, '', 'date')) + campo('Hora *', txt('generales.hora', g.hora, '', 'time')) + '</div>' +
      campo('ATS liderado por *', txt('generales.lideradoPor', g.lideradoPor, 'Nombres y apellidos')) +
      campo('Supervisor de trabajo *', txt('generales.supervisor', g.supervisor, 'Nombres y apellidos')) +
      '<label class="etiqueta">Permisos de trabajo que requiere la tarea</label>' +
      '<div class="fichas">' + C.ats.permisos.map(function (p) { return ficha('toggle', 'permisos.' + p.id, d.permisos[p.id], p.label); }).join('') + '</div>' +
      (d.permisos.otro ? campo('Especifica el otro permiso *', txt('permisoOtro', d.permisoOtro, '')) : '') +
      (d.permisos.caliente ? '<p class="nota">Marcaste trabajo en caliente: al registrar este ATS podrás generar el PETAR con sus datos.</p>' : '');
  }

  function fAtsPasos(d) {
    return '<p class="intro">Una tarjeta por paso de la tarea. Piensa qué podría salir mal y cómo evitarlo.</p>' +
      d.pasos.map(function (p, i) {
        var r = 'pasos.' + i + '.';
        return '<article class="cond"><header class="cond__cab"><h3>Paso ' + (i + 1) + '</h3>' +
          (d.pasos.length > 1 ? '<button class="enlace enlace--mal" data-accion="quitar-paso" data-i="' + i + '">Quitar</button>' : '') + '</header>' +
          campo('¿Qué vamos a hacer? *', area(r + 'paso', p.paso, 'Secuencia del paso', 2)) +
          campo('¿Qué podría ir mal? Evento indeseado y causa *', area(r + 'evento', p.evento, 'Ej. Quemadura causada por salpicadura de metal', 2)) +
          '<div class="preg"><p class="preg__texto">¿Es crítico? *</p>' + seg(r + 'critico', p.critico, ESC_SN) + '</div>' +
          campo('¿Qué podemos hacer al respecto? Medidas de control *', area(r + 'medidas', p.medidas, 'Controles a implementar', 2)) +
          campo('Responsable de implementar los controles *', txt(r + 'responsable', p.responsable, 'Nombre')) +
          '</article>';
      }).join('') +
      (d.pasos.length < C.ats.maxPasos ? '<button class="btn btn--secundario btn--ancho" data-accion="agregar-paso">+ Agregar paso</button>' : '<p class="nota">Máximo ' + C.ats.maxPasos + ' pasos.</p>') +
      (d.pasos.length === 1 && !d.pasos[0].paso ? '<button class="enlace" data-accion="ejemplo-pasos">Cargar un ejemplo de soldadura para la demostración</button>' : '');
  }

  function fAtsEpp(d) {
    return '<label class="etiqueta">EPP</label><div class="fichas">' +
      C.ats.epp.map(function (e) { return ficha('toggle', 'epp.' + e.id, d.epp[e.id], e.label, e.fijo); }).join('') + '</div>' +
      campo('Otros EPP', txt('otrosEpp', d.otrosEpp, 'Ej. careta de soldar, mandil de cuero')) +
      campo('Herramientas', area('herramientas', d.herramientas, 'Ej. máquina de soldar MIG, esmeril angular', 2)) +
      campo('Comentarios adicionales', area('comentarios', d.comentarios, '', 3));
  }

  /* --- PETAR --- */
  function fPDescripcion(d) {
    var s = d.descripcion;
    return numeroFijo(d) +
      '<div class="caja-info"><strong>' + esc(C.petar.validez) + '</strong></div>' +
      '<div class="par">' + campo('Fecha *', txt('descripcion.fecha', s.fecha, '', 'date')) + campo('Sede', '<input type="text" value="' + esc(s.sede) + '" disabled>') + '</div>' +
      '<div class="par">' + campo('Hora inicial *', txt('descripcion.horaInicio', s.horaInicio, '', 'time')) + campo('Hora final *', txt('descripcion.horaFin', s.horaFin, '', 'time')) + '</div>' +
      campo('ATS de referencia', '<input type="text" value="' + esc(s.atsRef) + '" disabled>', 'Vinculado al ATS registrado en este dispositivo.') +
      campo('Área de Grupo Pana *', txt('descripcion.ejecutaNombre', s.ejecutaNombre, 'Ej. Planchado y pintura')) +
      campo('Descripción de la tarea *', area('descripcion.tarea', s.tarea, 'Qué se hará, con qué equipo y sobre qué elemento', 3)) +
      campo('Lugar específico de la tarea *', txt('descripcion.lugar', s.lugar, 'Ej. Bahía 3, lado norte')) +
      '<label class="etiqueta">Tipo de trabajo *</label><div class="fichas">' +
        C.petar.tipos.map(function (t) { return ficha('toggle', 'tipos.' + t.id, d.tipos[t.id], t.label + (t.activo ? '' : ' · próx. versión'), !t.activo); }).join('') + '</div>' +
      pregunta('¿Se llevó a cabo la capacitación previa de los trabajadores que realizarán el trabajo? *', 'descripcion.capacitacion', s.capacitacion, ESC_SN,
        marca('critico'), s.capacitacion === 'no' ? ['mal', 'Sin capacitación previa el permiso no puede autorizarse.'] : null);
  }

  function fPEpp(d) {
    return '<p class="intro">Se marca EPP básico y, al elegir el tipo de trabajo, se sugieren EPP específicos. Ajusta según la tarea real.</p>' +
      C.petar.epp.map(function (g) {
        return '<label class="etiqueta">' + esc(g.grupo) + '</label><div class="fichas">' +
          g.items.map(function (it) { return ficha('toggle', 'epp.' + it.id, d.epp[it.id], it.label); }).join('') + '</div>';
      }).join('') +
      campo('Otros EPP', txt('eppOtros', d.eppOtros, ''));
  }

  function fPRequisitos(d) {
    return '<p class="intro">Responde el supervisor responsable del trabajo. Un "No" impide autorizar el permiso.</p>' +
      C.petar.requisitos.map(function (r) {
        var v = d.requisitos[r.id];
        return pregunta(r.label, 'requisitos.' + r.id, v, ESC_SN, marca(r.nivel), v === 'no' ? ['mal', 'Corrige en campo antes de autorizar.'] : null);
      }).join('');
  }

  function fPCaliente(d) {
    return '<p class="intro">Verificación del supervisor del trabajo.</p>' +
      C.petar.caliente.map(function (r) { return preguntaV(d, 'caliente', r); }).join('') +
      campo('Vigía de trabajo en caliente *', txt('vigias.caliente.nombre', d.vigias.caliente.nombre, 'Nombres y apellidos'), 'Firma de manera independiente en la pantalla de firmas.') +
      '<h2 class="h-seccion">Controles adicionales</h2>' +
      C.petar.adicionales.map(function (r) {
        return pregunta(r.label, 'adicionales.' + r.id, d.adicionales[r.id], ESC_SNNA, marca(r.nivel));
      }).join('');
  }

  function fPAltura(d) {
    var e = d.escaleras;
    return '<p class="intro">Verificación del supervisor del trabajo.</p>' +
      '<div class="alerta alerta--aviso">' + esc(C.petar.notaAltura) + '</div>' +
      C.petar.altura.map(function (r) { return preguntaV(d, 'altura', r); }).join('') +
      campo('Vigía de trabajo en altura *', txt('vigias.altura.nombre', d.vigias.altura.nombre, 'Nombres y apellidos'), 'Firma de manera independiente en la pantalla de firmas.') +
      '<h2 class="h-seccion">Uso de escaleras</h2>' +
      pregunta('¿Se usará escalera para esta tarea? *', 'escaleras.usa', e.usa, ESC_SN) +
      (e.usa === 'si' ? C.petar.escaleras.map(function (r) { return preguntaV(d, 'escaleras', r); }).join('') : '');
  }

  function fPPeligrosos(d) {
    var q = d.quimicos;
    return '<div class="alerta alerta--aviso">Solo para tareas no rutinarias (por ejemplo: limpieza o mantenimiento de cabina u horno, trasvase o mezcla fuera de la cabina). La pintura rutinaria se gestiona con IPERC, PETS, HDS y ATS.</div>' +
      campo('Productos químicos que se manipularán *', area('quimicos.productos', q.productos, 'Ej. thinner acrílico, catalizador, desengrasante', 2)) +
      pregunta('¿Algún producto es inflamable? *', 'quimicos.inflamable', q.inflamable, ESC_SN) +
      (M.calienteConInflamables(d)
        ? '<div class="alerta alerta--mal"><strong>Trabajo en caliente con productos inflamables.</strong> Solo puede autorizarse con medición de LEL igual a 0 %. Si no hay medidor, separa las tareas en tiempo o lugar.</div>' +
          campo('LEL medido (%)', txt('quimicos.lel', q.lel, 'Ej. 0', 'number', ' inputmode="decimal" step="0.1" min="0"'))
        : '') +
      '<h2 class="h-seccion">Verificación</h2>' +
      C.petar.peligrosos.map(function (r) { return preguntaV(d, 'peligrosos', r); }).join('');
  }

  function fPEvidencias(d) {
    M.normalizar(d);
    if (!st.fotosDisponibles) {
      d.evidenciasNoDisponibles = true;
      return '<div class="alerta alerta--aviso"><strong>Evidencias fotográficas no disponibles.</strong> Este navegador cayó al almacenamiento de respaldo localStorage. El PETAR puede continuar, pero no se guardarán fotos en este dispositivo.</div>';
    }
    d.evidenciasNoDisponibles = false;
    var req = M.evidenciasRequeridas(d);
    return '<p class="intro">Registra evidencias mínimas del trabajo, no una foto por cada pregunta. Las imágenes se comprimen y se guardan aparte del PETAR para mantener la aplicación ligera.</p>' +
      '<div class="datos"><div class="dato"><span>Fotos del permiso</span><strong>' + M.totalFotos(d) + ' / ' + C.petar.fotos.maxTotal + '</strong></div></div>' +
      req.map(function (ev) { return evidenciaHTML(d, ev); }).join('');
  }

  function fPEmergencia(d) {
    var m = d.emergencia;
    return campo('Nombre del encargado de la sede *', txt('emergencia.encargadoSede', m.encargadoSede, '')) +
      campo('Nombre del supervisor o prevencionista *', txt('emergencia.supervisorPrevencionista', m.supervisorPrevencionista, '')) +
      '<h2 class="h-seccion">Posible emergencia detectada</h2>' +
      C.petar.emergencias.map(function (x) { return pregunta(x, 'emergencia.emergencias.' + x, m.emergencias[x], ESC_SINA); }).join('') +
      campo('Otros (indicar)', txt('emergencia.emergenciaOtro', m.emergenciaOtro, '')) +
      '<h2 class="h-seccion">Equipos de emergencia</h2>' +
      C.petar.equiposEmergencia.map(function (x) { return pregunta(x, 'emergencia.equipos.' + x, m.equipos[x], ESC_SINA); }).join('') +
      campo('Otros (indicar)', txt('emergencia.equipoOtro', m.equipoOtro, '')) +
      pregunta('¿Las rutas de acceso y salida están libres de obstáculos? *', 'emergencia.rutasLibres', m.rutasLibres, ESC_SN, marca('critico')) +
      pregunta('¿Se indicó a los trabajadores involucrados las rutas de evacuación y puntos de reunión en caso de emergencia? *', 'emergencia.rutasIndicadas', m.rutasIndicadas, ESC_SN, marca('critico')) +
      '<div class="par">' + campo('Teléfono de contacto para emergencias *', txt('emergencia.telefono', m.telefono, '', 'tel')) +
      campo('Persona de contacto *', txt('emergencia.contacto', m.contacto, '')) + '</div>' +
      campo('Observaciones', area('observaciones', d.observaciones, 'Medidas complementarias o restricciones', 3));
  }

  function marca(n) { return n === 'critico' ? '<span class="marca marca--critico">Crítico</span>' : n === 'requerido' ? '<span class="marca marca--requerido">Requerido</span>' : ''; }
  function numeroFijo(d) {
    return '<div class="campo campo--fijo"><label>Número</label><output class="valor-fijo">' + esc(d.numero) + '</output>' +
      '<small class="ayuda">Creado el ' + esc(UI.fechaHora(d.creadoEn)) + ' por ' + esc(d.usuario.nombre) + '.</small></div>';
  }

  /* ========================== Pantalla: revisión ==================== */
  function vRevision() {
    var d = st.doc, err = M.validarTodo(d), bl = M.bloqueos(d), obs = M.observados(d);
    var puede = !err.length && !bl.length;
    app.innerHTML = resumen(d, true) +
      (err.length ? '<div class="alerta alerta--aviso"><strong>Falta información</strong><ul>' +
        err.slice(0, 10).map(function (e) { return '<li><button class="enlace" data-accion="editar" data-paso="' + e.paso + '">' + esc(e.titulo) + '</button>: ' + esc(e.mensaje) + '</li>'; }).join('') + '</ul></div>' : '') +
      (bl.length ? '<div class="alerta alerta--mal"><strong>El permiso no puede autorizarse</strong><ul>' + bl.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>Corrige en campo y actualiza la respuesta.</div>' : '') +
      (obs.length ? '<div class="alerta alerta--aviso"><strong>Observaciones (no bloquean)</strong><ul>' + obs.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' : '') +
      '<section class="bloque acciones-finales">' +
        '<button class="btn btn--principal btn--ancho" data-accion="ir-firmas"' + (puede ? '' : ' disabled') + '>Continuar a firmas</button>' +
        '<button class="btn btn--fantasma btn--ancho" data-accion="ver-pdf">Ver borrador en PDF</button>' +
        '<button class="btn btn--secundario btn--ancho" data-accion="guardar-salir">Guardar y salir</button>' +
      '</section>';
  }

  /* =========================== Pantalla: firmas ===================== */
  function vFirmas() {
    var d = st.doc, err = st.errores;
    var h = UI.listaErrores(err.map(function (m) { return { mensaje: m }; })) +
      '<div class="alerta alerta--aviso">Las firmas quedan asociadas a este contenido. Si vuelves a editar el documento, se borrarán y habrá que firmar de nuevo.</div>';
    if (d.tipo === 'ATS') {
      h += '<section class="bloque"><h2 class="h-seccion">Personal que realiza la tarea</h2>' +
        '<p class="intro">Cada trabajador escribe su nombre, su DNI y firma. Luego pasa el celular al siguiente.</p>' +
        listaFirmantes(d.personal, 'personal') +
        (d.personal.length < C.ats.maxPersonal ? nuevoFirmante(false) : '<p class="nota">Máximo ' + C.ats.maxPersonal + ' personas.</p>') + '</section>' +
        '<section class="bloque"><h2 class="h-seccion">Supervisor de trabajo</h2>' + firmaFija('supervisorFirma', d.supervisorFirma, false, d.generales.supervisor) + '</section>' +
        '<section class="bloque acciones-finales"><button class="btn btn--principal btn--ancho" data-accion="registrar-ats">' + (C.modoPrueba ? 'Registrar ATS de prueba' : 'Registrar ATS y enviar a SST') + '</button>' +
        '<button class="btn btn--secundario btn--ancho" data-accion="guardar-salir">Guardar y salir</button></section>';
    } else {
      h += '<section class="bloque"><h2 class="h-seccion">VII. Colaboradores participantes</h2>' +
        '<p class="intro">Cada colaborador escribe su nombre, su DNI y firma. Luego pasa el celular al siguiente.</p>' +
        listaFirmantes(d.participantes, 'participantes') +
        (d.participantes.length < C.petar.maxParticipantes ? nuevoFirmante(true) : '<p class="nota">Máximo ' + C.petar.maxParticipantes + ' participantes.</p>') + '</section>' +
        '<section class="bloque"><h2 class="h-seccion">Supervisor de trabajo (sección VII)</h2>' + firmaFija('supervisorTrabajo', d.supervisorTrabajo, true) + '</section>' +
        (d.tipos.caliente ? '<section class="bloque"><h2 class="h-seccion">Vigía · Trabajo en caliente</h2>' + firmaFija('vigias.caliente', d.vigias.caliente, false) + '</section>' : '') +
        (d.tipos.altura ? '<section class="bloque"><h2 class="h-seccion">Vigía · Trabajo en altura</h2>' + firmaFija('vigias.altura', d.vigias.altura, false) + '</section>' : '') +
        '<section class="bloque"><h2 class="h-seccion">Autorización del trabajo</h2>' +
        C.petar.firmasAutorizacion.map(function (a) {
          return '<h3 class="h-sub">' + esc(a.cargo) + '</h3>' + (a.ayuda ? '<p class="nota">' + esc(a.ayuda) + '</p>' : '') + firmaFija('autorizacion.' + a.clave, d.autorizacion[a.clave], false);
        }).join('') + '</section>' +
        '<section class="bloque acciones-finales"><button class="btn btn--principal btn--ancho" data-accion="autorizar">' + (C.modoPrueba ? 'Simular autorización del PETAR' : 'Autorizar PETAR y enviar a SST') + '</button>' +
        '<button class="btn btn--secundario btn--ancho" data-accion="guardar-salir">Guardar y salir</button></section>';
    }
    app.innerHTML = h;
  }

  function listaFirmantes(lista, ruta) {
    if (!lista.length) return vacio('Todavía no firma nadie.');
    return '<div class="firmantes">' + lista.map(function (x, i) {
      return '<div class="firmante">' +
        (x.firma ? '<img src="' + x.firma + '" alt="Firma de ' + esc(x.nombre) + '">' : '<span class="firma-mini__falta">Falta firmar</span>') +
        '<div><strong>' + esc(x.nombre) + '</strong><small>' + (x.dni ? 'DNI ' + esc(x.dni) : 'Sin DNI') + (x.fechaHora ? ' · ' + esc(UI.fechaHora(x.fechaHora)) : '') + '</small></div>' +
        (x.firma ? '' : '<button class="enlace" data-accion="firmar-pendiente" data-ruta="' + ruta + '" data-i="' + i + '">Firmar</button>') +
        '<button class="enlace enlace--mal" data-accion="quitar-firmante" data-ruta="' + ruta + '" data-i="' + i + '">Quitar</button></div>';
    }).join('') + '</div>';
  }

  function nuevoFirmante(dniObligatorio) {
    var p = st.pendiente || { nombre: '', dni: '' };
    return '<div class="sub-bloque nuevo-firmante" id="nuevoFirmante">' +
      '<h3 class="h-sub">' + (p.editando !== undefined ? 'Firma de ' + esc(p.nombre) : 'Agregar persona') + '</h3>' +
      campo('Nombres y apellidos *', '<input type="text" id="nfNombre" autocomplete="off" value="' + esc(p.nombre) + '" placeholder="Escribe tu nombre completo">') +
      campo('DNI' + (dniObligatorio ? ' *' : ''), '<input type="tel" id="nfDni" inputmode="numeric" maxlength="8" value="' + esc(p.dni) + '" placeholder="8 dígitos">') +
      '<div class="firma"><canvas class="firma__lienzo" data-firma="__nuevo" aria-label="Área de firma"></canvas>' +
      '<div class="firma__pie"><span>Firma con el dedo</span><button class="enlace" data-accion="borrar-firma" data-firma="__nuevo">Borrar</button></div></div>' +
      '<button class="btn btn--principal btn--ancho" data-accion="agregar-firmante" data-dni="' + (dniObligatorio ? '1' : '') + '">Firmar y agregar</button></div>';
  }

  function firmaFija(ruta, x, conDni, sugerido) {
    if (!x.nombre && sugerido) x.nombre = sugerido;
    return campo('Nombres y apellidos *', txt(ruta + '.nombre', x.nombre, '')) +
      (conDni ? campo('DNI *', txt(ruta + '.dni', x.dni, '8 dígitos', 'tel', ' inputmode="numeric" maxlength="8"')) : '') +
      '<div class="firma"><canvas class="firma__lienzo" data-firma="' + ruta + '"></canvas>' +
      '<div class="firma__pie"><span>' + (x.fechaHora ? 'Firmado ' + esc(UI.fechaHora(x.fechaHora)) : 'Firma con el dedo') + '</span>' +
      '<button class="enlace" data-accion="borrar-firma" data-firma="' + ruta + '">Borrar</button></div></div>';
  }

  function montarFirmas() {
    st.pads = {};
    UI.$$('canvas[data-firma]').forEach(function (cv) {
      var ruta = cv.dataset.firma, pad = UI.FirmaPad(cv);
      st.pads[ruta] = pad;
      if (ruta === '__nuevo' || ruta === '__verif') {
        pad.alTerminar = function (data) { st['firma' + ruta] = data; };
        if (st['firma' + ruta]) setTimeout(function () { pad.cargar(st['firma' + ruta]); }, 60);
        return;
      }
      var obj = getPath(st.doc, ruta);
      if (obj && obj.firma) setTimeout(function () { pad.cargar(obj.firma); }, 60);
      pad.alTerminar = function (data) {
        var o = getPath(st.doc, ruta);
        o.firma = data; o.fechaHora = data ? new Date().toISOString() : '';
        guardarLuego();
      };
    });
  }

  /* =========================== Pantalla: detalle ==================== */
  function vDetalle() {
    var d = st.doc, e = M.estadoVisible(d), u = window.Envio.ultimo(d);
    var acc = '<button class="btn btn--principal btn--ancho" data-accion="ver-pdf">Ver documento PDF</button>' +
      '<button class="btn btn--fantasma btn--ancho" data-accion="descargar-pdf">Descargar PDF</button>';
    if (d.estado !== 'BORRADOR') acc += '<button class="btn btn--fantasma btn--ancho" data-accion="reenviar">Reenviar a SST</button>';
    if (d.tipo === 'ATS' && d.estado === 'REGISTRADO') acc += '<button class="btn btn--secundario btn--ancho" data-accion="petar-desde" data-id="' + esc(d.id) + '">Crear PETAR con este ATS</button>';
    if (d.tipo === 'PETAR' && e === 'AUTORIZADO') acc +=
      '<button class="btn btn--secundario btn--ancho" data-accion="ir-verificacion">Registrar verificación durante el trabajo</button>' +
      '<button class="btn btn--secundario btn--ancho" data-accion="ir-cierre">Cerrar permiso</button>' +
      '<button class="btn btn--peligro btn--ancho" data-accion="cancelar">Cancelar por alarma o emergencia</button>';
    if (d.tipo === 'PETAR' && e === 'PROGRAMADO') acc += '<button class="btn btn--peligro btn--ancho" data-accion="cancelar">Cancelar permiso programado</button>';
    if (d.tipo === 'PETAR' && e === 'VENCIDO') acc += '<button class="btn btn--secundario btn--ancho" data-accion="ir-cierre">Cerrar permiso</button>';
    if (d.estado === 'BORRADOR') {
      var sinATS = d.tipo === 'PETAR' && (!d.descripcion || !d.descripcion.atsId || !d.descripcion.atsRef);
      if (sinATS) acc +=
        '<div class="alerta alerta--mal"><strong>PETAR bloqueado.</strong><div>Este borrador no tiene un ATS registrado vinculado. Primero registra el ATS y luego crea un PETAR desde ese ATS.</div></div>' +
        '<button class="btn btn--principal btn--ancho" data-accion="nuevo-ats">Crear ATS</button>';
      else acc += '<button class="btn btn--secundario btn--ancho" data-accion="editar" data-paso="0">Continuar edición</button>';
      acc += '<button class="btn btn--peligro btn--ancho" data-accion="eliminar">Eliminar borrador</button>';
    }

    app.innerHTML = resumen(d, false) +
      (u ? '<section class="bloque"><div class="alerta alerta--' + (u.resultado === 'confirmado' ? 'ok' : 'aviso') + '"><strong>' +
        ({ prueba: 'Prueba local · sin envío', no_confirmado: 'sin confirmar', confirmado: 'confirmado ✓', enviado: 'sin confirmar', rechazado: 'rechazado', pendiente: 'pendiente', error: 'pendiente', sin_flujo: 'pendiente' }[u.resultado] || u.resultado) +
        '</strong><div>' + esc(u.detalle) + '</div><small>' + esc(UI.fechaHora(u.fechaHora)) + '</small></div></section>' : '') +
      '<section class="bloque"><h2 class="h-seccion">Acciones</h2>' + acc +
      '<h2 class="h-seccion">Trazabilidad</h2><div class="historial-estados">' +
      d.bitacora.slice().reverse().map(function (b) {
        return '<div class="he"><span>' + esc(M.etiquetaEstado(b.estado)) + '</span><small>' + esc(UI.fechaHora(b.fechaHora)) + ' · ' + esc(b.usuario) + (b.comentario ? ' · ' + esc(b.comentario) : '') + '</small></div>';
      }).join('') + '</div></section>';
  }

  /* Resumen legible del documento */
  function resumen(d, editable) {
    M.normalizar(d);
    function f(k, v) { return '<div class="dato"><span>' + esc(k) + '</span><strong>' + esc(v || '—') + '</strong></div>'; }
    function tit(t, paso) { return '<div class="titulo-fila"><h2>' + esc(t) + '</h2>' + (editable && paso !== undefined ? '<button class="enlace" data-accion="editar" data-paso="' + paso + '">Editar</button>' : '') + '</div>'; }
    function sn(v) { return v === 'si' ? 'Sí' : v === 'no' ? 'No' : v === 'na' ? 'N/A' : 'Sin responder'; }
    function lista(items, valores) {
      return '<ul class="lista-check">' + items.map(function (it) {
        var v = valores[it.id], t = v === 'si' ? 'ok' : v === 'no' ? 'mal' : v === 'na' ? 'neutro' : 'vacio';
        return '<li class="check check--' + t + '"><span>' + esc(it.label) + '</span><b>' + sn(v) + '</b></li>';
      }).join('') + '</ul>';
    }
    var sem = { conforme: ['ok', 'Completo y conforme'], observado: ['aviso', 'Con observaciones'], pendiente: ['neutro', 'Pendiente de completar'], no_conforme: ['mal', 'Control crítico sin cumplir'] }[M.semaforo(d)];
    var h = '<section class="bloque"><div class="cabecera-resumen"><div><strong class="numero">' + etiquetaTipo(d) + ' ' + esc(d.numero) + '</strong>' + pastilla(d) + '</div>' +
      '<span class="semaforo semaforo--' + sem[0] + '">' + esc(sem[1]) + '</span></div>';
    var P = M.pasos(d).map(function (p) { return p.id; });

    if (d.tipo === 'ATS') {
      var g = d.generales;
      h += tit('Datos de la tarea', 0) + '<div class="datos">' + f('Sede', M.sede(d)) + f('Tarea', g.tarea) + f('Ubicación', g.ubicacion) + f('Área de Grupo Pana', g.areaContratista) +
        f('Fecha y hora', fecha(g.fecha) + ' ' + g.hora) + f('Liderado por', g.lideradoPor) + f('Supervisor', g.supervisor) +
        f('Permisos', C.ats.permisos.filter(function (p) { return d.permisos[p.id]; }).map(function (p) { return p.id === 'otro' ? 'Otro: ' + d.permisoOtro : p.label; }).join(', ')) + '</div>' +
        tit('Pasos de la tarea', 1) + d.pasos.map(function (p, i) {
          return '<div class="paso-res"><strong>' + (i + 1) + '. ' + esc(p.paso || '—') + (p.critico === 'si' ? ' <span class="marca marca--critico">Crítico</span>' : '') + '</strong>' +
            '<small>Riesgo: ' + esc(p.evento || '—') + '</small><small>Control: ' + esc(p.medidas || '—') + ' · Resp.: ' + esc(p.responsable || '—') + '</small></div>';
        }).join('') +
        tit('EPP y herramientas', 2) + '<div class="datos">' + f('EPP', C.ats.epp.filter(function (e) { return d.epp[e.id]; }).map(function (e) { return e.label; }).concat(d.otrosEpp ? [d.otrosEpp] : []).join(', ')) +
        f('Herramientas', d.herramientas) + f('Comentarios', d.comentarios) + '</div>';
      if (d.estado !== 'BORRADOR' || d.personal.length) h += tit('Personal', undefined) + '<div class="datos">' + f('Firmaron', d.personal.map(function (x) { return x.nombre; }).join(', ')) + f('Supervisor', d.supervisorFirma.nombre) + '</div>';
      return h + '</section>';
    }

    var s = d.descripcion, m = d.emergencia;
    h += tit('I. Descripción del trabajo', P.indexOf('descripcion')) + '<div class="datos">' +
      f('Sede', M.sede(d)) + f('Fecha y horario', fecha(s.fecha) + ' · ' + s.horaInicio + ' a ' + (s.horaFin || '—')) + f('ATS de referencia', s.atsRef) +
      f('Área de Grupo Pana', s.ejecutaNombre) + f('Tarea', s.tarea) + f('Lugar', s.lugar) + f('Tipo', M.tiposTexto(d)) +
      f('Capacitación previa', sn(s.capacitacion)) + '</div>' +
      tit('III. EPP', P.indexOf('epp')) + '<p class="parrafo">' + esc(C.petar.epp.reduce(function (a, g) { return a.concat(g.items.filter(function (it) { return d.epp[it.id]; }).map(function (it) { return it.label; })); }, []).concat(d.eppOtros ? [d.eppOtros] : []).join(', ') || '—') + '</p>' +
      tit('IV. Requisitos de seguridad', P.indexOf('requisitos')) + lista(C.petar.requisitos, d.requisitos);
    if (d.tipos.caliente) h += tit('V. Trabajo en caliente', P.indexOf('caliente')) + lista(C.petar.caliente, d.caliente) +
      '<p class="nota">Controles adicionales:</p>' + lista(C.petar.adicionales, d.adicionales) + '<div class="datos">' + f('Vigía caliente', d.vigias && d.vigias.caliente ? d.vigias.caliente.nombre : '') + '</div>';
    if (d.tipos.altura) h += tit('V. Trabajo en altura', P.indexOf('altura')) + lista(C.petar.altura, d.altura) +
      (d.escaleras.usa === 'si' ? '<p class="nota">Uso de escaleras (bloque sugerido):</p>' + lista(C.petar.escaleras, d.escaleras) : '<div class="datos">' + f('Uso de escalera', sn(d.escaleras.usa)) + '</div>');
    if (d.tipos.peligrosos) h += tit('V. Materiales peligrosos', P.indexOf('peligrosos')) + '<div class="datos">' + f('Productos', d.quimicos.productos) +
      f('¿Inflamables?', sn(d.quimicos.inflamable)) + (M.calienteConInflamables(d) ? f('LEL medido', d.quimicos.lel ? d.quimicos.lel + ' %' : 'Sin medición') : '') + '</div>' +
      lista(C.petar.peligrosos, d.peligrosos);
    if (d.tipos.caliente || d.tipos.altura || d.tipos.peligrosos) h += '<div class="datos">' + f('Fotografías de evidencia', String(M.totalFotos(d))) +
      (M.fotosFaltantes(d).length ? f('Evidencias pendientes', String(M.fotosFaltantes(d).length)) : '') + '</div>';
    h += tit('VI. Emergencias', P.indexOf('emergencia')) + '<div class="datos">' + f('Encargado de sede', m.encargadoSede) + f('Supervisor / prevencionista', m.supervisorPrevencionista) +
      f('Rutas libres', sn(m.rutasLibres)) + f('Rutas indicadas', sn(m.rutasIndicadas)) + f('Contacto de emergencia', m.contacto + ' · ' + m.telefono) + '</div>';
    if (d.estado !== 'BORRADOR') {
      h += tit('Autorización', undefined) + '<div class="datos">' + f('Participantes', d.participantes.map(function (x) { return x.nombre; }).join(', ')) +
        C.petar.firmasAutorizacion.map(function (a) { return f(a.cargo, d.autorizacion[a.clave].nombre); }).join('') + '</div>';
      if (d.verificaciones.length) h += tit('Verificaciones durante el trabajo') + '<div class="datos">' + d.verificaciones.map(function (v) { return f(UI.fechaHora(v.fechaHora) + ' · ' + v.cargo, v.nombre + (v.observaciones ? ' — ' + v.observaciones : '')); }).join('') + '</div>';
      if (d.cancelacion) h += '<div class="alerta alerta--mal"><strong>Cancelado:</strong> ' + esc(d.cancelacion.motivo) + (d.cancelacion.detalle ? ' — ' + esc(d.cancelacion.detalle) : '') + '</div>';
    }
    return h + '</section>';
  }

  /* ====================== Verificación y cierre ===================== */
  function vVerificacion() {
    var v = st.verif || (st.verif = { cargo: '', nombre: '', observaciones: '' });
    app.innerHTML = UI.listaErrores(st.errores.map(function (m) { return { mensaje: m }; })) + '<section class="bloque">' +
      '<p class="intro">Registro de quien verifica el trabajo en curso (V°B°).</p>' +
      campo('Verificador (cargo) *', '<input type="text" id="vCargo" value="' + esc(v.cargo) + '" placeholder="Ej. Supervisor SST">') +
      campo('Apellidos y nombres *', '<input type="text" id="vNombre" value="' + esc(v.nombre) + '">') +
      campo('Observaciones de la verificación', '<textarea id="vObs" rows="3">' + esc(v.observaciones) + '</textarea>') +
      '<h3 class="h-sub">V°B° *</h3><div class="firma"><canvas class="firma__lienzo" data-firma="__verif"></canvas>' +
      '<div class="firma__pie"><span>Firma con el dedo</span><button class="enlace" data-accion="borrar-firma" data-firma="__verif">Borrar</button></div></div>' +
      '</section><div class="barra-pie"><button class="btn btn--fantasma" data-accion="volver-detalle">Cancelar</button>' +
      '<button class="btn btn--principal" data-accion="guardar-verif">Registrar</button></div>';
  }

  function vCierre() {
    var d = st.doc;
    app.innerHTML = UI.listaErrores(st.errores.map(function (m) { return { mensaje: m }; })) + '<section class="bloque">' +
      '<p class="intro">El cierre confirma que el trabajo terminó y el área quedó en condiciones seguras. La fecha y la hora se registran con cada firma.</p>' +
      C.petar.firmasAutorizacion.map(function (a) {
        var x = d.cierre[a.clave];
        if (!x.nombre) x.nombre = d.autorizacion[a.clave].nombre;
        return '<h3 class="h-sub">' + esc(a.cargo) + '</h3>' + firmaFija('cierre.' + a.clave, x, false);
      }).join('') +
      '</section><div class="barra-pie"><button class="btn btn--fantasma" data-accion="volver-detalle">Cancelar</button>' +
      '<button class="btn btn--principal" data-accion="registrar-cierre">' + (C.modoPrueba ? 'Registrar cierre de prueba' : 'Cerrar y enviar a SST') + '</button></div>';
  }

  /* ============================ Ajustes ============================= */
  function vAjustes() {
    if (!st.sstAutorizado) { st.pantalla = 'accesoSST'; return vAccesoSST(); }
    app.innerHTML = '<section class="bloque">' +
      '<h2 class="h-seccion">Sede de este dispositivo</h2>' +
      '<p class="intro">La sede se aplica únicamente a documentos nuevos. Los documentos ya creados conservan su sede original.</p>' +
      campo('Sede actual', '<select id="aSede">' + opcionesSede(C.sedeCodigo) + '</select>') +
      '<button class="btn btn--fantasma btn--ancho" data-accion="guardar-sede-ajustes">Cambiar sede del dispositivo</button>' +
      '<h2 class="h-seccion">Envío a SST (Power Automate)</h2>' +
      '<p class="intro">La URL y la clave se guardan únicamente en este dispositivo. Si usas otro celular o navegador, debes configurarlas una vez en ese dispositivo. No las publiques en el repositorio.</p>' +
      campo('URL del flujo', '<textarea id="aUrl" rows="4" placeholder="<URL_DEL_FLUJO>">' + esc(C.flujoUrl) + '</textarea>') +
      '<div class="campo"><label for="aClave">Clave del área</label><input id="aClave" type="password" autocomplete="off" value="' + esc(C.claveArea || '') + '" placeholder="<CLAVE_DEL_AREA>">' +
      '<label class="confirmacion" for="aMostrarClave"><input id="aMostrarClave" type="checkbox" data-accion="mostrar-clave"> Mostrar clave</label></div>' +
      '<button class="btn btn--principal btn--ancho" data-accion="guardar-conexion">Guardar conexión</button>' +
      '<button class="btn btn--fantasma btn--ancho" data-accion="probar-envio"' + (window.Envio.configurado() ? '' : ' disabled') + '>Enviar un documento de prueba</button>' +
      '<p class="nota">La confirmación solo se muestra cuando el flujo devuelve una respuesta válida y coincidente. Un envío sin confirmar no se reintenta automáticamente.</p>' +
      '<h2 class="h-seccion">Seguridad de Ajustes</h2>' + campo('Nueva clave SST', '<input id="sstNuevaClave" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres">') + campo('Confirmar nueva clave SST', '<input id="sstNuevaClave2" type="password" autocomplete="new-password" placeholder="Repite la nueva clave">') + '<button class="btn btn--fantasma btn--ancho" data-accion="cambiar-clave-sst">Cambiar clave de acceso SST</button>' +
      '<h2 class="h-seccion">Este celular</h2><div class="datos">' +
      '<div class="dato"><span>Almacenamiento</span><strong>' + esc(st.motor) + '</strong></div>' +
      '<div class="dato"><span>Versión</span><strong>' + esc(C.version) + '</strong></div></div></section>';
  }

  /* ============================ PDF visor =========================== */
  function verPDF(d) {
    UI.aviso('Generando PDF…');
    window.DocPDF.blobUrl(d).then(function (url) {
      var fondo = document.createElement('div'); fondo.className = 'modal modal--pdf';
      fondo.innerHTML = '<div class="visor"><div class="visor__barra"><strong>' + esc(d.numero) + '</strong><button class="enlace" data-cerrar>Cerrar</button></div>' +
        '<iframe class="visor__marco" src="' + url + '" title="Documento"></iframe><div class="visor__acciones"><button class="btn btn--fantasma" data-nueva>Abrir en otra pestaña</button><button class="btn btn--principal" data-descargar>Descargar</button></div></div>';
      document.body.appendChild(fondo);
      fondo.addEventListener('click', function (ev) {
        if (ev.target.hasAttribute('data-descargar')) window.DocPDF.descargar(d).catch(function () { UI.aviso('No se pudo descargar el PDF.', 'mal'); });
        else if (ev.target.hasAttribute('data-nueva')) window.open(url, '_blank');
        else if (ev.target.hasAttribute('data-cerrar') || ev.target === fondo) { URL.revokeObjectURL(url); fondo.remove(); }
      });
    }).catch(function (e) { UI.aviso('No se pudo generar el PDF: ' + (e.message || e), 'mal'); });
  }

  /* ============================ Envío =============================== */
  function enviar(d, momento) {
    UI.aviso(C.modoPrueba || d.prueba ? 'Guardando prueba local…' : 'Intentando envío a SST…');
    return window.Envio.enviar(d, momento).then(function (r) {
      return window.Store.guardar(d).then(function () {
        UI.aviso(r.detalle || textoEnvio(r), r.resultado === 'confirmado' ? 'ok' : 'mal');
        return r;
      });
    });
  }

  function reenviar(d) {
    var ultimo = window.Envio.ultimo(d);
    function hacer() { return enviar(d, 'reenvio').then(function () { render(); }); }
    if (!ultimo || ['no_confirmado', 'confirmado'].indexOf(ultimo.resultado) < 0) return hacer();
    return UI.confirmar({
      titulo: 'Reenviar a SST',
      texto: ultimo.resultado === 'confirmado'
        ? 'Este documento ya fue confirmado por SST. Reenviarlo puede generar un duplicado.'
        : 'El intento anterior quedó sin confirmar y el flujo pudo haberlo procesado. Reenviarlo puede generar un duplicado.',
      aceptar: 'Reenviar de todos modos',
      peligro: true
    }).then(function (ok) { if (ok) return hacer(); });
  }

  /* ============================ Acciones ============================ */
  function nuevo(tipo, ats) {
    if (!C.sede || !C.sedeCodigo) { UI.aviso('Primero configura la sede de este dispositivo.', 'mal'); ir('sede'); return Promise.resolve(); }
    if (tipo === 'PETAR' && (!ats || ats.tipo !== 'ATS' || ats.estado !== 'REGISTRADO' || M.sede(ats) !== C.sede)) {
      avisoATSObligatorio();
      return Promise.resolve();
    }
    return window.Store.siguienteNumero(tipo).then(function (n) {
      st.doc = tipo === 'ATS' ? M.nuevoATS(n, st.usuario) : M.nuevoPETAR(n, st.usuario, ats);
      if (tipo === 'PETAR') st.doc.evidenciasNoDisponibles = !window.Store.fotosSoportadas();
      return window.Store.guardar(st.doc);
    }).then(function () { ir('form', 0); UI.aviso(st.doc.numero + ' creado'); });
  }

  function abrir(id, pantalla) {
    return window.Store.obtener(id).then(function (d) {
      if (!d) { UI.aviso('El documento ya no existe.', 'mal'); return; }
      st.doc = d; if (d.tipo === 'PETAR') { M.normalizar(d); d.evidenciasNoDisponibles = !window.Store.fotosSoportadas(); } ir(pantalla || 'detalle', 0);
    });
  }

  function editarDesde(paso) {
    var d = st.doc;
    if (!M.editable(d)) { UI.aviso('Solo se editan borradores.', 'mal'); return; }
    if (!M.tieneFirmas(d)) return ir('form', paso);
    UI.confirmar({ titulo: 'Editar el documento', texto: 'Ya hay firmas registradas. Si editas el contenido, las firmas se borrarán y todos deberán firmar de nuevo.', aceptar: 'Editar y borrar firmas', peligro: true })
      .then(function (ok) { if (!ok) return; M.limpiarFirmas(d); guardarYa().then(function () { ir('form', paso); }); });
  }

  function clic(ev) {
    var b = ev.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    var a = b.dataset.accion, d = st.doc;

    switch (a) {
      case 'guardar-sede':
        var codigoSede = $('#sedeSeleccion').value;
        if (!aplicarSede(codigoSede)) { UI.aviso('Selecciona una sede válida.', 'mal'); return; }
        window.Store.pref('sede_v072', C.sedeCodigo).then(function () {
          UI.aviso('Sede ' + C.sede + ' configurada', 'ok');
          ir(st.usuario ? 'inicio' : 'usuario');
        });
        break;
      case 'guardar-usuario':
        var n = $('#uNombre').value.trim(), c = $('#uCargo').value.trim();
        if (!n || !c) { UI.aviso('Escribe tu nombre y tu cargo.', 'mal'); return; }
        st.usuario = { nombre: n, cargo: c };
        window.Store.pref('usuario', st.usuario).then(function () { ir('inicio'); });
        break;
      case 'cambiar-usuario': ir('usuario'); break;
      case 'ir-historial': ir('historial'); break;
      case 'ir-acceso-sst': st.volverA = st.usuario ? 'inicio' : 'usuario'; ir('accesoSST'); break;
      case 'ir-ajustes': st.volverA = st.usuario ? 'inicio' : 'usuario'; ir(st.sstAutorizado ? 'ajustes' : 'accesoSST'); break;
      case 'crear-clave-sst':
        var claveNueva = $('#sstClave').value, claveNueva2 = $('#sstClave2').value;
        if (claveNueva.length < 6 || claveNueva !== claveNueva2) { UI.aviso(claveNueva.length < 6 ? 'La clave SST debe tener al menos 6 caracteres.' : 'Las claves SST no coinciden.', 'mal'); return; }
        hashClaveAjustes(claveNueva).then(function (hash) { st.claveAjustesHash = hash; return window.Store.pref('claveAjustesHash_v07', hash); }).then(function () { st.sstAutorizado = true; ir('ajustes'); }); break;
      case 'validar-clave-sst':
        hashClaveAjustes($('#sstClave').value).then(function (hash) { if (hash !== st.claveAjustesHash) { UI.aviso('Clave SST incorrecta.', 'mal'); return; } st.sstAutorizado = true; ir('ajustes'); }); break;
      case 'filtro': st.filtroTipo = b.dataset.valor; render(); break;
      case 'nuevo-ats': nuevo('ATS'); break;
      case 'nuevo-petar': window.Store.todos().then(function (l) { st.lista = l; ir('elegirATS'); }); break;
      case 'petar-desde':
        var idA = b.dataset.id;
        (idA ? window.Store.obtener(idA) : Promise.resolve(null)).then(function (ats) { nuevo('PETAR', ats); });
        break;
      case 'abrir':
        window.Store.obtener(b.dataset.id).then(function (x) { st.doc = x; ir(x.estado === 'BORRADOR' ? 'revision' : 'detalle'); });
        break;
      case 'volver-detalle': ir('detalle'); break;

      /* Formulario */
      case 'paso-atras':
        if (st.paso === 0) guardarYa().then(function () { ir('inicio'); });
        else ir('form', st.paso - 1);
        break;
      case 'paso-sig':
        var pasos = M.pasos(d), err = M.validarPaso(d, pasos[st.paso].id);
        if (err.length) { st.errores = err; render(); window.scrollTo(0, 0); return; }
        guardarYa();
        if (st.paso === pasos.length - 1) ir('revision'); else ir('form', st.paso + 1);
        break;
      case 'editar': editarDesde(Number(b.dataset.paso)); break;
      case 'resp':
        var actual = getPath(d, b.dataset.ruta);
        setPath(d, b.dataset.ruta, actual === b.dataset.valor && b.dataset.ruta !== 'descripcion.ejecutaTipo' ? '' : b.dataset.valor);
        guardarLuego(); quieto();
        break;
      case 'toggle':
        var rutaToggle = b.dataset.ruta, nuevoValor = !getPath(d, rutaToggle);
        if (d.tipo === 'PETAR' && rutaToggle.indexOf('tipos.') === 0 && !nuevoValor) {
          var tipoOff = rutaToggle.split('.')[1], refsOff = M.limpiarEvidenciasTipo(d, tipoOff);
          setPath(d, rutaToggle, false); window.Store.eliminarFotos(refsOff).catch(function () {}); guardarLuego(); quieto(); break;
        }
        setPath(d, rutaToggle, nuevoValor);
        if (d.tipo === 'ATS' && rutaToggle === 'epp.basico') d.epp.basico = true;
        if (d.tipo === 'PETAR' && rutaToggle.indexOf('tipos.') === 0 && nuevoValor) (C.petar.eppPorTipo[rutaToggle.split('.')[1]] || []).forEach(function (k) { d.epp[k] = true; });
        guardarLuego(); quieto(); break;
      case 'quitar-foto':
        var lf = (d.evidencias || {})[b.dataset.ruta], idFoto = b.dataset.id;
        if (lf) { d.evidencias[b.dataset.ruta] = lf.filter(function (f) { return f.id !== idFoto; }); if (!d.evidencias[b.dataset.ruta].length) delete d.evidencias[b.dataset.ruta]; }
        window.Store.eliminarFoto(idFoto).catch(function () {}); guardarLuego(); quieto(); break;
      case 'ver-foto': verFoto(b.dataset.id); break;
      case 'agregar-paso': d.pasos.push({ paso: '', evento: '', critico: '', medidas: '', responsable: '' }); guardarLuego(); quieto(); break;
      case 'quitar-paso': d.pasos.splice(Number(b.dataset.i), 1); guardarLuego(); quieto(); break;
      case 'ejemplo-pasos':
        d.pasos = C.ats.pasosEjemplo.map(function (p) { return Object.assign({}, p, { responsable: d.generales.supervisor || st.usuario.nombre }); });
        guardarLuego(); quieto();
        break;
      case 'guardar-salir': guardarYa().then(function () { UI.aviso('Guardado'); ir('inicio'); }); break;
      case 'ver-pdf': verPDF(d); break;
      case 'descargar-pdf': window.DocPDF.descargar(d).catch(function () { UI.aviso('No se pudo descargar el PDF.', 'mal'); }); break;

      /* Firmas */
      case 'ir-firmas':
        if (M.validarTodo(d).length || M.bloqueos(d).length) { render(); return; }
        st.pendiente = null; st['firma__nuevo'] = '';
        ir('firmas');
        break;
      case 'borrar-firma':
        var pad = st.pads[b.dataset.firma];
        if (pad) pad.limpiar();
        break;
      case 'agregar-firmante': agregarFirmante(b.dataset.dni === '1'); break;
      case 'firmar-pendiente':
        var lst = d[b.dataset.ruta], idx = Number(b.dataset.i);
        st.pendiente = { nombre: lst[idx].nombre, dni: lst[idx].dni, editando: idx };
        st['firma__nuevo'] = '';
        render();
        document.getElementById('nuevoFirmante').scrollIntoView({ behavior: 'smooth' });
        break;
      case 'quitar-firmante':
        d[b.dataset.ruta].splice(Number(b.dataset.i), 1); st.pendiente = null;
        guardarLuego(); quieto();
        break;
      case 'registrar-ats': finalizar('REGISTRADO', 'atsRegistrado', 'Registrar el ATS', 'Se registrará el ATS con las firmas y se enviará a SST.'); break;
      case 'autorizar': finalizar('AUTORIZADO', 'petarAutorizado', 'Autorizar el PETAR', 'Se autoriza la ejecución del trabajo en las condiciones indicadas, para el día y horario: ' + d.descripcion.horaInicio + ' a ' + d.descripcion.horaFin + '.'); break;

      /* Detalle */
      case 'reenviar': reenviar(d); break;
      case 'ir-verificacion': st.verif = null; st['firma__verif'] = ''; ir('verificacion'); break;
      case 'guardar-verif': guardarVerificacion(); break;
      case 'ir-cierre': ir('cierre'); break;
      case 'registrar-cierre':
        var ec = M.validarCierre(d);
        if (ec.length) { st.errores = ec; render(); window.scrollTo(0, 0); return; }
        UI.confirmar({ titulo: 'Cerrar el permiso', texto: 'Confirmas que el trabajo terminó y que el área quedó en condiciones seguras.', aceptar: 'Cerrar permiso' }).then(function (ok) {
          if (!ok) return;
          M.cambiarEstado(d, 'CERRADO', st.usuario.nombre, 'Cierre del permiso');
          window.Store.guardar(d).then(function () { return C.enviarAl.petarCerrado ? enviar(d, 'petarCerrado') : null; }).then(function () { ir('detalle'); });
        });
        break;
      case 'cancelar': dialogoCancelar(); break;
      case 'eliminar':
        UI.confirmar({ titulo: 'Eliminar borrador', texto: 'Se borrará ' + d.numero + ' de este celular.', aceptar: 'Eliminar', peligro: true }).then(function (ok) {
          if (!ok) return;
          var fotoIds = [];
          Object.keys(d.evidencias || {}).forEach(function (ruta) { (d.evidencias[ruta] || []).forEach(function (f) { if (f.id) fotoIds.push(f.id); }); });
          window.Store.eliminarFotos(fotoIds).catch(function () {}).then(function () { return window.Store.eliminar(d.id); }).then(function () { st.doc = null; ir('inicio'); });
        });
        break;

      /* Ajustes */
      case 'mostrar-clave':
        $('#aClave').type = $('#aMostrarClave').checked ? 'text' : 'password';
        break;
      case 'guardar-sede-ajustes':
        var nuevaSedeCodigo = $('#aSede').value, nuevaSede = buscarSede(nuevaSedeCodigo);
        if (!nuevaSede) { UI.aviso('Selecciona una sede válida.', 'mal'); return; }
        if (nuevaSedeCodigo === C.sedeCodigo) { UI.aviso('La sede del dispositivo ya es ' + C.sede + '.'); return; }
        UI.confirmar({
          titulo: 'Cambiar sede del dispositivo',
          texto: 'Los documentos existentes conservarán su sede. Los nuevos ATS y PETAR se crearán para ' + nuevaSede.nombre + '.',
          aceptar: 'Cambiar a ' + nuevaSede.nombre
        }).then(function (ok) {
          if (!ok) return;
          aplicarSede(nuevaSedeCodigo); st.doc = null;
          window.Store.pref('sede_v072', C.sedeCodigo).then(function () { UI.aviso('Sede actualizada a ' + C.sede, 'ok'); ir('inicio'); });
        });
        break;
      case 'guardar-conexion':
        C.flujoUrl = $('#aUrl').value.trim();
        C.claveArea = $('#aClave').value.trim();
        Promise.all([
          window.Store.pref('flujoUrl_v05', C.flujoUrl),
          window.Store.pref('claveArea_v06', C.claveArea)
        ]).then(function () { UI.aviso(window.Envio.configurado() ? 'Conexión guardada' : 'Falta URL o clave del área'); render(); });
        break;
      case 'probar-envio': probarEnvio(); break;
      case 'cambiar-clave-sst':
        var nuevaSst = $('#sstNuevaClave').value, nuevaSst2 = $('#sstNuevaClave2').value;
        if (nuevaSst.length < 6 || nuevaSst !== nuevaSst2) { UI.aviso(nuevaSst.length < 6 ? 'La nueva clave SST debe tener al menos 6 caracteres.' : 'Las nuevas claves SST no coinciden.', 'mal'); return; }
        hashClaveAjustes(nuevaSst).then(function (hash) { st.claveAjustesHash = hash; return window.Store.pref('claveAjustesHash_v07', hash); }).then(function () { UI.aviso('Clave de acceso SST actualizada', 'ok'); render(); }); break;
    }
  }

  function agregarFirmante(dniObligatorio) {
    var d = st.doc, lista = d.tipo === 'ATS' ? d.personal : d.participantes;
    var nombre = $('#nfNombre').value.trim(), dni = $('#nfDni').value.trim(), firma = st['firma__nuevo'];
    var p = st.pendiente;
    if (nombre.length < 5 || nombre.indexOf(' ') < 0) { UI.aviso('Escribe nombres y apellidos.', 'mal'); return; }
    if ((dniObligatorio || dni) && !M.dniValido(dni)) { UI.aviso('El DNI debe tener 8 dígitos.', 'mal'); return; }
    var dup = lista.some(function (x, i) { return x.dni && x.dni === dni && (!p || p.editando !== i); });
    if (dup) { UI.aviso('Ese DNI ya está registrado.', 'mal'); return; }
    if (!firma) { UI.aviso('Falta la firma.', 'mal'); return; }
    var reg = M.firmante({ nombre: nombre, dni: dni, firma: firma, fechaHora: new Date().toISOString() });
    if (p && p.editando !== undefined) lista[p.editando] = reg; else lista.push(reg);
    st.pendiente = null; st['firma__nuevo'] = '';
    guardarYa().then(function () {
      UI.aviso('Firma de ' + nombre.split(' ')[0] + ' registrada. Pasa el celular al siguiente.');
      quieto();
    });
  }

  function finalizar(estado, momento, tituloConf, textoConf, vinculoATSComprobado) {
    var d = st.doc;
    if (d && d.tipo === 'PETAR' && !vinculoATSComprobado) {
      return atsRegistradoParaPetar(d).then(function (ok) {
        if (!ok) {
          avisoATSObligatorio();
          if (st.pantalla !== 'detalle') ir('detalle');
          return;
        }
        return finalizar(estado, momento, tituloConf, textoConf, true);
      });
    }
    var e = M.validarTodo(d).map(function (x) { return x.mensaje; }).concat(M.validarFirmas(d), M.bloqueos(d));
    if (!M.editable(d)) { UI.aviso('El documento ya fue finalizado.', 'mal'); return; }
    if (e.length) { st.errores = e; render(); window.scrollTo(0, 0); return; }
    UI.confirmar({ titulo: C.modoPrueba ? 'Registrar simulación' : tituloConf, texto: C.modoPrueba ? 'Este documento es de prueba, no autoriza trabajos y no se enviará a SST.' : textoConf, aceptar: estado === 'AUTORIZADO' ? 'Autorizar' : 'Registrar' }).then(function (ok) {
      if (!ok) return;
      if (!M.editable(d)) return;
      var pendientes = M.validarTodo(d).map(function (x) { return x.mensaje; }).concat(M.validarFirmas(d), M.bloqueos(d));
      if (pendientes.length) { st.errores = pendientes; render(); return; }
      M.cambiarEstado(d, estado, st.usuario.nombre, estado === 'AUTORIZADO' ? 'Autorizado por ' + d.autorizacion.supervisor.nombre + ' y ' + d.autorizacion.area.nombre : 'ATS firmado por ' + d.personal.length + ' persona(s)');
      window.Store.guardar(d).then(function () {
        return (C.enviarAl[momento] ? enviar(d, momento) : null);
      }).then(function () { ir('detalle'); });
    });
  }

  function guardarVerificacion() {
    var d = st.doc, v = { cargo: $('#vCargo').value.trim(), nombre: $('#vNombre').value.trim(), observaciones: $('#vObs').value.trim() };
    st.verif = v;
    var e = [];
    if (!v.cargo) e.push('Indica el cargo del verificador.');
    if (!v.nombre) e.push('Indica el nombre del verificador.');
    if (!st['firma__verif']) e.push('Falta el V°B° (firma).');
    if (e.length) { st.errores = e; render(); window.scrollTo(0, 0); return; }
    v.firma = st['firma__verif']; v.fechaHora = new Date().toISOString();
    d.verificaciones.push(v);
    d.bitacora.push({ estado: d.estado, fechaHora: v.fechaHora, usuario: v.nombre, comentario: 'Verificación durante el trabajo (' + v.cargo + ')' });
    window.Store.guardar(d).then(function () { UI.aviso('Verificación registrada'); ir('detalle'); });
  }

  function dialogoCancelar() {
    var d = st.doc, fondo = document.createElement('div');
    fondo.className = 'modal';
    fondo.innerHTML = '<div class="modal__caja" role="dialog" aria-modal="true"><h3 class="modal__titulo">Cancelar el permiso</h3>' +
      '<p class="modal__texto">' + esc(C.petar.leyendaAlarma) + '. Para retomar el trabajo se emite un PETAR nuevo.</p>' +
      '<div class="campo"><label for="cMot">Motivo</label><select id="cMot"><option>Alarma o aviso de emergencia</option><option>Cambio de las condiciones de trabajo</option><option>Otro</option></select></div>' +
      '<div class="campo"><label for="cDet">Detalle</label><textarea id="cDet" rows="3"></textarea></div>' +
      '<div class="modal__acciones"><button class="btn btn--fantasma" data-r="0">Volver</button><button class="btn btn--peligro" data-r="1">Cancelar permiso</button></div></div>';
    document.body.appendChild(fondo);
    fondo.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-r]');
      if (!b && ev.target !== fondo) return;
      var ok = b && b.dataset.r === '1', mot = fondo.querySelector('#cMot').value, det = fondo.querySelector('#cDet').value.trim();
      fondo.remove();
      if (!ok) return;
      d.cancelacion = { motivo: mot, detalle: det, fechaHora: new Date().toISOString(), usuario: st.usuario.nombre };
      M.cambiarEstado(d, 'CANCELADO', st.usuario.nombre, mot + (det ? ' — ' + det : ''));
      window.Store.guardar(d).then(function () { return enviar(d, 'petarCancelado'); }).then(function () { render(); });
    });
  }

  function probarEnvio() {
    if (!window.Envio.configurado()) { UI.aviso('Configura la URL y la clave del área.', 'mal'); return Promise.resolve(); }
    var ficticio = { nombre: 'USUARIO FICTICIO', cargo: 'PRUEBA DE CONEXIÓN' };
    var prueba = M.nuevoATS('ATS-PRUEBA-CONEXION-' + Date.now().toString().slice(-6), ficticio);
    prueba.prueba = false;
    prueba.generales.tarea = 'PRUEBA FICTICIA DE CONEXIÓN — NO CORRESPONDE A UN TRABAJO REAL';
    prueba.generales.ubicacion = 'UBICACIÓN FICTICIA';
    prueba.generales.areaContratista = 'ÁREA FICTICIA';
    prueba.generales.lideradoPor = ficticio.nombre;
    prueba.generales.supervisor = ficticio.nombre;
    prueba.pasos = [{ paso: 'Prueba de conexión', evento: 'Dato ficticio', critico: 'no', medidas: 'Dato ficticio', responsable: ficticio.nombre }];
    return window.Envio.enviar(prueba, 'prueba_conexion').then(function (r) {
      UI.aviso(r.detalle || textoEnvio(r), r.resultado === 'confirmado' ? 'ok' : 'mal');
      return r;
    });
  }

  function entrada(ev) {
    var el = ev.target;
    if (!el.dataset || !el.dataset.campo || !st.doc) return;
    setPath(st.doc, el.dataset.campo, el.value);
    guardarLuego();
    if (el.dataset.campo === 'descripcion.atsRef') st.doc.descripcion.atsId = '';
  }

  /* ============================ Arranque ============================ */
  function iniciar() {
    app = $('#app'); titulo = $('#tituloApp'); sub = $('#subApp'); atras = $('#btnAtras');
    app.addEventListener('click', clic);
    app.addEventListener('input', entrada);
    app.addEventListener('change', entrada);
    app.addEventListener('change', function (ev) { if (ev.target && ev.target.dataset && ev.target.dataset.foto) tomarFoto(ev.target); });
    atras.addEventListener('click', function () {
      var p = st.pantalla;
      if (p === 'form') return st.paso > 0 ? ir('form', st.paso - 1) : guardarYa().then(function () { ir('inicio'); });
      if (p === 'revision') return ir('form', M.pasos(st.doc).length - 1);
      if (p === 'firmas') return ir('revision');
      if (p === 'verificacion' || p === 'cierre') return ir('detalle');
      if (p === 'accesoSST' || p === 'ajustes') return ir(st.volverA || (st.usuario ? 'inicio' : 'usuario'));
      ir('inicio');
    });
    window.addEventListener('unhandledrejection', function (ev) {
      errorGuardado(); ev.preventDefault();
    });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') guardarYa().catch(errorGuardado); });
    window.addEventListener('pagehide', function () { guardarYa().catch(errorGuardado); });

    window.Store.init().then(function (m) {
      st.motor = m;
      $('#motor').textContent = 'Copia en este celular · ' + m;
      st.fotosDisponibles = window.Store.fotosSoportadas();
      return Promise.all([window.Store.pref('usuario'), window.Store.pref('flujoUrl_v05'), window.Store.pref('claveArea_v06'), window.Store.pref('claveAjustesHash_v07'), window.Store.pref('claveAjustesHash_v06'), window.Store.pref('sede_v072')]);
    }).then(function (r) {
      // La URL anterior contenía una clave publicada; no se reutiliza.
      window.Store.pref('flujoUrl', '').catch(errorGuardado);
      if (r[1]) C.flujoUrl = r[1];
      if (r[2]) C.claveArea = r[2];
      st.claveAjustesHash = r[3] || r[4] || '';
      st.usuario = r[0] || null;
      if (r[5]) aplicarSede(r[5]);
      ir(C.sede ? (st.usuario ? 'inicio' : 'usuario') : 'sede');
    });

    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  window.App = { estado: st };
  document.addEventListener('DOMContentLoaded', iniciar);
})();
