/* =====================================================================
   DATOS — window.Store (almacenamiento local) y window.Envio (flujo) · v07
   ---------------------------------------------------------------------
   Store: copia de trabajo en el celular (IndexedDB; respaldo en
   localStorage). El registro oficial es el que llega a SharePoint.
   Envio: manda el PDF y los datos al flujo de Power Automate.
   ===================================================================== */
(function () {
  'use strict';

  var DB = 'pana_sst_v03', VER = 2, ST = 'docs', META = 'meta', FOTOS = 'fotos', LS = 'pana_sst_v03_respaldo';

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
          if (!db.objectStoreNames.contains(FOTOS)) db.createObjectStore(FOTOS, { keyPath: 'id' });
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
          t.onabort = t.onerror = function () { mal(t.error || new Error('Guardado cancelado')); };
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
      setMeta: function (k, v) { return tx(META, 'readwrite', function (s) { return s.put({ clave: k, valor: v }); }); },
      putFoto: function (f) { return tx(FOTOS, 'readwrite', function (s) { return s.put(f); }); },
      getFoto: function (id) { return tx(FOTOS, 'readonly', function (s) { return s.get(id); }); },
      delFoto: function (id) { return tx(FOTOS, 'readwrite', function (s) { return s.delete(id); }); },
      siguiente: function (k) {
        return abrir().then(function (db) { return new Promise(function (ok, mal) {
          var t = db.transaction(META, 'readwrite'), st = t.objectStore(META), n;
          var req = st.get(k);
          req.onsuccess = function () { n = ((req.result || {}).valor || 0) + 1; st.put({ clave: k, valor: n }); };
          t.oncomplete = function () { ok(n); };
          t.onabort = t.onerror = function () { mal(t.error || new Error('No se pudo reservar el número')); };
        }); });
      }
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
      setMeta: function (k, v) { var d = leer(); d.meta[k] = v; esc(d); return Promise.resolve(); },
      putFoto: function () { return Promise.reject(new Error('Las fotos requieren IndexedDB.')); },
      getFoto: function () { return Promise.resolve(null); },
      delFoto: function () { return Promise.resolve(); },
      siguiente: function (k) {
        function reservar() { var d = leer(); var n = (d.meta[k] || 0) + 1; d.meta[k] = n; esc(d); return n; }
        if (navigator.locks) return navigator.locks.request(DB + '_numeracion', reservar);
        return Promise.resolve(reservar());
      }
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
    fotosSoportadas: function () { return nombreMotor === 'IndexedDB'; },
    guardarFoto: function (f) { return listo.then(function () { if (nombreMotor !== 'IndexedDB') throw new Error('Las fotos requieren IndexedDB.'); return motor.putFoto(f); }).then(function () { return f; }); },
    obtenerFoto: function (id) { return listo.then(function () { return motor.getFoto(id); }); },
    eliminarFoto: function (id) { return listo.then(function () { return motor.delFoto(id); }); },
    eliminarFotos: function (ids) { return Promise.all((ids || []).map(function (id) { return Store.eliminarFoto(id); })); },
    /* Contador atómico en IndexedDB. Año + identificador aleatorio evitan
       reutilizar códigos al reiniciar el contador o usar varias pestañas. */
    siguienteNumero: function (tipo) {
      var sede = window.SST_CONFIG.sedeCodigo, anio = new Date().getFullYear();
      if (!sede) return Promise.reject(new Error('Selecciona la sede del dispositivo antes de crear documentos.'));
      return listo.then(function () { return motor.siguiente('corr_' + tipo + '_' + sede + '_' + anio); }).then(function (n) {
        var bytes = new Uint8Array(4); window.crypto.getRandomValues(bytes);
        var sufijo = Array.from(bytes).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('').toUpperCase();
        return tipo + '-' + sede + '-' + anio + '-' + String(n).padStart(4, '0') + '-' + sufijo;
      });
    }
  };

  /* ---------------- Envío al flujo ---------------- */
  function nuevoIdEnvio() {
    var c = window.crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    var b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.from(b).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function agregarRegistro(doc, registro, resultado, detalle) {
    registro.resultado = resultado;
    registro.detalle = detalle;
    doc.envios.push(registro);
    return registro;
  }

  var Envio = {
    configurado: function () {
      return !!(window.SST_CONFIG.flujoUrl || '').trim() && !!(window.SST_CONFIG.claveArea || '').trim();
    },

    enviar: function (doc, momento) {
      var C = window.SST_CONFIG;
      var registro = { fechaHora: new Date().toISOString(), momento: momento, resultado: '', detalle: '' };
      doc.envios = doc.envios || [];

      /* Regla heredada de v05: un documento creado como prueba nunca sale del dispositivo. */
      if (C.modoPrueba || doc.prueba === true) {
        return Promise.resolve(agregarRegistro(doc, registro, 'prueba',
          'Documento de prueba guardado solo en este dispositivo. No se realizó ningún envío.'));
      }
      if (!Envio.configurado()) {
        return Promise.resolve(agregarRegistro(doc, registro, 'sin_flujo',
          'Falta configurar la URL del flujo y la clave del área en Ajustes.'));
      }
      if (navigator.onLine === false) {
        return Promise.resolve(agregarRegistro(doc, registro, 'pendiente',
          'Envío pendiente · sin conexión. Reintenta manualmente desde la ficha.'));
      }

      return Promise.resolve().then(function () { return window.DocPDF.base64(doc); }).then(function (pdf) {
      var idEnvio = nuevoIdEnvio();
      registro.idEnvio = idEnvio;
      var payload = {
        origen: 'gestion-digital-sst-v03',
        tipo: doc.tipo,
        numero: doc.numero,
        estado: doc.estado,
        momento: momento,
        sede: window.Modelo.sede(doc),
        fecha: doc.tipo === 'ATS' ? doc.generales.fecha : doc.descripcion.fecha,
        asunto: window.Modelo.asuntoCorreo(doc, momento),
        cuerpo: window.Modelo.correoHTML(doc, momento),
        nombreArchivo: window.DocPDF.nombreArchivo(doc),
        pdfBase64: pdf,
        registradoPor: doc.usuario ? doc.usuario.nombre : '',
        generadoEn: new Date().toISOString(),
        version: 'v07',
        clave: C.claveArea,
        idEnvio: idEnvio
      };

      var controlador = new AbortController();
      var reloj = setTimeout(function () { controlador.abort(); }, 45000);

      return fetch(C.flujoUrl.trim(), {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
        signal: controlador.signal
      }).then(function (respuesta) {
        clearTimeout(reloj);
        return respuesta.text().then(function (texto) {
          var datos = null;
          try { datos = JSON.parse(texto); } catch (e) {}

          if ((datos && datos.ok === false) || (respuesta.status >= 400 && respuesta.status < 500)) {
            var motivo = datos && datos.motivo ? String(datos.motivo) : 'solicitud rechazada';
            registro.motivo = motivo;
            return agregarRegistro(doc, registro, 'rechazado', 'Envío rechazado: ' + motivo);
          }

          if (respuesta.ok && datos && datos.ok === true &&
              datos.numero === doc.numero && datos.idEnvio === idEnvio && datos.archivo) {
            registro.archivo = String(datos.archivo);
            return agregarRegistro(doc, registro, 'confirmado', 'Recibido por SST ✓ — ' + registro.archivo);
          }

          return agregarRegistro(doc, registro, 'no_confirmado', 'Envío intentado · recepción sin confirmar');
        });
      }).catch(function () {
        clearTimeout(reloj);
        return agregarRegistro(doc, registro, 'no_confirmado', 'Envío intentado · recepción sin confirmar');
      });
      }).catch(function () { return agregarRegistro(doc, registro, 'error', 'No se pudo generar el PDF.'); });
    },

    ultimo: function (doc) {
      var e = doc.envios || [];
      return e.length ? e[e.length - 1] : null;
    }
  };

  window.Store = Store;
  window.Envio = Envio;
})();
