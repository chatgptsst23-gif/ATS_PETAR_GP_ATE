# ATS y PETAR — Grupo Pana, sede Ate

## v06: piloto operativo

Aplicación web estática para registrar ATS (FOR-GHS-001) y PETAR de trabajo en caliente (FOR-GHS-002) del área de Planchado y Pintura de la sede Ate.

### Implementado en v06

- `modoPrueba: false`; los documentos nuevos se crean con `prueba: false`.
- La protección heredada de v05 se mantiene: un documento que tenga `prueba: true` nunca se envía, aunque el modo global esté desactivado.
- La URL del flujo se guarda en la preferencia local `flujoUrl_v05` y la clave del área en `claveArea_v06`, ambas en el almacenamiento del navegador.
- `Envio.configurado()` exige URL y clave.
- Cada intento usa un `idEnvio` nuevo y envía `version: "v06"`.
- El transporte usa `POST`, `mode: "cors"`, `Content-Type: text/plain;charset=UTF-8` y espera como máximo 45 s.
- Solo se considera **confirmado** si la respuesta 2xx contiene JSON `{ok:true, numero, archivo, idEnvio}` y coinciden `numero` e `idEnvio`.
- Estados visibles de envío: **confirmado ✓**, **sin confirmar**, **rechazado** y **pendiente**.
- No hay reintento automático después de errores de red, CORS, timeout o respuestas ilegibles.
- El reenvío manual advierte sobre posibles duplicados si el intento anterior fue confirmado o quedó sin confirmar.
- La prueba de conexión usa un ATS claramente ficticio, con `momento: "prueba_conexion"`, sin marcarlo como `prueba: true`.
- Caché y referencias estáticas actualizadas a v06.

La URL firmada que apareció en una versión antigua del historial público debe considerarse comprometida. La guía v06 exige recrear el disparador HTTP para invalidarla.

## Configuración en cada dispositivo

1. Abrir **Ajustes y conexión con SST**.
2. Pegar la URL nueva del flujo en **URL del flujo**.
3. Ingresar la **Clave del área**. El campo es de tipo contraseña y puede mostrarse temporalmente.
4. Pulsar **Guardar conexión**.
5. Pulsar **Enviar un documento de prueba** y verificar que la app muestre **Recibido por SST ✓ — <archivo>**.

La URL y la clave no deben escribirse en archivos del repositorio. Se almacenan únicamente en el navegador del dispositivo.

## Estados de envío

- **confirmado ✓**: el flujo respondió 2xx con datos válidos y coincidentes.
- **sin confirmar**: hubo intento, pero la app no puede demostrar la recepción. Puede haber sido procesado; no se reintenta automáticamente.
- **rechazado**: el flujo devolvió `ok:false` o una respuesta HTTP 4xx; se muestra el motivo disponible.
- **pendiente**: no hubo envío por falta de conexión u otra condición pendiente de reintento manual.

El contador **Envíos pendientes** incluye `pendiente`, `no_confirmado`, `rechazado` y `error`.

## Correcciones de v05 conservadas

Se mantienen las validaciones de campos y controles, protección e invalidación de firmas al volver a editar, transiciones de estado restringidas, numeración `TIPO-SEDE-AÑO-CORRELATIVO-SUFIJO`, manejo de errores de guardado, PDF, estado programado/vencido, caché propia y pruebas de regresión.

## Pruebas realizadas antes del commit

`tests/regresion.cjs` no usa red real: simula `fetch` y cubre modo operativo, bloqueo permanente de documentos de prueba, configuración URL+clave, contrato del payload, confirmado, rechazado, CORS, timeout, offline y prueba de conexión, además de las regresiones de v05.

Comandos de validación:

```bash
find . -name '*.js' -print0 | xargs -0 -n1 node --check
node tests/regresion.cjs
```

## Requiere validación en entorno real

- CORS efectivo entre GitHub Pages y el disparador de Power Automate.
- Disponibilidad y comportamiento de las acciones **Respuesta** y **Terminar** del conector de solicitudes HTTP.
- Licenciamiento aplicable de Power Automate/HTTP, SharePoint y Outlook en el tenant.
- Creación real del PDF en SharePoint y recepción del correo con adjunto.

## Limitaciones vigentes

- Sin inicio de sesión corporativo.
- Sin roles ligados a una identidad corporativa real.
- Sin sincronización entre dispositivos.
- Sin correlativo central; cada dispositivo mantiene su contador local y agrega un sufijo aleatorio.
- La fecha y la hora dependen del dispositivo.
- La clave del área es una barrera básica adicional y **no reemplaza autenticación, autorización ni controles de TI**.
- IndexedDB/localStorage es una copia local de trabajo; el registro oficial depende de la recepción confirmada por el flujo.

## Power Automate

Ver `docs/POWER_AUTOMATE_v06.md`.
