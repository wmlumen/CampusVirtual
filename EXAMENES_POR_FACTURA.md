# Exámenes por factura: habilitación, ventana horaria e intentos

## Flujo

1. **Docente** (`docente.html` → sección "Habilitar Exámenes"): para cada examen de su asignatura fija **fecha y hora de inicio**, **fecha y hora de cierre** y **cantidad de intentos (1, 2, 3… N)**. Hora de Asunción.
2. **Alumno** abre el examen: si no tiene clave, en la pestaña **Cargar factura** ingresa el N° de su factura.
   - Si la factura figura **pagada** en la hoja `Pagos` (misma cédula) → se le envía **automáticamente** un mail con el enlace y la clave.
   - Si figura pendiente o no figura → queda **"Por revisar"**. El docente ve sus **4 últimos pagos** (factura, monto, fecha, estado) y decide **Habilitar y enviar** o **Rechazar**.
3. **El mail** trae dos caminos:
   - botón **"Ingresar directamente al examen"** (el enlace lleva mail + clave ya cargados), o
   - el enlace normal del examen + la **clave** para escribirla junto con el mail.
4. **Al entrar**, el servidor controla clave, ventana horaria e intentos. Cada ingreso nuevo consume un intento; recargar la página dentro de una sesión abierta (hasta 3 h) no consume otro.

## Piezas

| Archivo | Qué hace |
|---|---|
| `app/Backend_Scripts/02_Examenes_Factura.gs` | Lógica del servidor (**archivo nuevo: hay que agregarlo al proyecto de Apps Script junto con el 01**) |
| `app/Backend_Scripts/01_Script_Cloud_Completo.gs` | 8 rutas nuevas (`pagos_ultimos`, `examen_config_listar`, `examen_config_publica`, `examen_solicitudes`, `examen_config_guardar`, `examen_solicitar`, `examen_resolver`, `examen_acceso_validar`) |
| `app/js/api.js` | Métodos en `CenturiaAPI.exams` |
| `app/js/exam-lock.js` | Pantalla de acceso del alumno (reemplaza el código compartido por clave personal por mail) |
| `app/docente.html` | Panel de habilitación y solicitudes |
| `app/Backend_Scripts/examenes.test.cjs` | Prueba automática (`node examenes.test.cjs`, con Sheets y mail simulados) |

Hojas nuevas (se crean solas): `ConfigExamen`, `AccesoExamen` (la clave se guarda solo como hash), `IntentosExamen`.

## Puesta en marcha

1. En Apps Script: agregar `02_Examenes_Factura.gs` y reemplazar `01_Script_Cloud_Completo.gs`; **Implementar → Nueva versión**.
2. La primera vez que se envíe un mail, Google pide autorizar el envío de correo (`MailApp`).
3. Propiedades del script (opcionales): `EXAM_BASE_URL` (por defecto `https://wmlumen.github.io/CampusVirtual/app/`) y `EXAM_MAIL_REMITENTE` (reply-to de los mails).
4. Requisito de datos: el alumno debe tener **email** en `Usuarios` y sus pagos deben registrarse con el **N° de factura** en la hoja `Pagos` (columna `Factura`).

## Decisiones asumidas (cambiables)

- La configuración es por **examen + asignatura**; los intentos y la ventana valen para todos los alumnos de esa asignatura.
- "4 últimos pagos" = los 4 más recientes de la hoja `Pagos` de ese alumno, sin contar los anulados.
- El envío automático solo ocurre si la factura cargada figura **pagada**; en cualquier otro caso decide el docente.
- Reenvío: un alumno ya habilitado puede pedir el mail de nuevo tras 5 minutos (se genera una clave nueva y la anterior deja de servir). 10 claves erróneas seguidas bloquean 15 min ese mail.
- Un intento se cuenta al **ingresar** al examen (no al enviar respuestas).
