# ATS y PETAR — Grupo Pana, sede Ate

## v05: prueba de campo

El modo de prueba está activo en `config.js` (`modoPrueba: true`).

- Todos los envíos externos están bloqueados, también los reenvíos de documentos anteriores.
- Los documentos nuevos se marcan como prueba y sus PDF indican que no autorizan trabajos.
- Los documentos creados como prueba nunca se envían, aunque posteriormente se desactive el modo de prueba.
- Los registros anteriores se conservan en el navegador. No se reclasifican como documentos de prueba.
- Usar datos ficticios durante la visita.

## Conexión con SST pendiente

La URL firmada publicada anteriormente fue retirada de la configuración. Su eliminación no revoca la clave ni la borra del historial de Git. El administrador debe revocar o regenerar esa clave en Power Automate.

La preferencia antigua del navegador se descarta. No volver a publicar una URL con credenciales en este repositorio. El modo operativo requiere definir autenticación e integración segura.

El transporte actual no permite leer la respuesta del servidor (`no-cors`). Por eso un intento de envío se marca como recepción sin confirmar; los registros históricos llamados `enviado` también se muestran como recepción sin confirmar. No se afirma que SharePoint haya archivado un documento sin comprobación.

## Correcciones

- Respuestas obligatorias de emergencias y equipos; PDF distingue omisiones de N/A.
- Regreso al formulario invalida firmas con confirmación, incluida la navegación superior.
- Validación completa antes y después de confirmar la finalización; transiciones de estado restringidas.
- Numeración nueva con año, contador atómico en IndexedDB y sufijo aleatorio. Se conservan números anteriores.
- Estado programado antes del inicio y vencido al llegar al fin del horario.
- Observación requerida cuando hay controles adicionales respondidos No, sin reclasificar controles críticos.
- Avisos de error de guardado y guardado al ocultar la página. El almacenamiento sigue siendo local, sin respaldo central sincronizado.
- Caché propia de la aplicación y archivos de versión coherente para funcionamiento sin conexión.

## Pruebas

Ejecutar `node tests/regresion.cjs`. Usa datos ficticios y solicitudes simuladas; no contacta a Power Automate. Incluye generación real de PDF con la librería incorporada.

## Publicación

Sitio estático servido desde la raíz del repositorio. Al cambiar archivos de la app, incrementar la versión de caché en `sw.js` y los identificadores de recursos en `index.html`.
