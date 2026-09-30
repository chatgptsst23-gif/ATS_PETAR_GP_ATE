# Power Automate — configuración v06

Esta guía usa únicamente marcadores. **No escribas una URL firmada, una firma de autenticación ni una clave real en el repositorio.**

## 1. Invalidar la URL anterior

1. En el flujo, borrar el disparador **Cuando se recibe una solicitud HTTP**.
2. Crearlo nuevamente.
3. En **Quién puede desencadenar el flujo**, seleccionar **Cualquiera**.
4. Guardar el flujo para generar una URL **NUEVA**.
5. No reutilizar la URL anterior: quedó expuesta en el historial público y debe considerarse invalidada.

La URL nueva se pega únicamente en **Ajustes** de cada dispositivo.

## 2. Convertir el cuerpo recibido

Agregar una acción **Redactar** y renombrarla **Datos**.

Insertar con **fx**:

```text
json(string(triggerBody()))
```

## 3. Validar la solicitud

Agregar una condición y renombrarla **Validar**. Insertar toda la expresión con **fx**:

```text
and(
  equals(outputs('Datos')?['clave'], '<CLAVE_DEL_AREA>'),
  equals(outputs('Datos')?['origen'], 'gestion-digital-sst-v03'),
  startsWith(outputs('Datos')?['pdfBase64'], 'JVBERi0'),
  less(length(outputs('Datos')?['pdfBase64']), 20000000)
)
```

El valor de `origen` fue verificado en `datos.js`: **gestion-digital-sst-v03**.

## 4. Rama No

Agregar una acción **Respuesta**:

- Código de estado: `403`
- Encabezado `Content-Type`: `application/json`
- Encabezado `Access-Control-Allow-Origin`: `https://chatgptsst23-gif.github.io`
- Cuerpo:

```json
{"ok":false,"motivo":"solicitud rechazada"}
```

Después agregar **Terminar** con estado **Correcto**.

## 5. Rama Sí

### a. Nombre definitivo del archivo

Agregar **Redactar**, renombrar **NombreArchivo** e insertar con **fx**:

```text
concat(toLower(replace(outputs('Datos')?['numero'],'/','-')),'_',outputs('Datos')?['momento'],'_',formatDateTime(utcNow(),'yyyyMMdd-HHmmss'),'.pdf')
```

El `nombreArchivo` recibido desde la app es solo una sugerencia; el flujo construye el nombre definitivo.

### b. SharePoint — Crear archivo

- Carpeta: carpeta de SST definida por el administrador.
- Nombre: `outputs('NombreArchivo')`
- Contenido: insertar con **fx**:

```text
base64ToBinary(outputs('Datos')?['pdfBase64'])
```

### c. Outlook — Enviar correo (V2)

- Asunto: `outputs('Datos')?['asunto']`
- Cuerpo: `outputs('Datos')?['cuerpo']`
- Adjunto — nombre: `outputs('NombreArchivo')`
- Adjunto — contenido: `base64ToBinary(outputs('Datos')?['pdfBase64'])`

### d. Confirmación para la app

Agregar una acción **Respuesta**:

- Código de estado: `200`
- Encabezado `Content-Type`: `application/json`
- Encabezado `Access-Control-Allow-Origin`: `https://chatgptsst23-gif.github.io`
- Cuerpo:

```json
{"ok":true,"numero":"@{outputs('Datos')?['numero']}","archivo":"@{outputs('NombreArchivo')}","idEnvio":"@{outputs('Datos')?['idEnvio']}"}
```

## 6. Expresiones

Todas las expresiones anteriores deben insertarse mediante el botón **fx** de Power Automate, no pegándolas como texto literal en campos que esperan una expresión.

## 7. SharePoint

Restringir la carpeta de destino a personal de SST y revisar los permisos heredados antes del piloto.

## 8. Prueba operativa

1. En la app, abrir **Ajustes**.
2. Pegar la URL nueva del disparador y la clave del área.
3. Pulsar **Enviar un documento de prueba**.
4. La app debe mostrar **Recibido por SST ✓**.
5. Verificar que llegue el correo con el PDF adjunto.
6. Verificar que el archivo aparezca en SharePoint.

Si la app muestra **sin confirmar** pero el correo llegó, revisar especialmente el encabezado `Access-Control-Allow-Origin` en la acción **Respuesta**.

## Nota de licencia

Las acciones **Respuesta** y **Terminar** pertenecen al conector de solicitudes HTTP. Debe verificarse en el entorno real si el tenant y el tipo de flujo utilizados exigen licencia adicional. Esta guía no asume que esas acciones estén cubiertas por la licencia actual.
