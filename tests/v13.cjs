/* node tests/v13.cjs — conexión compartida, migración local y confirmación. Sin red real. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const values=new Map(),elements={};const element=k=>elements[k]||(elements[k]={innerHTML:'',value:'',classList:{add(){},remove(){}}});
const w={crypto:require('node:crypto').webcrypto,jspdf:require(path.join(root,'jspdf.umd.min.js')),scrollTo(){}};
const nav={onLine:true};let calls=0,lastRequest,reply;
const ctx=vm.createContext({window:w,navigator:nav,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},document:{addEventListener(){},querySelector:element,querySelectorAll(){return []}},Date,Math,Promise,Uint8Array,AbortController,console,setTimeout,clearTimeout,fetch:async(url,init)=>{calls++;lastRequest={url,init,payload:JSON.parse(init.body)};return reply(lastRequest.payload);}});
for(const f of ['config.js','modelo.js','datos.js','ui.js','pdf.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const C=w.SST_CONFIG,M=w.Modelo,E=w.Envio;C.sede='Ate';C.sedeCodigo='ATE';
const response=(status,data)=>({status,ok:status>=200&&status<300,text:async()=>data===undefined?'':JSON.stringify(data)});
let src=fs.readFileSync(path.join(root,'app.js'),'utf8');
src=src.replace('window.App = { estado: st };',"window.App = { estado: st, ajustes: vAjustes, inicio: vInicio, textoEnvio: textoEnvio, clic: clic, probar: probarEnvio, setup: function(){app=$('#app');} };");vm.runInContext(src,ctx);
const A=w.App;A.setup();A.estado.sstAutorizado=true;A.estado.usuario={nombre:'Usuario Ficticio',cargo:'Técnico'};w.UI.aviso=()=>{};
(async()=>{
 assert.equal(C.envioDirecto,true);assert.equal(C.claveArea,'');assert(E.configurado());
 const endpoint=new URL(C.flujoUrl);assert.equal(endpoint.protocol,'https:');assert(endpoint.hostname.endsWith('.environment.api.powerplatform.com'));assert(endpoint.searchParams.has('sig'));
 assert(C.enviarAl.atsRegistrado&&C.enviarAl.petarAutorizado&&C.enviarAl.petarCerrado);
 const originalURL=C.flujoUrl;
 E.aplicarConfiguracionLocal('https://example.invalid/antiguo','CLAVE_ANTIGUA');assert.equal(C.flujoUrl,originalURL);assert.equal(C.claveArea,'');
 E.aplicarConfiguracionLocal(null,null);assert.equal(C.flujoUrl,originalURL);
 // La conexión compartida no se puede sustituir desde el formulario antiguo.
 A.clic({target:{closest(){return {dataset:{accion:'guardar-conexion'}};}}});assert.equal(C.flujoUrl,originalURL);
 A.ajustes();let html=element('#app').innerHTML;assert(html.includes('configurado para todos los dispositivos'));assert(!html.includes('id="aUrl"'));assert(!html.includes('id="aClave"'));assert(!html.includes(originalURL));assert(html.includes('data-accion="probar-envio"'));
 await w.Store.init();A.inicio();await new Promise(resolve=>setImmediate(resolve));html=element('#app').innerHTML;assert(html.includes('Envío automático a SST activado'));assert(!html.includes('Envío a SST no configurado'));assert(html.includes('ATS de manera semanal'));assert(html.includes('lugar de trabajo quede ordenado'));
 const doc=M.nuevoATS('ATS-TEST-V13',A.estado.usuario);doc.generales.tarea='PRUEBA FICTICIA';
 reply=async()=>response(202);const accepted=await E.enviar(doc,'atsRegistrado');
 assert.equal(calls,1);assert.equal(lastRequest.url,originalURL);assert.equal(lastRequest.payload.clave,'');assert(lastRequest.payload.pdfBase64.startsWith('JVBERi0'));assert.equal(lastRequest.payload.momento,'atsRegistrado');
 assert.equal(accepted.resultado,'no_confirmado');assert.equal(accepted.aceptadoPorFlujo,true);assert(accepted.detalle.includes('aún no están confirmados'));assert(A.textoEnvio(accepted).includes('correo sin confirmar'));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,1); // Sin reintento automático.
 reply=async x=>response(200,{ok:true,numero:x.numero,idEnvio:x.idEnvio,archivo:'archivo-ficticio.pdf'});
 assert.equal((await E.enviar(doc,'reenvio')).resultado,'confirmado');
 reply=async x=>response(200,{ok:true,numero:'OTRO',idEnvio:x.idEnvio,archivo:'archivo-ficticio.pdf'});
 assert.equal((await E.enviar(doc,'reenvio')).resultado,'no_confirmado');
 reply=async()=>response(202,{ok:false,motivo:'rechazado'});const rejected=await E.enviar(doc,'reenvio');assert.equal(rejected.resultado,'rechazado');assert(!rejected.aceptadoPorFlujo);
 reply=async()=>response(403);assert.equal((await E.enviar(doc,'reenvio')).resultado,'rechazado');
 reply=async()=>{throw new Error('network')};const network=await E.enviar(doc,'reenvio');assert.equal(network.resultado,'no_confirmado');assert(!network.aceptadoPorFlujo);
 nav.onLine=false;const n=calls;assert.equal((await E.enviar(doc,'reenvio')).resultado,'pendiente');assert.equal(calls,n);nav.onLine=true;
 doc.prueba=true;assert.equal((await E.enviar(doc,'reenvio')).resultado,'prueba');assert.equal(calls,n);
 // El botón de prueba funciona con la configuración distribuida y un documento ficticio.
 reply=async()=>response(202);assert.equal((await A.probar()).aceptadoPorFlujo,true);assert.equal(lastRequest.payload.momento,'prueba_conexion');assert(lastRequest.payload.numero.startsWith('ATS-PRUEBA-CONEXION-'));
 assert(!JSON.stringify(doc.envios).includes(originalURL));assert(!JSON.stringify(doc.envios).includes(endpoint.searchParams.get('sig')));
 // Compatibilidad: el modo local exige URL y clave, y permite preferencias.
 C.envioDirecto=false;C.flujoUrl='';C.claveArea='';assert(!E.configurado());E.aplicarConfiguracionLocal('https://example.invalid/local','');assert(!E.configurado());E.aplicarConfiguracionLocal(null,'CLAVE_FICTICIA');assert(E.configurado());
 A.ajustes();assert(element('#app').innerHTML.includes('id="aUrl"'));assert(element('#app').innerHTML.includes('id="aClave"'));
 console.log('OK: v13 — envío listo sin configuración local, preferencias antiguas ignoradas, PDF enviado, 202 sin confirmación falsa, prueba de conexión, modo local y errores.');
})().catch(e=>{console.error(e);process.exitCode=1;});
