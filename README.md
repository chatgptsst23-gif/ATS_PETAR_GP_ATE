# ATS y PETAR — Grupo Pana, sede Ate

## v07 integrada · piloto operativo

Versión que integra la ampliación funcional de Claude sobre v07 con el acceso separado de **Usuario / Área SST** y una arquitectura de **evidencias fotográficas optimizada para celulares**.

### Funciones principales

- ATS FOR-GHS-001 y PETAR FOR-GHS-002.
- PETAR habilitado para **trabajo en caliente**, **trabajo en altura**, **materiales peligrosos no rutinarios** y **trabajo no rutinario**. Los demás tipos siguen desactivados.
- Trabajo en altura: controles del FOR-GHS-002, bloque de escaleras sugerido y controles del D.S. 42-F incorporados por Claude.
- Materiales peligrosos: productos utilizados, inflamabilidad, controles del FOR-GHS-002 y regla crítica para combinación de trabajo en caliente + productos inflamables.
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

Un PETAR nuevo ya **no nace automáticamente como trabajo en caliente**.

- Si se crea desde un ATS registrado en el dispositivo, se heredan los permisos compatibles actualmente: **Caliente** y/o **Altura**.
- Si se crea sin ATS vinculado, el usuario debe seleccionar el tipo de trabajo.
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

La URL del flujo se guarda localmente en `flujoUrl_v05` y la clave del área en `claveArea_v06`. No deben escribirse URLs reales ni claves reales en el repositorio.

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
- Sin sincronización entre dispositivos.
- Sin correlativo central.
- Fecha y hora dependen del dispositivo.
- La clave SST y la clave del área son barreras locales/técnicas del piloto, no controles equivalentes a autenticación corporativa.
- IndexedDB es una copia de trabajo local; el registro oficial depende de la recepción confirmada por el flujo.

## Power Automate

El contrato de integración se mantiene sobre la guía existente: `docs/POWER_AUTOMATE_v06.md`. Para v07, el payload conserva los mismos campos y cambia `version` a `v07`.
