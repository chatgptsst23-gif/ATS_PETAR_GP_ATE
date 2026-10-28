/* node tests/v12.cjs — contactos, separación de riesgos, compatibilidad, firmas y navegación. Sin red. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const elements={};const el=key=>elements[key]||(elements[key]={innerHTML:'',classList:{add(){},remove(){}},querySelector(){return null;}});
let nextImageFails=false,revoked=0;
class TestImage {constructor(){this.width=600;this.height=150;}set src(v){queueMicrotask(()=>nextImageFails?this.onerror():this.onload());}}
const document={addEventListener(){},querySelector:el,querySelectorAll(){return [];},createElement(name){assert.equal(name,'canvas');return {getContext(){return {fillRect(){},drawImage(){}}},toDataURL(){return PNG}};}};
const w={jspdf:require(path.join(root,'jspdf.umd.min.js')),scrollTo(){},scrollY:0};
const ctx=vm.createContext({window:w,document,console,Date,Math,Uint8Array,setTimeout,clearTimeout,Image:TestImage,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){revoked++;}}});
for(const f of ['config.js','catalogo_bp.js','modelo.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(src.replace('window.App = { estado: st };',`window.App = { estado: st, generales: fAtsGenerales, pasosHTML: fAtsPasos, descripcion: fPDescripcion, emergencia: fPEmergencia, firmas: vFirmas, resumen: resumen, clic: clic, entrada: entrada, cargar: cargarFirmaImagen, ir: ir, setup: function(){ app = $('#app'); titulo = $('#tituloApp'); sub = $('#subApp'); atras = $('#btnAtras'); } };`),ctx);
const C=w.SST_CONFIG,M=w.Modelo,A=w.App,u={nombre:'Técnico Ficticio',cargo:'Técnico'};
C.sede='Ate';C.sedeCodigo='ATE';C.modoPrueba=true;
const saved=new Map();w.Store={guardar:async d=>{saved.set(d.id,JSON.parse(JSON.stringify(d)));},obtener:async id=>saved.get(id)};
w.UI.confirmar=async()=>true;w.UI.aviso=()=>{};w.UI.marcarGuardado=()=>{};
A.setup();A.estado.usuario=u;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function pdfText(d){const raw=w.DocPDF.generar(d).output();return Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch{return m[1]}}).join('\n');}
(async()=>{
 const a=M.nuevoATS('ATS-V12',u);
 a.generales.tarea='Retirar pieza';a.generales.supervisor='Supervisor Ficticio';
 assert.equal(M.validarPaso(a,'generales').length,0);assert(!A.generales(a).includes('generales.ubicacion'));
 a.pasos=[{paso:'Retirar pieza',peligro:'Borde filoso',riesgo:'Contacto: corte en la mano',critico:'no',medidas:'Guantes adecuados',responsable:u.nombre}];
 assert.equal(M.validarPaso(a,'pasos').length,0);
 for(const key of ['peligro','riesgo']){const b=structuredClone(a);b.pasos[0][key]=' ';assert(M.validarPaso(b,'pasos').some(x=>x.includes(key)));assert(A.pasosHTML(a).includes('data-campo="pasos.0.'+key+'"'));}
 assert(A.pasosHTML(a).includes('placeholder="Ej.'));assert(!A.pasosHTML(a).includes('data-campo="pasos.0.evento"'));
 a.personal=[{nombre:u.nombre,dni:'12345678',firma:PNG}];a.supervisorFirma={nombre:'Supervisor Ficticio',firma:PNG};a.estado='REGISTRADO';a.permisos.caliente=true;await w.Store.guardar(a);
 const p=M.nuevoPETARBP('PETAR-V12',u,a),cfg=M.configPetar(p);
 p.descripcion.horaInicio='08:00';p.descripcion.horaFin='18:00';
 assert.equal(M.validarPaso(p,'descripcion').length,0);assert(!A.descripcion(p).includes('descripcion.lugar'));
 assert.equal(p.emergencia.encargadoSede,'Sandro Vallebuona');assert.equal(p.emergencia.contactos.length,3);
 M.aplicarContactos(p,{encargadoSede:'Otro',telefono:'000',contacto:'Otro',responsableArea:'Otro'});
 const eh=A.emergencia(p);
 for(const x of C.contactosEmergencia){assert(eh.includes(x.nombre));assert(eh.includes('href="tel:'+x.telefono+'"'));}
 assert(!eh.includes('data-campo="emergencia.telefono"'));assert.equal(p.emergencia.encargadoSede,'Sandro Vallebuona');
 assert.equal(cfg.firmasAutorizacion.map(x=>x.clave).join(','),'supervisor,ejecutante');
 assert(M.validarFirmas(p).some(x=>x.includes('ejecutante')));assert(!M.validarFirmas(p).some(x=>x.includes('responsable del área')));
 cfg.requisitos.forEach(x=>p.requisitos[x.id]='si');cfg.caliente.forEach(x=>p.caliente[x.id]='si');cfg.adicionales.forEach(x=>p.adicionales[x.id]='si');
 p.epp.guantes_hyflex=true;p.emergencia.supervisorPrevencionista='Supervisor Ficticio';p.emergencia.rutasLibres='si';p.emergencia.rutasIndicadas='si';cfg.emergencias.forEach(x=>p.emergencia.emergencias[x]='si');cfg.equiposEmergencia.forEach(x=>p.emergencia.equipos[x]='si');
 assert.equal(M.validarTodo(p).length,0);assert.equal(M.bloqueos(p).length,0);
 M.usarFirmaATS(p,'supervisor');M.usarFirmaATS(p,'ejecutante');assert.equal(M.validarFirmas(p).length,0);
 A.estado.doc=p;A.estado.pantalla='firmas';A.firmas();
 assert(el('#app').innerHTML.includes('Añadir firma desde imagen'));assert(el('#app').innerHTML.includes('retroceder-revisar'));assert(!el('#app').innerHTML.includes('Responsable del área'));
 const signatures=JSON.stringify(p.autorizacion);
 A.clic({target:{closest(){return {dataset:{accion:'retroceder-revisar'}};}}});await tick();await tick();
 assert.equal(A.estado.pantalla,'revision');assert.equal(JSON.stringify(p.autorizacion),signatures);assert.equal(saved.get(p.id).autorizacion.ejecutante.firma,PNG);
 A.ir('firmas');await tick();assert.equal(A.estado.pantalla,'firmas');assert.equal(p.autorizacion.ejecutante.firma,PNG);
 // Upload failure or cancellation must preserve existing signature; success replaces ATS origin.
 const input=type=>({value:'file',dataset:{firmaImagen:'autorizacion.ejecutante'},files:[{type,size:100}]});
 await A.cargar(input('text/plain'));assert.equal(revoked,0);
 w.UI.confirmar=async()=>false;await A.cargar(input('image/png'));assert.equal(revoked,0);
 w.UI.confirmar=async()=>true;nextImageFails=true;await A.cargar(input('image/png'));assert(p.autorizacion.ejecutante.origenFirma);assert.equal(revoked,1);
 nextImageFails=false;await A.cargar(input('image/png'));assert.equal(p.autorizacion.ejecutante.firma,PNG);assert(!p.autorizacion.ejecutante.origenFirma);assert.equal(revoked,2);
 // Editing the signer invalidates the attached signature.
 A.entrada({type:'input',target:{dataset:{campo:'autorizacion.ejecutante.nombre'},value:'Otra Persona'}});assert.equal(p.autorizacion.ejecutante.firma,'');assert.equal(p.autorizacion.ejecutante.fechaHora,'');
 p.autorizacion.ejecutante.nombre=u.nombre;M.usarFirmaATS(p,'ejecutante');
 // Reviewing keeps signatures; entering editable content clears them after confirmation.
 A.ir('form',0);await tick();await tick();await tick();assert.equal(A.estado.pantalla,'form');assert.equal(p.autorizacion.supervisor.firma,'');assert.equal(p.autorizacion.ejecutante.firma,'');
 const ta=pdfText(a),tp=pdfText(p);assert(ta.includes('Peligro'));assert(ta.includes('Riesgo'));assert(ta.includes('Borde filoso'));assert(!ta.includes('Ubicaci'));
 for(const x of C.contactosEmergencia){assert(tp.includes(x.nombre));assert(tp.includes(x.telefono));}assert(!tp.includes('Lugar espec'));assert(!tp.includes('Responsable del'));
 assert(!M.correoHTML(p,'petarAutorizado').includes('Responsable del área'));assert(!M.correoHTML(a,'atsRegistrado').includes('Ubicación'));
 // Legacy signed and final documents keep the exact data and old format.
 const old=structuredClone(p);delete old.formularioVersion;old.estado='AUTORIZADO';old.autorizacion.area.nombre='Responsable Histórico';old.autorizacion.area.firma=PNG;old.descripcion.lugar='Bahía histórica';
 const snapshot=JSON.stringify(old);M.normalizar(old);assert.equal(JSON.stringify(old),snapshot);assert(M.configPetar(old).firmasAutorizacion.some(x=>x.clave==='area'));assert(pdfText(old).includes('Responsable Hist'));
 old.estado='BORRADOR';const signedDraft=JSON.stringify(old);M.normalizar(old);assert.equal(JSON.stringify(old),signedDraft);
 M.limpiarFirmas(old);M.normalizar(old);assert.equal(old.formularioVersion,12);assert.equal(old.emergencia.contactos.length,3);
 const legacyATS=structuredClone(a);delete legacyATS.formularioVersion;legacyATS.estado='BORRADOR';legacyATS.personal=[];legacyATS.supervisorFirma=M.firmante();legacyATS.pasos=[{paso:'Cortar',evento:'Borde → corte',critico:'no',medidas:'Guantes',responsable:u.nombre}];
 M.normalizar(legacyATS);assert.equal(legacyATS.pasos[0].evento,'Borde → corte');assert(A.pasosHTML(legacyATS).includes('Referencia del registro anterior'));assert.equal(M.validarPaso(legacyATS,'pasos').length,2);
 if(process.env.PETAR_QA_PDF){for(const [suffix,d] of [['ats',a],['petar',p]])fs.writeFileSync(process.env.PETAR_QA_PDF+'_'+suffix+'.pdf',Buffer.from(w.DocPDF.generar(d).output('arraybuffer')));}
 console.log('OK: v12 — contactos y encargado automáticos, campos separados, sin ubicación ni responsable de área, carga de firma, revisión sin pérdida, edición invalida firmas, PDF e históricos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
