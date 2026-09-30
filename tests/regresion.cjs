/* v07.1 — Ejecutar: node tests/regresion.cjs. No realiza solicitudes de red real. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
let calls = 0, quota = false, fetchImpl;
const values = new Map();
const storage = { getItem:k=>values.get(k)||null, setItem:(k,v)=>{if(quota)throw new Error('QuotaExceeded');values.set(k,v)}, removeItem:k=>values.delete(k) };
class TestAbortController {
  constructor(){ const listeners=[]; this.signal={aborted:false,addEventListener:(t,f)=>{if(t==='abort')listeners.push(f)}}; this._listeners=listeners; }
  abort(){ if(this.signal.aborted)return; this.signal.aborted=true; this._listeners.forEach(f=>f()); }
}
const w = { crypto:require('node:crypto').webcrypto, jspdf:require(path.join(root,'jspdf.umd.min.js')) };
const nav={onLine:true};
let timeoutFast=false;
const realSetTimeout=setTimeout;
const ctx = vm.createContext({
  window:w, localStorage:storage, navigator:nav, Date, Math, Promise, Uint8Array, console,
  AbortController:TestAbortController,
  setTimeout:(fn,ms)=> timeoutFast && ms===45000 ? realSetTimeout(fn,0) : realSetTimeout(fn,ms),
  clearTimeout,
  fetch:(...args)=>{calls++;return fetchImpl(...args)}
});
const run = f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
['config.js','modelo.js','datos.js','pdf.js'].forEach(run);
const M=w.Modelo, C=w.SST_CONFIG;
const user={nombre:'Usuario Prueba',cargo:'Supervisor'};
const respuesta=(status,obj)=>({status,ok:status>=200&&status<300,text:async()=>typeof obj==='string'?obj:JSON.stringify(obj)});
const configurar=()=>{C.flujoUrl='https://example.invalid/flujo';C.claveArea='CLAVE_FICTICIA_V06';};
(async()=>{
  assert.equal(C.flujoUrl,''); assert.equal(C.claveArea,''); assert.equal(C.modoPrueba,false); assert.equal(C.version,'v07.1 (piloto operativo)');

  const p=M.nuevoPETAR('PETAR-PRUEBA',user);
  assert.equal(p.prueba,false); p.tipos.caliente=true;
  Object.assign(p.emergencia,{encargadoSede:'A',supervisorPrevencionista:'B',rutasLibres:'si',rutasIndicadas:'si',telefono:'123',contacto:'C'});
  assert.equal(M.validarPaso(p,'emergencia').length,C.petar.emergencias.length+C.petar.equiposEmergencia.length);
  C.petar.emergencias.forEach(k=>p.emergencia.emergencias[k]='na');
  C.petar.equiposEmergencia.forEach(k=>p.emergencia.equipos[k]='na');
  assert.equal(M.validarPaso(p,'emergencia').length,0);
  C.petar.adicionales.forEach(x=>p.adicionales[x.id]='no');
  assert(M.validarPaso(p,'emergencia').some(x=>x.includes('medidas')));
  p.observaciones='Medida de prueba';assert.equal(M.validarPaso(p,'emergencia').length,0);
  assert.throws(()=>M.cambiarEstado(p,'CERRADO','Prueba'));
  p.descripcion.fecha='2099-01-01';p.descripcion.horaInicio='08:00';p.descripcion.horaFin='17:00';
  M.cambiarEstado(p,'AUTORIZADO','Prueba');assert.equal(M.estadoVisible(p),'PROGRAMADO');
  p.descripcion.fecha='2000-01-01';assert.equal(M.estadoVisible(p),'VENCIDO');

  await w.Store.init();
  const nums=await Promise.all(Array.from({length:100},()=>w.Store.siguienteNumero('ATS')));
  assert.equal(new Set(nums).size,100);assert(nums.every(n=>n.includes('-'+new Date().getFullYear()+'-')));
  quota=true;await assert.rejects(w.Store.guardar(M.nuevoATS('ATS-CUOTA',user)));quota=false;

  C.modoPrueba=true;const pdfDoc=M.nuevoPETAR('PETAR-PRUEBA-PDF',user);
  const raw=w.DocPDF.generar(pdfDoc).output();
  const pdf=Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch(e){return m[1]}}).join('\n');
  assert(pdf.includes('SIN'));assert(pdf.includes('RESPONDER'));assert(pdf.includes('NO AUTORIZA TRABAJOS'));
  assert(w.DocPDF.nombreArchivo(pdfDoc).startsWith('prueba_'));
  C.modoPrueba=false;configurar();
  fetchImpl=async()=>{throw new Error('no debe llamarse')};
  const antes=calls;assert.equal((await w.Envio.enviar(pdfDoc,'reenvio')).resultado,'prueba');assert.equal(calls,antes);

  const op=M.nuevoATS('ATS-V06-OPERATIVO',user);
  const base64Real=w.DocPDF.base64;w.DocPDF.base64=()=> 'JVBERi0FAKE';
  C.flujoUrl='';C.claveArea='CLAVE_FICTICIA_V06';
  assert.equal(w.Envio.configurado(),false);let c0=calls;assert.equal((await w.Envio.enviar(op,'atsRegistrado')).resultado,'sin_flujo');assert.equal(calls,c0);
  C.flujoUrl='https://example.invalid/flujo';C.claveArea='';
  assert.equal(w.Envio.configurado(),false);c0=calls;assert.equal((await w.Envio.enviar(op,'atsRegistrado')).resultado,'sin_flujo');assert.equal(calls,c0);

  configurar();let ultimoPayload,ultimoInit;
  fetchImpl=async(url,init)=>{ultimoInit=init;ultimoPayload=JSON.parse(init.body);return respuesta(200,{ok:true,numero:ultimoPayload.numero,archivo:'ats-confirmado.pdf',idEnvio:ultimoPayload.idEnvio})};
  let r=await w.Envio.enviar(op,'atsRegistrado');
  assert.equal(r.resultado,'confirmado');assert.equal(r.archivo,'ats-confirmado.pdf');
  assert.equal(ultimoPayload.version,'v07');assert.equal(ultimoPayload.clave,C.claveArea);assert(ultimoPayload.idEnvio);
  assert.equal(ultimoInit.mode,'cors');assert.equal(ultimoInit.headers['Content-Type'],'text/plain;charset=UTF-8');
  assert(!JSON.stringify(op.bitacora).includes(C.claveArea));assert(!JSON.stringify(op.envios).includes(C.claveArea));

  fetchImpl=async(url,init)=>{const x=JSON.parse(init.body);return respuesta(200,{ok:true,numero:'OTRO',archivo:'x.pdf',idEnvio:x.idEnvio})};
  assert.equal((await w.Envio.enviar(op,'reenvio')).resultado,'no_confirmado');
  fetchImpl=async(url,init)=>{const x=JSON.parse(init.body);return respuesta(200,{ok:true,numero:x.numero,archivo:'x.pdf',idEnvio:'otro-id'})};
  assert.equal((await w.Envio.enviar(op,'reenvio')).resultado,'no_confirmado');

  fetchImpl=async()=>respuesta(403,{ok:false,motivo:'clave incorrecta'});
  r=await w.Envio.enviar(op,'reenvio');assert.equal(r.resultado,'rechazado');assert(r.detalle.includes('clave incorrecta'));

  c0=calls;fetchImpl=async()=>{throw new TypeError('Failed to fetch')};
  r=await w.Envio.enviar(op,'reenvio');assert.equal(r.resultado,'no_confirmado');assert.equal(calls,c0+1);

  timeoutFast=true;
  fetchImpl=(url,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>{const e=new Error('AbortError');e.name='AbortError';reject(e)}));
  r=await w.Envio.enviar(op,'reenvio');timeoutFast=false;assert.equal(r.resultado,'no_confirmado');

  nav.onLine=false;c0=calls;r=await w.Envio.enviar(op,'reenvio');assert.equal(r.resultado,'pendiente');assert.equal(calls,c0);nav.onLine=true;

  w.DocPDF.base64=base64Real;
  const pdfOpRaw=w.DocPDF.generar(op).output();
  const pdfOp=Array.from(pdfOpRaw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch(e){return m[1]}}).join('\n');
  assert(!pdfOp.includes(C.claveArea));
  assert(!fs.readFileSync(path.join(root,'pdf.js'),'utf8').includes('claveArea'));

  let confirm=true,docConexion,momentoConexion;
  w.UI={esc:String,$:()=>({}),$$:()=>[],aviso:()=>{},confirmar:async()=>confirm};
  ctx.document={addEventListener:()=>{}};w.scrollTo=()=>{};w.scrollY=0;
  let app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  app=app.replace('function render() {','function render() { return;');
  app=app.replace('window.App = { estado: st };','window.App = { estado: st, ir: ir, finalizar: finalizar, probarEnvio: probarEnvio };');
  vm.runInContext(app,ctx);
  const a=M.nuevoATS('ATS-FIRMADO',user);a.supervisorFirma.firma='firma';a.supervisorFirma.fechaHora='fecha';
  w.App.estado.doc=a;w.App.estado.pantalla='revision';
  confirm=false;w.App.ir('form',0);await new Promise(r=>realSetTimeout(r,10));assert.equal(w.App.estado.pantalla,'revision');assert.equal(a.supervisorFirma.firma,'firma');
  confirm=true;w.App.ir('form',0);await new Promise(r=>realSetTimeout(r,10));assert.equal(w.App.estado.pantalla,'form');assert.equal(a.supervisorFirma.firma,'');
  a.personal=[{nombre:'Prueba Persona',firma:'x'}];a.supervisorFirma={nombre:'Supervisor Prueba',firma:'x'};
  w.App.finalizar('REGISTRADO','atsRegistrado','Prueba','Prueba');assert.equal(a.estado,'BORRADOR');assert(w.App.estado.errores.length>0);
  const envioReal=w.Envio.enviar;
  w.Envio.enviar=async(doc,momento)=>{docConexion=doc;momentoConexion=momento;return {resultado:'confirmado',detalle:'Recibido por SST ✓ — prueba.pdf'}};
  w.App.estado.usuario=user;await w.App.probarEnvio();
  assert.equal(docConexion.prueba,false);assert.equal(momentoConexion,'prueba_conexion');
  w.Envio.enviar=envioReal;


  /* ------------------------------ v07 integrada ------------------------------ */
  const tipos=Object.fromEntries(C.petar.tipos.map(t=>[t.id,t.activo]));
  assert.equal(tipos.altura,true);assert.equal(tipos.peligrosos,true);assert.equal(tipos.caliente,true);assert.equal(tipos.confinado,false);
  assert.equal(C.petar.fotos.maxTotal,8);assert.equal(C.petar.fotos.anchoMaximoPx,1024);

  const atsRef=M.nuevoATS('ATS-REF',user);atsRef.permisos.caliente=false;atsRef.permisos.altura=true;
  const desdeAts=M.nuevoPETAR('PETAR-V07-DESDE-ATS',user,atsRef);
  assert.equal(desdeAts.tipos.altura,true);assert.equal(desdeAts.tipos.caliente,false);

  const JPG='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAGAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkKKKK8U/TD//Z';
  let fotoN=0; const foto=(t)=>({id:'f_'+(++fotoN),fechaHora:new Date().toISOString(),texto:t,ancho:8,alto:6});

  const h=M.nuevoPETAR('PETAR-V07-ALTURA',user);h.tipos.altura=true;M.normalizar(h);
  assert(h.altura&&h.escaleras&&h.peligrosos&&h.quimicos&&h.evidencias&&h.vigias.altura);
  assert.equal(M.pasos(h).map(x=>x.id).join(','),'descripcion,epp,requisitos,altura,evidencias,emergencia');
  assert(M.validarPaso(h,'altura').some(x=>x.includes('sin responder')));
  C.petar.altura.forEach(r=>h.altura[r.id]='si');h.escaleras.usa='no';h.vigias.altura.nombre='Vigia Altura';
  assert.equal(M.validarPaso(h,'altura').length,0);
  assert.equal(M.validarPaso(h,'evidencias').length,C.petar.evidenciasPorTipo.altura.length);
  M.evidenciasRequeridas(h).forEach(x=>{h.evidencias[x.ruta]=[foto(x.texto)]});
  assert.equal(M.validarPaso(h,'evidencias').length,0);
  assert(!JSON.stringify(h).includes('data:image'));
  h.escaleras.usa='si';assert(M.validarPaso(h,'altura').some(x=>x.startsWith('Escalera sin responder')));
  C.petar.escaleras.forEach(r=>h.escaleras[r.id]='si');assert.equal(M.validarPaso(h,'altura').length,0);
  h.escaleras.e_estado='no';assert(M.bloqueos(h).some(x=>x.includes('Escalera en buenas condiciones')));
  h.escaleras.e_estado='si';h.escaleras.e_angulo='no';assert(M.observados(h).some(x=>x.includes('1/4')));assert(!M.bloqueos(h).some(x=>x.includes('1/4')));
  h.altura.h_aptitud='no';assert(M.bloqueos(h).some(x=>x.includes('aptitud médica')));h.altura.h_aptitud='si';

  const q=M.nuevoPETAR('PETAR-V07-QUIM',user);q.tipos.caliente=true;q.tipos.peligrosos=true;M.normalizar(q);
  assert.equal(M.pasos(q).map(x=>x.id).join(','),'descripcion,epp,requisitos,caliente,peligrosos,evidencias,emergencia');
  q.quimicos.inflamable='no';assert(!M.bloqueos(q).some(x=>x.includes('LEL')));
  q.quimicos.inflamable='si';assert(M.calienteConInflamables(q));assert(M.bloqueos(q).some(x=>x.includes('LEL')));
  q.quimicos.lel='5';assert(M.bloqueos(q).some(x=>x.includes('LEL')));q.quimicos.lel='0';assert(!M.bloqueos(q).some(x=>x.includes('LEL')));
  q.tipos.caliente=false;q.quimicos.lel='';assert(!M.bloqueos(q).some(x=>x.includes('LEL')));q.tipos.caliente=true;
  assert(M.validarPaso(q,'peligrosos').some(x=>x.includes('productos')));
  q.quimicos.productos='Thinner';C.petar.peligrosos.forEach(r=>q.peligrosos[r.id]='si');q.quimicos.inflamable='no';
  assert.equal(M.validarPaso(q,'peligrosos').length,0);
  assert.equal(M.fotosFaltantes(q).length,C.petar.evidenciasPorTipo.caliente.length+C.petar.evidenciasPorTipo.peligrosos.length);
  q.peligrosos.q_atmosfera='na';q.peligrosos.q_nfpa='no';assert(M.bloqueos(q).some(x=>x.includes('NFPA')));

  const f=M.nuevoPETAR('PETAR-V07-FIRMAS',user);f.tipos.altura=true;M.normalizar(f);
  f.autorizacion.supervisor.nombre='Juan  Perez';f.autorizacion.ejecutante.nombre='juan perez';
  assert(M.validarFirmas(f).some(x=>x.includes('misma persona')));assert(M.validarFirmas(f).some(x=>x.includes('vigía de trabajo en altura')));
  f.autorizacion.ejecutante.nombre='Luis Soto';assert(!M.validarFirmas(f).some(x=>x.includes('misma persona')));

  const combinado=M.nuevoPETAR('PETAR-V07-VIGIAS',user);combinado.tipos.caliente=true;combinado.tipos.altura=true;M.normalizar(combinado);
  combinado.vigias.caliente.nombre='Vigia Caliente';combinado.vigias.altura.nombre='Vigia Altura';
  assert.notEqual(combinado.vigias.caliente,combinado.vigias.altura);

  const viejo=JSON.parse(JSON.stringify(M.nuevoPETAR('PETAR-V06-ANTIGUO',user)));
  delete viejo.altura;delete viejo.escaleras;delete viejo.peligrosos;delete viejo.quimicos;delete viejo.evidencias;delete viejo.vigias;
  viejo.tipos={caliente:true};viejo.vigia={nombre:'Vigia legado',dni:'',firma:'x',fechaHora:'2026-01-01T00:00:00Z'};
  assert.doesNotThrow(()=>{M.pasos(viejo);M.bloqueos(viejo);M.validarTodo(viejo);w.DocPDF.generar(viejo);});
  assert.equal(viejo.vigias.caliente.nombre,'Vigia legado');

  /* Desactivar un tipo desvincula sus evidencias del documento. */
  const lim=M.nuevoPETAR('PETAR-LIMPIEZA',user);lim.tipos.altura=true;M.normalizar(lim);lim.evidencias['altura.acceso']=[foto('Acceso')];
  const idsLim=M.limpiarEvidenciasTipo(lim,'altura');assert.equal(idsLim.length,1);assert.equal(M.totalFotos(lim),0);

  /* El PDF acepta un mapa de imágenes temporal: la foto no vive dentro del PETAR. */
  const hp=M.nuevoPETAR('PETAR-PDF-FOTOS',user);hp.tipos.altura=true;M.normalizar(hp);C.petar.altura.forEach(r=>hp.altura[r.id]='si');hp.escaleras.usa='no';hp.vigias.altura.nombre='Vigia';
  const mapa={};M.evidenciasRequeridas(hp).forEach(x=>{const fr=foto(x.texto);hp.evidencias[x.ruta]=[fr];mapa[fr.id]=new Uint8Array(Buffer.from(JPG.split(',')[1],'base64'));});
  const rawF=w.DocPDF.generar(hp,mapa).output();
  const txtF=Array.from(rawF.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch(e){return m[1]}}).join('\n');
  assert(txtF.includes('REGISTRO FOTOGR'));assert(txtF.includes('TRABAJO EN ALTURA'));assert((rawF.match(/\/Subtype \/Image/g)||[]).length>=1);

  const fuenteApp=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert(fuenteApp.includes('Acceso Área SST'));assert(fuenteApp.includes('claveAjustesHash_v07'));assert(fuenteApp.includes('canvasBlob'));
  assert(!fuenteApp.includes('Continuar sin vincular'));assert(!fuenteApp.includes("'Contratista'"));assert(!fuenteApp.includes('D.S. 42-F'));assert(!fuenteApp.includes('FOR-GHS-002'));
  const fuentePdf=fs.readFileSync(path.join(root,'pdf.js'),'utf8');assert(!fuentePdf.includes('D.S. 42-F'));assert(!fuentePdf.includes('FOR-GHS-002'));
  assert(!fuenteApp.includes('toDataURL('));assert(!fuenteApp.includes('readAsDataURL'));
  const fuenteDatos=fs.readFileSync(path.join(root,'datos.js'),'utf8');
  assert(fuenteDatos.includes("FOTOS = 'fotos'"));assert(fuenteDatos.includes('fotosSoportadas'));
  assert(fs.readFileSync(path.join(root,'modelo.js'),'utf8').includes('lideradoPor: usuario.nombre'));

  console.log('OK: v07.1 operativa (ATS obligatorio + solo Grupo Pana + UI/PDF sin referencias normativas) y regresiones v07/v06/v05.');
})().catch(e=>{console.error(e);process.exitCode=1});
