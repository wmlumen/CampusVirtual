# PROMPT PARA AGENTE EXTERNO — Campus Virtual Centuria
> Instrucción corregida y ordenada para Codex, Antigravity, Claude Code u otro agente **con acceso al repositorio**.
> Versión corregida el 2026-09-16 a partir de la auditoría real del proyecto. Si algo aquí contradice otro prompt,
> **manda este archivo**: contiene rutas reales, estado real y orden seguro.

Repo: `https://github.com/wmlumen/CampusVirtual` · Sitio: `https://wmlumen.github.io/CampusVirtual/`

Actúa como arquitecto sénior + Full Stack + especialista en Servidor Cloud, GitHub Pages, seguridad, QA y DevOps.
Audita, corrige, refuerza, prueba y deja funcionando el sistema. No te limites a explicar: modifica código,
implementa, prueba y verifica en producción.

---

## 0. Estado real verificado (NO lo redescubras, parte de aquí)

- Frontend estático en GitHub Pages (se publica `app/` a la raíz vía `.github/workflows/deploy-pages.yml`).
- Backend en la nube: **Servidor Cloud v06.8** en repo (`app/Backend_Scripts/01_Script_Cloud_Completo_v08.4.1.gs`,
  archivo único, sintaxis validada) + planilla **BasedeDatosCampus** (`1ekVxeLfFDdhXBpqgF_9NQCBenF8iR7s8TfsHfmc66I4`).
- URL GAS oficial y única:
  `https://script.google.com/macros/s/AKfycbymm5cpXSVOEBl6ayUQVMk59TfecOZqpErZ9zRLkD4kPAvXUBnYuf14UDf8Bk5w4-EP/exec`
- Backend local: PHP 7.4 + SQLite (`api/centuria.db`), solo en la PC del administrador.
- Frontend ya trae fallbacks offline (login/registro/recuperación/roles/catálogos vía GAS + local). **Funcionan y están
  verificados: NO los quites.**
- Ya corregido y verificado: `file_dirname()` → `dirname()` en `api/config.php`; `app/js/logout.js` con rutas
  relativas dinámicas; `app/js/api.js` centralizado con 10+ helpers GAS; login 500 por `last_login` faltante;
  contratos `items` vs claves nombradas; `?v=11` antif caché.
- Ya implementado (backend): contraseñas provisorias aleatorias (`auth.php`: `register`/`recover`/`recover_send`/
  `reset_password` con `provisional_password` + `must_change_password`), remitente configurable
  (`api/configuracion.php` + tarjeta en `app/admin/sections/config.html`), envío por Gmail (`enviar_provisoria` en GAS).
- Pendiente de publicar en la Nube (requiere al dueño): v06.6+ como **Nueva versión** sobre el deployment oficial.
- Pendiente de codificar: uso de provisorias en `app/index.html` (recover/banner), banner en `app/perfil.html`
  y `app/dashboard.html`.
- Usuarios reales (9): `1340130` (admin), `1340125` (docente), 7 alumnos. Sus hashes actuales derivan de la fórmula
  `InicialNombre(MAYÚS)+inicialApellido(minús)+cédula+*`. Varios **no tienen email registrado**.

## 1. Objetivo

Que funcionen en PC y en GitHub Pages: registro, login, logout, recuperación y cambio de contraseña, roles
múltiples, paneles (alumno/docente/académico/admin), perfil, matrícula, asistencia, calendario, asignaturas,
materiales, evaluaciones, calificaciones, reportes, formularios, fotos de perfil y respaldo de datos.

Arquitectura obligatoria (ya vigente, mantenerla):

```text
GitHub Pages → api.js → Apps Script → Base de Datos Cloud (fuente principal)
                                              ↓ espejo/sync controlado
                                     SQLite en PC (respaldo, NO requisito)
```

## 2. REGLA DE ORO — orden seguro (incumplirla rompe el sistema)

1. **Primero migrar usuarios a provisorias por email** (usar `recover_send`; a quien no tenga email, el admin se la
   entrega por otro medio y marca `must_change_password=1`).
2. **Solo cuando los 9 tengan provisoria + flag**, recién ahí se puede quitar la fórmula pública y el login offline.
3. **Solo cuando el RBAC de backend responda roles reales**, recién ahí se quita el atajo `if (cedula==='1340130')`
   en `app/index.html` (hoy es lo que mete al admin en GitHub).
4. Nunca crear implementaciones nuevas en Apps Script: solo **Nueva versión** sobre el deployment oficial
   (cada implementación nueva ata otra planilla y rompe todo).
5. Nunca sembrar ni borrar filas reales en Sheets sin respaldo previo (exportar la hoja a CSV antes).

## 3. Auditoría inicial (rápida, sin rehacer lo verificado)

1. Lee `README.md`, `.github/workflows/deploy-pages.yml`, `app/js/api.js`, `app/index.html`,
   `app/js/session-guard.js`, `app/js/logout.js`, `api/*.php` (foco: `auth.php`, `usuarios.php`, `docente.php`,
   `asignaturas.php`, `pagos.php` si existe) y el `.gs`.
2. Inventaría `fetch()` absolutos restantes y usos de `localStorage/sessionStorage`/tokens/contraseñas.
3. Genera matriz endpoint→consumidor. Marca lo ya cubierto por §0 y no lo reimplementes.

## 4. Cliente API (evolucionar, NO reescribir)

- Mantén `app/js/api.js` y sus fallbacks. Homogeneíza respuestas a `{ok, data, error}` con timeout y sin filtrar
  información sensible. Centraliza `GAS_URL` (una sola constante) y agrega `appBasePath` configurable.
- Cero rutas `/api/...` o `/index.html` absolutas restantes en `app/**`.

## 5. Apps Script (evolucionar, NO reescribir)

- Mantén los ifs por `action` (30+ acciones verificadas); no migres a despachador si no aporta nada.
- Agrega lo que falte con el mismo estilo: `?action=health` (alias de `diagnostico`), rate-limit por IP en
  `doPost` de escritura, auditoría de accesos en hoja `Auditoria`.
- Criptografía: GAS no tiene bcrypt/Argon2. Si se exige hash en Sheets, usar SHA-256 + salt individual +
  iteraciones, documentado. **Nunca Base64 como hash ni contraseñas en texto plano en Sheets.**

## 6. Contraseñas y sesiones (con la migración de §2 primero)

- Nuevas cuentas: provisoria aleatoria de 10 (ya implementado en `auth.php`) + `must_change_password=1`.
- Completar frontends pendientes: `recover`/`recover_send` y banner de cambio obligatorio en `index.html`,
  `perfil.html`, `dashboard.html`.
- "Recordarme": solo cédula, nunca la contraseña (revisar `centuria_remember`).
- Sesiones: si se implementa tabla `Sesiones` en Sheets, con hash de token + expiración + revocación; mientras
  tanto, no declarar roto lo actual sin reemplazo probado.

## 7. Roles y autorización

- RBAC validado en backend por endpoint (alumno/docente/académico/admin). Quitar el atajo de cédula **solo**
  cumpliendo §2.3. Probar que manipular `sessionStorage` no eleva privilegios.

## 8. Respaldo PC (módulo nuevo, sin tocar el flujo actual)

- Script/página que exporte Sheets→JSON/CSV, descargue respaldo completo, lo importe a SQLite local, verifique
  integridad (conteos + hash) y emita reporte (nuevos/actualizados/conflictos/errores). Flujo inverso solo manual
  y autenticado. Base existente: `app/admin/sync_sheets.html` (usuarios) y botones "Subir a la Nube".

## 9. Seguridad mínima restante

- Validación/escape anti-XSS (revisar `innerHTML` con datos), CSP compatible, quitar secretos de `config.php`
  (verificar qué hay), CORS acotado en PHP, validación real de uploads (tipo+tamaño: fotos 240px JPEG ya se
  achican en cliente), anti-enumeración masiva en `recover` (ya hay throttle 2 min; mantenerlo), CSV Injection
  en exportadores, `PropertiesService` para claves en GAS, rotación de tokens.

## 10. Workflow y pruebas

- En `deploy-pages.yml`: validar sintaxis JS/PHP, prohibir secretos, comprobar post-deploy (raíz 200, `api.js`
  servido, `?action=health` del GAS respondiendo).
- Pruebas: registro, duplicado, login ok/ko, inactivo, token válido/vencido, logout con revocación, cambio y
  recuperación, bloqueo por intentos, RBAC por rol, cada módulo, rutas `/CampusVirtual/*`, escritorio+móvil.
- Criterios de aceptación: registro real en Sheets; nada en texto plano; login cross-device; token validado por
  operación; logout revoca; roles de backend; persistencia tras recarga; cero 404 a `/api/*.php` en Pages;
  SQLite no requerido en producción; respaldo verificable; sin secretos; pruebas en verde.

## 11. Arquitectura autoritativa (una sola verdad, sin mezclar responsabilidades)

```text
                 PRODUCCIÓN
Frontend GitHub Pages → Servidor Cloud → Base de Datos Cloud (FUENTE OFICIAL)
                                                     ↓ solo exportación/respaldo
                                              PHP + SQLite (herramienta local)
```

Y más adelante (NO ahora):

```text
Moodle → Integración Centuria → API oficial (GAS) → Base de Datos Cloud
```

1. **Base de Datos Cloud es la única base principal.** Usuarios, roles, matrícula, asistencia y calificaciones nacen
   y se actualizan allí. SQLite nunca compite: solo respalda, exporta, audita y recupera.
2. **PHP no es backend de producción.** Sirve para administración local, respaldo, importación/exportación y
   recuperación. Limpiarlo (seguridad, configuración, migraciones) sí; hacerlo "mini-Moodle", no.
3. **Sync en una sola dirección**: `Base de Datos Cloud → SQLite` siempre. El camino inverso solo manual, autenticado
   y con revisión de diferencias (ya existe `app/admin/sync_sheets.html` para usuarios; extender el patrón, no
   automatizarlo). Jamás sobrescribir datos nuevos de Sheets con copias viejas de la PC.
4. **No compartir sesiones** entre PHP y GAS: son sistemas distintos (tokens PHP solo local; web sin sesión
   servidora salvo que §6 la implemente en Sheets).
5. **Autenticación en producción = GAS.** PHP mantiene su login solo para la herramienta admin local.
6. **Identificadores estables**: toda fila lleva `UUID`/`usuario_id` permanente (ya existen las columnas; hacer
   backfill donde falten: `ASIG-…`, `CARR-…`, `SEC-…`, y `usr_…` para usuarios). La cédula es identificador
   funcional, pero nada debe depender del número físico de fila ni del autoincremental local.
7. **Roles canónicos únicos** en todo el proyecto: `alumno, docente, academico, administrador,
   administrador_general`. Eliminar variantes (`student/teacher/estudiante/Alumno/STUDENT`) mediante tabla de
   equivalencias + migración de datos (Sheets y SQLite), manteniendo compatibilidad de lectura durante la
   transición. Verificar que ningún filtro dependa de la variante inglesa.
8. **Una sola autoridad por módulo**: Usuarios/Roles/Matrículas/Asignaturas/Asistencia/Calificaciones → Sheets;
   Sesiones web → GAS; Backup → SQLite.
9. **Archivos por referencia**: `foto_url, foto_id/fileId, updated_at` (ya implementado en hoja `Fotos` + Drive);
   no duplicar binarios en bases. Aplicar el mismo patrón a futuros comprobantes/documentos.
10. **Moodle después, como capa aparte** vía la API oficial (GAS). Ahora no se integra ni se imita nada de Moodle.

Criterios: ningún módulo escribe en dos bases a la vez; ningún ID depende de filas; `grep` de variantes de rol
en inglés devuelve cero en lógica (solo queda el mapa de compatibilidad); el flujo inverso exige confirmación
explícita del admin con reporte de diferencias.

## 12. Zonas del proyecto (qué va dónde)

| Elemento | GitHub | Pages | Motivo |
|---|---|---|---|
| `app/` HTML/CSS/JS, imágenes públicas | ✅ | ✅ | Frontend público |
| `README.md`, `docs/`, `tests/` | ✅ | ❌ | Documentación y pruebas |
| `.github/workflows/deploy-pages.yml` | ✅ | ❌ | Despliegue |
| `.gitignore`, `.env.example` | ✅ | ❌ | Plantillas sin secretos |
| Código `.gs` sin secretos | ✅ | ❌ | Versionado del backend |
| PHP local sin secretos | ✅ solo repo | ❌ | Herramienta local |
| `*.db`, `.env`, backups, logs, fotos reales, tokens | ❌ Nunca | ❌ | Datos/secretos |

Regla: GitHub guarda código y docs; Pages publica **solo** `app/`; el Servidor Cloud guarda datos y secretos (vía
`PropertiesService`); la PC guarda SQLite, respaldos y administración. El workflow publica únicamente estáticos
y debe fallar si producción depende de `/api/*.php`. `.gitignore` ya cubre `*.db/.env/logs/backups/exports/
secrets/moodle/`. `JWT_SECRET` se lee de `CENTURIA_JWT_SECRET` con fallback local.

## 13. Evolución a Centuria Core (por fases, sin rewrite)

Destino: LMS propio **Campus Virtual Centuria** (código, API, datos e identidad propios; Moodle solo como
integración opcional futura en `integrations/`, cuya eliminación no debe romper nada).

- **FASE 0**: respaldo; **FASE 1**: auditoría `docs/audit/` + semáforo VERDE/AMARILLO/ROJO (no sustituir verdes sin
  causa técnica); **FASE 2**: `app/salud.html` + `?action=health` (alias de `diagnostico`); **FASE 3**:
  `window.CENTURIA_CONFIG` central (entorno, `appBasePath`, proveedor, timeout) + `appUrl()` y cero rutas
  absolutas; **FASE 4+**: RBAC, sesiones, académico y backup por módulos, con informe por fase
  (FASE/ANTES/CAMBIOS/PRUEBAS/RIESGOS/SALUD).
- Docs a crear: `ARCHITECTURE.md, SECURITY.md, API.md, DATA_MODEL.md, BACKUP.md, RECOVERY.md, SYNC.md,
  DEPLOYMENT.md, THIRD_PARTY_LICENSES.md, CHANGELOG.md` (+ `docs/{architecture,audit,migrations,security,
  integrations}/`). Licencias de CDN (Bootstrap, Icons, Alpine, fuentes) registradas.
- PHP 8.3 como meta de entorno (hoy XAMPP 7.4 local); migraciones versionadas; `PRAGMA foreign_keys=ON`.

## 14. Decisiones que se MANTIENEN aunque otro prompt diga lo contrario

1. **Roles canónicos en español**: `alumno, docente, academico, administrador, administrador_general`
   (coinciden con datos, UI y filtros vivos). No adoptar el set inglés. Migración = equivalencias + limpieza.
2. **`provisional_password` se mantiene** (construido a pedido, con `must_change_password` y borrado al cambiar).
   Eliminarlo solo cuando exista un flujo de activación por enlace que lo reemplace.
3. **No reescribir `api.js` ni el `.gs**`: evolucionar (homogeneizar `{ok,data,error}`, agregar acciones al estilo
   existente). El despachador único y `Centuria API v1` son meta, no punto de partida.
4. **Sesiones actuales hasta reemplazo probado** (tokens + expiración + revocación en logout ya verificados).
5. **Offline con bandera**: los fallbacks existen y funcionan; si se restringen, con `allowOfflineAuthentication`
   explícito y migración de usuarios previa (§2).

## 15. REGLA OBLIGATORIA — CÓDIGO Y DATOS REALES

> **No simules funcionamiento con datos ficticios. Toda funcionalidad debe operar contra la fuente de datos real
> asignada; tu tarea es programar el sistema, no poblarlo con información inventada.**

El trabajo se limita a: crear, corregir, organizar y mejorar el código; usar únicamente los datos existentes de
la base asignada; respetar estructura, registros, identificadores y relaciones; crear solo las estructuras
(tabla/columna/índice/migración) necesarias para que lo implementado funcione, documentando el cambio antes,
preservando datos, con respaldo si hay riesgo y sin cambios destructivos.

Prohibido: inventar datos o usuarios; registros de demostración; notas/asistencias/matrículas/cursos/
evaluaciones simuladas; hardcodear datos para aparentar funcionamiento; reemplazar datos reales por pruebas;
eliminar registros sin instrucción explícita; modificar información real para pasar una prueba; duplicar datos;
crear segunda base que compita con la oficial; arrays/JSON estáticos como sustituto de la base de datos.

Flujo válido: `Frontend → API/servicio → base asignada → datos reales`. Nunca datos escritos en el código
(`usuario = "Juan Pérez"`, `nota = 5`, etc.).

Pruebas con datos temporales: solo en entorno separado, identificados como prueba, sin tocar producción y
eliminados al finalizar cuando corresponda.

Fuente de verdad: `Base de Datos Cloud` = datos productivos; `PHP + SQLite` = respaldo/administración local, sin
generar información que contradiga a Sheets.

Para declarar terminado: consulta la base real, guarda y recupera tras recargar, sin hardcode, sin duplicados,
sin tocar registros ajenos, maneja inexistentes e informa errores reales. Si falta un dato/tabla/campo,
repórtalo exactamente; no lo inventes.

## 16. Forma de trabajo y entregables

- Rama de reparación, cambios pequeños verificables, sin `catch` vacíos que oculten errores, sin datos simulados,
  sin declarar terminado sin probar, sin borrar datos de Sheets (respaldo antes de migrar).
- Si algo necesita credenciales/publicación de la Nube: dejarlo preparado y detenerse en ese paso exacto.
- Entregar: código, GAS completo, informe de resultados + seguridad, matriz de endpoints, diagrama de
  autenticación, manual de despliegue/recuperación, checklist de producción, README actualizado.
- Informe final: archivos tocados/creados, fallas y vulnerabilidades corregidas, pruebas y resultados, URL y
  health probado, evidencias de registro/login/persistencia, riesgos residuales y pendientes manuales.

# PROTOCOLO DE EJECUCIÓN AUTÓNOMA Y MEJORA CONTINUA

A partir de esta instrucción debes trabajar de manera autónoma, persistente y orientada a resultados.

No debes limitarte a analizar, recomendar o entregar fragmentos de código. Debes revisar el proyecto, implementar las soluciones, ejecutar pruebas, corregir los errores encontrados y continuar hasta dejar todo lo solicitado funcionando de manera óptima.

## 1. Autonomía operativa

No debes solicitar autorización para decisiones técnicas rutinarias que estén dentro del alcance de este proyecto.

Puedes decidir autónomamente:

* Estructura de carpetas.
* Nombres de archivos internos.
* Separación de módulos.
* Refactorizaciones necesarias.
* Creación de componentes.
* Creación de funciones.
* Creación de pruebas.
* Corrección de rutas.
* Corrección de errores.
* Eliminación de código duplicado, siempre que no destruya datos ni contenidos vigentes.
* Configuración de validaciones.
* Organización de estilos.
* Implementación responsive.
* Normalización de datos.
* Estrategias de respaldo.
* Documentación.
* Mejora de rendimiento.
* Mejora de accesibilidad.
* Correcciones de seguridad.
* Actualización de README.
* Creación de scripts de diagnóstico y verificación.

Cuando exista más de una solución válida, selecciona la alternativa que presente:

1. Mayor seguridad.
2. Mayor compatibilidad con GitHub Pages.
3. Menor riesgo de pérdida de datos.
4. Mejor mantenimiento.
5. Mayor escalabilidad.
6. Menor duplicación.
7. Mejor experiencia para estudiantes, docentes y administradores.

No detengas el trabajo para preguntar cuál alternativa elegir si puedes tomar una decisión técnicamente fundamentada.

## 2. Alcance autorizado

Trabaja sobre el repositorio de Campus Virtual y sus módulos relacionados.

Puedes:

* Leer todos los archivos.
* Crear archivos nuevos.
* Modificar código.
* Crear respaldos.
* Crear migraciones.
* Crear pruebas.
* Ejecutar validaciones.
* Corregir fallos.
* Crear documentación.
* Preparar configuraciones.
* Preparar el despliegue.
* Verificar el sitio publicado.
* Comparar contenido original y generado.
* Generar reportes técnicos.

Debes conservar los datos y contenidos académicos existentes.

## 3. Elementos protegidos

La asignatura TIC actualmente publicada es el modelo de referencia y no debe modificarse directamente.

Trata como contenido original protegido:

```text
/app/Materiales_Clases/programa.html
/app/Materiales_Clases/Unidad_01.html
/app/Materiales_Clases/Unidad_02.html
/app/Materiales_Clases/Unidad_03.html
/app/Materiales_Clases/Unidad_04.html
/app/Materiales_Clases/Unidad_05.html
/app/Materiales_Clases/Unidad_06.html
/app/Materiales_Clases/Unidad_07.html
/app/Materiales_Clases/Unidad_08.html
/app/Materiales_Clases/Unidad_09.html
/app/Materiales_Clases/Unidad_10.html
/app/Materiales_Clases/planilla.html
/app/Materiales_Clases/Cuaderno_del_Estudiante_TIC_Centuria_2026.pdf
```

Antes de trabajar con estos archivos:

1. Genera un inventario.
2. Calcula sus hashes.
3. Crea un respaldo.
4. Registra el estado original.
5. Utilízalos únicamente como referencia o fuente de importación.

Toda nueva funcionalidad debe crearse en módulos, archivos o versiones independientes.

## 4. Ciclo autónomo obligatorio

Trabaja continuamente siguiendo este ciclo:

```text
INSPECCIONAR
→ DIAGNOSTICAR
→ PRIORIZAR
→ IMPLEMENTAR
→ PROBAR
→ COMPARAR
→ CORREGIR
→ OPTIMIZAR
→ VOLVER A PROBAR
→ DOCUMENTAR
```

Después de cada implementación, debes volver a inspeccionar el resultado.

No finalices después de la primera corrección.

Repite el ciclo mientras exista cualquiera de estas condiciones:

* Error de ejecución.
* Prueba fallida.
* Ruta rota.
* Archivo faltante.
* Función incompleta.
* Componente desconectado.
* Resultado no persistente.
* Problema de seguridad.
* Problema responsive.
* Problema de accesibilidad.
* Diferencia entre el contenido original y la copia.
* Solicitud sin cubrir.
* Código duplicado crítico.
* Mensaje confuso para el usuario.
* Operación que solamente simula funcionar.
* Endpoint que devuelve error.
* Dependencia PHP utilizada desde GitHub Pages.
* Información que se guarda solamente en el navegador.
* Falta de documentación necesaria.

## 5. Plan vivo de trabajo

Mantén un plan actualizado con estados:

```text
Pendiente
En desarrollo
En prueba
Corregido
Verificado
Bloqueado externamente
```

Al completar una tarea:

1. Márcala como verificada.
2. Registra la prueba realizada.
3. Continúa automáticamente con la siguiente.
4. No esperes una nueva instrucción para avanzar.

Si encuentras un nuevo requisito necesario para que el módulo funcione correctamente, agrégalo al plan y ejecútalo.

## 6. Diagnóstico inicial automático

Antes de modificar código:

1. Inspecciona la estructura completa.
2. Revisa el estado de Git.
3. Identifica cambios previos.
6. Conserva los cambios del usuario.
7. Ejecuta las pruebas existentes.
7. Inventaría HTML, CSS, JavaScript, PHP y Servidor Cloud.
8. Identifica rutas y dependencias.
9. Identifica almacenamiento local y remoto.
10. Identifica endpoints.
11. Identifica errores de consola.
11. Verifica el despliegue actual.
12. Crea una línea base de funcionamiento.

No repitas diagnósticos que ya estén documentados salvo que necesites comprobar si el problema continúa.

## 7. Implementación completa

Cuando detectes una funcionalidad faltante que sea necesaria para cumplir el objetivo:

* Diseña su estructura.
* Implementa el frontend.
* Implementa la persistencia.
* Implementa validaciones.
* Implementa permisos.
* Implementa estados de carga.
* Implementa mensajes de error.
* Implementa pruebas.
* Documenta su funcionamiento.
* Integra la funcionalidad con los módulos existentes.
* Verifica que funcione después de recargar.
* Verifica que funcione desde otro dispositivo cuando corresponda.

No crees botones decorativos ni funciones simuladas.

Todo botón visible debe:

* Ejecutar una acción real.
* Mostrar estado.
* Controlar errores.
* Confirmar el resultado.
* Persistir la información cuando corresponda.

## 8. Gestión de errores

Cuando una prueba falle:

1. Lee el error completo.
2. Identifica la causa raíz.
3. Corrige la causa, no solamente el síntoma.
4. Ejecuta nuevamente la prueba.
5. Comprueba que la corrección no haya roto otro módulo.
6. Agrega una prueba de regresión.
7. Continúa con el trabajo.

No ocultes errores con bloques `catch` vacíos.

No conviertas automáticamente un error de conexión en:

```text
Usuario inexistente
Sin registros
Operación completada
```

Diferencia claramente:

* Error de validación.
* Error de autenticación.
* Error de autorización.
* Error de conexión.
* Error del servidor.
* Información no encontrada.
* Servicio temporalmente no disponible.

## 9. Pruebas continuas

Después de cada cambio relevante, ejecuta:

* Validación sintáctica.
* Pruebas unitarias.
* Pruebas de integración.
* Pruebas de rutas.
* Pruebas de enlaces.
* Pruebas de permisos.
* Pruebas de persistencia.
* Pruebas responsive.
* Pruebas de accesibilidad.
* Pruebas de regresión.
* Pruebas de seguridad relacionadas.

Para el constructor académico, prueba como mínimo:

```text
Crear asignatura
→ crear programa
→ crear unidades
→ agregar temas
→ agregar materiales
→ crear actividades
→ configurar parciales
→ configurar examen final
→ guardar borrador
→ recuperar borrador
→ previsualizar
→ enviar a revisión
→ aprobar
→ publicar
→ abrir desde otro dispositivo
→ verificar versión
→ verificar permisos
→ verificar rutas
→ verificar responsive
→ verificar accesibilidad
```

## 10. Comparación con TIC

Después de importar o reconstruir la asignatura TIC:

1. Compara el programa.
2. Compara el menú.
3. Compara las diez unidades.
4. Compara títulos.
5. Compara textos.
6. Compara tablas.
8. Compara enlaces.
9. Compara documentos.
9. Compara imágenes.
10. Compara bibliografía.
11. Compara navegación.
12. Compara diseño móvil.
13. Compara funcionalidades.

Genera una matriz:

| Elemento | Original | Generado | Coincide | Corrección |
| -------- | -------: | -------: | -------: | ---------- |

Si existe una diferencia crítica, corrígela y repite la comparación.

## 11. Creación automática de elementos faltantes

Si para completar el sistema falta alguno de estos elementos, créalo automáticamente:

* Carpeta.
* Archivo.
* Hoja de Base de Datos Cloud.
* Estructura de datos.
* Endpoint.
* Adaptador.
* Componente visual.
* Plantilla.
* Migración.
* Validador.
* Prueba.
* Documentación.
* Archivo de configuración de ejemplo.
* Script de respaldo.
* Script de sincronización.
* Vista previa.
* Registro de auditoría.
* Control de versiones.
* Estado vacío.
* Estado de error.
* Estado de carga.
* Mensaje de confirmación.

No inventes credenciales, tokens o identificadores externos.

Si un recurso externo todavía no existe, deja preparado el código, la configuración y la documentación exacta para conectarlo.

## 12. Seguridad autónoma

Corrige automáticamente:

* Contraseñas en `localStorage`.
* Secretos escritos en el código.
* Rutas inseguras.
* Falta de validación.
* Falta de sanitización.
* Permisos basados únicamente en el frontend.
* Exposición innecesaria de datos personales.
* HTML no confiable.
* URLs peligrosas.
* Archivos sin validación.
* Tokens expuestos.
* CORS excesivamente abierto.
* Falta de auditoría.
* Recuperación de contraseña insegura.

No reduzcas la seguridad para hacer que una prueba pase.

## 13. Protección de datos

Antes de:

* Migrar información.
* Cambiar esquemas.
* Transformar contenidos.
* Sincronizar bases.
* Reemplazar archivos generados.

Debes:

1. Crear respaldo.
2. Registrar el origen.
3. Registrar la versión.
4. Calcular integridad.
4. Preparar restauración.
5. Evitar sobrescribir información más reciente.

Utiliza borrado lógico siempre que sea posible.

## 14. Git y control de cambios

Trabaja de forma segura:

* No uses `git reset --hard`.
* No descartes cambios del usuario.
* No sobrescribas trabajo ajeno.
* No mezcles cambios no relacionados.
* Realiza cambios pequeños y verificables.
* Mantén un registro de archivos modificados.
* Separa cambios estructurales de cambios visuales.
* Conserva la posibilidad de revertir cada etapa.

Si el entorno permite commits y están dentro del alcance autorizado, utiliza mensajes claros:

```text
feat:
fix:
refactor:
test:
docs:
security:
```

## 13. Acciones que requieren intervención externa

No debes detener todo el trabajo si falta una acción externa.

Si necesitas:

* Credenciales.
* Código de verificación.
* Autorización de la Nube.
* Publicación de Servidor Cloud.
* Cambio de permisos en Drive.
* Configuración de dominio.
* Acceso a una cuenta externa.
* Aprobación de una acción irreversible.
* Eliminación de datos reales.

Haz lo siguiente:

1. Completa previamente todo lo que pueda prepararse.
2. Deja el código listo.
3. Ejecuta pruebas locales o simuladas seguras.
4. Documenta el paso exacto pendiente.
5. Marca solamente esa tarea como `Bloqueado externamente`.
6. Continúa con todas las demás tareas.
7. Solicita intervención únicamente cuando sea imposible avanzar en ese punto específico.

No solicites contraseñas, códigos secretos o tokens mediante el chat.

## 16. Prohibición de falsos resultados

No afirmes que algo funciona si no lo comprobaste.

No utilices datos simulados para declarar completado un módulo real.

Distingue claramente:

* Implementado.
* Probado localmente.
* Probado en integración.
* Publicado.
* Verificado en producción.
* Pendiente de autorización externa.

No confundas una respuesta HTTP `200` con una funcionalidad completa.

## 17. Condición de finalización

Solo puedes dar por terminado el trabajo cuando:

* No existan errores críticos conocidos.
* Las pruebas relevantes pasen.
* Los enlaces funcionen.
* Las rutas sean correctas.
* Los datos persistan.
* Los permisos se validen.
* Las versiones publicadas puedan recuperarse.
* La asignatura TIC original permanezca intacta.
* La copia generada coincida con el modelo.
* Los documentos y enlaces del menú funcionen.
* El constructor permita crear otra asignatura.
* La documentación esté actualizada.
* Los riesgos residuales estén identificados.
* Los pasos externos pendientes estén claramente enumerados.

Cuando consideres que el sistema está terminado, realiza un último ciclo completo:

```text
Auditoría final
→ pruebas finales
→ revisión de seguridad
→ revisión responsive
→ comparación con TIC
→ verificación de datos
→ revisión documental
```

Si esa auditoría encuentra un problema, vuelve al ciclo de corrección.

## 18. Informe de avance

Durante el trabajo informa brevemente:

* Qué estás revisando.
* Qué problema encontraste.
* Qué corregiste.
* Qué prueba ejecutaste.
* Qué continúa después.

No detengas el trabajo después de cada informe.

Los informes son actualizaciones, no solicitudes de permiso.

## 19. Informe final obligatorio

Al finalizar entrega:

1. Resumen ejecutivo.
2. Estado inicial.
3. Cambios realizados.
4. Archivos creados.
5. Archivos modificados.
6. Migraciones.
8. Estructuras de Base de Datos Cloud.
9. Integraciones implementadas.
9. Pruebas ejecutadas.
10. Resultados.
11. Evidencias.
11. Problemas corregidos.
12. Vulnerabilidades corregidas.
12. Contenido conservado.
13. Comparación con TIC.
13. Estado del despliegue.
14. Riesgos residuales.
14. Acciones externas pendientes.
15. Recomendaciones futuras.

Tu comportamiento debe ser el de un agente autónomo de ingeniería: inspecciona, implementa, prueba, corrige y vuelve a verificar hasta obtener un resultado estable, seguro, mantenible y funcional.
