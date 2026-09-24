/* =====================================================================
   MODELO — window.Modelo
   Estructura, validación y estados del ATS y del PETAR.
   Lógica pura: no toca la interfaz ni el almacenamiento.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.SST_CONFIG;

  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function hora(minExtra) {
    var d = new Date(Date.now() + (minExtra || 0) * 60000);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function aFecha(f, h) {
    if (!f || !h) return null;
    var a = f.split('-'), b = h.split(':');
    return new Date(+a[0], +a[1] - 1, +a[2], +b[0], +b[1]);
  }
  function firmante(extra) { return Object.assign({ nombre: '', dni: '', firma: '', fechaHora: '' }, extra || {}); }
  function dniValido(d) { return /^\d{8}$/.test((d || '').trim()); }

  var Modelo = {
    hoy: hoy, hora: hora, aFecha: aFecha, dniValido: dniValido, firmante: firmante,

    /* ------------------------------------------------------------ */
    nuevoATS: function (numero, usuario) {
      return {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        tipo: 'ATS', numero: numero, estado: 'BORRADOR',
        creadoEn: new Date().toISOString(), actualizadoEn: '',
        usuario: { nombre: usuario.nombre, cargo: usuario.cargo },
        generales: {
          tarea: '', ubicacion: '', areaContratista: C.areaPorDefecto,
          fecha: hoy(), hora: hora(), lideradoPor: usuario.nombre, supervisor: ''
        },
        permisos: { caliente: true },
        permisoOtro: '',
        pasos: [{ paso: '', evento: '', critico: '', medidas: '', responsable: '' }],
        epp: { basico: true },
        otrosEpp: '', herramientas: '', comentarios: '',
        personal: [],
        supervisorFirma: firmante(),
        bitacora: [{ estado: 'BORRADOR', fechaHora: new Date().toISOString(), usuario: usuario.nombre, comentario: 'Creado' }],
        envios: []
      };
    },

    nuevoPETAR: function (numero, usuario, ats) {
      var epp = {};
      C.petar.epp.forEach(function (g) { g.items.forEach(function (it) { if (it.sugerido) epp[it.id] = true; }); });
      var p = {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        tipo: 'PETAR', numero: numero, estado: 'BORRADOR',
        creadoEn: new Date().toISOString(), actualizadoEn: '',
        usuario: { nombre: usuario.nombre, cargo: usuario.cargo },
        descripcion: {
          fecha: hoy(), horaInicio: hora(), horaFin: '',
          atsRef: '', atsId: '', sede: C.sede,
          ejecutaTipo: 'Grupo Pana', ejecutaNombre: C.areaPorDefecto,
          tarea: '', lugar: '', capacitacion: ''
        },
        tipos: { caliente: true },
        epp: epp, eppOtros: '',
        requisitos: {},
        caliente: {}, vigia: firmante(),
        adicionales: {},
        emergencia: {
          encargadoSede: '', supervisorPrevencionista: '',
          emergencias: {}, emergenciaOtro: '',
          equipos: {}, equipoOtro: '',
          rutasLibres: '', rutasIndicadas: '', telefono: '', contacto: ''
        },
        observaciones: '',
        participantes: [],
        supervisorTrabajo: firmante(),
        autorizacion: { supervisor: firmante(), area: firmante(), ejecutante: firmante() },
        verificaciones: [],
        cierre: { supervisor: firmante(), area: firmante(), ejecutante: firmante() },
        cancelacion: null,
        bitacora: [{ estado: 'BORRADOR', fechaHora: new Date().toISOString(), usuario: usuario.nombre, comentario: 'Creado' }],
        envios: []
      };
      if (ats) Modelo.vincularATS(p, ats);
      return p;
    },

    /* Copia al PETAR lo que ya se registró en el ATS (sin firmas) */
    vincularATS: function (p, ats) {
      p.descripcion.atsRef = ats.numero;
      p.descripcion.atsId = ats.id;
      p.descripcion.fecha = ats.generales.fecha;
      if (!p.descripcion.tarea) p.descripcion.tarea = ats.generales.tarea;
      if (!p.descripcion.lugar) p.descripcion.lugar = ats.generales.ubicacion;
      if (ats.generales.areaContratista) p.descripcion.ejecutaNombre = ats.generales.areaContratista;
      if (!p.participantes.length) {
        p.participantes = (ats.personal || []).map(function (x) { return firmante({ nombre: x.nombre, dni: x.dni }); });
      }
      if (!p.supervisorTrabajo.nombre && ats.generales.supervisor) p.supervisorTrabajo.nombre = ats.generales.supervisor;
    },

    /* ------------------------- Estados --------------------------- */
    cambiarEstado: function (d, estado, usuario, comentario) {
      d.estado = estado;
      d.bitacora.push({ estado: estado, fechaHora: new Date().toISOString(), usuario: usuario || '', comentario: comentario || '' });
    },

    finVigencia: function (p) { return p.tipo === 'PETAR' ? aFecha(p.descripcion.fecha, p.descripcion.horaFin) : null; },

    estadoVisible: function (d) {
      if (d.tipo === 'PETAR' && d.estado === 'AUTORIZADO') {
        var fin = Modelo.finVigencia(d);
        if (fin && new Date() > fin) return 'VENCIDO';
      }
      return d.estado;
    },

    editable: function (d) { return d.estado === 'BORRADOR'; },

    /* ¿Hay alguna firma registrada? (editar el contenido las invalida) */
    tieneFirmas: function (d) {
      if (d.tipo === 'ATS') return d.personal.some(function (x) { return x.firma; }) || !!d.supervisorFirma.firma;
      var a = d.autorizacion;
      return d.participantes.some(function (x) { return x.firma; }) || !!d.supervisorTrabajo.firma ||
        !!(a.supervisor.firma || a.area.firma || a.ejecutante.firma || d.vigia.firma);
    },

    limpiarFirmas: function (d) {
      function l(f) { f.firma = ''; f.fechaHora = ''; }
      if (d.tipo === 'ATS') { d.personal.forEach(l); l(d.supervisorFirma); return; }
      d.participantes.forEach(l); l(d.supervisorTrabajo); l(d.vigia);
      ['supervisor', 'area', 'ejecutante'].forEach(function (k) { l(d.autorizacion[k]); });
    },

    /* ------------------------ Pasos del formulario ------------------ */
    pasos: function (d) {
      if (d.tipo === 'ATS') return [
        { id: 'generales', titulo: 'Datos de la tarea' },
        { id: 'pasos', titulo: 'Pasos, riesgos y controles' },
        { id: 'epp', titulo: 'EPP, herramientas y comentarios' }
      ];
      var l = [
        { id: 'descripcion', titulo: 'I. Descripción del trabajo' },
        { id: 'epp', titulo: 'III. Equipos de protección personal' },
        { id: 'requisitos', titulo: 'IV. Requisitos de seguridad' }
      ];
      if (d.tipos.caliente) l.push({ id: 'caliente', titulo: 'V. Trabajo en caliente' });
      l.push({ id: 'emergencia', titulo: 'VI. Respuesta ante emergencias' });
      return l;
    },

    /* ----------------------- Validación ------------------------- */
    validarPaso: function (d, id) {
      var e = [];
      function req(v, m) { if (!v || !String(v).trim()) e.push(m); }

      if (d.tipo === 'ATS') {
        var g = d.generales;
        if (id === 'generales') {
          req(g.tarea, 'Indica la tarea.');
          req(g.ubicacion, 'Indica la ubicación.');
          req(g.areaContratista, 'Indica el área de Grupo Pana o la contratista.');
          req(g.fecha, 'Indica la fecha.'); req(g.hora, 'Indica la hora.');
          req(g.lideradoPor, 'Indica quién lidera el ATS.');
          req(g.supervisor, 'Indica el supervisor de trabajo.');
          if (d.permisos.otro) req(d.permisoOtro, 'Especifica el otro permiso de trabajo.');
        }
        if (id === 'pasos') {
          if (!d.pasos.length) e.push('Registra al menos un paso de la tarea.');
          d.pasos.forEach(function (p, i) {
            var n = 'Paso ' + (i + 1) + ': ';
            req(p.paso, n + 'describe qué se va a hacer.');
            req(p.evento, n + 'indica el evento indeseado.');
            if (!p.critico) e.push(n + 'marca si es crítico.');
            req(p.medidas, n + 'indica las medidas de control.');
            req(p.responsable, n + 'indica el responsable de implementar los controles.');
          });
        }
        return e;
      }

      /* PETAR */
      var s = d.descripcion;
      if (id === 'descripcion') {
        req(s.fecha, 'Indica la fecha.');
        req(s.horaInicio, 'Indica la hora inicial.');
        req(s.horaFin, 'Indica la hora final: el permiso es válido solo para el día y horario indicados.');
        var ini = aFecha(s.fecha, s.horaInicio), fin = aFecha(s.fecha, s.horaFin);
        if (ini && fin && fin <= ini) e.push('La hora final debe ser posterior a la hora inicial.');
        req(s.atsRef, 'Indica el ATS de referencia.');
        req(s.ejecutaNombre, 'Indica el área de Grupo Pana o la contratista que ejecuta.');
        req(s.tarea, 'Describe la tarea.');
        req(s.lugar, 'Indica el lugar específico de la tarea.');
        if (!Object.keys(d.tipos).some(function (k) { return d.tipos[k]; })) e.push('Marca al menos un tipo de trabajo.');
        if (!s.capacitacion) e.push('Indica si se llevó a cabo la capacitación previa de los trabajadores.');
      }
      if (id === 'epp') {
        if (!Object.keys(d.epp).some(function (k) { return d.epp[k]; })) e.push('Marca el EPP requerido.');
      }
      if (id === 'requisitos') {
        C.petar.requisitos.forEach(function (r, i) { if (!d.requisitos[r.id]) e.push('Requisito ' + (i + 1) + ' sin responder.'); });
      }
      if (id === 'caliente') {
        C.petar.caliente.forEach(function (r, i) { if (!d.caliente[r.id]) e.push('Trabajo en caliente, pregunta ' + (i + 1) + ' sin responder.'); });
        C.petar.adicionales.forEach(function (r) { if (!d.adicionales[r.id]) e.push('Control adicional sin responder: ' + r.label + '.'); });
        req(d.vigia.nombre, 'Indica el nombre del vigía.');
      }
      if (id === 'emergencia') {
        var m = d.emergencia;
        req(m.encargadoSede, 'Indica el encargado de la sede.');
        req(m.supervisorPrevencionista, 'Indica el supervisor o prevencionista.');
        if (!m.rutasLibres) e.push('Indica si las rutas de acceso y salida están libres de obstáculos.');
        if (!m.rutasIndicadas) e.push('Indica si se informó a los trabajadores las rutas de evacuación y puntos de reunión.');
        req(m.telefono, 'Indica el teléfono de contacto para emergencias.');
        req(m.contacto, 'Indica la persona de contacto para emergencias.');
      }
      return e;
    },

    validarTodo: function (d) {
      var t = [];
      Modelo.pasos(d).forEach(function (p, i) {
        Modelo.validarPaso(d, p.id).forEach(function (m) { t.push({ paso: i, titulo: p.titulo, mensaje: m }); });
      });
      return t;
    },

    /* Controles críticos incumplidos (impiden autorizar el PETAR) */
    bloqueos: function (d) {
      var b = [];
      if (d.tipo !== 'PETAR') return b;
      if (d.descripcion.capacitacion === 'no') b.push('No se llevó a cabo la capacitación previa de los trabajadores.');
      C.petar.requisitos.forEach(function (r) { if (d.requisitos[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.tipos.caliente) C.petar.caliente.forEach(function (r) { if (d.caliente[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.emergencia.rutasLibres === 'no') b.push('Las rutas de acceso y salida no están libres de obstáculos.');
      if (d.emergencia.rutasIndicadas === 'no') b.push('No se indicó a los trabajadores las rutas de evacuación y puntos de reunión.');
      var fin = Modelo.finVigencia(d);
      if (fin && new Date() > fin) b.push('La hora final ya pasó: el permiso nacería vencido.');
      return b;
    },

    /* Observaciones: controles "requerido" respondidos con No */
    observados: function (d) {
      if (d.tipo !== 'PETAR' || !d.tipos.caliente) return [];
      return C.petar.adicionales.filter(function (r) { return d.adicionales[r.id] === 'no'; }).map(function (r) { return r.label; });
    },

    semaforo: function (d) {
      if (d.tipo === 'ATS') return Modelo.validarTodo(d).length ? 'pendiente' : 'conforme';
      if (Modelo.bloqueos(d).length) return 'no_conforme';
      if (Modelo.validarTodo(d).length) return 'pendiente';
      if (Modelo.observados(d).length) return 'observado';
      return 'conforme';
    },

    /* Firmas necesarias antes de registrar (ATS) o autorizar (PETAR) */
    validarFirmas: function (d) {
      var e = [];
      function f(x, n) {
        if (!x.nombre || !x.nombre.trim()) e.push('Falta el nombre: ' + n + '.');
        if (!x.firma) e.push('Falta la firma: ' + n + '.');
      }
      if (d.tipo === 'ATS') {
        if (!d.personal.length) e.push('Registra al menos a una persona que realiza la tarea.');
        d.personal.forEach(function (x, i) { if (!x.firma) e.push('Falta la firma de ' + (x.nombre || 'la persona ' + (i + 1)) + '.'); });
        f(d.supervisorFirma, 'supervisor de trabajo');
        return e;
      }
      if (!d.participantes.length) e.push('Registra al menos a un colaborador participante.');
      d.participantes.forEach(function (x, i) {
        var n = x.nombre || 'colaborador ' + (i + 1);
        if (!dniValido(x.dni)) e.push('DNI inválido o vacío de ' + n + ' (8 dígitos).');
        if (!x.firma) e.push('Falta la firma de ' + n + '.');
      });
      f(d.supervisorTrabajo, 'supervisor de trabajo (sección VII)');
      if (!dniValido(d.supervisorTrabajo.dni)) e.push('DNI inválido o vacío del supervisor de trabajo.');
      if (d.tipos.caliente) f(d.vigia, 'vigía');
      C.petar.firmasAutorizacion.forEach(function (a) { f(d.autorizacion[a.clave], a.cargo.toLowerCase()); });
      return e;
    },

    validarCierre: function (d) {
      var e = [];
      C.petar.firmasAutorizacion.forEach(function (a) {
        var x = d.cierre[a.clave];
        if (!x.nombre || !x.nombre.trim()) e.push('Falta el nombre: ' + a.cargo + '.');
        if (!x.firma) e.push('Falta la firma: ' + a.cargo + '.');
      });
      return e;
    },

    /* --------------------------- Textos ------------------------- */
    titulo: function (d) {
      return d.tipo === 'ATS' ? (d.generales.tarea || 'ATS sin tarea') : (d.descripcion.tarea || 'PETAR sin descripción');
    },
    fecha: function (d) { return d.tipo === 'ATS' ? d.generales.fecha : d.descripcion.fecha; },
    lugar: function (d) { return d.tipo === 'ATS' ? d.generales.ubicacion : d.descripcion.lugar; },
    etiquetaEstado: function (e) { return (C.estados[e] || { etiqueta: e }).etiqueta; },
    tiposTexto: function (p) {
      return C.petar.tipos.filter(function (t) { return p.tipos[t.id]; }).map(function (t) { return t.label; }).join(', ');
    },

    asuntoCorreo: function (d, momento) {
      var m = { atsRegistrado: 'ATS registrado', petarAutorizado: 'PETAR autorizado', petarCerrado: 'PETAR cerrado', petarCancelado: 'PETAR cancelado', reenvio: 'Reenvío' }[momento] || momento;
      return '[SST ' + C.sede + '] ' + m + ' — ' + d.numero + ' — ' + Modelo.titulo(d).slice(0, 70);
    },

    correoHTML: function (d, momento) {
      function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      function f(k, v) { return '<tr><td style="padding:4px 10px;color:#555;border-bottom:1px solid #eee">' + e(k) + '</td><td style="padding:4px 10px;border-bottom:1px solid #eee"><b>' + e(v || '—') + '</b></td></tr>'; }
      var filas = '';
      if (d.tipo === 'ATS') {
        var g = d.generales;
        filas = f('Tarea', g.tarea) + f('Ubicación', g.ubicacion) + f('Área / contratista', g.areaContratista) +
          f('Fecha y hora', g.fecha + ' ' + g.hora) + f('Liderado por', g.lideradoPor) + f('Supervisor', g.supervisor) +
          f('Personal', d.personal.map(function (x) { return x.nombre; }).join(', ')) +
          f('Pasos críticos', d.pasos.filter(function (p) { return p.critico === 'si'; }).length + ' de ' + d.pasos.length);
      } else {
        var s = d.descripcion;
        filas = f('Tarea', s.tarea) + f('Lugar', s.lugar) + f('Tipo de trabajo', Modelo.tiposTexto(d)) +
          f('Fecha / horario', s.fecha + ' · ' + s.horaInicio + ' a ' + s.horaFin) + f('ATS de referencia', s.atsRef) +
          f('Ejecuta', s.ejecutaTipo + ' — ' + s.ejecutaNombre) +
          f('Participantes', d.participantes.map(function (x) { return x.nombre; }).join(', ')) +
          f('Supervisor del trabajo', d.autorizacion.supervisor.nombre) + f('Responsable del área', d.autorizacion.area.nombre) +
          f('Estado', Modelo.etiquetaEstado(Modelo.estadoVisible(d)));
        if (d.cancelacion) filas += f('Motivo de cancelación', d.cancelacion.motivo);
        var obs = Modelo.observados(d);
        if (obs.length) filas += f('Observaciones', obs.join(' | '));
      }
      return '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#111">' +
        '<p>Se registró el siguiente documento en <b>' + e(C.sistema) + '</b> — sede ' + e(C.sede) + '.</p>' +
        '<table style="border-collapse:collapse">' + f('Documento', d.tipo + ' ' + d.numero) + filas + '</table>' +
        '<p style="color:#555">El PDF se adjunta y queda archivado en la carpeta de SST. Registrado por ' + e(d.usuario.nombre) + '.</p>' +
        '<p style="color:#999;font-size:12px">Mensaje generado automáticamente (' + e(momento) + ').</p></div>';
    }
  };

  window.Modelo = Modelo;
})();
