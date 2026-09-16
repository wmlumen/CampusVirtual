# PROMPT PARA AGENTE EXTERNO — Campus Virtual Centuria
> Instrucción corregida y ordenada para Codex, Antigravity, Claude Code u otro agente **con acceso al repositorio**.
> Versión corregida el 2026-09-16 a partir de la auditoría real del proyecto. Si algo aquí contradice otro prompt,
> **manda este archivo**: contiene rutas reales, estado real y orden seguro.

Repo: `https://github.com/wmlumen/CampusVirtual` · Sitio: `https://wmlumen.github.io/CampusVirtual/`

Actúa como arquitecto sénior + Full Stack + especialista en Google Apps Script, GitHub Pages, seguridad, QA y DevOps.
Audita, corrige, refuerza, prueba y deja funcionando el sistema. No te limites a explicar: modifica código,
implementa, prueba y verifica en producción.

---

## 0. Estado real verificado (NO lo redescubras, parte de aquí)

- Frontend estático en GitHub Pages (se publica `app/` a la raíz vía `.github/workflows/deploy-pages.yml`).
- Backend en la nube: **Google Apps Script v06.8** en repo (`app/Backend_Scripts/01_Script_Google_Completo.gs`,
  archivo único, sintaxis validada) + planilla **BasedeDatosCampus** (`1ekVxeLfFDdhXBpqgF_9NQCBenF8iR7s8TfsHfmc66I4`).
- URL GAS oficial y única:
  `https://script.google.com/macros/s/AKfycbxek9YPO_GaFBMwqrBnmzqt9Ooh1w7VP9kbfTN64y-af9PrhWyZ_xWkdT5IFpwAIcR1/exec`
- Backend local: PHP 7.4 + SQLite (`api/centuria.db`), solo en la PC del administrador.
- Frontend ya trae fallbacks offline (login/registro/recuperación/roles/catálogos vía GAS + local). **Funcionan y están
  verificados: NO los quites.**
- Ya corregido y verificado: `file_dirname()` → `dirname()` en `api/config.php`; `app/js/logout.js` con rutas
  relativas dinámicas; `app/js/api.js` centralizado con 10+ helpers GAS; login 500 por `last_login` faltante;
  contratos `items` vs claves nombradas; `?v=11` antif caché.
- Ya implementado (backend): contraseñas provisorias aleatorias (`auth.php`: `register`/`recover`/`recover_send`/
  `reset_password` con `provisional_password` + `must_change_password`), remitente configurable
  (`api/configuracion.php` + tarjeta en `app/admin/sections/config.html`), envío por Gmail (`enviar_provisoria` en GAS).
- Pendiente de publicar en Google (requiere al dueño): v06.6+ como **Nueva versión** sobre el deployment oficial.
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
GitHub Pages → api.js → Apps Script → Google Sheets (fuente principal)
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
  y autenticado. Base existente: `app/admin/sync_sheets.html` (usuarios) y botones "Subir a Google".

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
Frontend GitHub Pages → Google Apps Script → Google Sheets (FUENTE OFICIAL)
                                                     ↓ solo exportación/respaldo
                                              PHP + SQLite (herramienta local)
```

Y más adelante (NO ahora):

```text
Moodle → Integración Centuria → API oficial (GAS) → Google Sheets
```

1. **Google Sheets es la única base principal.** Usuarios, roles, matrícula, asistencia y calificaciones nacen
   y se actualizan allí. SQLite nunca compite: solo respalda, exporta, audita y recupera.
2. **PHP no es backend de producción.** Sirve para administración local, respaldo, importación/exportación y
   recuperación. Limpiarlo (seguridad, configuración, migraciones) sí; hacerlo "mini-Moodle", no.
3. **Sync en una sola dirección**: `Google Sheets → SQLite` siempre. El camino inverso solo manual, autenticado
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

## 12. Forma de trabajo y entregables

- Rama de reparación, cambios pequeños verificables, sin `catch` vacíos que oculten errores, sin datos simulados,
  sin declarar terminado sin probar, sin borrar datos de Sheets (respaldo antes de migrar).
- Si algo necesita credenciales/publicación de Google: dejarlo preparado y detenerse en ese paso exacto.
- Entregar: código, GAS completo, informe de resultados + seguridad, matriz de endpoints, diagrama de
  autenticación, manual de despliegue/recuperación, checklist de producción, README actualizado.
- Informe final: archivos tocados/creados, fallas y vulnerabilidades corregidas, pruebas y resultados, URL y
  health probado, evidencias de registro/login/persistencia, riesgos residuales y pendientes manuales.
