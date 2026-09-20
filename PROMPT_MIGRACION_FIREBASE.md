# PROMPT DE MIGRACIÓN GOOGLE SHEETS → FIREBASE FIRESTORE
> Centuria Campus Virtual — Instrucciones completas para cualquier IA

---

## CONTEXTO

Estoy migrando Campus Virtual Centuria de Google Sheets/GAS a Firebase Firestore 100%.
El proyecto está en `C:\Users\HP 250 G10\Documents\GITHUT\Centuria\CampusVirtual\`

**Firebase project:** `centuria-campusvirtual-e74dd`
**Hosting URL:** `https://centuriacampus-virtual.web.app/`
**API Key:** `AIzaSyC_Jup2lXag6UFvsaiLQv5KSrP7JIpMIQQ`
**GAS URL (obsoleto):** `https://script.google.com/macros/s/AKfycbwE5Mk0xeReN8Fcwj7rabSwLqyF5y7NUFgxspPcytGjskoKvLKsfj3AmrVxi-xpf5p8/exec`

**Firebase credentials** en `app/js/firebase-config.js`:
```
projectId: 'centuria-campusvirtual-e74dd'
authDomain: 'centuria-campusvirtual-e74dd.firebaseapp.com'
storageBucket: 'centuria-campusvirtual-e74dd.firebasestorage.app'
messagingSenderId: '85652711732'
appId: '1:85652711732:web:6c07800f01cc7d4bca1d61'
measurementId: 'G-GVYL32YCFX'
```

**Colecciones Firestore:** `usuarios`, `roles`, `asignaturas`, `notas`, `asistencia`, `eventos`, `formularios`, `pagos`, `solicitudes_docentes`, `configuracion`, `filiales`, `calendar_events`, `examenes`, `consultas`, `mensajes`, `credenciales`, `borradores`, `cursos`

**6 roles:** `alumno`, `docente`, `admin`, `academico`, `administrador_plataforma`, `admin_filial`

**67 líneas es**

**Importante: TODO el código JavaScript usa `require('firebase-firestore')` con las funciones `collection()`, `doc()`, `getDocs()`, `getDoc()`, `setDoc()`, `updateDoc()`, `deleteDoc()`, `query()`, `where()`, `orderBy()`. Estas funciones vienen del SDK de Firebase cargado en `firebase-config.js` via `<script>` tag CDN. El `db` se obtiene con `window.firebase.firestore()` después de `firebase.initializeApp(FIREBASE_CONFIG)`.**

---

## TAREA PRINCIPAL: REESCRIBIR `app/js/api.js`

El archivo `app/js/api.js` DEBE reemplazar TODOS los calls a GAS con operaciones Firestore directas.

### Estructura obligatoria de `api.js`:

```javascript
// api.js - Centuria Portal API Client (v100-FIREBASE)
// v100 (2026-09-20): Migración completa Google Sheets → Firebase Firestore
// 100% compatible con todas las páginas existentes

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyC_Jup2lXag6UFvsaiLQv5KSrP7JIpMIQQ",
    authDomain: "centuria-campusvirtual-e74dd.firebaseapp.com",
    projectId: "centuria-campusvirtual-e74dd",
    storageBucket: "centuria-campusvirtual-e74dd.firebasestorage.app",
    messagingSenderId: "85652711732",
    appId: "1:85652711732:web:6c07800f01cc7d4bca1d61",
    measurementId: "G-GVYL32YCFX"
};

const ROLE_ES = {student:'alumno',teacher:'docente',admin:'admin',academic:'academico',inactive:'inactivo'};
const ROLE_EN = {alumno:'student',docente:'docente',admin:'admin',academico:'academic',inactive:'inactive'};

let _fb = null;
async function getDb() {
    if (_fb) return _fb;
    const fb = window.firebase;
    if (!fb.apps || fb.apps.length === 0) fb.initializeApp(FIREBASE_CONFIG);
    _fb = fb.firestore();
    return _fb;
}
function genId(p=''){const t=Date.now().toString(36),r=Math.random().toString(36).substring(2,8);return p?t+'-'+t+r:t+r;}
function san(d){const c={};for(const[k,v]of Object.entries(d))if(v!==undefined&&v!==null)c[k]=v;return c;}
function mapUser(u){if(!u)return null;const r=(u.rol||u.role||'alumno').toLowerCase();return{id:u.id||u.cedula||'',cedula:u.cedula||u.username||'',username:u.username||u.cedula||'',nombre:u.firstname||u.nombre||'',apellido:u.lastname||u.apellido||'',rol:ROLE_ES[r]||r||'alumno',firstname:u.firstname||u.nombre||'',lastname:u.lastname||u.apellido||'',role:r,email:u.email||'',telefono:u.telefono||'',grado:u.grado||'',carrera:u.carrera||'',seccion:u.seccion||'',estado:u.estado||'activo',foto:u.foto||u.foto_url||''};}

window.CENTURIA_CONFIG={environment:'production',appBasePath:(function(){try{var s=document.getElementsByTagName('script');for(var i=0;i<s.length;i++){var src=s[i].getAttribute('src')||'';var m=src.match(/^((?:\.\.\/)*)js\/api\.js/);if(m)return m[1]||'./';}}catch(e){}try{var j=location.pathname.indexOf('/app/');return j>=0?location.pathname.slice(0,j)+'/app/':'./';}catch(e){return'./';}})(),apiProvider:'firebase',cloudApiUrl:'firestore',requestTimeout:15000,allowOfflineAuthentication:true};
```

### Luego: `const API = { ... }` con TODOS estos namespaces:

**REGLA ABSOLUTA:** Cada namespace es un getter (`get nombre(){return{...}}`) que contiene métodos async. TODOS los métodos usan `require('firebase-firestore')` con `getDb()` para obtener `db`.

**1. `login(c,p)`** — Login con cédula/password. Busca en `usuarios` por `cedula`. Retorna `{ok:true,user,token,must_change_password:0}`.
**2. `authRegister(d)`** — Registro. Verifica cédula única. Llama `_saveUser()`.
**3. `_saveUser(d)`** — Inserta en `usuarios`. Retorna `{ok:true,user,token}`.
**4. `validateSession()`** — Valida token.
**5. `getCurrentUser()`** — Lee `sessionStorage`/`localStorage`.
**6. `getToken()`** — Lee token de storage.
**7. `logout()`** — Limpia storage.
**8. `updateProfile(data)`** — Update en `usuarios`.
**9. `changePassword(c,o,n)`** — Cambia password.
**10. `recoverAccess(c,e)`** — Recuperación.
**11. `checkStudent(c)`** — Verifica estudiante.
**12. `catalogos`** getter — `getAsignaturas`, `getCarreras`, `getSecciones`, `getGrados`, `list(tipo)`
**13. `usuarios`** getter — `list(f)`, `get(uid)`, `update(uid,data)`, `create(data)`, `delete(uid)`, `pendientes()`, `aprobar(ced)`, `reject(ced)`, `registerDirect(d)`, `resetPassword(ced)`, `addRole(d)`, `removeRole(d)`, `getPending()`, `actualizar(ced,data)`
**14. `academico`** getter — `listTeachers(ac)`, `saveAssignment(d)`, `decideTeacher(d)`, `revokeAssignment(d)`
**15. `docente`** getter — `getMySubjects(uid)`, `getPendingRequests()`, `approveRequest(ced,token)`, `rejectRequest(ced,mot,token)`
**16. `exams`** getter — `list()`, `getExamConfigs(asig)`, `getExamsForApproval(ac)`, `approveExam(eid,ac)`, `rejectExam(eid,ac,mot)`, `getExamApprovalStatus(eid)`, `revokeExamApproval(eid,ac)`
**17. `calendar`** getter — `list(i,f)`, `create(p)`, `update(id,data)`, `delete(id)`, `carreras()`
**18. `kit`** getter — `getHabilitadas()`, `status(cod)`, `upload(d)`
**19. `cursos`** getter — `misCursos(c)`
**20. `tesoreria`** getter — `listarEstudiantes()`, `registrarPago(ac,m,co,cb)`, `obtenerHistorialPagos(ac)`, `obtenerExoneracion(ac)`, `reporteCobranzas()`, `asignarExoneracion(ac,por,con)`
**21. `pagos`** getter — `stats()`, `list()`, `save(datos)`, `updateStatus({id,cedula,estado,factura_numero})`, `delete({id,cedula})`
**22. `facturas`** getter — `listarFacturas(ac)`, `crearFactura(d)`, `revisarFactura(id)`
**23. `mensajes`** getter — `listar(c)`, `enviar(d)`
**24. `consultas`** getter — `listar(c)`, `crear(d)`, `responder(id,r)`
**25. `eventos`** getter — `listar(f={})`, `crear(d)`, `actualizar(id,d)`, `eliminar(id)`
**26. `configuracion`** getter — `get(k)`, `getAll()`, `save(k,v)`, `set(k,v)`, `testMail(d)`
**27. `filiales`** getter — `list()`, `crear(d)`, `update(d)`, `delete(id)`, `adminsByFilial()`
**28. `constructor`** getter — `getAsignaturas()`, `guardarBorrador(d)`, `aprobarBorrador(id)`
**29. `credencial`** getter — `generar(c)`
**30. `roles`** getter — `list()`, `save(d)`, `delete(id)`
**31. `asignaturas`** getter — `list(f={})`, `save(d)`, `delete(a)`
**32. `grades`** getter — `list()`, `listByUser(cedula)`
**33. `attendance`** getter — `list(f={})`, `createEvent(body)`, `myEvents(ced)`, `getEvent(id)`, `closeEvent(id)`, `validateCode(code)`, `mark(body)`, `listByCourseAndDate(courseId,fecha)`, `markAttendance(cid,fecha,status,userId)`
**34. `matricula`** getter — `my(ced)`, `save(datos)`
**35. `asistente`** getter — `list(c)`, `crear(d)`, `responder(id,r)`
**36. `materias`** getter — `listar(f={})`
**37. `teachers`** getter — `list()`, `assign(d)`
**38. `auth`** getter — `login(c,p)`, `register(d)`, `verify(c)`, `changePassword(a,n)`, `recoverAccess(c,e)`
**39. `upload`** getter — `importUsersFromCSV(formData)`
**40. `admin`** getter — `getRoles()`
**41. `getCourses`** getter — `async()`, `roster(cod)`, `listGrades(cid)`, `listAttendance(cid)`, `markAttendance(...)`

### Después del `API` object:
```javascript
window.CenturiaAPI=API;var CenturiaAPI=window.CenturiaAPI;
function isAuthenticated(){return!!(localStorage.getItem('centuria_auth_token')||sessionStorage.getItem('centuria_auth_token'));}
function getCurrentUser(){return API.getCurrentUser();}
```

### REGLAS IMPORTANTES para escribir `api.js`:
- TODAS las queries usan `require('firebase-firestore').query(require('firebase-firestore').collection(db,'coleccion'),require('firebase-firestore').where(...))`
- TODAS las operaciones de escritura usan `require('firebase-firestore').setDoc(require('firebase-firestore').doc(db,'coleccion',id),data)`
- `getDocs()` retorna `{docs:[...]}` y cada doc tiene `.id` y `.data()`
- `getDoc()` retorna `{exists:true/false, data()}`
- Los errores se manejan con `try/catch` retornando `{ok:false,error:e.message}`
- NUNCA usar `GAS_URL`, `callGas()`, o referencias a Google Sheets
- TODAS las operaciones son directas a Firestore

---

## TAREA 2: `app/js/firebase-db.js`

Debe tener TODAS estas colecciones en el `FirebaseDB` export:
`usuarios`, `roles`, `asignaturas`, `notas`, `asistencia`, `eventos`, `formularios`, `pagos`, `solicitudes_docentes`, `configuracion`, `filiales`, `catalogos`, `cursos`, `examenes`, `consultas`, `mensajes`, `credenciales`, `borradores`, `facturas`

El `'cursos'` debe aparecer como string literal en el archivo (ej: `// Colección 'cursos'`).

---

## TAREA 3: `firebase/firestore.rules`

Debe tener estas funciones: `isAuthenticated()`, `isAdmin()`, `isAcademico()`, `isDocente()`, `isPlatformAdmin()`, `isAdminOrPlatform()`, `isStaff()`, `isOwner(userId)`

Y estos `match`: `usuarios`, `asignaturas`, `notas`, `asistencia`, `eventos`, `formularios`, `pagos`, `solicitudes_docentes`, `configuracion`, `filiales`, `calendar_events`, `examenes`, `consultas`, `mensajes`, `credenciales`, `borradores`, `cursos`

`isOwner(userId)` debe ser: `return isAuthenticated() && request.auth.uid == userId;`

---

## TAREA 4: `firebase/firestore.indexes.json`

Debe tener estos índices:
- `usuarios:rol,created_at`, `usuarios:estado,rol`
- `eventos:tipo,fecha`, `eventos:creado_por,fecha`
- `asistencia:cedula,fecha`, `notas:cedula,fecha`
- `pagos:cedula,fecha`, `formularios:cedula_alumno,created_at`
- `examenes:asignatura,estado`, `examenes:estado,fecha`
- `consultas:alumno_cedula,estado`, `mensajes:destinatario,fecha`

`fieldOverrides` debe estar vacío: `[]`

---

## TAREA 5: `app/admin/js/admin.js` — `vistasDisponibles`

Debe tener estos 14+ entries:
```javascript
{ id: 'dash_admin', label: 'Dashboard General Admin', icon: 'bi-speedometer2', color: '#d4a843', url: '../dashboard-admin.html', desc: 'Panel centralizado con KPIs, aprobaciones directas y accesos' },
{ id: 'alumno', label: 'Panel Alumno', icon: 'bi-mortarboard-fill', color: '#10b981', url: '../dashboard.html', desc: 'Dashboard del alumno' },
{ id: 'docente', label: 'Panel Docente', icon: 'bi-person-badge-fill', color: '#3b82f6', url: '../docente.html', desc: 'Calificaciones, exámenes, asistencia' },
{ id: 'academico', label: 'Panel Académico', icon: 'bi-building', color: '#8b5cf6', url: '../academic/index.html', desc: 'Indicadores, criterios' },
{ id: 'admin', label: 'Panel Administrador', icon: 'bi-shield-fill-check', color: '#f43f5e', url: 'index.html', desc: 'Gestión central: usuarios, catálogos' },
{ id: 'asistencia', label: 'Asistencia Estudiante', icon: 'bi-person-heart', color: '#f59e0b', url: '../atencion-estudiante.html', desc: 'Ficha del estudiante' },
{ id: 'eventos', label: 'Eventos', icon: 'bi-calendar-event', color: '#06b6d4', url: '../eventos.html', desc: 'Gestión de eventos académicos' },
{ id: 'facturas', label: 'Facturas', icon: 'bi-receipt', color: '#ef4444', url: '../facturas.html', desc: 'Facturación y gestión de pagos' },
{ id: 'calendario', label: 'Calendario', icon: 'bi-calendar3', color: '#06b6d4', url: '../calendario.html', desc: 'Eventos académicos' },
{ id: 'tesoreria', label: 'Tesorería', icon: 'bi-cash-stack', color: '#84cc16', url: '../tesoreria.html', desc: 'Pagos, facturas, exoneraciones' },
{ id: 'consultas', label: 'Consultas', icon: 'bi-chat-dots-fill', color: '#a855f7', url: '../consultas.html', desc: 'Soporte académico' },
{ id: 'mensajes', label: 'Mensajes Alumnos', icon: 'bi-envelope-fill', color: '#ec4899', url: '../mensajes-alumnos.html', desc: 'Comunicación directa' },
{ id: 'constructor', label: 'Constructor Académico', icon: 'bi-tools', color: '#14b8a6', url: '../constructor/index.html', desc: 'Crear asignaturas' },
{ id: 'libreta', label: 'Libreta Virtual', icon: 'bi-journal-bookmark-fill', color: '#f97316', url: '../libreta.html', desc: 'Notas y progreso' },
{ id: 'formulario', label: 'Formulario Matrícula', icon: 'bi-file-earmark-medical-fill', color: '#6366f1', url: '../formulario-matricula.html', desc: 'Formulario de inscripción' }
```

---

## TAREA 6: `sync-check.js` — Script de verificación

Crea `sync-check.js` que verifica:
1. `firebase.json` existe con `projectId`, `public: "app"`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`
2. `firebase-config.js` existe con `apiKey`
3. `api.js` NO usa `GAS_URL`, NO usa `callGas()`, SÍ usa `getFirestore`, SÍ usa `collection()/getDocs()`
4. `api.js` tiene TODOS los `API.*` namespaces como strings
5. `api.js` tiene `window.CenturiaAPI=API` y `apiProvider:'firebase'`
6. `firebase-db.js` tiene TODAS las colecciones como string literal `'coleccion'`
7. `firestore.rules` tiene TODAS las funciones y `match` para cada colección
8. `firestore.indexes.json` tiene TODOS los índices requeridos
9. `session-guard.js` tiene `CenturiaSession` y `protect:`
10. `index.html` o `dashboard.html` tienen `session-guard`
11. Firebase CLI instalado y proyecto accesible
12. API key en `firebase-config.js`

---

## TAREA 7: Despliegue

Ejecutar:
```bash
cd "C:\Users\HP 250 G10\Documents\GITHUT\Centuria\CampusVirtual"
firebase deploy --only hosting    # Despliega a Firebase Hosting
firebase deploy --only firestore:rules  # Despliega reglas
firebase deploy --only firestore:indexes  # Despliega índices
```

Para watch automático:
```bash
npm run watch-deploy
```

---

## TAREA 8: Verificación final

Ejecutar `node sync-check.js`. Debe mostrar `✅ TODO VERIFICADO — PERFECTAMENTE SINCRONIZADO`.

---

## NOTAS CRÍTICAS

- **`require('firebase-firestore')`** es el patrón usado en `api.js` para acceder a Firestore. Funciona porque el Firebase SDK se carga globalmente vía `<script>` tag en `index.html`. NO usar `import` en `api.js`.
- **`getDb()`** retorna `window.firebase.firestore()` — es el singleton de Firestore.
- **`genId(prefix)`** genera IDs únicos con timestamp + random.
- **`san(d)`** limpia objetos de undefined/null.
- **`mapUser(u)`** normaliza usuarios de Firestore al formato estándar.
- **`window.CenturiaAPI`** debe estar DEFINIDO en `api.js` para que todas las páginas puedan acceder a la API.
- **NUNCA** incluir `GAS_URL`, `callGas`, o referencias a `script.google.com` en `api.js`.
- **TODA** autenticación es local con `localStorage`/`sessionStorage`.

---

## LISTA DE PÁGINAS HTML QUE USAN CenturiaAPI

Verificar que cada página tenga `<script src=".../js/session-guard.js?v=3"></script>` y `CenturiaSession.protect()`:
- `app/eventos.html` ✅
- `app/facturas.html` ✅
- `app/calendario.html` ✅
- `app/tesoreria.html` ✅
- `app/atencion-estudiante.html` ✅
- `app/mensajes-alumnos.html` ✅
- `app/dashboard.html` ✅
- `app/dashboard-admin.html` ✅
- `app/consultas.html` ✅
- `app/docente.html` ✅
- `app/libreta.html` ✅
- `app/index.html` ✅
- `app/alumno/index.html` ✅
- `app/admin/index.html` ✅
- `app/academic/index.html` ✅
- `app/constructor/index.html` ✅
