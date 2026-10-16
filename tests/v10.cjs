/* Ejecutar: node tests/v10.cjs. Firma del ATS reutilizada en la autorización del PETAR B&P. Solo datos ficticios y sin red. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const w={jspdf:require(path.join(root,'jspdf.umd.min.js'))};
const ctx=vm.createContext({window:w,document:{addEventListener(){}},console,Date,Math,Uint8Array,setTimeout,clearTimeout});
for(const f of ['config.js','catalogo_bp.js','modelo.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const C=w.SST_CONFIG,M=w.Modelo,u={nombre:'Técnico Ficticio Uno',cargo:'Técnico de Carrocería'};
C.sede='Ate';C.sedeCodigo='ATE';C.modoPrueba=true;C.ats.modoLlenado='catalogo'; /* v11: estas pruebas cubren el modo con catálogo */
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const a=M.nuevoATS('ATS-P',u);a.generales.puesto='Técnico de Carrocería';a.tareasCatalogo=['T08'];M.aplicarTareas(a);M.aplicarUbicacion(a,'Nivel 1 – Bahía 2');
a.generales.supervisor='Supervisor Ficticio';
a.personal=[{nombre:'Tecnico Ficticio Uno',dni:'12345678',firma:PNG},{nombre:'Ayudante Ficticio',dni:'87654321',firma:PNG}];
a.supervisorFirma={nombre:'Supervisor Ficticio',firma:PNG,fechaHora:'t'};a.estado='REGISTRADO';
const p=M.nuevoPETARBP('PETAR-P',u,a);
assert.equal(p.firmasATS.length,3);
// Supervisor y ejecutante (nombre con o sin tilde) tienen firma del ATS; responsable del área no.
assert(M.firmaATSPara(p,'supervisor')); assert(M.firmaATSPara(p,'ejecutante')); 
p.autorizacion.area.nombre='Responsable Ficticio'; assert.equal(M.firmaATSPara(p,'area'),null);
assert(M.usarFirmaATS(p,'supervisor')&&M.usarFirmaATS(p,'ejecutante'));
assert.equal(p.autorizacion.supervisor.firma,PNG); assert.equal(p.autorizacion.supervisor.origenFirma.ats,'ATS-P');
p.autorizacion.area.firma=PNG;
assert.equal(M.validarFirmas(p).length,0);
// Si cambia el nombre, la firma del ATS deja de valer
p.autorizacion.ejecutante.nombre='Otra Persona'; assert(M.validarFirmas(p).some(x=>x.includes('vuelve a firmar')));
p.autorizacion.ejecutante.nombre=u.nombre; assert.equal(M.validarFirmas(p).length,0);
// Al editar el documento se borran firmas y su origen
M.limpiarFirmas(p); assert(!p.autorizacion.supervisor.origenFirma); assert.equal(p.autorizacion.supervisor.firma,'');
// Nombre desconocido: no hay firma del ATS
p.autorizacion.supervisor.nombre='Alguien Más'; assert.equal(M.firmaATSPara(p,'supervisor'),null); assert(!M.usarFirmaATS(p,'supervisor'));
// PDF registra el origen
p.autorizacion.supervisor.nombre='Supervisor Ficticio'; M.usarFirmaATS(p,'supervisor');
const raw=w.DocPDF.generar(p).output();const t=Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch{return m[1]}}).join('\n');
assert(t.includes('Firma del ATS-P confirmada'));
// Perfiles anteriores no ofrecen la opción
const viejo=JSON.parse(JSON.stringify(p)); viejo.perfilPetar='bp-v1'; assert.equal(M.firmaATSPara(viejo,'supervisor'),null);
console.log('OK: v10 — firma del ATS reutilizable en la autorización (supervisor y ejecutante), con confirmación, control de nombre, limpieza y registro en PDF.');
