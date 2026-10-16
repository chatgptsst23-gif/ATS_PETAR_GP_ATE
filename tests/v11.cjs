/* Ejecutar: node tests/v11.cjs. ATS de llenado manual y PETAR vinculado. Solo datos ficticios y sin red. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const w={jspdf:require(path.join(root,'jspdf.umd.min.js'))};
const ctx=vm.createContext({window:w,document:{addEventListener(){}},console,Date,Math,Uint8Array,setTimeout,clearTimeout});
for(const f of ['config.js','catalogo_bp.js','modelo.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(src.replace('window.App = { estado: st };','window.App = { estado: st, generales: fAtsGenerales, pasos: fAtsPasos };'),ctx);
const C=w.SST_CONFIG,M=w.Modelo,A=w.App,u={nombre:'Técnico Ficticio Uno',cargo:'Técnico de Carrocería'};
C.sede='Ate';C.sedeCodigo='ATE';C.modoPrueba=true;
assert.equal(C.ats.modoLlenado,'manual'); assert(!M.precargaATS());
const a=M.nuevoATS('ATS-M',u);
assert.equal(a.catalogo,''); assert(M.esAtsManual(a)); assert(!M.usaCatalogo(a));
assert.deepEqual(M.pasos(a).map(x=>x.id).join(),'generales,pasos,epp');
assert.equal(a.pasos.length,1); assert.equal(a.pasos[0].paso,'');
const hg=A.generales(a); assert(hg.includes('Nivel 1 – Bahía 1')); assert(hg.includes('data-ruta="permisos.caliente"')); assert(!hg.includes('disabled'));
assert(!A.pasos(a).includes('ejemplo-pasos')); assert(!A.pasos(a).includes('vienen de las tareas'));
// El trabajador llena todo
assert(M.validarPaso(a,'generales').length>0); assert(M.validarPaso(a,'pasos').length>0);
a.generales.tarea='Esmerilado de puerta — placa ficticia'; M.aplicarUbicacion(a,'Nivel 1 – Bahía 4'); a.generales.supervisor='Supervisor Ficticio';
a.pasos[0]={paso:'Esmerilar',evento:'Chispas → incendio',critico:'si',medidas:'Extintor y biombos',responsable:u.nombre};
assert.equal(M.validarPaso(a,'generales').length,0); assert.equal(M.validarPaso(a,'pasos').length,0);
assert(!M.atsRequierePetar(a)); a.permisos.caliente=true; assert(M.atsRequierePetar(a));
assert(A.generales(a).includes('te ofrecerá realizar el PETAR'));
// PETAR vinculado desde ATS manual
a.personal=[{nombre:u.nombre,dni:'12345678',firma:'data:x'}]; a.supervisorFirma={nombre:'Supervisor Ficticio',firma:'data:y'}; a.estado='REGISTRADO';
const p=M.nuevoPETARBP('PETAR-M',u,a);
assert.equal(p.descripcion.atsId,a.id); assert.equal(p.descripcion.atsRef,'ATS-M'); assert.equal(p.perfilPetar,'bp-v2'); assert(p.tipos.caliente);
assert.equal(p.descripcion.lugar,'Nivel 1 – Bahía 4'); assert.equal(p.descripcion.lugarTipo,'abierta');
// Pasos del PDF del ATS manual
const raw=w.DocPDF.generar(a).output(); assert(raw.length>1000);
console.log('OK: v11 — ATS de llenado manual (sin precarga), ubicaciones de la sede, permisos marcados por el trabajador y PETAR vinculado al ATS.');
