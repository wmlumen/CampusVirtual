# PROMPT DE MEJORA — Campus Virtual Centuria
> Diagnóstico del 2026-09-16 + plan para corregir debilidades por prioridad.
> Úsalo como instrucción para el agente ejecutor. No avances de fase sin cumplir los criterios de aceptación.

## 0. Reglas del juego
- Stack: PHP 7.4 + SQLite (`api/centuria.db`), frontend estático en GitHub Pages (`app/` → raíz), Servidor Cloud (`app/Backend_Scripts/01_Script_Cloud_Completo.gs`) + planilla **TIC DATOS** (`1TRxrgXIojONTrszwF9cmgJn75qx-zUbacjRzwrT8xeo`).
- URL GAS oficial: `https://script.google.com/macros/s/AKfycbw-f6I2uM2U4oaU-CJihO14Lpq8P919dd3-2lkOfyt5QsDsAXf35EhCrt5yVL9v6neI/exec` (planilla BasedeDatosCampus; anteriores obsoletas).
- Prohibido romper lo que funciona: cada cambio se prueba con los comandos de §5 antes de commitear.
- Commits atómicos en español + push a `main` (Pages redespliega solo).
- Nunca inventar datos de personas reales; solo filas de prueba `99xxxxx` y borrarlas después.

## 1. Diagnóstico (qué está mal hoy)
| # | Debilidad | Evidencia | Impacto |
|---|-----------|-----------|---------|
| D1 | `api.js` apunta al deployment GAS viejo (planilla desconocida) | `GAS_URL = AKfycbwRHS9q…`, su `diagnostico` devuelve `[]` | GitHub lee/escribe en la planilla equivocada |
| D2 | Planilla TIC DATOS casi vacía: 1/15 hojas con datos | `diagnostico`: solo `RegistroAlumnos:29`, resto `-1` | Login/roles/catálogo/fotos en GitHub fallan o vacíos |
| D3 | Script publicado desactualizado (v06.2 vs repo v06.4) | `diagnostico` no lista Secciones/Carreras/Grados/Modalidades | `sembrar_todo`, espejo de materias y fotos-Drive no responden |
| D4 | Alumnos SQLite sin carrera/sección (7 filas) | `carrera=[] seccion=[]` en 1801234–1801239 | Roster por alcance sale vacío al aprobar solicitudes |
| D5 | Datos basura en SQLite | Fila `TIC -2` sin carrera; `1886139` con carrera ADMINISTRADOR/A; rol `docente-CON` inactivo huérfano | Confusión en listas y reportes |
| D6 | Contraseñas deterministas públicas + GAS sin API key | Fórmula impresa en el login; `doGet` sin autenticación | Cualquiera con una cédula entra; escritura anónima en Sheets |
| D7 | PHP solo vive en una PC (sin hosting público) | Servidor `127.0.0.1:8080` manual, sin servicio/autoarranque | Si la PC se apaga, el admin y todo lo dinámico mueren |
| D8 | Sin backup de `api/centuria.db` | No hay copia programada | Un disco dañado = pérdida total |
| D9 | Todo muestra contenido TIC aunque sea otra materia | `mostrarCursos` cae a curso TIC por defecto; unidades fijas | Bloquea roadmap académico (Fase 1) |
| D10 | Repo sucio + legacy | `Captura de pantalla …png` sin commitear; repo Asistencia abandonado | Ruido y riesgo de confusión |

## 2. Plan P0 — Encender lo construido (hacer YA, en orden)
- [ ] **P0.1 Publicar GAS v06.4**: pegar el `.gs` del repo → Ejecutar ▶ (autorizar Drive) → Nueva versión, misma URL. Verificar: `?action=diagnostico` debe listar 15 hojas.
- [ ] **P0.2 Sembrar TIC DATOS**: abrir `?action=sembrar_todo` una vez → debe responder `ok:true` con conteos (Carreras 3, Grados 4, Secciones 2, Asignaturas 10, Filiales 6, Roles 9). Re-verificar con `diagnostico` (todo >0 salvo hojas de movimiento).
- [ ] **P0.3 Cambiar `GAS_URL` en `app/js/api.js`** a la implementación nueva + subir `?v=8`→`?v=9` en TODOS los `<script src="*api.js?v=*">` de `app/**`. Verificar: en GitHub, recuperar contraseña de `1340130` muestra `Ck1340130*`.
- [ ] **P0.4 Espejar materias**: admin local → Asignaturas → Subir a la Nube → `?action=listar_asignaturas` debe traer las 10.
- [ ] **P0.5 Sincronizar usuarios**: `admin/sync_sheets.html` → Cargar comparación → Sincronizar faltantes → `?action=verificar_alumno&cedula=1801234` debe dar `existe:true`.
- [ ] **P0.6 Backfill alumnos**: poner carrera+sección reales a los 7 alumnos de prueba (o borrarlos si son descartables) + eliminar fila `TIC -2` + corregir `1886139`. Verificar: `docente.php?action=mis_alumnos&carrera=…&seccion=…` trae >0.

## 3. Plan P1 — Seguridad mínima (esta semana)
- [ ] **P1.1 Clave de escritura en GAS**: exigir `data.key` igual a propiedad del script en todo `doPost` que escriba (alumnos, fotos, asignaturas, matrícula); la lectura sigue pública. El frontend la envía desde una constante. Criterio: POST sin key → `{ok:false}`.
- [ ] **P1.2 Contraseñas**: al registrar, generar clave aleatoria de 10 (guardar hash en SQLite, mostrarla una sola vez al usuario); mantener la fórmula solo como fallback de recuperación para cuentas viejas. Criterio: dos cuentas nuevas no comparten patrón predecible.
- [ ] **P1.3 Backup diario de `api/centuria.db`**: tarea programada que copie con fecha a `backups/` y conserve 14 días. Criterio: existe copia de hoy y restore probado en temp.
- [ ] **P1.4 PHP como servicio**: `iniciar.bat`/`iniciar.ps1` revisados + arranque automático al iniciar Windows. Criterio: tras reiniciar, `:8080/api/upload.php?action=health` responde sin intervención.

## 4. Plan P2 — Académico real (después de P0+P1)
- [ ] **P2.1 Cursos independientes por materia**: tabla `course_content(asignatura_id, unidad, seccion, titulo, html, orden, visible)`; cada asignatura carga lo suyo; quitar el curso TIC por defecto (o dejarlo solo como último recurso con aviso). Criterio: TIC y SOC muestran programas distintos.
- [ ] **P2.2 Editor docente**: CRUD de contenidos sin tocar HTML. Criterio: un docente crea una unidad y se ve sin deploy.
- [ ] **P2.3 Tareas y entregas** → **P2.4 Banco de preguntas completo** → **P2.5 Exámenes seguros** → **P2.6 Libro de calificaciones** (en ese orden, cada uno con su tabla y pantalla, reutilizando `mis_alumnos` para nóminas).
- [ ] **P2.7 Limpieza**: borrar `Captura…png` o moverlo fuera del repo; archivar repo Asistencia con README de “obsoleto → usar CampusVirtual”.

## 5. Comandos de verificación (no saltar)
```powershell
# Backend local (27 endpoints)
powershell -ExecutionPolicy Bypass -File "C:\Users\HP250G~1\AppData\Local\Temp\opencode\apitest.ps1"
# Sintaxis
C:\xampp\php\php.exe -l api\*.php
node --check app\js\api.js; node --check app\admin\js\admin.js
```
```text
# Navegador Web
.../exec?action=diagnostico        → 15 hojas con conteos
.../exec?action=sembrar_todo       → ok:true (solo 1ª vez siembra)
.../exec?action=listar_asignaturas → 10 materias
.../exec?action=verificar_alumno&cedula=1801234 → existe:true
# GitHub Pages → pie del login debe decir v2026.09.16-r3 (o superior)
```

## 6. Criterio global de “funciona correctamente”
Registro → login → cursos → materiales → asistencia → notas → perfil/foto funcionan **en la PC y en GitHub Pages**, con datos idénticos en SQLite y TIC DATOS, y el admin puede asignar materias a docentes que las ven con sus nóminas. Todo lo anterior verificado con §5 el mismo día del cambio.
