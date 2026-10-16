/* =====================================================================
   MODELO — window.Modelo · v10
   Estructura, validación y estados del ATS y del PETAR.
   Lógica pura: no toca la interfaz ni el almacenamiento.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.SST_CONFIG;
  function CAT() { return window.SST_CATALOGO || { tareas: [], puestos: [], ubicacionesPorSede: {} }; }
  function tareaCat(codigo) { return CAT().tareas.find(function (t) { return t.codigo === codigo; }) || null; }
  function norm(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' '); }

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
  function sedeDe(d) {
    if (!d) return '';
    if (d.tipo === 'ATS') return d.generales && d.generales.sede ? d.generales.sede : 'Ate';
    if (d.tipo === 'PETAR') return d.descripcion && d.descripcion.sede ? d.descripcion.sede : 'Ate';
    return '';
  }

  var Modelo = {
    hoy: hoy, hora: hora, aFecha: aFecha, dniValido: dniValido, firmante: firmante, sede: sedeDe,

    /* ------------------------------------------------------------ */
    nuevoATS: function (numero, usuario) {
      return {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        tipo: 'ATS', catalogoEppVersion: 2, prueba: !!C.modoPrueba, numero: numero, estado: 'BORRADOR',
        creadoEn: new Date().toISOString(), actualizadoEn: '',
        usuario: { nombre: usuario.nombre, cargo: usuario.cargo },
        generales: {
          tarea: '', ubicacion: '', areaContratista: C.areaPorDefecto, sede: C.sede,
          fecha: hoy(), hora: hora(), lideradoPor: usuario.nombre, supervisor: ''
        },
        permisos: {},
        permisoOtro: '',
        pasos: window.SST_CATALOGO ? [] : [{ paso: '', evento: '', critico: '', medidas: '', responsable: '' }],
        /* v08: tareas del catálogo B&P que precargan el ATS */
        catalogo: window.SST_CATALOGO ? CAT().version : '',
        tareasCatalogo: [], tareaLibre: false, alturaDesde18: '', auto: {}, permisosAuto: {},
        epp: {},
        otrosEpp: '', herramientas: '', comentarios: '',
        personal: [],
        supervisorFirma: firmante(),
        bitacora: [{ estado: 'BORRADOR', fechaHora: new Date().toISOString(), usuario: usuario.nombre, comentario: 'Creado' }],
        envios: []
      };
    },

    nuevoPETAR: function (numero, usuario, ats) {
      var epp = {}, tipos = {};
      C.petar.tipos.forEach(function (t) { tipos[t.id] = false; });
      /* Sin selección básica obligatoria; se conserva la sugerencia existente para altura. */
      if (ats && ats.permisos) {
        if (ats.permisos.caliente) tipos.caliente = true;
        if (ats.permisos.altura) tipos.altura = true;
      }
      Object.keys(tipos).forEach(function (tipo) {
        if (!tipos[tipo]) return;
        (C.petar.eppPorTipo[tipo] || []).forEach(function (k) { epp[k] = true; });
      });
      var p = {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        tipo: 'PETAR', catalogoEppVersion: 2, prueba: !!C.modoPrueba, numero: numero, estado: 'BORRADOR',
        creadoEn: new Date().toISOString(), actualizadoEn: '',
        usuario: { nombre: usuario.nombre, cargo: usuario.cargo },
        descripcion: {
          fecha: hoy(), horaInicio: hora(), horaFin: '',
          atsRef: '', atsId: '', sede: C.sede,
          ejecutaTipo: 'Grupo Pana', ejecutaNombre: C.areaPorDefecto,
          tarea: '', lugar: '', capacitacion: ''
        },
        tipos: tipos,
        epp: epp, eppOtros: '',
        requisitos: {},
        caliente: {}, vigia: firmante(), /* legado v06 */
        vigias: { caliente: firmante(), altura: firmante() },
        adicionales: {},
        altura: {}, escaleras: { usa: '' }, peligrosos: {},
        quimicos: { productos: '', inflamable: '', lel: '' },
        evidencias: {},
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

    esCarroceria: function (d) { return !!d && d.tipo === 'PETAR' && ['carroceria-v1', 'bp-v1', 'bp-v2'].indexOf(d.perfilPetar) >= 0; },
    esBP: function (d) { return !!d && d.tipo === 'PETAR' && (d.perfilPetar === 'bp-v1' || d.perfilPetar === 'bp-v2'); },
    configPetar: function (d) {
      if (d && d.perfilPetar === 'bp-v2') return C.petarBP2;
      return Modelo.esBP(d) ? C.petarBP : Modelo.esCarroceria(d) ? C.petarCarroceria : C.petar;
    },
    /* v09: opciones del perfil (sinVigias, sinMonitoreo, sinFotos, soloAutorizacion). */
    opcion: function (d, k) { return !!(d && d.tipo === 'PETAR' && Modelo.configPetar(d)[k]); },

    /* ------------------- v08: catálogo de tareas B&P ------------------- */
    catalogo: CAT,
    tareaCatalogo: tareaCat,
    usaCatalogo: function (d) { return !!(d && d.tipo === 'ATS' && d.catalogo); },
    tareasDePuesto: function (puesto) { return CAT().tareas.filter(function (t) { return !puesto || t.puestos.indexOf(puesto) >= 0; }); },
    ubicacionesSede: function (codigo) { return (CAT().ubicacionesPorSede || {})[codigo] || []; },

    /* Permisos que exigen las tareas: caliente y materiales peligrosos siempre;
       altura solo si el trabajo es desde 1,80 m (criterio provisional). */
    permisosRequeridos: function (d) {
      var r = {};
      (d.tareasCatalogo || []).forEach(function (c) {
        var t = tareaCat(c); if (!t) return;
        Object.keys(t.permisos || {}).forEach(function (k) {
          if (t.permisos[k] === 'desde18') { if (d.alturaDesde18 === 'si') r[k] = true; }
          else if (t.permisos[k]) r[k] = true;
        });
      });
      return r;
    },
    requiereAltura18: function (d) {
      return (d.tareasCatalogo || []).some(function (c) { var t = tareaCat(c); return t && t.permisos && t.permisos.altura === 'desde18'; });
    },

    /* Reconstruye pasos, permisos, EPP, herramientas y tarea a partir de las tareas elegidas.
       Conserva los pasos editados de tareas que siguen elegidas y los pasos agregados a mano;
       los textos generales solo se reemplazan si no fueron editados. */
    aplicarTareas: function (d) {
      if (!Modelo.usaCatalogo(d)) return d;
      d.auto = d.auto || {}; d.permisosAuto = d.permisosAuto || {};
      var elegidas = CAT().tareas.filter(function (t) { return d.tareasCatalogo.indexOf(t.codigo) >= 0; });
      var resp = d.generales.lideradoPor || 'Ejecutante';
      var pasos = [];
      elegidas.forEach(function (t) {
        var previos = d.pasos.filter(function (p) { return p.origen === t.codigo; });
        if (previos.length) pasos = pasos.concat(previos);
        else t.pasos.forEach(function (x) { pasos.push({ paso: x.paso, evento: x.evento, critico: x.critico, medidas: x.medidas, responsable: resp, origen: t.codigo }); });
      });
      d.pasos = pasos.concat(d.pasos.filter(function (p) { return !p.origen; }));
      if (!Modelo.requiereAltura18(d)) d.alturaDesde18 = '';
      var req = Modelo.permisosRequeridos(d);
      Object.keys(d.permisosAuto).forEach(function (k) { if (d.permisosAuto[k] && !req[k]) d.permisos[k] = false; });
      Object.keys(req).forEach(function (k) { d.permisos[k] = true; });
      d.permisosAuto = req;
      elegidas.forEach(function (t) { (t.eppIds || []).forEach(function (k) { d.epp[k] = true; }); });
      function unir(lista) {
        var vistos = [], out = [];
        lista.forEach(function (txt) { String(txt || '').split(',').forEach(function (x) { x = x.trim(); if (x && x !== '—' && vistos.indexOf(norm(x)) < 0) { vistos.push(norm(x)); out.push(x); } }); });
        return out.join(', ');
      }
      function auto(campo, valor, obj, clave) {
        if (!obj[clave] || obj[clave] === d.auto[campo]) obj[clave] = valor;
        d.auto[campo] = valor;
      }
      auto('tarea', elegidas.map(function (t) { return t.nombre; }).join('; '), d.generales, 'tarea');
      auto('otrosEpp', unir(elegidas.map(function (t) { return t.epp; })), d, 'otrosEpp');
      auto('herramientas', unir(elegidas.map(function (t) { return t.herramientas; })), d, 'herramientas');
      return d;
    },

    aplicarUbicacion: function (d, valor) {
      var u = Modelo.ubicacionesSede(C.sedeCodigo).find(function (x) { return x.nombre === valor; });
      d.generales.ubicacionSel = valor;
      if (u) { d.generales.ubicacion = u.nombre; d.generales.ubicacionTipo = u.tipo; }
      else { if (d.generales.ubicacionTipo) d.generales.ubicacion = ''; d.generales.ubicacionTipo = valor ? 'otro' : ''; }
    },

    atsRequierePetar: function (ats) {
      return !!(ats && ats.tipo === 'ATS' && ats.permisos && (ats.permisos.caliente || ats.permisos.altura || ats.permisos.peligrosos));
    },
    permisosSinFormato: function (ats) {
      return ['confinado', 'electrico', 'excavacion', 'otro'].filter(function (k) { return ats && ats.permisos && ats.permisos[k]; });
    },

    /* Un PETAR por ATS con las secciones que exigen sus tareas. */
    nuevoPETARBP: function (numero, usuario, ats) {
      if (!Modelo.atsRequierePetar(ats)) throw new Error('El ATS no indica trabajos que requieran PETAR (caliente, altura o materiales peligrosos).');
      var p = Modelo.nuevoPETAR(numero, usuario, ats);
      p.perfilPetar = 'bp-v2';
      p.tipos = { caliente: !!ats.permisos.caliente, altura: !!ats.permisos.altura, peligrosos: !!ats.permisos.peligrosos };
      /* v09: EPP solo del catálogo por tipo de trabajo (no se arrastran los EPP del ATS). */
      p.epp = {}; p.eppPendienteDetalle = {}; p.eppOtros = '';
      var cfgBP = Modelo.configPetar(p);
      Object.keys(p.tipos).forEach(function (t) { if (p.tipos[t]) (cfgBP.eppPorTipo[t] || []).forEach(function (k) { p.epp[k] = true; }); });
      var fin = C.petar.horaFinTurno || '';
      p.descripcion.horaFin = fin && hora() < fin ? fin : '';
      p.descripcion.lugarTipo = ats.generales.ubicacionTipo || '';
      p.descripcion.atsPersonal = (ats.personal || []).map(function (x) { return { nombre: x.nombre, dni: x.dni || '' }; });
      /* v10: firmas registradas en el ATS, para reutilizarlas solo con confirmación expresa. */
      p.firmasATS = (ats.personal || []).filter(function (x) { return x.firma; }).map(function (x) { return { nombre: x.nombre, dni: x.dni || '', firma: x.firma, rol: 'personal' }; });
      if (ats.supervisorFirma && ats.supervisorFirma.firma) p.firmasATS.push({ nombre: ats.supervisorFirma.nombre || ats.generales.supervisor || '', dni: ats.supervisorFirma.dni || '', firma: ats.supervisorFirma.firma, rol: 'supervisor' });
      p.autoRespuestas = {};
      /* Todos los del ATS firmaron al registrarlo: se precarga y se controla al firmar el PETAR. */
      if ((ats.personal || []).length && ats.personal.every(function (x) { return x.firma; })) {
        p.requisitos.r_ats = 'si';
        p.autoRespuestas['requisitos.r_ats'] = 'Precargado: todas las personas del ' + ats.numero + ' firmaron el ATS. Si se suma alguien que no lo firmó, el permiso no se podrá autorizar.';
      }
      if (p.tipos.caliente && p.descripcion.lugarTipo === 'abierta' && cfgBP.caliente.some(function (x) { return x.id === 'c_lel'; })) {
        p.caliente.c_lel = 'na';
        p.autoRespuestas['caliente.c_lel'] = 'Marcado "No aplica": ' + (ats.generales.ubicacion || 'la ubicación') + ' es una bahía abierta, no un espacio cerrado. Cámbialo si las condiciones son otras.';
      }
      if (!p.autorizacion.ejecutante.nombre) p.autorizacion.ejecutante.nombre = usuario.nombre;
      return p;
    },

    /* v10: firma del ATS disponible para una firma de autorización (por nombre de quien firma). */
    firmaATSPara: function (d, clave) {
      if (!d || d.tipo !== 'PETAR' || (Modelo.configPetar(d).firmaDesdeATS || []).indexOf(clave) < 0) return null;
      var nom = norm(d.autorizacion[clave] && d.autorizacion[clave].nombre);
      if (!nom) return null;
      return (d.firmasATS || []).find(function (x) { return norm(x.nombre) === nom; }) || null;
    },
    usarFirmaATS: function (d, clave) {
      var f = Modelo.firmaATSPara(d, clave);
      if (!f || !Modelo.editable(d)) return false;
      var o = d.autorizacion[clave];
      o.firma = f.firma; o.fechaHora = new Date().toISOString();
      o.origenFirma = { ats: d.descripcion.atsRef, nombre: f.nombre, confirmada: o.fechaHora };
      return true;
    },

    /* Emergencias del formato vigente más las que un documento anterior ya respondió (p. ej. Tsunami). */
    emergenciasDe: function (d) {
      var l = Modelo.configPetar(d).emergencias.slice();
      Object.keys((d.emergencia && d.emergencia.emergencias) || {}).forEach(function (k) { if (l.indexOf(k) < 0 && d.emergencia.emergencias[k]) l.push(k); });
      return l;
    },
    atsCompatibleCarroceria: function (ats) {
      return !!(ats && ats.permisos && ats.permisos.caliente &&
        !Object.keys(ats.permisos).some(function (k) { return k !== 'caliente' && ats.permisos[k]; }));
    },
    nuevoPETARCarroceria: function (numero, usuario, ats) {
      if (!Modelo.atsCompatibleCarroceria(ats)) throw new Error('Se requiere un ATS de trabajo en caliente. Los permisos adicionales se gestionan por separado.');
      var p = Modelo.nuevoPETAR(numero, usuario, ats);
      p.perfilPetar = 'carroceria-v1';
      p.tipos = { caliente: true };
      p.descripcion.ejecutaNombre = 'Carrocería / planchado';
      return p;
    },

    /* Copia al PETAR lo que ya se registró en el ATS (sin firmas) */
    vincularATS: function (p, ats) {
      p.descripcion.atsRef = ats.numero;
      p.descripcion.atsId = ats.id;
      p.descripcion.sede = sedeDe(ats);
      p.descripcion.fecha = ats.generales.fecha;
      if (!p.descripcion.tarea) p.descripcion.tarea = ats.generales.tarea;
      if (!p.descripcion.lugar) p.descripcion.lugar = ats.generales.ubicacion;
      if (ats.generales.areaContratista) p.descripcion.ejecutaNombre = ats.generales.areaContratista;
      if (!p.participantes.length) {
        p.participantes = (ats.personal || []).map(function (x) { return firmante({ nombre: x.nombre, dni: x.dni }); });
      }
      if (!p.supervisorTrabajo.nombre && ats.generales.supervisor) p.supervisorTrabajo.nombre = ats.generales.supervisor;
      if (!p.autorizacion.supervisor.nombre) p.autorizacion.supervisor.nombre = ats.generales.supervisor || '';
      ['gorro_antigolpe', 'resp_mediacara_filtro'].forEach(function (k) {
        if (ats.epp && ats.epp[k]) p.epp[k] = true;
      });
      p.eppOtros = ats.otrosEpp || '';
      p.eppPendienteDetalle = {
        guantes: !!(ats.epp && ats.epp.guantes), auditiva: !!(ats.epp && ats.epp.auditiva)
      };
    },

    /* Los documentos antiguos conservan los nombres de los EPP con que se firmaron. */
    catalogoEpp: function (d, formulario) {
      var cfg = d.tipo === 'ATS' ? C.ats : Modelo.configPetar(d);
      if (d.catalogoEppVersion !== 2 && !formulario) return cfg.eppLegado;
      var lista = cfg.epp.slice();
      if (d.tipo === 'ATS') {
        var ids = lista.map(function (x) { return x.id; });
        return lista.concat(cfg.eppLegado.filter(function (x) { return ids.indexOf(x.id) < 0 && d.epp[x.id]; }));
      }
      var actuales = [];
      lista.forEach(function (g) { g.items.forEach(function (it) { actuales.push(it.id); }); });
      var antiguos = [];
      cfg.eppLegado.forEach(function (g) {
        g.items.forEach(function (it) { if (actuales.indexOf(it.id) < 0 && d.epp[it.id]) antiguos.push(it); });
      });
      if (antiguos.length) lista.push({ grupo: 'EPP conservados del documento anterior — revisar', items: antiguos });
      return lista;
    },

    prepararCatalogoEpp: function (d) {
      if (d.estado !== 'BORRADOR' || Modelo.tieneFirmas(d)) return;
      d.catalogoEppVersion = 2;
    },

    sugerirEpp: function (d, perfil) {
      if (!d || d.tipo !== 'PETAR' || !Modelo.editable(d) || Modelo.tieneFirmas(d)) return;
      var sugerencia = Modelo.configPetar(d).sugerenciasEpp[perfil];
      if (!sugerencia) return;
      sugerencia.ids.forEach(function (id) { d.epp[id] = true; });
      // Solo sugiere equipos; nunca responde requisitos ni copia firmas.
    },

    aplicarContactos: function (d, contactos) {
      if (!d || d.estado !== 'BORRADOR' || Modelo.tieneFirmas(d)) return;
      var c = contactos || {};
      if (d.tipo === 'ATS') {
        if (!d.generales.supervisor) d.generales.supervisor = c.supervisorTrabajo || '';
        return;
      }
      if (!d.supervisorTrabajo.nombre) d.supervisorTrabajo.nombre = c.supervisorTrabajo || '';
      if (!d.autorizacion.supervisor.nombre) d.autorizacion.supervisor.nombre = d.supervisorTrabajo.nombre;
      if (!d.autorizacion.area.nombre) d.autorizacion.area.nombre = c.responsableArea || '';
      ['encargadoSede', 'supervisorPrevencionista', 'telefono', 'contacto'].forEach(function (k) {
        if (!d.emergencia[k]) d.emergencia[k] = c[k] || '';
      });
    },

    /* ------------------------- Estados --------------------------- */
    cambiarEstado: function (d, estado, usuario, comentario) {
      var permitidos = d.tipo === 'ATS' ? { BORRADOR: ['REGISTRADO'] } : { BORRADOR: ['AUTORIZADO'], AUTORIZADO: ['CERRADO', 'CANCELADO'] };
      if ((permitidos[d.estado] || []).indexOf(estado) < 0) throw new Error('Cambio de estado no permitido: ' + d.estado + ' → ' + estado);
      d.estado = estado;
      d.bitacora.push({ estado: estado, fechaHora: new Date().toISOString(), usuario: usuario || '', comentario: comentario || '' });
    },

    finVigencia: function (p) { return p.tipo === 'PETAR' ? aFecha(p.descripcion.fecha, p.descripcion.horaFin) : null; },

    estadoVisible: function (d) {
      if (d.tipo === 'PETAR' && d.estado === 'AUTORIZADO') {
        var fin = Modelo.finVigencia(d);
        if (fin && new Date() >= fin) return 'VENCIDO';
        var inicio = aFecha(d.descripcion.fecha, d.descripcion.horaInicio);
        if (inicio && new Date() < inicio) return 'PROGRAMADO';
      }
      return d.estado;
    },

    editable: function (d) { return d.estado === 'BORRADOR'; },

    /* ¿Hay alguna firma registrada? (editar el contenido las invalida) */
    tieneFirmas: function (d) {
      if (d.tipo === 'ATS') return d.personal.some(function (x) { return x.firma; }) || !!d.supervisorFirma.firma;
      var a = d.autorizacion;
      return d.participantes.some(function (x) { return x.firma; }) || !!d.supervisorTrabajo.firma ||
        !!(a.supervisor.firma || a.area.firma || a.ejecutante.firma || (d.vigias && d.vigias.caliente && d.vigias.caliente.firma) || (d.vigias && d.vigias.altura && d.vigias.altura.firma) || (d.vigia && d.vigia.firma));
    },

    limpiarFirmas: function (d) {
      function l(f) { f.firma = ''; f.fechaHora = ''; delete f.origenFirma; }
      if (d.tipo === 'ATS') { d.personal.forEach(l); l(d.supervisorFirma); return; }
      Modelo.normalizar(d); d.participantes.forEach(l); l(d.supervisorTrabajo); l(d.vigias.caliente); l(d.vigias.altura); if (d.vigia) l(d.vigia);
      ['supervisor', 'area', 'ejecutante'].forEach(function (k) { l(d.autorizacion[k]); });
    },

    /* Completa campos nuevos y migra documentos creados antes del modo multisede.
       Los documentos sin sede pertenecen a Ate porque las versiones anteriores eran exclusivas de esa sede. */
    normalizar: function (d) {
      if (!d) return d;
      if (d.tipo === 'ATS') {
        d.generales = d.generales || {};
        if (!d.generales.sede) d.generales.sede = 'Ate';
        return d;
      }
      if (d.tipo !== 'PETAR') return d;
      d.descripcion = d.descripcion || {};
      if (!d.descripcion.sede) d.descripcion.sede = 'Ate';
      d.altura = d.altura || {};
      d.escaleras = d.escaleras || { usa: '' };
      d.peligrosos = d.peligrosos || {};
      d.quimicos = d.quimicos || { productos: '', inflamable: '', lel: '' };
      d.evidencias = d.evidencias || {};
      if (d.estado === 'BORRADOR' && d.descripcion) d.descripcion.ejecutaTipo = 'Grupo Pana';
      d.vigias = d.vigias || { caliente: firmante(), altura: firmante() };
      d.vigias.caliente = Object.assign(firmante(), d.vigias.caliente || {});
      d.vigias.altura = Object.assign(firmante(), d.vigias.altura || {});
      /* Migra el vigía único de v06/v07 temprana sin perder la firma. */
      if (d.vigia && (d.vigia.nombre || d.vigia.firma)) {
        if (d.tipos.caliente && !d.vigias.caliente.nombre) d.vigias.caliente = Object.assign(firmante(), d.vigia);
        if (d.tipos.altura && !d.vigias.altura.nombre) d.vigias.altura = Object.assign(firmante(), d.vigia);
      }
      return d;
    },

    /* ------------------------ Evidencias fotográficas ------------------ */
    /* Evidencias mínimas por tipo de trabajo. Las fotos son referencias a Blobs de IndexedDB. */
    evidenciasRequeridas: function (d, seccion) {
      Modelo.normalizar(d);
      var r = [];
      ['caliente', 'altura', 'peligrosos'].forEach(function (tipo) {
        if (seccion && seccion !== tipo) return;
        if (!d.tipos[tipo]) return;
        (Modelo.configPetar(d).evidenciasPorTipo[tipo] || []).forEach(function (it) {
          r.push({ ruta: tipo + '.' + it.id, texto: it.label, ayuda: it.ayuda || '', seccion: tipo, id: it.id });
        });
      });
      return r;
    },

    fotosDe: function (d, ruta) { return ((d.evidencias || {})[ruta]) || []; },

    fotosActivas: function (d) {
      var r = [];
      Modelo.evidenciasRequeridas(d).forEach(function (x) {
        Modelo.fotosDe(d, x.ruta).forEach(function (f) { r.push(Object.assign({ ruta: x.ruta, seccion: x.seccion, etiqueta: x.texto }, f)); });
      });
      return r;
    },

    totalFotos: function (d) { return Modelo.fotosActivas(d).length; },

    fotosFaltantes: function (d, seccion) {
      if (d.evidenciasNoDisponibles) return [];
      return Modelo.evidenciasRequeridas(d, seccion).filter(function (x) { return !Modelo.fotosDe(d, x.ruta).length; });
    },

    limpiarEvidenciasTipo: function (d, tipo) {
      Modelo.normalizar(d);
      var ids = [];
      Object.keys(d.evidencias).forEach(function (ruta) {
        if (ruta.indexOf(tipo + '.') !== 0) return;
        (d.evidencias[ruta] || []).forEach(function (f) { if (f.id) ids.push(f.id); });
        delete d.evidencias[ruta];
      });
      return ids;
    },

    /* Regla crítica: soldadura/corte y productos inflamables en el mismo permiso */
    calienteConInflamables: function (d) {
      Modelo.normalizar(d);
      return d.tipo === 'PETAR' && !!d.tipos.caliente && !!d.tipos.peligrosos && d.quimicos.inflamable === 'si';
    },

    /* ------------------------ Pasos del formulario ------------------ */
    pasos: function (d) {
      if (d.tipo === 'ATS') return (Modelo.usaCatalogo(d) ? [{ id: 'tareas', titulo: 'Tareas del día' }] : []).concat([
        { id: 'generales', titulo: 'Datos de la tarea' },
        { id: 'pasos', titulo: 'Pasos, riesgos y controles' },
        { id: 'epp', titulo: 'EPP, herramientas y comentarios' }
      ]);
      var l = [
        { id: 'descripcion', titulo: 'Tarea y horario' },
        { id: 'epp', titulo: 'Equipos de protección' },
        { id: 'requisitos', titulo: 'Revisión antes de empezar' }
      ];
      Modelo.normalizar(d);
      if (d.tipos.caliente) l.push({ id: 'caliente', titulo: 'Trabajo en caliente' });
      if (d.tipos.altura) l.push({ id: 'altura', titulo: 'Trabajo en altura' });
      if (d.tipos.peligrosos) l.push({ id: 'peligrosos', titulo: 'Materiales peligrosos' });
      if ((d.tipos.caliente || d.tipos.altura || d.tipos.peligrosos) && !Modelo.opcion(d, 'sinFotos')) l.push({ id: 'evidencias', titulo: 'Evidencias fotográficas' });
      l.push({ id: 'emergencia', titulo: 'Emergencias y contactos' });
      return l;
    },

    /* ----------------------- Validación ------------------------- */
    validarPaso: function (d, id) {
      var e = [];
      function req(v, m) { if (!v || !String(v).trim()) e.push(m); }

      if (d.tipo === 'ATS') {
        var g = d.generales;
        if (id === 'tareas') {
          req(g.puesto, 'Elige tu puesto.');
          if (!(d.tareasCatalogo || []).length && !d.tareaLibre) e.push('Elige al menos una tarea o marca "Otra tarea".');
          if (Modelo.requiereAltura18(d) && !d.alturaDesde18) e.push('Indica si el trabajo en zonas altas será desde 1,80 m.');
        }
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
        req(s.atsRef, 'El PETAR debe tener un ATS de referencia.');
        req(s.atsId, 'El PETAR debe estar vinculado a un ATS registrado.');
        req(s.ejecutaNombre, 'Indica el área de Grupo Pana que ejecuta.');
        req(s.tarea, 'Describe la tarea.');
        req(s.lugar, 'Indica el lugar específico de la tarea.');
        if (d.perfilPetar === 'carroceria-v1' && (!d.tipos.caliente || Object.keys(d.tipos).some(function (k) { return k !== 'caliente' && d.tipos[k]; }))) e.push('Este PETAR cubre únicamente trabajo en caliente de carrocería.');
        if (!Object.keys(d.tipos).some(function (k) { return d.tipos[k]; })) e.push('Marca al menos un tipo de trabajo.');
        if (!Modelo.esBP(d) && !s.capacitacion) e.push('Indica si se llevó a cabo la capacitación previa de los trabajadores.');
      }
      if (id === 'epp') {
        if (!Object.keys(d.epp).some(function (k) { return d.epp[k]; })) e.push('Marca el EPP requerido.');
      }
      if (id === 'requisitos') {
        Modelo.configPetar(d).requisitos.forEach(function (r, i) { if (!d.requisitos[r.id]) e.push('Requisito ' + (i + 1) + ' sin responder.'); });
      }
      if (id === 'caliente') {
        Modelo.configPetar(d).caliente.forEach(function (r, i) { if ((r.admiteNA ? ['si', 'no', 'na'] : ['si', 'no']).indexOf(d.caliente[r.id]) < 0) e.push('Trabajo en caliente, pregunta ' + (i + 1) + ' sin responder.'); });
        Modelo.configPetar(d).adicionales.forEach(function (r) { if (!d.adicionales[r.id]) e.push('Control adicional sin responder: ' + r.label + '.'); });
        if (!Modelo.opcion(d, 'sinVigias')) req(d.vigias.caliente.nombre, 'Indica el nombre del vigía de trabajo en caliente.');
      }
      if (id === 'altura') {
        Modelo.normalizar(d);
        C.petar.altura.forEach(function (r, i) { if (!d.altura[r.id]) e.push('Trabajo en altura, pregunta ' + (i + 1) + ' sin responder.'); });
        if (!d.escaleras.usa) e.push('Indica si se usará escalera.');
        if (d.escaleras.usa === 'si') C.petar.escaleras.forEach(function (r) { if (!d.escaleras[r.id]) e.push('Escalera sin responder: ' + r.label + '.'); });
        if (!Modelo.opcion(d, 'sinVigias')) req(d.vigias.altura.nombre, 'Indica el nombre del vigía de trabajo en altura.');
      }
      if (id === 'peligrosos') {
        Modelo.normalizar(d);
        req(d.quimicos.productos, 'Indica los productos químicos que se manipularán.');
        if (!d.quimicos.inflamable) e.push('Indica si algún producto es inflamable.');
        Modelo.configPetar(d).peligrosos.forEach(function (r, i) { if (!d.peligrosos[r.id]) e.push('Materiales peligrosos, pregunta ' + (i + 1) + ' sin responder.'); });
      }
      if (id === 'evidencias') {
        Modelo.fotosFaltantes(d).forEach(function (x) { e.push('Falta la evidencia: ' + x.texto + '.'); });
      }
      if (id === 'emergencia') {
        var m = d.emergencia;
        Modelo.emergenciasDe(d).forEach(function (x) { if (['si', 'na'].indexOf(m.emergencias[x]) < 0) e.push('Responde la emergencia: ' + x + '.'); });
        Modelo.configPetar(d).equiposEmergencia.forEach(function (x) { if (['si', 'na'].indexOf(m.equipos[x]) < 0) e.push('Responde el equipo de emergencia: ' + x + '.'); });
        if (Modelo.observados(d).length) req(d.observaciones, 'Describe las medidas o restricciones para los controles adicionales respondidos No.');
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
      Modelo.configPetar(d).requisitos.forEach(function (r) { if (d.requisitos[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      Modelo.normalizar(d);
      if (d.tipos.caliente) Modelo.configPetar(d).caliente.forEach(function (r) { if (d.caliente[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.tipos.caliente) Modelo.configPetar(d).adicionales.forEach(function (r) { if (d.adicionales[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.tipos.altura) C.petar.altura.forEach(function (r) { if (d.altura[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.tipos.altura && d.escaleras.usa === 'si') C.petar.escaleras.forEach(function (r) { if (d.escaleras[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (d.tipos.peligrosos) Modelo.configPetar(d).peligrosos.forEach(function (r) { if (d.peligrosos[r.id] === 'no' && r.nivel === 'critico') b.push(r.label); });
      if (Modelo.calienteConInflamables(d) && Modelo.opcion(d, 'sinMonitoreo')) {
        b.push('Trabajo en caliente y productos inflamables en el mismo permiso: no se autoriza. Separa las tareas en tiempo o lugar.');
      } else if (Modelo.calienteConInflamables(d)) {
        var lel = String(d.quimicos.lel || '').trim().replace(',', '.');
        if (lel === '' || isNaN(Number(lel)) || Number(lel) !== 0) {
          b.push('Trabajo en caliente con productos inflamables: se requiere medición de LEL igual a 0 %. Sin medición, el permiso no se autoriza. Separa las tareas en tiempo o lugar.');
        }
      }
      if (d.emergencia.rutasLibres === 'no') b.push('Las rutas de acceso y salida no están libres de obstáculos.');
      if (d.emergencia.rutasIndicadas === 'no') b.push('No se indicó a los trabajadores las rutas de evacuación y puntos de reunión.');
      var fin = Modelo.finVigencia(d);
      if (fin && new Date() > fin) b.push('La hora final ya pasó: el permiso nacería vencido.');
      return b;
    },

    /* Observaciones: controles "requerido" respondidos con No */
    observados: function (d) {
      if (d.tipo !== 'PETAR') return [];
      Modelo.normalizar(d);
      var o = [];
      if (d.tipos.caliente) o = o.concat(Modelo.configPetar(d).adicionales.filter(function (r) { return d.adicionales[r.id] === 'no'; }).map(function (r) { return r.label; }));
      if (d.tipos.altura && d.escaleras.usa === 'si') o = o.concat(C.petar.escaleras.filter(function (r) { return r.nivel !== 'critico' && d.escaleras[r.id] === 'no'; }).map(function (r) { return r.label; }));
      return o;
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
      var soloAut = Modelo.opcion(d, 'soloAutorizacion');
      if (!d.participantes.length) e.push('Registra al menos a un colaborador participante.');
      if (!soloAut) d.participantes.forEach(function (x, i) {
        var n = x.nombre || 'colaborador ' + (i + 1);
        if (!dniValido(x.dni)) e.push('DNI inválido o vacío de ' + n + ' (8 dígitos).');
        if (!x.firma) e.push('Falta la firma de ' + n + '.');
      });
      if (Modelo.esBP(d) && d.descripcion.atsPersonal) {
        var delAts = d.descripcion.atsPersonal;
        d.participantes.forEach(function (x) {
          var ok = delAts.some(function (y) { return (x.dni && y.dni && x.dni.trim() === y.dni.trim()) || (norm(x.nombre) && norm(x.nombre) === norm(y.nombre)); });
          if (!ok) e.push((x.nombre || 'Un participante') + ' no firmó el ATS ' + d.descripcion.atsRef + ': debe participar en el ATS antes de trabajar con este permiso.');
        });
      }
      if (!soloAut) {
        f(d.supervisorTrabajo, 'supervisor de trabajo (sección VII)');
        if (!dniValido(d.supervisorTrabajo.dni)) e.push('DNI inválido o vacío del supervisor de trabajo.');
      }
      Modelo.normalizar(d);
      if (!Modelo.opcion(d, 'sinVigias')) {
        if (d.tipos.caliente) f(d.vigias.caliente, 'vigía de trabajo en caliente');
        if (d.tipos.altura) f(d.vigias.altura, 'vigía de trabajo en altura');
      }
      Modelo.configPetar(d).firmasAutorizacion.forEach(function (a) { f(d.autorizacion[a.clave], a.cargo.toLowerCase()); });
      /* v10: una firma tomada del ATS solo vale para la misma persona que la firmó. */
      Object.keys(d.autorizacion).forEach(function (k) {
        var x = d.autorizacion[k];
        if (x && x.firma && x.origenFirma && norm(x.origenFirma.nombre) !== norm(x.nombre)) e.push('La firma de ' + k + ' se tomó del ATS de ' + x.origenFirma.nombre + ' y no corresponde a ' + (x.nombre || 'la persona indicada') + ': vuelve a firmar.');
      });
      var sup = (d.autorizacion.supervisor.nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
      var eje = (d.autorizacion.ejecutante.nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (sup && sup === eje) e.push('El supervisor del trabajo no puede ser la misma persona que el ejecutante: la autorización debe ser independiente.');
      return e;
    },

    validarCierre: function (d) {
      var e = [];
      Modelo.configPetar(d).firmasAutorizacion.forEach(function (a) {
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
      return Modelo.configPetar(p).tipos.filter(function (t) { return p.tipos[t.id]; }).map(function (t) { return t.label; }).join(', ');
    },

    asuntoCorreo: function (d, momento) {
      var m = { atsRegistrado: 'ATS registrado', petarAutorizado: 'PETAR autorizado', petarCerrado: 'PETAR cerrado', petarCancelado: 'PETAR cancelado', reenvio: 'Reenvío' }[momento] || momento;
      return '[SST ' + Modelo.sede(d) + '] ' + m + ' — ' + d.numero + ' — ' + Modelo.titulo(d).slice(0, 70);
    },

    correoHTML: function (d, momento) {
      function e(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      function f(k, v) { return '<tr><td style="padding:4px 10px;color:#555;border-bottom:1px solid #eee">' + e(k) + '</td><td style="padding:4px 10px;border-bottom:1px solid #eee"><b>' + e(v || '—') + '</b></td></tr>'; }
      var filas = '';
      if (d.tipo === 'ATS') {
        var g = d.generales;
        filas = f('Tarea', g.tarea) + f('Ubicación', g.ubicacion) + f('Área de Grupo Pana', g.areaContratista) +
          f('Fecha y hora', g.fecha + ' ' + g.hora) + f('Liderado por', g.lideradoPor) + f('Supervisor', g.supervisor) +
          f('Personal', d.personal.map(function (x) { return x.nombre; }).join(', ')) +
          f('Pasos críticos', d.pasos.filter(function (p) { return p.critico === 'si'; }).length + ' de ' + d.pasos.length);
      } else {
        var s = d.descripcion;
        filas = f('Tarea', s.tarea) + f('Lugar', s.lugar) + f('Tipo de trabajo', Modelo.tiposTexto(d)) +
          f('Fecha / horario', s.fecha + ' · ' + s.horaInicio + ' a ' + s.horaFin) + f('ATS de referencia', s.atsRef) +
          f('Área de Grupo Pana', s.ejecutaNombre) +
          f('Participantes', d.participantes.map(function (x) { return x.nombre; }).join(', ')) +
          f('Supervisor del trabajo', d.autorizacion.supervisor.nombre) + f('Responsable del área', d.autorizacion.area.nombre) +
          f('Estado', Modelo.etiquetaEstado(Modelo.estadoVisible(d)));
        if (d.cancelacion) filas += f('Motivo de cancelación', d.cancelacion.motivo);
        var obs = Modelo.observados(d);
        if (obs.length) filas += f('Observaciones', obs.join(' | '));
      }
      return '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#111">' +
        '<p>Se registró el siguiente documento en <b>' + e(C.sistema) + '</b> — sede ' + e(Modelo.sede(d)) + '.</p>' +
        '<table style="border-collapse:collapse">' + f('Documento', d.tipo + ' ' + d.numero) + filas + '</table>' +
        '<p style="color:#555">El PDF se adjunta y queda archivado en la carpeta de SST. Registrado por ' + e(d.usuario.nombre) + '.</p>' +
        '<p style="color:#999;font-size:12px">Mensaje generado automáticamente (' + e(momento) + ').</p></div>';
    }
  };

  window.Modelo = Modelo;
})();
