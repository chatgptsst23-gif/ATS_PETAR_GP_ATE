/* v06 — Ejecutar: node tests/regresion.cjs. No realiza solicitudes de red real. */
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
  assert.equal(C.flujoUrl,''); assert.equal(C.claveArea,''); assert.equal(C.modoPrueba,false); assert.equal(C.version,'v06 (piloto)');

  const p=M.nuevoPETAR('PETAR-PRUEBA',user);
  assert.equal(p.prueba,false);
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
  assert.equal(ultimoPayload.version,'v06');assert.equal(ultimoPayload.clave,C.claveArea);assert(ultimoPayload.idEnvio);
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

  console.log('OK: v06 y regresiones v05.');
})().catch(e=>{console.error(e);process.exitCode=1});
