/* =====================================================================
   DOCUMENTO PDF — window.DocPDF
   Genera el ATS (FOR-GHS-001) y el PETAR (FOR-GHS-002) en A4.
   Todas las celdas ajustan su alto al texto: nada se corta.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.SST_CONFIG;
  var M = 10, W = 210, H = 297, U = W - 2 * M, LIM = H - 18;
  var ROJO = [226, 10, 23], TINTA = [29, 29, 27], GRIS = [105, 110, 118], LINEA = [170, 174, 180];
  var OK = [30, 122, 75], MAL = [194, 38, 27];
  var FS = 7.6, LH = 3.3;           /* tamaño y alto de línea del texto de celdas */

  function fmtF(iso) { if (!iso) return ''; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function fmtFH(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() +
      ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function horaDe(iso) { if (!iso) return ''; var d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function sn(v) { return v === 'si' ? 'SÍ' : v === 'no' ? 'NO' : v === 'na' ? 'N/A' : '—'; }

  /* --------------------------- Lienzo ------------------------------ */
  function Lienzo(d) {
    var J = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!J) throw new Error('No se encontró la librería jsPDF.');
    this.doc = new J({ unit: 'mm', format: 'a4', compress: true });
    this.d = d;
    this.y = 0;
    this.cabecera(true);
  }

  Lienzo.prototype.cabecera = function (primera) {
    var doc = this.doc, d = this.d, cfg = d.tipo === 'ATS' ? C.ats : C.petar;
    var h = primera ? 20 : 13;
    doc.setDrawColor.apply(doc, LINEA); doc.setLineWidth(0.3);
    doc.rect(M, M, U, h);
    /* Marca: isotipo + GRUPO / PANA */
    var hl = primera ? 11 : 8, lg = window.SST_LOGO;
    var xl = M + 3, yl = M + (h - hl) / 2;
    if (lg) { try { doc.addImage(lg.png, 'PNG', xl, yl, hl * lg.proporcion, hl); } catch (e) { /* logo opcional */ } }
    var xt = xl + (lg ? hl * lg.proporcion + 2.5 : 0);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(primera ? 11.5 : 8.5);
    doc.setTextColor.apply(doc, TINTA); doc.text('GRUPO', xt, yl + hl * 0.45);
    doc.setTextColor.apply(doc, ROJO); doc.text('PANA', xt, yl + hl * 0.95);
    doc.setTextColor.apply(doc, TINTA);
    doc.setLineWidth(0.3); doc.setDrawColor.apply(doc, LINEA);
    /* Título */
    var xT = M + 46, wT = U - 46 - 44;
    doc.line(xT, M, xT, M + h);
    doc.setFontSize(primera ? 9.5 : 8);
    doc.text(doc.splitTextToSize(cfg.titulo, wT - 4), xT + wT / 2, M + (primera ? 7 : 5.5), { align: 'center' });
    if (primera && d.tipo === 'PETAR') {
      doc.setFillColor.apply(doc, ROJO); doc.rect(xT, M + h - 5, wT, 5, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(7);
      doc.text(cfg.validez, xT + wT / 2, M + h - 1.6, { align: 'center' });
      doc.setTextColor.apply(doc, TINTA);
    }
    /* Código */
    var xC = M + U - 44;
    doc.line(xC, M, xC, M + h);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
    doc.text('Código: ' + cfg.codigo, xC + 2, M + 4);
    doc.text('Versión: ' + cfg.versionFormato, xC + 2, M + 7.2);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(primera ? 8 : 7);
    doc.text(d.numero, xC + 2, M + (primera ? 12 : 11));
    if (primera) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
      doc.text('Estado: ' + window.Modelo.etiquetaEstado(window.Modelo.estadoVisible(d)), xC + 2, M + 16);
    }
    this.y = M + h + 3;
  };

  Lienzo.prototype.espacio = function (alto) {
    if (this.y + alto > LIM) { this.doc.addPage(); this.cabecera(false); return true; }
    return false;
  };

  Lienzo.prototype.banda = function (txt) {
    this.espacio(24);
    var doc = this.doc;
    doc.setFillColor.apply(doc, ROJO); doc.rect(M, this.y, U, 5.6, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(txt, M + 2, this.y + 3.9);
    doc.setTextColor.apply(doc, TINTA);
    this.y += 5.6;
  };

  /* Fila de campos etiqueta/valor. campos: [[etiqueta, valor, fracciónDeAncho]] */
  Lienzo.prototype.fila = function (campos) {
    var doc = this.doc, self = this;
    var anchos = campos.map(function (c) { return (c[2] || 1 / campos.length) * U; });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(FS);
    var lineas = campos.map(function (c, i) { return doc.splitTextToSize(String(c[1] || '—'), anchos[i] - 4); });
    var alto = Math.max.apply(null, lineas.map(function (l) { return l.length; })) * LH + 6;
    this.espacio(alto);
    var x = M;
    campos.forEach(function (c, i) {
      doc.setDrawColor.apply(doc, LINEA); doc.setLineWidth(0.2);
      doc.rect(x, self.y, anchos[i], alto);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.2); doc.setTextColor.apply(doc, GRIS);
      doc.text(c[0], x + 2, self.y + 2.8);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(FS); doc.setTextColor.apply(doc, TINTA);
      doc.text(lineas[i], x + 2, self.y + 6);
      x += anchos[i];
    });
    this.y += alto;
  };

  /* Tabla con encabezado repetido en cada página.
     cols: [{t: título, w: fracción, a: 'left'|'center', color: fn(valor)->rgb}] */
  Lienzo.prototype.tabla = function (cols, filas) {
    var doc = this.doc, self = this;
    var anchos = cols.map(function (c) { return c.w * U; });
    function encabezado() {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6);
      var ls = cols.map(function (c, i) { return doc.splitTextToSize(c.t, anchos[i] - 3); });
      var h = Math.max.apply(null, ls.map(function (l) { return l.length; })) * 3 + 3;
      self.espacio(h + 8);
      var x = M;
      doc.setFillColor(236, 238, 241);
      doc.rect(M, self.y, U, h, 'F');
      cols.forEach(function (c, i) {
        doc.setDrawColor.apply(doc, LINEA); doc.rect(x, self.y, anchos[i], h);
        doc.setTextColor.apply(doc, GRIS);
        doc.text(ls[i], x + anchos[i] / 2, self.y + 3.4, { align: 'center' });
        x += anchos[i];
      });
      doc.setTextColor.apply(doc, TINTA);
      self.y += h;
    }
    encabezado();
    filas.forEach(function (f) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(FS);
      var ls = f.map(function (v, i) { return doc.splitTextToSize(String(v == null || v === '' ? '—' : v), anchos[i] - 3); });
      var h = Math.max.apply(null, ls.map(function (l) { return l.length; })) * LH + 3;
      if (self.espacio(h)) encabezado();
      var x = M;
      f.forEach(function (v, i) {
        var c = cols[i];
        doc.setDrawColor.apply(doc, LINEA); doc.setLineWidth(0.2); doc.rect(x, self.y, anchos[i], h);
        var color = c.color ? c.color(v) : TINTA;
        doc.setTextColor.apply(doc, color);
        doc.setFont('helvetica', c.b ? 'bold' : 'normal');
        if (c.a === 'center') doc.text(ls[i], x + anchos[i] / 2, self.y + 3.6, { align: 'center' });
        else doc.text(ls[i], x + 1.5, self.y + 3.6);
        x += anchos[i];
      });
      doc.setTextColor.apply(doc, TINTA);
      self.y += h;
    });
  };

  /* Lista de casillas en columnas: [[etiqueta, marcado]] */
  Lienzo.prototype.casillas = function (items, columnas) {
    var doc = this.doc, self = this, n = columnas || 3, w = U / n;
    doc.setFontSize(FS);
    for (var i = 0; i < items.length; i += n) {
      var grupo = items.slice(i, i + n);
      var ls = grupo.map(function (it) { return doc.splitTextToSize(it[0], w - 9); });
      var h = Math.max.apply(null, ls.map(function (l) { return l.length; })) * LH + 2.6;
      this.espacio(h);
      grupo.forEach(function (it, j) {
        var x = M + j * w;
        doc.setDrawColor.apply(doc, LINEA); doc.rect(x, self.y, w, h);
        doc.setDrawColor.apply(doc, TINTA); doc.rect(x + 1.6, self.y + 1.2, 3, 3);
        if (it[1]) { doc.setFont('helvetica', 'bold'); doc.setTextColor.apply(doc, ROJO); doc.text('X', x + 2.3, self.y + 3.8); }
        doc.setFont('helvetica', it[1] ? 'bold' : 'normal'); doc.setTextColor.apply(doc, it[1] ? TINTA : GRIS);
        doc.text(ls[j], x + 6, self.y + 3.4);
      });
      doc.setTextColor.apply(doc, TINTA);
      this.y += h;
    }
  };

  Lienzo.prototype.texto = function (etq, txt) { this.fila([[etq, txt || 'Sin registro', 1]]); };

  /* Bloques de firma: [{titulo, nombre, detalle, firma}] en N columnas */
  Lienzo.prototype.firmas = function (lista, columnas) {
    var doc = this.doc, self = this, n = columnas || 3, w = U / n, h = 30;
    for (var i = 0; i < lista.length; i += n) {
      this.espacio(h);
      lista.slice(i, i + n).forEach(function (f, j) {
        var x = M + j * w;
        doc.setDrawColor.apply(doc, LINEA); doc.setLineWidth(0.2); doc.rect(x, self.y, w, h);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.4); doc.setTextColor.apply(doc, GRIS);
        doc.text(doc.splitTextToSize(f.titulo, w - 4)[0], x + 2, self.y + 3);
        if (f.firma) { try { doc.addImage(f.firma, 'PNG', x + 4, self.y + 4, w - 8, 13); } catch (e) { /* firma ilegible */ } }
        else { doc.setFont('helvetica', 'italic'); doc.setTextColor.apply(doc, MAL); doc.text('Sin firma', x + w / 2, self.y + 12, { align: 'center' }); }
        doc.setDrawColor.apply(doc, TINTA); doc.line(x + 4, self.y + 18, x + w - 4, self.y + 18);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); doc.setTextColor.apply(doc, TINTA);
        doc.text(doc.splitTextToSize(f.nombre || '—', w - 4), x + w / 2, self.y + 21.5, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.4); doc.setTextColor.apply(doc, GRIS);
        doc.text(doc.splitTextToSize(f.detalle || '', w - 4).slice(0, 2), x + w / 2, self.y + 25.5, { align: 'center' });
      });
      doc.setTextColor.apply(doc, TINTA);
      this.y += h;
    }
  };

  Lienzo.prototype.nota = function (txt, color) {
    var doc = this.doc;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6.4); doc.setTextColor.apply(doc, color || GRIS);
    var ls = doc.splitTextToSize(txt, U);
    this.espacio(ls.length * 3 + 2);
    doc.text(ls, M, this.y + 3);
    doc.setTextColor.apply(doc, TINTA);
    this.y += ls.length * 3 + 2;
  };

  Lienzo.prototype.sep = function (mm) { this.y += (mm || 2.5); };

  Lienzo.prototype.cerrar = function () {
    var doc = this.doc, d = this.d, n = doc.getNumberOfPages();
    var marca = { BORRADOR: 'BORRADOR', CANCELADO: 'CANCELADO', VENCIDO: 'VENCIDO' }[window.Modelo.estadoVisible(d)];
    for (var i = 1; i <= n; i++) {
      doc.setPage(i);
      if (marca) {
        doc.setTextColor(222, 224, 228); doc.setFont('helvetica', 'bold'); doc.setFontSize(60);
        doc.text(marca, W / 2, H / 2, { align: 'center', angle: 35 });
      }
      doc.setDrawColor.apply(doc, LINEA); doc.line(M, H - 13, W - M, H - 13);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.3); doc.setTextColor.apply(doc, GRIS);
      doc.text('Generado digitalmente el ' + fmtFH(new Date().toISOString()) + ' · ' + C.empresa + ' · ' + C.sistema + ' ' + C.version + ' · Sede ' + C.sede, M, H - 9.5);
      doc.text(d.numero + ' · Página ' + i + ' de ' + n, W - M, H - 9.5, { align: 'right' });
      if (d.tipo === 'PETAR') {
        doc.setFont('helvetica', 'bold'); doc.setTextColor.apply(doc, ROJO); doc.setFontSize(7);
        doc.text(C.petar.leyendaAlarma, W / 2, H - 5.5, { align: 'center' });
      }
    }
    doc.setTextColor.apply(doc, TINTA);
    return doc;
  };

  function colorSN(v) { return v === 'SÍ' ? OK : v === 'NO' ? MAL : GRIS; }

  /* ============================ ATS =============================== */
  function ats(d) {
    var L = new Lienzo(d), g = d.generales;
    L.banda('DATOS DE LA TAREA');
    L.fila([['Tarea', g.tarea, 0.6], ['Fecha', fmtF(g.fecha), 0.2], ['Hora', g.hora, 0.2]]);
    L.fila([['Ubicación', g.ubicacion, 0.5], ['Grupo Pana (Área) / Contratista', g.areaContratista, 0.5]]);
    L.fila([['ATS liderado por', g.lideradoPor, 0.5], ['Supervisor de trabajo', g.supervisor, 0.5]]);
    L.sep();
    L.banda('PERMISOS DE TRABAJO');
    L.casillas(C.ats.permisos.map(function (p) {
      return [p.id === 'otro' && d.permisoOtro ? 'Otro: ' + d.permisoOtro : p.label, !!d.permisos[p.id]];
    }), 3);
    L.sep();
    L.banda('ANÁLISIS DE LA TAREA');
    L.tabla([
      { t: 'N°', w: 0.04, a: 'center' },
      { t: 'Secuencia de pasos básicos de la tarea ¿Qué vamos a hacer?', w: 0.22 },
      { t: 'Evento indeseado (seguridad, salud o ambiental) causado por… ¿Qué podría ir mal?', w: 0.24 },
      { t: '¿Crítico?', w: 0.08, a: 'center', b: true, color: colorSN },
      { t: 'Medidas de control ¿Qué podemos hacer al respecto?', w: 0.28 },
      { t: 'Responsable de implementar controles', w: 0.14 }
    ], d.pasos.map(function (p, i) { return [i + 1, p.paso, p.evento, sn(p.critico), p.medidas, p.responsable]; }));
    L.sep();
    L.banda('EPP Y HERRAMIENTAS');
    L.casillas(C.ats.epp.map(function (e) { return [e.label, !!d.epp[e.id]]; }), 3);
    L.fila([['Otros EPP', d.otrosEpp, 0.5], ['Herramientas', d.herramientas, 0.5]]);
    L.texto('Comentarios adicionales', d.comentarios);
    L.sep();
    L.banda('PERSONAL QUE REALIZA LA TAREA');
    L.firmas(d.personal.map(function (x, i) {
      return { titulo: (i + 1) + '. Participante', nombre: x.nombre, detalle: (x.dni ? 'DNI ' + x.dni + ' · ' : '') + 'Firmó ' + fmtFH(x.fechaHora), firma: x.firma };
    }).concat([{ titulo: 'Supervisor de trabajo', nombre: d.supervisorFirma.nombre, detalle: d.supervisorFirma.fechaHora ? 'Firmó ' + fmtFH(d.supervisorFirma.fechaHora) : '', firma: d.supervisorFirma.firma }]), 4);
    bitacora(L, d);
    return L.cerrar();
  }

  /* =========================== PETAR ============================== */
  function petar(d) {
    var L = new Lienzo(d), s = d.descripcion;
    L.banda('I. DESCRIPCIÓN DEL TRABAJO');
    L.fila([['Fecha', fmtF(s.fecha), 0.2], ['Hora inicial', s.horaInicio, 0.15], ['Hora final', s.horaFin, 0.15], ['ATS de referencia', s.atsRef, 0.25], ['Sede', s.sede, 0.25]]);
    L.fila([['Ejecuta (Grupo Pana / Contratista)', s.ejecutaTipo + ' — ' + s.ejecutaNombre, 1]]);
    L.fila([['Descripción de la tarea', s.tarea, 1]]);
    L.fila([['Lugar específico de la tarea', s.lugar, 1]]);
    L.casillas(C.petar.tipos.map(function (t) { return [t.label, !!d.tipos[t.id]]; }), 4);
    L.tabla([{ t: 'Pregunta', w: 0.85 }, { t: 'Respuesta', w: 0.15, a: 'center', b: true, color: colorSN }],
      [['¿Se llevó a cabo la capacitación previa de los trabajadores que realizarán el trabajo?', sn(s.capacitacion)]]);
    L.nota('II. Monitoreo del ambiente de trabajo: aplica a espacios confinados y materiales peligrosos; no habilitado en esta versión.');
    L.sep();

    L.banda('III. EQUIPOS DE PROTECCIÓN PERSONAL (EPP)');
    C.petar.epp.forEach(function (g) {
      var marcados = g.items.filter(function (it) { return d.epp[it.id]; });
      if (!marcados.length) return;
      L.nota(g.grupo, TINTA);
      L.casillas(marcados.map(function (it) { return [it.label, true]; }), 3);
    });
    if (d.eppOtros) L.texto('Otros EPP', d.eppOtros);
    L.sep();

    L.banda('IV. REQUISITOS DE SEGURIDAD (SUPERVISOR RESPONSABLE DEL TRABAJO)');
    L.tabla([{ t: 'Requisito', w: 0.85 }, { t: 'Respuesta', w: 0.15, a: 'center', b: true, color: colorSN }],
      C.petar.requisitos.map(function (r) { return [r.label, sn(d.requisitos[r.id])]; }));
    L.sep();

    if (d.tipos.caliente) {
      L.banda('V. TRABAJO DE ALTO RIESGO — TRABAJO EN CALIENTE (SUPERVISOR DEL TRABAJO)');
      L.tabla([{ t: 'Verificación', w: 0.85 }, { t: 'Respuesta', w: 0.15, a: 'center', b: true, color: colorSN }],
        C.petar.caliente.map(function (r) { return [r.label, sn(d.caliente[r.id])]; }));
      L.nota('Controles adicionales sugeridos (D.S. 42-F). No forman parte del formato FOR-GHS-002; se incluyen para validación de SST.');
      L.tabla([{ t: 'Control adicional', w: 0.7 }, { t: 'Referencia', w: 0.15, a: 'center' }, { t: 'Respuesta', w: 0.15, a: 'center', b: true, color: colorSN }],
        C.petar.adicionales.map(function (r) { return [r.label, 'D.S. 42-F ' + r.ref, sn(d.adicionales[r.id])]; }));
      L.firmas([{ titulo: 'Vigía', nombre: d.vigia.nombre, detalle: d.vigia.fechaHora ? 'Firmó ' + fmtFH(d.vigia.fechaHora) : '', firma: d.vigia.firma }], 3);
      L.sep();
    }

    var m = d.emergencia;
    L.banda('VI. PROTOCOLOS DE RESPUESTA ANTE EMERGENCIA');
    L.fila([['Nombre del encargado de la sede', m.encargadoSede, 0.5], ['Nombre del supervisor o prevencionista', m.supervisorPrevencionista, 0.5]]);
    var emer = C.petar.emergencias.map(function (x) { return [x, m.emergencias[x] === 'si' ? 'SÍ' : 'N/A']; });
    if (m.emergenciaOtro) emer.push(['Otros: ' + m.emergenciaOtro, 'SÍ']);
    var equi = C.petar.equiposEmergencia.map(function (x) { return [x, m.equipos[x] === 'si' ? 'SÍ' : 'N/A']; });
    if (m.equipoOtro) equi.push(['Otros: ' + m.equipoOtro, 'SÍ']);
    var nFilas = Math.max(emer.length, equi.length), filas = [];
    for (var i = 0; i < nFilas; i++) filas.push([(emer[i] || ['', ''])[0], (emer[i] || ['', ''])[1], (equi[i] || ['', ''])[0], (equi[i] || ['', ''])[1]]);
    L.tabla([{ t: 'Posible emergencia detectada', w: 0.38 }, { t: 'SÍ / N/A', w: 0.12, a: 'center', b: true, color: colorSN },
      { t: 'Equipos de emergencia', w: 0.38 }, { t: 'SÍ / N/A', w: 0.12, a: 'center', b: true, color: colorSN }], filas);
    L.tabla([{ t: 'Pregunta', w: 0.85 }, { t: 'Respuesta', w: 0.15, a: 'center', b: true, color: colorSN }], [
      ['¿Las rutas de acceso y salida están libres de obstáculos?', sn(m.rutasLibres)],
      ['¿Se indicó a los trabajadores involucrados las rutas de evacuación y puntos de reunión en caso de emergencia?', sn(m.rutasIndicadas)]
    ]);
    L.fila([['Teléfono de contacto para emergencias', m.telefono, 0.5], ['Persona de contacto para emergencias', m.contacto, 0.5]]);
    if (d.observaciones) L.texto('Observaciones', d.observaciones);
    L.sep();

    L.banda('VII. AUTORIZACIÓN DEL TRABAJO — COLABORADORES PARTICIPANTES');
    L.firmas(d.participantes.map(function (x, i) {
      return { titulo: (i + 1) + '. Colaborador participante', nombre: x.nombre, detalle: 'DNI ' + (x.dni || '—') + (x.fechaHora ? ' · ' + fmtFH(x.fechaHora) : ''), firma: x.firma };
    }).concat([{ titulo: 'Supervisor de trabajo', nombre: d.supervisorTrabajo.nombre, detalle: 'DNI ' + (d.supervisorTrabajo.dni || '—'), firma: d.supervisorTrabajo.firma }]), 4);
    L.sep();

    L.banda('AUTORIZACIÓN DEL TRABAJO');
    L.firmas(C.petar.firmasAutorizacion.map(function (a) {
      var x = d.autorizacion[a.clave];
      return { titulo: a.cargo, nombre: x.nombre, detalle: x.fechaHora ? 'Hora: ' + horaDe(x.fechaHora) + ' · Firma inicio' : '', firma: x.firma };
    }), 3);
    L.nota('Nota: el supervisor del trabajo es responsable de revisar la calidad del PETAR.');
    L.sep();

    L.banda('DURANTE EL TRABAJO');
    if (d.verificaciones.length) {
      L.tabla([{ t: 'Verificador (cargo)', w: 0.22 }, { t: 'Apellidos y nombres', w: 0.26 }, { t: 'Hora', w: 0.1, a: 'center' }, { t: 'Observaciones de la verificación', w: 0.42 }],
        d.verificaciones.map(function (v) { return [v.cargo, v.nombre, horaDe(v.fechaHora), v.observaciones]; }));
      L.firmas(d.verificaciones.map(function (v, i) { return { titulo: 'V°B° verificación ' + (i + 1), nombre: v.nombre, detalle: v.cargo, firma: v.firma }; }), 4);
    } else L.nota('Sin verificaciones registradas durante el trabajo.');
    L.sep();

    L.banda('CIERRE DE PERMISO');
    if (d.cancelacion) {
      L.fila([['Permiso CANCELADO', d.cancelacion.motivo + (d.cancelacion.detalle ? ' — ' + d.cancelacion.detalle : ''), 0.7], ['Fecha y hora', fmtFH(d.cancelacion.fechaHora), 0.3]]);
    }
    L.firmas(C.petar.firmasAutorizacion.map(function (a) {
      var x = d.cierre[a.clave];
      return { titulo: a.cargo, nombre: x.nombre, detalle: x.fechaHora ? 'Fecha y hora: ' + fmtFH(x.fechaHora) : 'Pendiente de cierre', firma: x.firma };
    }), 3);
    bitacora(L, d);
    return L.cerrar();
  }

  function bitacora(L, d) {
    L.sep();
    L.banda('TRAZABILIDAD DEL DOCUMENTO');
    L.tabla([{ t: 'Fecha y hora', w: 0.2 }, { t: 'Estado', w: 0.16 }, { t: 'Usuario', w: 0.24 }, { t: 'Detalle', w: 0.4 }],
      d.bitacora.map(function (b) { return [fmtFH(b.fechaHora), window.Modelo.etiquetaEstado(b.estado), b.usuario, b.comentario]; }));
  }

  function generar(d) { return d.tipo === 'ATS' ? ats(d) : petar(d); }

  window.DocPDF = {
    generar: generar,
    nombreArchivo: function (d) {
      var e = window.Modelo.estadoVisible(d).toLowerCase();
      return (d.numero + '_' + e).toLowerCase().replace(/[^a-z0-9_-]/g, '') + '.pdf';
    },
    base64: function (d) { return generar(d).output('datauristring').split(',')[1]; },
    blobUrl: function (d) { return URL.createObjectURL(generar(d).output('blob')); },
    descargar: function (d) { generar(d).save(window.DocPDF.nombreArchivo(d)); }
  };
})();
