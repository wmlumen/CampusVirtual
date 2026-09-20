# PROMPT UNIVERSAL — Migración Centuria a Firebase Firestore
> Cópialo y pégalo en cualquier IA (ChatGPT, Claude, Gemini, etc.)

---

ERES UN INGENIERO DE SOFTWARE EXPERTO EN FIREBASE Y JAVASCRIPT. Tu tarea es completar la migración de Campus Virtual Centuria de Google Sheets/GAS a Firebase Firestore 100%.

CONTEXTO: El proyecto está en `C:\Users\HP 250 G10\Documents\GITHUT\Centuria\CampusVirtual\`. Firebase project: `centuria-campusvirtual-e74dd`. API Key: `AIzaSyC_Jup2lXag6UFvsaiLQv5KSrP7JIpMIQQ`.

REGLAS ABSOLUTAS:
1. TODO el código JavaScript usa `require('firebase-firestore')` para acceder a Firestore. Funciona porque Firebase SDK está cargado globalmente via `<script>` tag.
2. `getDb()` retorna `window.firebase.firestore()` después de `firebase.initializeApp(FIREBASE_CONFIG)`.
3. TODAS las queries usan: `require('firebase-firestore').query(require('firebase-firestore').collection(db,'coleccion'),require('firebase-firestore').where('campo','==',valor))`
4. TODAS las operaciones usan `require('firebase-firestore').getDocs()`, `getDoc()`, `setDoc()`, `updateDoc()`, `deleteDoc()`
5. NUNCA uses `GAS_URL`, `callGas()`, `script.google.com`, o referencias a Google Sheets
6. NUNCA uses `import` en `api.js` — solo `require()` global
7. `api.js` DEBE exportar `window.CenturiaAPI=API` y `var CenturiaAPI=window.CenturiaAPI`
8. El `window.CENTURIA_CONFIG` debe tener `apiProvider:'firebase'` y `cloudApiUrl:'firestore'`

TAREAS EN ORDEN:

**A) Reescribir `app/js/api.js`** con TODOS estos namespaces como getters que retornan objetos con métodos async:
- `login(c,p)`, `authRegister(d)`, `_saveUser(d)`, `validateSession()`, `getCurrentUser()`, `getToken()`, `logout()`, `updateProfile(data)`, `changePassword(c,o,n)`, `recoverAccess(c,e)`, `checkStudent(c)`
- `catalogos`: `getAsignaturas`, `getCarreras`, `getSecciones`, `getGrados`, `list(tipo)`
- `usuarios`: `list(f)`, `get(uid)`, `update(uid,data)`, `create(data)`, `delete(uid)`, `pendientes()`, `aprobar(ced)`, `reject(ced)`, `registerDirect(d)`, `resetPassword(ced)`, `addRole(d)`, `removeRole(d)`, `getPending()`, `actualizar(ced,data)`
- `academico`: `listTeachers(ac)`, `saveAssignment(d)`, `decideTeacher(d)`, `revokeAssignment(d)`
- `docente`: `getMySubjects(uid)`, `getPendingRequests()`, `approveRequest(ced,token)`, `rejectRequest(ced,mot,token)`
- `exams`: `list()`, `getExamConfigs(asig)`, `getExamsForApproval(ac)`, `approveExam(eid,ac)`, `rejectExam(eid,ac,mot)`, `getExamApprovalStatus(eid)`, `revokeExamApproval(eid,ac)`
- `calendar`: `list(i,f)`, `create(p)`, `update(id,data)`, `delete(id)`, `carreras()`
- `kit`: `getHabilitadas()`, `status(cod)`, `upload(d)`
- `cursos`: `misCursos(c)`
- `tesoreria`: `listarEstudiantes()`, `registrarPago(ac,m,co,cb)`, `obtenerHistorialPagos(ac)`, `obtenerExoneracion(ac)`, `reporteCobranzas()`, `asignarExoneracion(ac,por,con)`
- `pagos`: `stats()`, `list()`, `save(datos)`, `updateStatus({id,cedula,estado,factura_numero})`, `delete({id,cedula})`
- `facturas`: `listarFacturas(ac)`, `crearFactura(d)`, `revisarFactura(id)`
- `mensajes`: `listar(c)`, `enviar(d)`
- `consultas`: `listar(c)`, `crear(d)`, `responder(id,r)`
- `eventos`: `listar(f={})`, `crear(d)`, `actualizar(id,d)`, `eliminar(id)`
- `configuracion`: `get(k)`, `getAll()`, `save(k,v)`, `set(k,v)`, `testMail(d)`
- `filiales`: `list()`, `crear(d)`, `update(d)`, `delete(id)`, `adminsByFilial()`
- `constructor`: `getAsignaturas()`, `guardarBorrador(d)`, `aprobarBorrador(id)`
- `credencial`: `generar(c)`
- `roles`: `list()`, `save(d)`, `delete(id)`
- `asignaturas`: `list(f={})`, `save(d)`, `delete(a)`
- `grades`: `list()`, `listByUser(cedula)`
- `attendance`: `list(f={})`, `createEvent(body)`, `myEvents(ced)`, `getEvent(id)`, `closeEvent(id)`, `validateCode(code)`, `mark(body)`, `listByCourseAndDate(courseId,fecha)`, `markAttendance(cid,fecha,status,userId)`
- `matricula`: `my(ced)`, `save(datos)`
- `asistente`: `list(c)`, `crear(d)`, `responder(id,r)`
- `materias`: `listar(f={})`
- `teachers`: `list()`, `assign(d)`
- `auth`: `login(c,p)`, `register(d)`, `verify(c)`, `changePassword(a,n)`, `recoverAccess(c,e)`
- `upload`: `importUsersFromCSV(formData)`
- `admin`: `getRoles()`
- `getCourses`: `async()`, `roster(cod)`, `listGrades(cid)`, `listAttendance(cid)`, `markAttendance(cid,fecha,status,userId)`

**B) Verificar `app/js/firebase-db.js`** tiene todas las colecciones en el `FirebaseDB` export. Agregar `'cursos'` como string literal.

**C) Verificar `firebase/firestore.rules`** tiene todas las funciones y match. `isOwner(userId)` debe retornar `isAuthenticated() && request.auth.uid == userId`.

**D) Verificar `firebase/firestore.indexes.json`** tiene todos los índices listados.

**E) Actualizar `app/admin/js/admin.js`** `vistasDisponibles` para incluir `eventos` y `facturas`.

**F) Crear/actualizar `sync-check.js`** que verifica todo y muestra ✅ o ❌ para cada check.

**G) Desplegar** con `firebase deploy --only hosting` desde el directorio del proyecto.

**H) Ejecutar `node sync-check.js`** y verificar que muestre `✅ TODO VERIFICADO — PERFECTAMENTE SINCRONIZADO`.

Archivos críticos existentes que NO debes modificar a menos que sea necesario: `app/js/firebase-config.js`, `app/js/session-guard.js`, `app/js/logout.js`, `firebase.json`, `firebase/storage.rules`, `app/index.html`, `app/dashboard.html`, `app/docente.html`, `app/academic/index.html`, `app/admin/index.html`, `app/calendario.html`, `app/tesoreria.html`, `app/facturas.html`, `app/eventos.html`, `app/consultas.html`, `app/mensajes-alumnos.html`.
