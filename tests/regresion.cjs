/* Ejecutar: node tests/regresion.cjs. No realiza solicitudes de red. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
let calls = 0, quota = false;
const values = new Map();
const storage = { getItem:k=>values.get(k)||null, setItem:(k,v)=>{if(quota)throw new Error('QuotaExceeded');values.set(k,v)}, removeItem:k=>values.delete(k) };
const w = { crypto:require('node:crypto').webcrypto, jspdf:require(path.join(root,'jspdf.umd.min.js')) };
const ctx = vm.createContext({window:w, localStorage:storage, navigator:{onLine:true}, Date, Math, Promise, Uint8Array, console, setTimeout, clearTimeout,
  fetch:async()=>{calls++;return {type:'opaque'}}});
const run = f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
['config.js','modelo.js','datos.js','pdf.js'].forEach(run);
const M=w.Modelo, C=w.SST_CONFIG;
const user={nombre:'Usuario Prueba',cargo:'Supervisor'};
(async()=>{
  assert.equal(C.flujoUrl,''); assert.equal(C.modoPrueba,true);
  const p=M.nuevoPETAR('PETAR-PRUEBA',user);
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
  C.flujoUrl='https://invalid.example/test';
  assert.equal((await w.Envio.enviar(p,'petarAutorizado')).resultado,'prueba');assert.equal(calls,0);
  C.modoPrueba=false;
  assert.equal((await w.Envio.enviar(p,'reenvio')).resultado,'prueba');assert.equal(calls,0);
  const old=M.nuevoATS('ATS-ANTERIOR',user);delete old.prueba;
  C.modoPrueba=true;assert.equal((await w.Envio.enviar(old,'reenvio')).resultado,'prueba');assert.equal(calls,0);
  C.modoPrueba=false;assert.equal((await w.Envio.enviar(old,'reenvio')).resultado,'no_confirmado');assert.equal(calls,1);
  await w.Store.init();
  const nums=await Promise.all(Array.from({length:100},()=>w.Store.siguienteNumero('ATS')));
  assert.equal(new Set(nums).size,100);assert(nums.every(n=>n.includes('-'+new Date().getFullYear()+'-')));
  quota=true;await assert.rejects(w.Store.guardar(old));quota=false;
  // PDF real: las omisiones siguen siendo omisiones, y las pruebas se identifican.
  C.modoPrueba=true;const pdfDoc=M.nuevoPETAR('PETAR-PRUEBA',user);
  const raw=w.DocPDF.generar(pdfDoc).output();
  const pdf=Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch(e){return m[1]}}).join('\n');
  assert(pdf.includes('SIN'));assert(pdf.includes('RESPONDER'));assert(pdf.includes('NO AUTORIZA TRABAJOS'));
  assert(w.DocPDF.nombreArchivo(pdfDoc).startsWith('prueba_'));
  // Aislar el renderizado permite probar el control común de navegación.
  let confirm=true;
  w.UI={esc:String,$:()=>({}),$$:()=>[],aviso:()=>{},confirmar:async()=>confirm};
  ctx.document={addEventListener:()=>{}};w.scrollTo=()=>{};
  let app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  app=app.replace('function render() {','function render() { return;');
  app=app.replace('window.App = { estado: st };','window.App = { estado: st, ir: ir, finalizar: finalizar };');
  vm.runInContext(app,ctx);
  const a=M.nuevoATS('ATS-FIRMADO',user);a.supervisorFirma.firma='firma';a.supervisorFirma.fechaHora='fecha';
  w.App.estado.doc=a;w.App.estado.pantalla='revision';
  confirm=false;w.App.ir('form',0);await new Promise(r=>setTimeout(r,10));assert.equal(w.App.estado.pantalla,'revision');assert.equal(a.supervisorFirma.firma,'firma');
  confirm=true;w.App.ir('form',0);await new Promise(r=>setTimeout(r,10));assert.equal(w.App.estado.pantalla,'form');assert.equal(a.supervisorFirma.firma,'');
  // No autorizar un documento incompleto aunque las firmas estén presentes.
  a.personal=[{nombre:'Prueba Persona',firma:'x'}];a.supervisorFirma={nombre:'Supervisor Prueba',firma:'x'};
  w.App.finalizar('REGISTRADO','atsRegistrado','Prueba','Prueba');assert.equal(a.estado,'BORRADOR');assert(w.App.estado.errores.length>0);
  console.log('OK: validaciones, estados, envíos simulados, numeración, error de guardado, PDF, firmas y validación final.');
})().catch(e=>{console.error(e);process.exitCode=1});
