/* Ejecutar: node tests/v08.cjs. ATS precargado desde el catálogo B&P y PETAR B&P. Solo datos ficticios y sin red. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const w={jspdf:require(path.join(root,'jspdf.umd.min.js'))};
const ctx=vm.createContext({window:w,document:{addEventListener(){}},console,Date,Math,Uint8Array,setTimeout,clearTimeout});
for(const f of ['config.js','catalogo_bp.js','modelo.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(src.replace('window.App = { estado: st };','window.App = { estado: st, tareas: fAtsTareas, generales: fAtsGenerales, descripcion: fPDescripcion, requisitos: fPRequisitos, caliente: fPCaliente, emergencia: fPEmergencia };'),ctx);
const C=w.SST_CONFIG,M=w.Modelo,A=w.App,K=w.SST_CATALOGO,u={nombre:'Técnico Ficticio Uno',cargo:'Técnico de Carrocería'};
C.sede='Ate';C.sedeCodigo='ATE';C.modoPrueba=true;
// Catálogo
assert.equal(K.tareas.length,22); assert.equal(K.puestos.length,4);
assert(!C.petar.emergencias.includes('Tsunami')); assert.equal(C.petar.horaFinTurno,'18:00'); assert.equal(C.ats.maxPasos,30);
// ATS precargado
const a=M.nuevoATS('ATS-PRUEBA',u); assert.equal(a.catalogo,'bp-v1'); assert.equal(a.pasos.length,0);
assert.deepEqual(M.pasos(a).map(x=>x.id).join(),'tareas,generales,pasos,epp');
assert(M.validarPaso(a,'tareas').length>0);
a.generales.puesto='Técnico de Carrocería';
assert(A.tareas(a).includes('Esmerilar piezas'));assert(!A.tareas(a).includes('Preparar la pintura'));
a.tareasCatalogo=['T01','T08']; M.aplicarTareas(a);
assert.equal(a.pasos.length,7); assert(a.pasos.every(p=>p.responsable===u.nombre&&p.origen));
assert.equal(a.permisos.caliente,true); assert(!a.permisos.altura);
assert(a.generales.tarea.includes('Esmerilar')); assert(a.otrosEpp.includes('Careta para esmeril')); assert(a.herramientas.includes('Esmeril'));
assert.equal(a.epp.guantes,true); assert.equal(a.epp.auditiva,true);
assert.equal(M.validarPaso(a,'tareas').length,0); assert.equal(M.validarPaso(a,'pasos').length,0);
// Edición conservada y textos editados no se pisan
a.pasos[3].medidas='Medida editada en campo'; a.generales.tarea='Esmerilado de puerta — placa ABC-123';
a.tareasCatalogo.push('T22'); M.aplicarTareas(a);
assert(a.pasos.some(p=>p.medidas==='Medida editada en campo')); assert.equal(a.generales.tarea,'Esmerilado de puerta — placa ABC-123');
assert(!a.permisos.altura); assert(M.validarPaso(a,'tareas').some(x=>x.includes('1,80')));
a.alturaDesde18='si'; M.aplicarTareas(a); assert.equal(a.permisos.altura,true);
a.alturaDesde18='no'; M.aplicarTareas(a); assert.equal(a.permisos.altura,false);
a.tareasCatalogo=a.tareasCatalogo.filter(c=>c!=='T08'); M.aplicarTareas(a); assert.equal(a.permisos.caliente,false); assert(!a.pasos.some(p=>p.origen==='T08'));
a.tareasCatalogo.push('T08'); M.aplicarTareas(a); assert.equal(a.permisos.caliente,true);
// Ubicación de la sede
M.aplicarUbicacion(a,'Nivel 1 – Bahía 3'); assert.equal(a.generales.ubicacion,'Nivel 1 – Bahía 3'); assert.equal(a.generales.ubicacionTipo,'abierta');
assert(A.generales(a).includes('Nivel 1 – Horno 5 (lado B)'));
assert(A.generales(a).includes('data-ruta="permisos.caliente" disabled'));
// Registro simulado del ATS
a.generales.supervisor='Supervisor Ficticio'; a.personal=[{nombre:u.nombre,dni:'12345678',firma:'data:x',fechaHora:'t'},{nombre:'Ayudante Ficticio',dni:'87654321',firma:'data:y',fechaHora:'t'}];
a.supervisorFirma={nombre:'Supervisor Ficticio',firma:'data:z'}; a.estado='REGISTRADO';
assert(M.atsRequierePetar(a));
// PETAR B&P
const p=M.nuevoPETARBP('PETAR-PRUEBA',u,a);
assert.equal(p.perfilPetar,'bp-v1'); assert.deepEqual(JSON.parse(JSON.stringify(p.tipos)),{caliente:true,altura:false,peligrosos:false});
assert.equal(p.participantes.length,2); assert.equal(p.requisitos.r_ats,'si'); assert.equal(p.caliente.c_lel,'na');
assert(['18:00',''].includes(p.descripcion.horaFin)); assert.equal(p.autorizacion.ejecutante.nombre,u.nombre);
assert(!A.descripcion(p).includes('capacitación previa')); assert(A.caliente(p).includes('bahía abierta')); assert(A.requisitos(p).includes('firmaron el ATS'));
assert(!A.emergencia(p).includes('Tsunami'));
assert(!M.validarPaso(p,'descripcion').some(x=>x.includes('capacitación'))||p.descripcion.horaFin==='');
assert.deepEqual(M.pasos(p).map(x=>x.id).join(),'descripcion,epp,requisitos,caliente,evidencias,emergencia');
// Participante que no firmó el ATS
p.participantes.push({nombre:'Persona Sin ATS',dni:'11112222',firma:'data:w'});
assert(M.validarFirmas(p).some(x=>x.includes('Persona Sin ATS')&&x.includes('no firmó el ATS')));
p.participantes.pop(); assert(!M.validarFirmas(p).some(x=>x.includes('no firmó el ATS')));
// Altura + peligrosos en un solo PETAR
const b=M.nuevoATS('ATS-PRUEBA-2',u); b.generales.puesto='Ayudante de Pintura'; b.tareasCatalogo=['T20','T22']; b.alturaDesde18='si'; M.aplicarTareas(b);
b.personal=[{nombre:'Ayudante Ficticio',dni:'87654321',firma:'data:y'}]; b.estado='REGISTRADO';
const q=M.nuevoPETARBP('PETAR-PRUEBA-2',u,b);
assert.deepEqual(JSON.parse(JSON.stringify(q.tipos)),{caliente:false,altura:true,peligrosos:true});
assert.deepEqual(M.pasos(q).map(x=>x.id).join(),'descripcion,epp,requisitos,altura,peligrosos,evidencias,emergencia');
assert(q.epp.arnes&&q.epp.linea_doble);
// ATS sin permisos de PETAR
const c=M.nuevoATS('ATS-PRUEBA-3',u); c.generales.puesto='Ayudante de Carrocería'; c.tareasCatalogo=['T04']; M.aplicarTareas(c);
assert(!M.atsRequierePetar(c)); assert.throws(()=>M.nuevoPETARBP('X',u,c));
// Documento anterior con Tsunami respondido: se conserva
const viejo=M.nuevoPETAR('PETAR-ANTERIOR',u); viejo.emergencia.emergencias={'Tsunami':'na','Sismo':'si'};
assert(M.emergenciasDe(viejo).includes('Tsunami'));
// PDF
function textoPdf(d){const raw=w.DocPDF.generar(d).output();return Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch{return m[1]}}).join('\n')}
const ta=textoPdf(a), tp=textoPdf(p);
assert(ta.includes('Puesto')); assert(!tp.includes('capacitaci\\363n previa')&&!tp.includes('capacitación previa'));
if(process.env.PETAR_QA_PDF){fs.writeFileSync(process.env.PETAR_QA_PDF+'_ats.pdf',Buffer.from(w.DocPDF.generar(a).output('arraybuffer')));fs.writeFileSync(process.env.PETAR_QA_PDF+'_petar.pdf',Buffer.from(w.DocPDF.generar(p).output('arraybuffer')));}
console.log('OK: v08 — ATS precargado desde el catálogo B&P, permisos por tarea, altura desde 1,80 m, PETAR B&P único por ATS, respuestas precargadas, emergencias y PDF.');
