/* Ejecutar: node tests/v09.cjs. PETAR B&P simplificado (perfil bp-v2). Solo datos ficticios y sin red. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const w={jspdf:require(path.join(root,'jspdf.umd.min.js'))};
const ctx=vm.createContext({window:w,document:{addEventListener(){}},console,Date,Math,Uint8Array,setTimeout,clearTimeout});
for(const f of ['config.js','catalogo_bp.js','modelo.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(src.replace('window.App = { estado: st };','window.App = { estado: st, epp: fPEpp, requisitos: fPRequisitos, caliente: fPCaliente, altura: fPAltura, peligrosos: fPPeligrosos, emergencia: fPEmergencia, firmas: vFirmas, setDoc: function (d) { st.doc = d; st.errores = []; } };'),ctx);
const C=w.SST_CONFIG,M=w.Modelo,A=w.App,u={nombre:'Técnico Ficticio Uno',cargo:'Técnico de Carrocería'};
C.sede='Ate';C.sedeCodigo='ATE';C.modoPrueba=true;C.ats.modoLlenado='catalogo'; /* v11: estas pruebas cubren el modo con catálogo */
function atsCon(tareas,altura){const a=M.nuevoATS('ATS-P',u);a.generales.puesto='Técnico de Carrocería';a.tareasCatalogo=tareas;a.alturaDesde18=altura||'';M.aplicarTareas(a);
  M.aplicarUbicacion(a,'Nivel 1 – Bahía 2');a.personal=[{nombre:u.nombre,dni:'12345678',firma:'data:x'},{nombre:'Ayudante Ficticio',dni:'87654321',firma:'data:y'}];a.estado='REGISTRADO';return a;}
const p=M.nuevoPETARBP('PETAR-P',u,atsCon(['T08']));
const cfg=M.configPetar(p);
assert.equal(p.perfilPetar,'bp-v2'); assert(cfg.sinVigias&&cfg.sinMonitoreo&&cfg.sinFotos&&cfg.soloAutorizacion);
// 1. Requisitos generales: 8 preguntas con el texto aprobado
assert.equal(cfg.requisitos.length,8);
assert.deepEqual(cfg.requisitos.map(r=>r.id).join(),'r_ats,r_calificadas,r_instruidas,r_epp,r_aislada,r_equipos,r_entorno,r_electricas');
const hr=A.requisitos(p); assert(hr.includes('aislado correctamente')); assert(hr.includes('sin producir daños en el entorno')); assert(!hr.includes('Ver pregunta completa'));
// 2. Caliente: 4 preguntas, sin adicionales, sin vigía, sin LEL
assert.deepEqual(cfg.caliente.map(r=>r.id).join(),'c_radio,c_extintor,c_herramientas,c_biombos'); assert.equal(cfg.adicionales.length,0);
const hc=A.caliente(p); assert(!hc.includes('Vigía')); assert(!hc.includes('Controles adicionales')); assert(!hc.includes('LEL'));
cfg.caliente.forEach(x=>p.caliente[x.id]='si'); assert.equal(M.validarPaso(p,'caliente').length,0);
p.caliente.c_biombos='no'; assert(M.bloqueos(p).some(x=>x.includes('biombos'))); p.caliente.c_biombos='si';
// 3. EPP de caliente: los 8 indicados, marcados; sin gorro ni calzado
const ids=cfg.epp.find(g=>g.tipo==='caliente').items.map(i=>i.id);
assert.deepEqual(ids.join(),'careta_soldar,resp_filtro,mandil_cuero,escarpines,lentes,guantes_cuero,auditiva,careta_esmerilar');
assert(ids.every(k=>p.epp[k])); assert(!p.epp.gorro_antigolpe);
const he=A.epp(p); assert(he.includes('Careta de esmerilar')); assert(!he.includes('Arnés')); assert(!he.includes('Gorro antigolpe'));
// 4. Pasos: sin fotos; emergencias sin tsunami ni trípode
assert.deepEqual(M.pasos(p).map(x=>x.id).join(),'descripcion,epp,requisitos,caliente,emergencia');
const hm=A.emergencia(p); assert(!hm.includes('Trípode')); assert(!hm.includes('Tsunami')); assert(hm.includes('Botiquín'));
// 5. Firmas: solo autorización; participantes del ATS sin firma en el PETAR

const fe=M.validarFirmas(p); assert(!fe.some(x=>x.includes('participante')||x.includes('vigía')||x.includes('sección VII')));
assert(fe.some(x=>x.includes('supervisor del trabajo'))); assert(fe.some(x=>x.includes('responsable del área')));
['supervisor','area','ejecutante'].forEach((k,i)=>{p.autorizacion[k].nombre=['Sup Ficticio','Resp Ficticio',u.nombre][i];p.autorizacion[k].firma='data:z';});
assert.equal(M.validarFirmas(p).length,0);
// Sin monitoreo: caliente + inflamables no se autoriza (sin campo LEL)
const q=M.nuevoPETARBP('PETAR-Q',u,atsCon(['T08','T20']));
assert(q.tipos.caliente&&q.tipos.peligrosos); assert(!M.configPetar(q).peligrosos.some(x=>x.id==='q_atmosfera'));
q.quimicos.inflamable='si'; assert(!A.peligrosos(q).includes('LEL medido')); assert(M.bloqueos(q).some(x=>x.includes('Separa las tareas')));
// Altura: sin vigía
const h=M.nuevoPETARBP('PETAR-H',u,atsCon(['T22'],'si')); assert(h.tipos.altura); assert(!A.altura(h).includes('Vigía'));
assert(h.epp.arnes&&h.epp.linea_doble);
// Documentos anteriores bp-v1 conservan su formato (vigía y adicionales)
const viejo=JSON.parse(JSON.stringify(p)); viejo.perfilPetar='bp-v1';
assert(A.caliente(viejo).includes('Vigía')); assert(M.pasos(viejo).some(x=>x.id==='evidencias'));
// PDF
function textoPdf(d){const raw=w.DocPDF.generar(d).output();return Array.from(raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)).map(m=>{try{return require('node:zlib').inflateSync(Buffer.from(m[1],'binary')).toString('latin1')}catch{return m[1]}}).join('\n')}
const t=textoPdf(p);
assert(!t.includes('Vig')); assert(!t.includes('Monitoreo')); assert(!t.includes('REGISTRO FOTOGR')); assert(t.includes('ATS-P'));
if(process.env.PETAR_QA_PDF)fs.writeFileSync(process.env.PETAR_QA_PDF,Buffer.from(w.DocPDF.generar(p).output('arraybuffer')));
console.log('OK: v09 — PETAR B&P simplificado: requisitos y caliente con texto aprobado, EPP por tipo, sin vigías, sin monitoreo, sin fotos, solo autorización y compatibilidad bp-v1.');
