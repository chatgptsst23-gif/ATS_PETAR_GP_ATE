# ATS y PETAR — Grupo Pana · Multisede

## v11 · ATS de llenado manual y PETAR vinculado al terminar el ATS

- **El trabajador llena el ATS** (decisión del área, 16-10-2026): ya no se eligen tareas del catálogo ni se precargan pasos, peligros, controles ni EPP. El ATS vuelve a 3 pasos: datos de la tarea, pasos/riesgos/controles y EPP. Se mantienen la fecha y hora automáticas, la lista de ubicaciones de la sede (Ate) y el supervisor desde los datos de la sede.
- **Permisos:** los marca el trabajador, con ayuda en pantalla (caliente: soldadura, esmerilado, spotter u oxicorte; altura desde 1,80 m; materiales peligrosos no rutinarios). Estos tres requieren PETAR.
- **Al registrar un ATS que requiere PETAR**, la app pregunta "¿Realizar ahora el PETAR?" y, si se acepta, lo crea vinculado a ese ATS. Si se elige "Más tarde", el detalle del ATS muestra "Realizar PETAR con este ATS".
- **Trazabilidad ATS ↔ PETAR:** el detalle del ATS lista sus PETAR vinculados (o avisa si requiere uno y aún no lo tiene) y el detalle del PETAR tiene "Ver ATS …".
- El catálogo de tareas (`catalogo_bp.js`) se conserva desactivado; se reactiva con `ats.modoLlenado: 'catalogo'`. Los borradores de ATS creados con catálogo conservan su formato.

Validación: `node tests/v11.cjs` (además de `regresion`, `carroceria`, `v08`, `v09` y `v10`).

## v10 · Firma del ATS en la autorización del PETAR

- En la autorización del PETAR B&P (`bp-v2`), el **supervisor del trabajo** y el **ejecutante** pueden tocar **"Usar mi firma del ATS"** si firmaron el ATS vinculado (se compara el nombre, sin distinguir mayúsculas ni tildes). Antes de aplicarla, la persona confirma que es ella; el **responsable del área** firma a mano.
- La firma no se copia sola: solo con el toque y la confirmación en el momento de autorizar, después de revisar las condiciones del PETAR.
- El PDF registra "Firma del ATS … confirmada [fecha y hora]". Si se dibuja o se borra encima, o se edita el documento, la firma tomada del ATS se reemplaza o se borra. Si se cambia el nombre, la app exige firmar de nuevo.
- Los nombres siguen precargándose desde el ATS (supervisor) y desde el usuario (ejecutante); los participantes del ATS no vuelven a firmar (v09).
- Es una barrera interna del piloto, no una firma digital certificada: su valor como sustento formal lo define el área con legal.

Validación: `node tests/v10.cjs` (además de `regresion`, `carroceria`, `v08` y `v09`).

## v09 · PETAR B&P simplificado (perfil `bp-v2`)

Cambios definidos por el área el 16-10-2026. Aplican a los PETAR nuevos; los PETAR `bp-v1`, `carroceria-v1` y anteriores conservan su formato en pantalla y PDF.

- **Sin vigías** ni firmas de vigía (caliente y altura).
- **Sin monitoreo del ambiente:** se retiran la pregunta de LEL/espacio cerrado, el campo "LEL medido" y la medición de atmósferas de materiales peligrosos. Trabajo en caliente + productos inflamables en el mismo permiso **no se autoriza**: se separan las tareas en tiempo o lugar.
- **EPP por tipo de trabajo** (solo se muestra el grupo de los tipos activos y viene marcado; se desmarca lo que no se use). Caliente: careta de soldar, respirador con filtro, mandil de cuero, escarpines, lentes/sobrelentes, guantes de cuero, protección auditiva y careta de esmerilar. Altura y materiales peligrosos: listas provisionales, **pendientes de definir**. Ya no se copian los EPP del ATS.
- **Requisitos generales:** 8 preguntas con el texto aprobado (incluye "¿El área de trabajo se ha aislado correctamente?" y "¿El espacio permite realizar el trabajo sin producir daños en el entorno?").
- **Trabajo en caliente:** 4 preguntas (12 m, extintor PQS 9 kg, herramientas/máquina de soldar, biombos). Se retiran los controles adicionales.
- **Trabajo en altura:** sin cambios de contenido (pendiente de definir por el área), sin vigía.
- **Sin fotos de evidencia.** Emergencias se mantienen (sin tsunami ni trípode).
- **Firmas:** tras emergencias se pasa a la autorización (supervisor del trabajo, responsable del área y ejecutante). Los participantes no vuelven a firmar: el PDF los lista con "Firmó el ATS …" y la app bloquea si alguien del PETAR no firmó el ATS.

Validación: `node tests/v09.cjs` (además de `regresion`, `carroceria` y `v08`).

## v08 · ATS precargado desde el catálogo de tareas B&P

Objetivo: reducir el tiempo de llenado en campo (40–45 min medidos con la v07.4) sin quitar controles. El tiempo nuevo debe medirse en campo.

- **ATS en 4 pasos:** *Tareas del día* → datos → pasos → EPP. El trabajador elige su **puesto** y una o varias **tareas** del catálogo (`catalogo_bp.js`, 22 tareas, derivado del IPERC B&P v03). La app precarga pasos, peligro → lesión, paso crítico, controles, responsable (quien lidera el ATS), EPP, herramientas y el texto de la tarea. Todo es editable; los pasos editados se conservan al cambiar tareas y los textos editados no se sobrescriben. Hay opción **Otra tarea** para trabajos fuera del catálogo.
- **Permisos por tarea (reglas del área, 10-10-2026):** soldadura, esmerilado y spotter → PETAR caliente siempre; trabajo en techos o zonas altas → PETAR altura si es **desde 1,80 m** (criterio provisional); ingreso no rutinario al horno → PETAR materiales peligrosos. Los permisos exigidos por las tareas quedan marcados y no se pueden quitar. Se agregó el permiso *Materiales peligrosos (no rutinario)* al ATS.
- **Ubicación:** en Ate se elige de una lista (Nivel 1 – Bahías 1 a 8 abiertas, Hornos 1 a 5) u *Otro lugar*. El tipo de ubicación se guarda en el ATS.
- **Un solo PETAR por ATS** (perfil `bp-v1`) con las secciones que exigen sus tareas: caliente (preguntas de carrocería), altura y/o materiales peligrosos. Hereda fecha, tarea, lugar, área, personal (nombre y DNI), EPP y supervisor; el ejecutante es el usuario que lo crea (cada técnico llena su PETAR). Hora final propuesta: **18:00** (`petar.horaFinTurno`), editable.
- **Respuestas precargadas con su motivo visible:** "¿El ATS se hizo con todos?" = Sí cuando todos los del ATS firmaron; la pregunta de espacio cerrado/LEL = N/A cuando la ubicación es una bahía abierta. Si se agrega al PETAR alguien que no firmó el ATS, no se puede autorizar.
- **Capacitación:** se elimina la pregunta duplicada "¿Se llevó a cabo la capacitación previa…?" en el PETAR B&P; queda "personal calificado" en *Revisión antes de empezar*.
- **Emergencias:** "Tsunami" retirado en todas las sedes. Los documentos anteriores que lo respondieron lo conservan en pantalla y PDF.
- **PDF:** fila de puesto y tareas del catálogo en el ATS; las flechas y símbolos sin soporte en la fuente se convierten (→ como ->).
- Los PETAR `carroceria-v1` y los formatos anteriores conservan su comportamiento.

Pendiente de validación de SST: contenido del catálogo (`catalogo_tareas_bp_v01.xlsx`), criterio de 1,80 m, lista de ubicaciones de Ate y precargas de respuestas.

Validación: `node tests/regresion.cjs`, `node tests/carroceria.cjs` y `node tests/v08.cjs`.

## v07.4 · PETAR de carrocería

Los PETAR nuevos se enfocan en soldadura y esmerilado de vehículos o piezas de carrocería. El ATS continúa disponible para carrocería y pintura.

- Inicio, descripción, preguntas, EPP y PDF utilizan el perfil `carroceria-v1`. Se vinculan a un ATS registrado con trabajo en caliente; los ATS que también indican otros permisos requieren gestionar ese alcance por separado.
- La pregunta general sobre paredes/techos se reemplaza por la revisión de ambas caras y cavidades de la pieza, tapizados, alfombras, espumas y protección del combustible. Se revisan los equipos reales, las bahías vecinas y el control de humos/polvo.
- Se retiran del perfil nuevo los selectores de altura/químicos, la sugerencia de pintura, las preguntas específicas de oxicorte y el trípode para espacios confinados. Se conserva una pregunta condicional sobre cilindros de gas de soldadura, con N/A cuando no se utilizan.
- No se copian respuestas de seguridad ni firmas. Los controles críticos nuevos con respuesta No bloquean la autorización; N/A solo se admite donde corresponde.
- Los documentos anteriores conservan el perfil general. Los borradores anteriores muestran un aviso para crear un PETAR nuevo si se requiere el formato de carrocería; no se reinterpretan sus respuestas.
- Esta corrección no establece exenciones por trabajo rutinario o bahía fija, ni define un tiempo de vigilancia posterior. El catálogo de tareas, el bloque específico de vehículos híbridos/eléctricos y los criterios de exigencia de permisos requieren desarrollo y validación adicionales con SST.
- Los valores de 12 m, extintor PQS de 9 kg y la condición de LEL existente se conservan del formato configurado; no se presentan como exigencias legales nuevas ni como valores derivados de las referencias siguientes.

Referencia técnica para adaptar el contenido a reparación vehicular: [HSE — Welding and flamecutting](https://www.hse.gov.uk/mvr/mechanical-repair/welding.htm). La guía no sustituye los procedimientos del fabricante ni los criterios internos aprobados.

Validación: `node tests/regresion.cjs` y `node tests/carroceria.cjs`. Pruebas sin red ni datos reales, con compatibilidad de formularios/PDF anteriores.

## v07.3 · llenado guiado y EPP de B&P

- ATS con cuatro opciones principales: gorro antigolpe, guantes, protección auditiva y respirador de media cara con filtro. Los demás EPP se detallan en **Otros EPP necesarios**.
- PETAR con 14 EPP de carrocería y pintura, guantes por modelo y orejeras/tapones separados. Los equipos de altura se muestran cuando aplica ese tipo.
- Sugerencias aditivas con un toque para soldadura, esmerilado y pintura/preparación. Son ayudas editables, no una certificación de suficiencia ni del estado del EPP. No se asigna un guante químico ni un filtro específico automáticamente.
- El ATS nuevo ya no marca trabajo en caliente por defecto. El PETAR hereda los permisos compatibles, los EPP coincidentes, el texto de otros EPP y los nombres del supervisor desde su ATS. Las firmas se realizan nuevamente.
- Preguntas de seguridad con un título corto, ayuda y acceso a la pregunta completa vigente. Se conservan sus controles, validaciones y criterios originales.
- El ATS pregunta por **peligro y riesgo para la persona**, con ejemplos que relacionan causa y lesión; el PDF nuevo usa el mismo enfoque.
- **Área SST → Ajustes → Datos repetidos** permite guardar seis datos de responsables/contactos por sede y dispositivo. Solo se completan campos vacíos en documentos nuevos; nunca respuestas Sí/No/N/A ni firmas. Cambiar de sede utiliza sus propios datos.
- Emergencias con opciones compactas y navegación con títulos simples; no se muestran tipos de permiso inactivos.
- Los documentos anteriores conservan su catálogo de EPP al generar el PDF. Al editar un borrador sin firmas se habilita el catálogo nuevo, conservando los EPP anteriores seleccionados para revisarlos explícitamente.
- Actualización de caché a v07.3. Tras abrir la web con conexión, cerrar y volver a abrir si aún aparece v07.2. **No borrar los datos del navegador**, porque ahí están los documentos locales.

La validez, el alcance, las firmas, las fotos exigidas y la autorización del PETAR no se amplían con esta actualización. El tiempo de llenado debe medirse en campo; no se promete una duración determinada.

## v07.2 · multisede (base operativa)

Versión operativa que integra las funciones v07, el acceso separado de **Usuario / Área SST**, evidencias fotográficas optimizadas para celulares y operación multisede.

### Sedes habilitadas

Montero (MON), Surquillo (SQO), Surco (SCO), San Miguel (SMG), Callao (CAL), Ate (ATE), Moquegua (MOQ) y Tacna (TAC).

La sede se selecciona una vez por dispositivo. Luego solo puede cambiarse desde **Ajustes del Área SST**. Cada ATS y PETAR conserva su sede de origen en el documento, PDF, correo y payload de Power Automate.

### Funciones principales

- ATS y PETAR para trabajos de alto riesgo.
- PETAR habilitado para **trabajo en caliente**, **trabajo en altura**, **materiales peligrosos no rutinarios** y **trabajo no rutinario**. Los demás tipos siguen desactivados.
- Trabajo en altura: controles de trabajo, acceso, protección contra caídas y uso de escaleras.
- Materiales peligrosos: productos utilizados, inflamabilidad y controles de exposición.
- Si caliente + inflamable están activos, la autorización exige LEL registrado en 0 % según el criterio definido para este piloto.
- Supervisor del trabajo y ejecutante deben ser personas distintas en la autorización.
- Los PETAR antiguos se normalizan al abrirse para conservar compatibilidad.

## Usuario y Área SST

### Usuario operativo

El usuario mantiene el comportamiento anterior:

- registra nombre y cargo en el dispositivo;
- puede cambiar de usuario;
- crea y gestiona ATS/PETAR;
- el campo **ATS liderado por** sigue iniciándose con el nombre del usuario y continúa siendo editable.

### Área SST

**Ajustes** está protegido por un acceso local separado:

1. Entrar en **Área SST**.
2. La primera vez, crear una clave SST de mínimo 6 caracteres.
3. En accesos posteriores, ingresar esa clave para abrir Ajustes.
4. Para cambiarla: **Área SST → Ajustes → Seguridad de Ajustes → Cambiar clave de acceso SST**.

No existe una contraseña SST fija dentro del repositorio. La aplicación guarda únicamente un hash SHA-256 local (`claveAjustesHash_v07`). Si existe la preferencia anterior `claveAjustesHash_v06`, se reutiliza como migración.

Esta barrera es local y no sustituye autenticación corporativa ni roles administrados por TI.

## Selección del tipo de PETAR

Un PETAR solo puede crearse desde un **ATS previamente registrado en el mismo dispositivo**.

- Se eliminó la opción de continuar sin vincular ATS.
- Al seleccionar el ATS, se copian tarea, lugar, personal y permisos compatibles como **Caliente** y/o **Altura**.
- Al activar un tipo, la app sugiere los EPP asociados; pueden ajustarse según la tarea real.
- Al desactivar Caliente, Altura o Materiales peligrosos, las evidencias fotográficas vinculadas a ese tipo se desvinculan y sus Blobs se eliminan del almacenamiento local.

## Vigías

La v07 integrada no presupone que el mismo trabajador sea vigía para dos riesgos distintos:

- **Vigía de trabajo en caliente**.
- **Vigía de trabajo en altura**.

Cada uno tiene nombre y firma independientes cuando el tipo correspondiente está activo. Los documentos antiguos con un único `vigia` se migran al abrirse para no perder información.

## Evidencias fotográficas optimizadas

Las fotografías se mantienen porque aportan trazabilidad, pero **no se exige una foto por cada pregunta**.

La app crea un paso independiente **Evidencias fotográficas** con evidencias mínimas según el tipo seleccionado:

- **Caliente:** área de trabajo acondicionada; equipos y medios de control.
- **Altura:** sistema de acceso/trabajo; protección contra caídas.
- **Materiales peligrosos:** producto e identificación; controles de exposición.

### Límites y rendimiento

- máximo **8 fotos por PETAR**;
- normalmente 2 evidencias por tipo de trabajo;
- hasta 2 fotos en una evidencia si se necesita una toma adicional;
- imagen principal: máximo **1024 px** en el lado mayor, JPEG calidad `0.65`;
- miniatura: máximo **240 px**, JPEG calidad `0.58`;
- se prefiere `createImageBitmap()` para decodificar la fotografía y se usa `ObjectURL + Image` como respaldo;
- no se usa `FileReader.readAsDataURL()` ni `canvas.toDataURL()` para almacenar fotografías.

### Almacenamiento de fotografías

Las fotos **no se guardan como Base64 dentro del JSON del PETAR**.

IndexedDB v2 incorpora un almacén separado `fotos`. El PETAR conserva únicamente referencias y metadatos (`id`, fecha/hora, texto, ancho y alto). Cada registro fotográfico guarda:

- Blob JPEG optimizado;
- Blob de miniatura;
- identificador del documento;
- metadatos mínimos.

La interfaz carga únicamente miniaturas cuando se muestran. La fotografía completa se recupera solo al abrirla o generar el PDF.

Si IndexedDB no está disponible y la app cae al respaldo `localStorage`, el ATS/PETAR sigue funcionando, pero la captura de evidencias fotográficas se deshabilita y se muestra una advertencia. Las fotos no se intentan guardar como Base64 en `localStorage`.

## PDF y envío

El PDF final conserva las secciones v07 de Claude y agrega un **Registro fotográfico** con las evidencias activas.

Para generar el PDF, las fotografías se recuperan secuencialmente desde IndexedDB como binario y se entregan a jsPDF de forma temporal. El objeto del PETAR continúa liviano.

El envío mantiene el contrato operativo de v06 y usa `version: "v07"`:

- `POST` con CORS;
- `Content-Type: text/plain;charset=UTF-8`;
- timeout de 45 s;
- `idEnvio` nuevo por intento;
- confirmación únicamente con respuesta válida y coincidente;
- estados confirmado, sin confirmar, rechazado y pendiente;
- sin reintento automático cuando la recepción no puede demostrarse.

La URL del flujo se guarda localmente en `flujoUrl_v05` y la clave del área en `claveArea_v06`. Son configuraciones **por dispositivo y navegador**: configurarlas en una PC no las sincroniza automáticamente con un celular. No deben escribirse URLs reales ni claves reales en el repositorio.

## Pruebas

Validación automática:

```bash
find . -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/regresion.cjs
```

La suite cubre regresiones v05/v06 y v07 integrada, incluyendo:

- selección/herencia del tipo de PETAR;
- altura, escaleras y materiales peligrosos;
- regla LEL;
- vigías separados;
- autorización independiente;
- migración de documentos anteriores;
- evidencias mínimas;
- ausencia de Base64 de fotos dentro del documento;
- limpieza de evidencias al desactivar un tipo;
- PDF con imagen binaria temporal;
- acceso Área SST;
- envío v07 y confirmación de recepción.

## Validación pendiente en campo

Antes de considerar la versión definitiva deben verificarse en celulares reales de la sede:

- cámara y selección de imágenes en los Android utilizados;
- captura de 6–8 fotos reales en un PETAR;
- tamaño final del PDF;
- velocidad de generación y envío;
- comportamiento con señal móvil/Wi‑Fi débil;
- guardado real en SharePoint y correo del flujo de Power Automate;
- criterios SST del bloque de escaleras y de evidencias mínimas.

## Limitaciones vigentes

- Sin inicio de sesión corporativo.
- Sin roles vinculados a identidad corporativa real.
- Sin sincronización automática entre dispositivos; cada dispositivo conserva su propia configuración y documentos locales.
- Sin correlativo central.
- Fecha y hora dependen del dispositivo.
- La clave SST y la clave del área son barreras locales/técnicas del piloto, no controles equivalentes a autenticación corporativa.
- IndexedDB es una copia de trabajo local; el registro oficial depende de la recepción confirmada por el flujo.

## Power Automate

El contrato de integración se mantiene sobre la guía existente: `docs/POWER_AUTOMATE_v06.md`. Para v07, el payload conserva los mismos campos y cambia `version` a `v07`.
