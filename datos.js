/* =====================================================================
   DATOS — window.Store (almacenamiento local) y window.Envio (flujo)
   ---------------------------------------------------------------------
   Store: copia de trabajo en el celular (IndexedDB; respaldo en
   localStorage). El registro oficial es el que llega a SharePoint.
   Envio: manda el PDF y los datos al flujo de Power Automate.
   ===================================================================== */
(function () {
  'use strict';

  var DB = 'pana_sst_v03', VER = 1, ST = 'docs', META = 'meta', LS = 'pana_sst_v03_respaldo';

  /* ---------------- IndexedDB ---------------- */
  var idb = (function () {
    var p = null;
    function abrir() {
      if (p) return p;
      p = new Promise(function (ok, mal) {
        if (!('indexedDB' in window)) return mal(new Error('sin-idb'));
        var r = indexedDB.open(DB, VER);
        r.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(ST)) db.createObjectStore(ST, { keyPath: 'id' });
          if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'clave' });
        };
        r.onsuccess = function (e) { ok(e.target.result); };
        r.onerror = function () { mal(r.error); };
      });
      return p;
    }
    function tx(st, modo, fn) {
      return abrir().then(function (db) {
        return new Promise(function (ok, mal) {
          var t = db.transaction(st, modo), req = fn(t.objectStore(st));
          t.oncomplete = function () { ok(req && req.result); };
          t.onerror = function () { mal(t.error); };
        });
      });
    }
    return {
      probar: abrir,
      put: function (d) { return tx(ST, 'readwrite', function (s) { return s.put(d); }); },
      get: function (id) { return tx(ST, 'readonly', function (s) { return s.get(id); }); },
      all: function () { return tx(ST, 'readonly', function (s) { return s.getAll(); }); },
      del: function (id) { return tx(ST, 'readwrite', function (s) { return s.delete(id); }); },
      meta: function (k) { return tx(META, 'readonly', function (s) { return s.get(k); }).then(function (r) { return r ? r.valor : undefined; }); },
      setMeta: function (k, v) { return tx(META, 'readwrite', function (s) { return s.put({ clave: k, valor: v }); }); }
    };
  })();

  /* ---------------- localStorage (respaldo) ---------------- */
  var ls = (function () {
    function leer() { try { return JSON.parse(localStorage.getItem(LS)) || { docs: [], meta: {} }; } catch (e) { return { docs: [], meta: {} }; } }
    function esc(d) { localStorage.setItem(LS, JSON.stringify(d)); }
    return {
      probar: function () { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); return Promise.resolve(); },
      put: function (x) { var d = leer(); var i = d.docs.findIndex(function (y) { return y.id === x.id; }); if (i >= 0) d.docs[i] = x; else d.docs.push(x); esc(d); return Promise.resolve(); },
      get: function (id) { return Promise.resolve(leer().docs.find(function (y) { return y.id === id; })); },
      all: function () { return Promise.resolve(leer().docs); },
      del: function (id) { var d = leer(); d.docs = d.docs.filter(function (y) { return y.id !== id; }); esc(d); return Promise.resolve(); },
      meta: function (k) { return Promise.resolve(leer().meta[k]); },
      setMeta: function (k, v) { var d = leer(); d.meta[k] = v; esc(d); return Promise.resolve(); }
    };
  })();

  var motor = idb, nombreMotor = 'IndexedDB';
  var listo = idb.probar().catch(function () {
    motor = ls; nombreMotor = 'localStorage';
    return ls.probar();
  });

  function codigoDispositivo() {
    return motor.meta('dispositivo').then(function (c) {
      if (c) return c;
      c = Math.random().toString(36).slice(2, 5).toUpperCase();
      return motor.setMeta('dispositivo', c).then(function () { return c; });
    });
  }

  var Store = {
    init: function () { return listo.then(function () { return nombreMotor; }); },
    guardar: function (d) { d.actualizadoEn = new Date().toISOString(); return listo.then(function () { return motor.put(d); }).then(function () { return d; }); },
    obtener: function (id) { return listo.then(function () { return motor.get(id); }); },
    todos: function () {
      return listo.then(function () { return motor.all(); }).then(function (l) {
        return (l || []).sort(function (a, b) { return (b.creadoEn || '').localeCompare(a.creadoEn || ''); });
      });
    },
    eliminar: function (id) { return listo.then(function () { return motor.del(id); }); },
    pref: function (k, v) {
      return listo.then(function () { return v === undefined ? motor.meta('pref_' + k) : motor.setMeta('pref_' + k, v); });
    },
    /* Número: TIPO-SEDE-0001-XYZ. El sufijo identifica al celular y evita
       que dos equipos generen el mismo número. */
    siguienteNumero: function (tipo) {
      var sede = window.SST_CONFIG.sede.toUpperCase().slice(0, 3);
      return listo.then(codigoDispositivo).then(function (disp) {
        var k = 'corr_' + tipo + '_' + new Date().getFullYear();
        return motor.meta(k).then(function (n) {
          n = (n || 0) + 1;
          return motor.setMeta(k, n).then(function () {
            return tipo + '-' + sede + '-' + String(n).padStart(4, '0') + '-' + disp;
          });
        });
      });
    }
  };

  /* ---------------- Envío al flujo ---------------- */
  var Envio = {
    configurado: function () { return !!(window.SST_CONFIG.flujoUrl || '').trim(); },

    /* Se envía como texto plano y sin CORS: el navegador no bloquea el
       envío, pero tampoco permite leer la respuesta. La confirmación
       real es la llegada del correo y del archivo a SharePoint. */
    enviar: function (doc, momento) {
      var C = window.SST_CONFIG;
      var registro = { fechaHora: new Date().toISOString(), momento: momento, resultado: '', detalle: '' };
      doc.envios = doc.envios || [];

      if (!Envio.configurado()) {
        registro.resultado = 'sin_flujo';
        registro.detalle = 'No hay URL del flujo configurada; el PDF solo se generó en el celular.';
        doc.envios.push(registro);
        return Promise.resolve(registro);
      }
      if (navigator.onLine === false) {
        registro.resultado = 'pendiente';
        registro.detalle = 'Sin conexión. Se puede reintentar desde la ficha del documento.';
        doc.envios.push(registro);
        return Promise.resolve(registro);
      }

      var pdf;
      try { pdf = window.DocPDF.base64(doc); }
      catch (e) {
        registro.resultado = 'error'; registro.detalle = 'No se pudo generar el PDF: ' + e.message;
        doc.envios.push(registro);
        return Promise.resolve(registro);
      }

      var cuerpo = window.Modelo.correoHTML(doc, momento);
      var payload = {
        origen: 'gestion-digital-sst-v03',
        tipo: doc.tipo,
        numero: doc.numero,
        estado: doc.estado,
        momento: momento,
        sede: C.sede,
        fecha: doc.tipo === 'ATS' ? doc.generales.fecha : doc.descripcion.fecha,
        asunto: window.Modelo.asuntoCorreo(doc, momento),
        cuerpo: cuerpo,
        nombreArchivo: window.DocPDF.nombreArchivo(doc),
        pdfBase64: pdf,
        registradoPor: doc.usuario ? doc.usuario.nombre : '',
        generadoEn: new Date().toISOString()
      };

      return fetch(C.flujoUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload)
      }).then(function () {
        registro.resultado = 'enviado';
        registro.detalle = 'Enviado al flujo de SST (' + payload.nombreArchivo + ').';
        doc.envios.push(registro);
        return registro;
      }).catch(function (e) {
        registro.resultado = 'pendiente';
        registro.detalle = 'No se pudo contactar al flujo: ' + e.message;
        doc.envios.push(registro);
        return registro;
      });
    },

    ultimo: function (doc) {
      var e = doc.envios || [];
      return e.length ? e[e.length - 1] : null;
    }
  };

  window.Store = Store;
  window.Envio = Envio;
})();
