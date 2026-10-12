// api.js - Centuria Portal API Client (v19)
// v19 (2026-09-20): API.cursos.mios (mis_cursos: cursos y asignaturas reales del alumno). Materiales, libreta y dashboard la usan.
// v19b (2026-09-20): GAS_URL apunta al nuevo despliegue (backend con 04 a 10: consultas, mensajes, facturas, mis_cursos).
// v16 (2026-09-20): API.eventos (módulo de eventos con asistencia por QR). API.credencial.generar devuelve un lote de códigos.
// v15 (2026-09-20): API.credencial (QR dinámico: generar / verificar). GAS_URL apunta al despliegue ...Wd7wA8B (backend con 04_ y 05_).
// v14 (2026-09-20): rol Asistencia al Estudiante (API.asistente: ficha, cumpleaños, beneficios, quejas) y API.cumple.mio() para el mensaje de cumpleaños del alumno.
// v13 (2026-09-20): GAS_URL apunta al despliegue con backend v08.4.1 (catálogos tolerantes, secciones desde la planilla).
// Cliente unificado para Servidor Cloud + Base de Datos / Almacenamiento Cloud
// 100% compatible con GitHub Pages (sin dependencia de PHP ni SQLite)
// Usado por: index.html, dashboard.html, docente.html, libreta.html, attendance.html,
//            calendario.html, formulario-matricula.html, tesoreria.html, admin/

const ROLE_ES = {student:'alumno',teacher:'docente',admin:'admin',academic:'academico',inactive:'inactivo'};
const ROLE_EN = {alumno:'student',docente:'docente',admin:'admin',academico:'academic',inactivo:'inactive',student:'student',teacher:'docente',academic:'academic',inactive:'inactive'};

// Servidor Cloud URL (planilla BasedeDatosCampus = única base en la nube).
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwAdP3StAmLM1qyYsCFI2GQ1KC7SY1b7N-C-Co-mUzUzHPkNIqFLu1jkpjOxb2AHZG4/exec';

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyC_Jup2lXag6UFvsaiLQv5KSrP7JIpMIQQ",
    authDomain: "centuria-campusvirtual-e74dd.firebaseapp.com",
    projectId: "centuria-campusvirtual-e74dd",
    storageBucket: "centuria-campusvirtual-e74dd.firebasestorage.app",
    messagingSenderId: "85652711732",
    appId: "1:85652711732:web:6c07800f01cc7d4bca1d61",
    measurementId: "G-GVYL32YCFX"
};

let _firestoreDb = null;

function getDb() {
    if (_firestoreDb) return _firestoreDb;
    const fb = window.firebase;
    if (!fb || !fb.firestore || !fb.initializeApp || !Array.isArray(fb.apps)) {
        if (typeof window._fbCheck === 'function') window._fbCheck();
        console.error('[getDb] Firebase compat SDK no está disponible; se rechaza la consulta para no informar falsamente que una cuenta no existe.');
        console.warn('[getDb] Script sources:', [...document.querySelectorAll('script[src*="firebase"]')].map(s => s.src + ' -> ' + (s.onerror ? 'has onerror' : 'no onerror')));
        throw new Error('No se pudo conectar con el servicio de cuentas. Recarga la página e inténtalo nuevamente.');
    }
    try {
        if (fb.apps.length === 0) fb.initializeApp(FIREBASE_CONFIG);
        _firestoreDb = fb.firestore();
    } catch (error) {
        console.error('[getDb] No se pudo inicializar Firebase:', error);
        throw new Error('No se pudo iniciar el servicio de cuentas. Inténtalo más tarde.');
    }
    if (!_firestoreDb || typeof _firestoreDb.collection !== 'function') {
        _firestoreDb = null;
        throw new Error('El servicio de cuentas no está disponible. Recarga la página e inténtalo nuevamente.');
    }
    return _firestoreDb;
}

// ── Firebase Authentication (Email/Contraseña) — v2026-10-06 ──
// Cada cuenta del Campus es un usuario de Firebase Auth con correo interno <cedula>@campus-centuria.local.
// La contraseña la verifica Firebase (nunca viaja ni se guarda en Firestore) y las reglas
// identifican al usuario por ese correo (o por el claim "cedula" que pone la migración).
const CV_AUTH_DOMINIO = 'campus-centuria.local';
// Secciones del Instituto (v2026-10-07). Cualquier otra se escribe a mano ("Otra").
const CV_SECCIONES = ['LV026', 'MJ026', 'S026'];
window.CV_SECCIONES = CV_SECCIONES;
// Servicio de recuperación de contraseña (Apps Script recuperar_campus.gs). Vacío = desactivado.
const RECUPERAR_URL = 'https://script.google.com/macros/s/AKfycbx8wwKp9sQ-KO_ieB9Og5QT_U4UgnGKSlheeHSDOmRgDNIW3R-3wDAbH5lRDr1jdvUnOA/exec';
function cvEmailDeCedula(ced) {
    return String(ced || '').replace(/[\.\s\-]/g, '').trim().toLowerCase() + '@' + CV_AUTH_DOMINIO;
}
let _cvAuthSdk = null;
// Carga los módulos compat que falten (app → firestore → auth), para páginas que no incluyen el SDK.
function cvCargarAuthSdk() {
    const fb = function () { return window.firebase || {}; };
    if (fb().initializeApp && fb().firestore && fb().auth) return Promise.resolve();
    if (_cvAuthSdk) return _cvAuthSdk;
    const cargar = function (modulo) {
        return new Promise(function (resolve, reject) {
            const version = fb().SDK_VERSION || '10.12.0';
            const s = document.createElement('script');
            s.src = 'https://www.gstatic.com/firebasejs/' + version + '/firebase-' + modulo + '-compat.js';
            s.onload = function () { resolve(); };
            s.onerror = function () { reject(new Error('No se pudo cargar Firebase (' + modulo + ').')); };
            document.head.appendChild(s);
        });
    };
    _cvAuthSdk = Promise.resolve()
        .then(function () { if (!fb().initializeApp) return cargar('app'); })
        .then(function () { if (!fb().firestore) return cargar('firestore'); })
        .then(function () { if (!fb().auth) return cargar('auth'); })
        .catch(function (e) { _cvAuthSdk = null; throw e; });
    return _cvAuthSdk;
}
// Espera a que Firebase restaure la sesión guardada antes de consultar Firestore.
let _cvAuthListo = null;
function authListo() {
    if (_cvAuthListo) return _cvAuthListo;
    _cvAuthListo = cvCargarAuthSdk().then(function () {
        getDb();
        return new Promise(function (resolve) {
            const off = window.firebase.auth().onAuthStateChanged(function (u) { off(); resolve(u); });
        });
    }).catch(function (e) { console.warn('[auth]', e && e.message); _cvAuthListo = null; return null; });
    return _cvAuthListo;
}
// Nombre histórico: antes iniciaba sesión anónima. Ahora devuelve el usuario con sesión iniciada.
function ensureAnonAuth() {
    return authListo().then(function () {
        const u = window.firebase && window.firebase.auth ? window.firebase.auth().currentUser : null;
        if (u) return u;
        const err = new Error('Tu sesión expiró. Volvé a ingresar con tu cédula y contraseña.');
        err.code = 'SIN_SESION';
        throw err;
    });
}
function cvErrorAuth(e, contexto) {
    const c = (e && e.code) || '';
    if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].indexOf(c) >= 0)
        return contexto === 'cambio' ? 'Contraseña actual incorrecta.' : 'Cédula o contraseña incorrecta.';
    if (c === 'auth/user-disabled') return 'Cuenta inactiva. Contactá a la administración.';
    if (c === 'auth/too-many-requests') return 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.';
    if (c === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
    if (c === 'auth/requires-recent-login') return 'Por seguridad, ingresá tu contraseña actual.';
    if (c === 'auth/operation-not-allowed' || c === 'auth/configuration-not-found')
        return 'El acceso con contraseña no está activado en Firebase (Authentication → Email/Contraseña).';
    if (c === 'auth/network-request-failed') return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    return 'Error: ' + (c || (e && e.message) || 'desconocido');
}
// Ficha del usuario logueado: primero por ID (= uid tras la migración), si no, por cédula.
function cvCargarFicha(db, authUser, ced) {
    return db.collection('usuarios').doc(authUser.uid).get().then(function (snap) {
        if (snap.exists && String(snap.data().cedula || '') === ced) return snap;
        return db.collection('usuarios').where('cedula', '==', ced).limit(1).get()
            .then(function (q) { return q.empty ? null : q.docs[0]; });
    });
}

// Configuración central institucional
window.CENTURIA_CONFIG = {
    environment: 'production',
    appBasePath: (function () {
        // En GitHub Pages el despliegue copia el contenido de app/ a la raíz del sitio,
        // así que '/app/' nunca aparece en la URL real. En vez de buscarlo, se calcula
        // la ruta de vuelta a la raíz leyendo el propio <script src="...js/api.js">
        // de la página (cada página ya lo referencia correctamente, con tantos '../'
        // como niveles de profundidad tenga).
        try {
            var scripts = document.getElementsByTagName('script');
            for (var s = 0; s < scripts.length; s++) {
                var src = scripts[s].getAttribute('src') || '';
                var m = src.match(/^((?:\.\.\/)*)js\/api\.js/);
                if (m) return m[1] || './';
            }
        } catch (e) {}
        // Respaldo (entorno local con carpeta /app/ en la URL)
        try {
            var i = location.pathname.indexOf('/app/');
            return i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
        } catch (e) { return './'; }
    })(),
    apiProvider: 'firebase',
    cloudApiUrl: 'firestore',
    requestTimeout: 15000,
    allowOfflineAuthentication: false
};

// URLs relativas a la raíz de la app
function appUrl(relativePath) {
    try {
        var base = (window.CENTURIA_CONFIG && CENTURIA_CONFIG.appBasePath) || './';
        // 'base' ya es la ruta relativa correcta hacia la raíz de la app desde la página
        // actual (p. ej. '../' desde academic/, '' desde la raíz) — se concatena y se
        // resuelve contra la URL de la página, nunca contra un origen absoluto fijo.
        return new URL(base + relativePath.replace(/^\.\//, ''), document.baseURI).href;
    } catch (e) { return relativePath; }
}

// ══════════════════════════════════════════════════════════════
// COMUNICADOR CENTRAL CON EL SERVIDOR CLOUD (CORS-friendly)
// ══════════════════════════════════════════════════════════════

function callGas(action, data, method) {
    return authListo().then(function () { return callGasCore(action, data, method); });
}

function callGasCore(action, data, method) {
    data = data || {};
    method = (method || 'GET').toUpperCase();
    try {
        const db = getDb();
        const F = window.firebase.firestore;
        switch (action) {
            case 'login': {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                const pass = String(data.password || '').trim();
                if (!ced || !pass) return Promise.resolve({ ok: false, error: 'Cédula y contraseña requeridas.' });
                const auth = window.firebase.auth();
                return auth.signInWithEmailAndPassword(cvEmailDeCedula(ced), pass).then(function (cred) {
                    return cvCargarFicha(db, cred.user, ced).then(function (doc) {
                        const salir = function (msg) { return auth.signOut().then(function () { return { ok: false, error: msg }; }); };
                        if (!doc) return salir('Tu cuenta existe pero no se encontró tu ficha. Contactá a la administración.');
                        const d = doc.data();
                        if (d.estado === 'pendiente' && (d.rol === 'docente' || d.solicitud_rol_docente)) return salir('Tu solicitud de acceso docente está pendiente de aprobación por Administración.');
                        if (d.estado === 'inactivo' || d.estado === 'baja') return salir('Cuenta inactiva. Contactá a la administración.');
                        // Sesión de 8 h (pseudo-JWT compatible con parseJwt()/isExpired() de session-guard.js).
                        const now = Math.floor(Date.now() / 1000);
                        const b64u = function (obj) {
                            return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
                                .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                        };
                        const token = b64u({ alg: 'none', typ: 'JWT' }) + '.' +
                                      b64u({ cedula: ced, rol: d.rol || 'alumno', exp: now + 8 * 3600, iat: now }) + '.' +
                                      ced.replace(/[^0-9]/g, '').substring(0, 8);
                        const user = Object.assign({}, d, { id: doc.id });
                        delete user.password; delete user.current_password;
                        return { ok: true, token: token, user: user,
                                 token_expires: new Date((now + 8 * 3600) * 1000).toISOString(),
                                 must_change_password: d.must_change_password ? 1 : 0 };
                    });
                }).catch(function (e) {
                    console.error('[login]', e && e.code, e && e.message);
                    return { ok: false, error: cvErrorAuth(e, 'login'), codigo: (e && e.code) || '' };
                });
            }

            case 'register': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                if (ced.length < 5 || ced.length > 20) return { ok: false, error: 'La cédula debe tener entre 5 y 20 caracteres.' };
                const rol = data.rol === 'docente' ? 'docente' : 'alumno';
                const email = String(data.email || '').trim().toLowerCase();
                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Correo electrónico válido requerido.' };
                if (!data.password || String(data.password).length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
                if (rol === 'alumno') {
                    if (!data.grado) return { ok: false, error: 'Grado académico es obligatorio para estudiantes.' };
                    if (!data.carrera) return { ok: false, error: 'Carrera/Programa es obligatorio para estudiantes.' };
                    if (!data.seccion) return { ok: false, error: 'Sección es obligatorio para estudiantes.' };
                }
                const indice = await db.collection('cedulas').doc(ced).get();
                // Un alumno pre-registrado (cargado desde planillas, sin cuenta) puede completar su registro.
                const preRegistro = indice.exists && indice.data().estado === 'pre_registro' && rol === 'alumno';
                if (indice.exists && !preRegistro) return { ok: false, error: 'Ya existe un usuario con esta cédula.' };
                const auth = window.firebase.auth();
                let cred;
                try {
                    cred = await auth.createUserWithEmailAndPassword(cvEmailDeCedula(ced), String(data.password));
                } catch (e) {
                    if (e && e.code === 'auth/email-already-in-use') return { ok: false, error: 'Ya existe un usuario con esta cédula.' };
                    return { ok: false, error: cvErrorAuth(e, 'registro') };
                }
                const uid = cred.user.uid;
                // Alumnos: ficha con ID = cédula (contrato existente). Docentes: ID = uid.
                const docId = rol === 'docente' ? uid : ced;
                const userData = {
                    id: docId, cedula: ced,
                    nombre: String(data.nombre || '').trim(), apellido: String(data.apellido || '').trim(),
                    email: email,
                    rol: rol,
                    grado: rol === 'alumno' ? String(data.grado || '') : '',
                    carrera: rol === 'alumno' ? String(data.carrera || '') : '',
                    seccion: rol === 'alumno' ? String(data.seccion || '') : '',
                    carrera_grado: rol === 'alumno' ? String(data.carrera || '') + '-' + String(data.grado || '') : '',
                    telefono: String(data.telefono || ''), foto: data.foto || data.foto_url || '',
                    estado: rol === 'docente' ? 'pendiente' : 'activo',
                    solicitud_rol_docente: rol === 'docente',
                    created_at: new Date().toISOString()
                };
                try {
                    // Una ficha anterior a la migración con la misma cédula no se pisa.
                    const previa = await db.collection('usuarios').doc(docId).get().catch(() => null);
                    if (previa && previa.exists) throw Object.assign(new Error('Ya existe un usuario con esta cédula.'), { code: 'YA_EXISTE' });
                    await db.collection('usuarios').doc(docId).set(userData);
                    await db.collection('cedulas').doc(ced).set({
                        cedula: ced, nombre: userData.nombre, apellido: userData.apellido,
                        estado: userData.estado, rol: rol, uid: docId, actualizado: userData.created_at
                    });
                } catch (e) {
                    try { await cred.user.delete(); } catch (_) {}
                    return { ok: false, error: e && e.code === 'YA_EXISTE' ? e.message : 'No se pudo completar el registro: ' + ((e && (e.code || e.message)) || 'error') };
                }
                if (rol === 'docente') { try { await auth.signOut(); } catch (_) {} }
                return { ok: true, user: userData, token: rol === 'docente' ? '' : Date.now().toString(36) };
            })();
            case 'validar_sesion': {
                let u = null; try{ const s = localStorage.getItem('centuria_user') || sessionStorage.getItem('centuria_user'); if(s) u = JSON.parse(s); }catch(e){}
                return Promise.resolve({ ok: true, valid: true, user: u });
            }
            case 'logout': return (window.firebase && window.firebase.auth ? window.firebase.auth().signOut() : Promise.resolve()).then(() => ({ ok: true }), () => ({ ok: true }));
            case 'actualizar_perfil': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                const ref = snap.docs[0].ref;
                const updates = {};
                ['nombre','apellido','email','telefono','telefono_alternativo','telefono_fijo',
                 'contacto_emergencia','fecha_nacimiento','lugar_nacimiento','nacionalidad','pais',
                 'direccion_calle','barrio','ciudad','departamento','direccion','latitud','longitud',
                 'estado_civil','foto','foto_url','grupo_sanguineo','alergias','seguro_medico',
                  'rol','estado','carrera','seccion','grado','must_change_password'
                ].forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
                updates.updated_at = new Date().toISOString();
                return ref.update(updates).then(async () => {
                    // v2026-10-11: el índice público «cedulas» refleja rol/estado (lo usan el login y «Buscar mi registro»).
                    if (updates.rol !== undefined || updates.estado !== undefined) {
                        const d = Object.assign({}, snap.docs[0].data(), updates);
                        await db.collection('cedulas').doc(String(d.cedula)).set({ cedula: String(d.cedula), rol: String(d.rol || 'alumno'),
                            estado: String(d.estado || 'activo'), actualizado: updates.updated_at }, { merge: true }).catch(() => {});
                    }
                    return { ok: true, user: Object.assign({}, snap.docs[0].data(), updates) };
                });
            }).catch(e => ({ ok: false, error: e.message }));
            case 'cambiar_password': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                const oldP = String(data.old_password || '');
                const newP = String(data.new_password || '');
                if (!ced || !newP) return { ok: false, error: 'Datos incompletos.' };
                if (newP.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
                const auth = window.firebase.auth();
                const email = cvEmailDeCedula(ced);
                try {
                    let u = auth.currentUser;
                    if (!u || String(u.email || '').toLowerCase() !== email) {
                        if (!oldP) return { ok: false, error: 'Ingresá tu contraseña actual.' };
                        u = (await auth.signInWithEmailAndPassword(email, oldP)).user;
                    } else if (oldP) {
                        await u.reauthenticateWithCredential(window.firebase.auth.EmailAuthProvider.credential(email, oldP));
                    }
                    await u.updatePassword(newP);
                    const doc = await cvCargarFicha(db, u, ced).catch(() => null);
                    if (doc) await doc.ref.update({ must_change_password: false, updated_at: new Date().toISOString() }).catch(() => {});
                    return { ok: true };
                } catch (e) {
                    return { ok: false, error: cvErrorAuth(e, 'cambio') };
                }
            })();
            // Las cuentas usan un correo interno: el enlace oficial de Firebase lo envía al correo real
            // el servicio de Apps Script recuperar_campus.gs (RECUPERAR_URL).
            case 'recuperar_acceso': {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                const correo = String(data.email || '').trim();
                if (!ced || !correo) return Promise.resolve({ ok: false, error: 'Ingresá tu cédula y el correo con el que te registraste.' });
                if (!RECUPERAR_URL) return Promise.resolve({ ok: false, error: 'La recuperación automática todavía no está disponible. Pedí a la administración del Instituto que restablezca tu contraseña.' });
                return fetch(RECUPERAR_URL, {
                    method: 'POST', redirect: 'follow', cache: 'no-store',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ accion: 'recuperar', cedula: ced, email: correo })
                }).then(r => r.json()).catch(() => ({ ok: false, error: 'No se pudo conectar con el servicio de recuperación. Intentá de nuevo.' }));
            }
            case 'verificar_alumno': {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return Promise.resolve({ ok: false, existe: false, error: 'Ingresa una cédula válida.', codigo: 'CEDULA_REQUERIDA' });
                return db.collection('cedulas').doc(ced).get().then(snap => {
                    if (!snap.exists) return { ok: true, existe: false, estado: 'no_existe' };
                    const d = snap.data();
                    return { ok: true, existe: true, estado: d.estado || 'activo',
                             estudiante: { cedula: ced, nombre: d.nombre || '', apellido: d.apellido || '', estado: d.estado || 'activo', rol: d.rol || '' } };
                }).catch(error => ({ ok: false, existe: false, error: error && error.message ? error.message : 'No se pudo consultar el registro.', codigo: error && error.code ? error.code : 'ERROR_CONSULTA' }));
            }
            case 'verificar_roles': return (data.cedula
                ? db.collection('usuarios').where('cedula', '==', data.cedula).limit(1).get()
                : db.collection('usuarios').get()
            ).then(snap => {
                if (data.cedula) {
                    if (snap.empty) return { ok: true, roles: [], rol: '' };
                    const d = snap.docs[0].data();
                    // Normalizar: si hay array roles[] usarlo; si no, construir desde campo rol simple.
                    var roles = [];
                    if (Array.isArray(d.roles) && d.roles.length > 0) {
                        roles = d.roles.map(function(r) {
                            return {
                                rol:     String(r.rol     || 'alumno').toLowerCase(),
                                estado:  String(r.estado  || 'activo').toLowerCase(),
                                carrera: r.carrera || d.carrera || '',
                                seccion: r.seccion || d.seccion || ''
                            };
                        });
                    } else {
                        // Compatibilidad legacy: solo campo rol raíz
                        roles = [{ rol: d.rol || 'alumno', estado: d.estado || 'activo', carrera: d.carrera || '', seccion: d.seccion || '' }];
                    }
                    return { ok: true, roles: roles, rol: d.rol || '' };
                }
                const users = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                return { ok: true, roles: users.map(u => ({ cedula: u.cedula, nombre: u.nombre, rol: u.rol, estado: u.estado })), usuarios: users };
            }).catch(() => ({ ok: true, roles: [] }));

            case 'listar_usuarios': return db.collection('usuarios').get().then(async snap => {
                const usuarios = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                // Alumnos pre-registrados (con asistencia cargada, sin cuenta todavía). Solo el personal puede listarlos.
                const conFicha = new Set(usuarios.map(u => String(u.cedula || u.id)));
                const pre = await db.collection('cedulas').where('estado', '==', 'pre_registro').get().catch(() => null);
                if (pre) pre.docs.forEach(d => {
                    if (conFicha.has(d.id)) return;
                    const x = d.data();
                    usuarios.push({ id: d.id, cedula: d.id, nombre: x.nombre || '', apellido: x.apellido || '', rol: 'alumno', estado: 'pre_registro', sin_cuenta: true });
                });
                return { ok: true, usuarios: usuarios };
            }).catch(() => ({ ok: true, usuarios: [] }));
            case 'listar_asignaturas': case 'materias.listar': return Promise.resolve().then(() => db.collection('asignaturas').get().then(snap => ({
                ok: true, asignaturas: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            }))).catch(() => ({ ok: true, asignaturas: [] }));
case 'listar_carreras': return Promise.resolve().then(() => db.collection('config_carreras').get().then(snap => {
                // Catálogo público (sin sesión): se usa en el registro y en "Solicitar Asignatura".
                const normG = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                const filtro = normG(data.grado || '');
                const CATALOGO_DEFAULT = [
                    { nombre: 'Licenciatura en Administración de Empresas', grado: 'GRADO' },
                    { nombre: 'Licenciatura en Administración Aduanera', grado: 'GRADO' },
                    { nombre: 'Licenciatura en Administración y Gestión Pública', grado: 'GRADO' },
                    { nombre: 'Licenciatura en Ciencias Contables', grado: 'GRADO' },
                    { nombre: 'Licenciatura en Comercio Internacional', grado: 'GRADO' },
                    { nombre: 'Ingeniería Comercial', grado: 'GRADO' },
                    { nombre: 'Ciencias Sociales', grado: 'GRADO' },
                    { nombre: 'Especialización en Didáctica Superior Universitaria', grado: 'ESPECIALIZACIÓN' },
                    { nombre: 'Especialización en Gestión de Políticas Públicas', grado: 'ESPECIALIZACIÓN' },
                    { nombre: 'Especialización en Gestión de Proyectos', grado: 'ESPECIALIZACIÓN' },
                    { nombre: 'Especialización en Auditoría y Control de Gestión', grado: 'ESPECIALIZACIÓN' },
                    { nombre: 'Especialización en Administración Financiera', grado: 'ESPECIALIZACIÓN' },
                    { nombre: 'Maestría en Administración de Empresas (MBA)', grado: 'MAESTRÍA' },
                    { nombre: 'Maestría en Gestión Pública y Desarrollo', grado: 'MAESTRÍA' },
                    { nombre: 'Maestría en Ciencias de la Educación y Docencia Superior', grado: 'MAESTRÍA' },
                    { nombre: 'Maestría en Auditoría Integral y Gestión de Riesgos', grado: 'MAESTRÍA' },
                    { nombre: 'Maestría en Finanzas y Negocios Internacionales', grado: 'MAESTRÍA' },
                    { nombre: 'Doctorado en Ciencias Administrativas y Gestión', grado: 'DOCTORADO' },
                    { nombre: 'Doctorado en Ciencias de la Educación', grado: 'DOCTORADO' },
                    { nombre: 'Doctorado en Políticas Públicas y Gobernanza', grado: 'DOCTORADO' },
                    { nombre: 'Doctorado en Economía y Desarrollo Social', grado: 'DOCTORADO' }
                ];

                const vistas = new Map();
                if (snap && !snap.empty) {
                    snap.docs.forEach(doc => {
                        const d = doc.data(); const c = String(d.nombre || '').trim(); if (!c) return;
                        const g = String(d.grado || '').trim();
                        if (filtro && g && normG(g) !== filtro) return;
                        if (!vistas.has(c)) vistas.set(c, { nombre: c, grado: g });
                    });
                }
                if (vistas.size === 0) {
                    CATALOGO_DEFAULT.forEach(item => {
                        if (filtro && normG(item.grado) !== filtro) return;
                        vistas.set(item.nombre, item);
                    });
                }
                return { ok: true, carreras: [...vistas.values()] };
            })).catch(() => ({ ok: true, carreras: [] }));
            case 'agregar_carrera': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                const rol = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get().then(snap => {
                    if (snap.empty) return '';
                    return snap.docs[0].data().rol || '';
                });
                const allowedRoles = ['admin','administrador_plataforma','administracion_general','admin_general','administracion'];
                if (!allowedRoles.includes(rol)) return { ok: false, error: 'Solo administradores pueden agregar carreras.' };
                const id = 'CAR-' + Date.now().toString(36);
                await db.collection('config_carreras').doc(id).set({
                    nombre: String(data.nombre || '').trim(),
                    grado: String(data.grado || 'GRADO').trim().toUpperCase(),
                    activo: data.activo !== false,
                    creado_en: new Date().toISOString()
                });
                return { ok: true, carrera: { id, nombre: data.nombre || '' } };
            })();
            case 'listar_secciones': return Promise.resolve({ ok: true, secciones: CV_SECCIONES.map(c => ({ codigo: c })) });
            case 'listar_grados': return Promise.resolve({ ok: true, grados: ['GRADO','ESPECIALIZACIÓN','MAESTRÍA','DOCTORADO'].map(g => ({ nombre: g })) });
            case 'listar_filiales': return db.collection('filiales').get().then(snap => ({
                ok: true, filiales: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, filiales: [] }));
            case 'listar_cursos': return Promise.resolve().then(() => db.collection('asignaturas').get().then(snap => ({
                ok: true, cursos: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            }))).catch(() => ({ ok: true, cursos: [] }));
            case 'mis_cursos': return (async () => {
                // ── Parsear token para obtener cédula y rol ─────────────────────────────
                var cedTok = '', rolTok = 'alumno', fichaAlumno = {};
                try {
                    var tok = (data && data.token) || '';
                    if (tok) {
                        var parts = tok.split('.');
                        if (parts.length >= 2) {
                            var pad = parts[1];
                            while (pad.length % 4) pad += '=';
                            var pl = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
                            cedTok = pl.cedula || '';
                            rolTok = pl.rol || 'alumno';
                        }
                    }
                } catch(e) {}
                // Personal (no alumno): sin cursos propios
                if (rolTok !== 'alumno') return { ok: true, alumno: false, cursos: [], materiales: [], resumen: {} };
                // ── Obtener ficha del alumno (carrera, sección, grado) ──────────────────
                if (cedTok) {
                    try {
                        var uSnap = await db.collection('usuarios').where('cedula', '==', cedTok).limit(1).get();
                        if (!uSnap.empty) fichaAlumno = uSnap.docs[0].data() || {};
                    } catch(e) {}
                }
                var carrera  = (fichaAlumno.carrera  || '').toUpperCase().trim();
                var seccion  = (fichaAlumno.seccion  || '').toUpperCase().trim();
                var rawGrado = (fichaAlumno.grado    || '').toUpperCase().trim();
                var deducirNivel = function(g, c) {
                    var gn = String(g || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                    if (['GRADO', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'].indexOf(gn) >= 0) return gn;
                    var cn = String(c || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                    if (/DOCTOR|PHD/.test(cn)) return 'DOCTORADO';
                    if (/MAESTR|MBA|MASTER/.test(cn)) return 'MAESTRIA';
                    if (/ESPECIALI|DIPLO|DIDACTICA/.test(cn)) return 'ESPECIALIZACION';
                    return 'GRADO';
                };
                var grado = deducirNivel(rawGrado, carrera);
                // ── Obtener asignaturas y filtrar ──────────────────────────────────────
                var snap = await db.collection('asignaturas').get();
                var todas = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
                // Filtrar: si el alumno tiene carrera definida, solo las de esa carrera (o sin carrera).
                // v2026-10-11: una asignatura puede ser de varias carreras (campo carreras[]) y se compara sin tildes.
                // Con calificaciones.js cargado se usa carreraClave (reconoce «Lic. en …», singular/plural, etc.).
                var sinTilde = (window.CenturiaNotas && CenturiaNotas.carreraClave) || function(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim(); };
                var filtradas = carrera
                    ? todas.filter(function(a) {
                        var lista = (Array.isArray(a.carreras) && a.carreras.length ? a.carreras : [a.carrera]).map(sinTilde).filter(Boolean);
                        return !lista.length || lista.indexOf(sinTilde(carrera)) >= 0;
                    })
                    : todas;
                // Construir cursos con la estructura que espera renderCursosAlumno
                var materiales = [];
                var cursos = filtradas.map(function(a) {
                    var codigo = (a.codigo || a.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                    var estado = (a.estado || 'activo').toLowerCase();
                    var tieneMateria = estado === 'activo' || estado === 'desarrollado';
                    if (tieneMateria && codigo) materiales.push(codigo);
                    return {
                        estado: estado,
                        materiales: tieneMateria,
                        grado: grado || a.grado || 'GRADO',
                        seccion: a.seccion || seccion,
                        asignatura: {
                            id:           a.id,
                            codigo:       a.codigo || a.id,
                            uuid:         a.codigo || a.id,
                            nombre:       a.nombre || a.Nombre || 'Asignatura',
                            carrera:      a.carrera || carrera,
                            icono:        a.icono   || 'bi-journal-bookmark',
                            semestre:     a.semestre || '',
                            carga_horaria: a.carga_horaria || a.horas || ''
                        }
                    };
                });
                var activos = cursos.filter(function(c) { return c.estado === 'activo'; }).length;
                return {
                    ok: true, alumno: true,
                    ficha: { carrera: fichaAlumno.carrera || '', seccion: fichaAlumno.seccion || '', grado: fichaAlumno.grado || '' },
                    cursos: cursos,
                    materiales: materiales,
                    resumen: { activo: activos, total: cursos.length },
                    diagnostico: {}
                };
            })().catch(function() { return { ok: true, alumno: true, cursos: [], materiales: [], resumen: {}, diagnostico: {} }; });

            case 'guardar_asignatura': return (async () => {
                const id = data.codigo || data.id || 'ASIG-' + Date.now().toString(36);
                await db.collection('asignaturas').doc(id).set(Object.assign({}, data, { updated_at: new Date().toISOString() }));
                return { ok: true, id: id };
            })();
            case 'eliminar_asignatura': return db.collection('asignaturas').doc(data.id).delete().then(() => ({ ok: true })).catch(() => ({ ok: false }));
            // v2026-10-11: activar / dar de baja una asignatura sin reescribir el resto de la ficha.
            case 'asignatura_estado': {
                const est = String(data.estado || '').toLowerCase();
                if (!data.id || ['activo', 'inactivo'].indexOf(est) < 0) return Promise.resolve({ ok: false, error: 'Datos inválidos.' });
                return db.collection('asignaturas').doc(String(data.id)).update({ estado: est, updated_at: new Date().toISOString() })
                    .then(() => ({ ok: true })).catch(e => ({ ok: false, error: e.message }));
            }
            // v2026-10-11: alta desde el panel = pre-registro de la cédula; la persona completa el registro con su contraseña.
            case 'preregistrar_usuario': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (ced.length < 5) return { ok: false, error: 'Cédula inválida.' };
                const idx = await db.collection('cedulas').doc(ced).get();
                if (idx.exists) return { ok: false, error: idx.data().estado === 'pre_registro' ? 'Esa cédula ya está pre-registrada.' : 'Ya existe una cuenta con esa cédula.' };
                await db.collection('cedulas').doc(ced).set({ cedula: ced, nombre: String(data.nombre || '').toUpperCase(),
                    apellido: String(data.apellido || '').toUpperCase(), estado: 'pre_registro', rol: 'alumno', uid: '', actualizado: new Date().toISOString() });
                return { ok: true };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'anular_preregistro': return db.collection('cedulas').doc(String(data.cedula || '')).get().then(d => {
                if (!d.exists || d.data().estado !== 'pre_registro') return { ok: false, error: 'No es un pre-registro.' };
                return d.ref.delete().then(() => ({ ok: true }));
            }).catch(e => ({ ok: false, error: e.message }));
            case 'asignar_rol': return (async () => {
                // Acciones: 'agregar' (default) | 'quitar' | 'principal'
                const ced    = String(data.cedula  || '').replace(/[\.\s\-]/g, '').trim();
                const rolNuevo = String(data.rol || data.role || 'alumno').toLowerCase().trim();
                const accion   = String(data.accion || 'agregar').toLowerCase();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                const snap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                const doc = snap.docs[0];
                const d   = doc.data();
                // Normalizar array de roles existente
                var rolesActuales = [];
                if (Array.isArray(d.roles)) {
                    rolesActuales = d.roles;
                } else if (d.rol) {
                    rolesActuales = [{ rol: d.rol, estado: d.estado || 'activo', carrera: d.carrera || '', seccion: d.seccion || '' }];
                }
                var updates = { updated_at: new Date().toISOString() };
                if (accion === 'quitar') {
                    // Desactivar el rol en el array (no eliminar → preserva historial)
                    rolesActuales = rolesActuales.map(function(r) {
                        return r.rol === rolNuevo ? Object.assign({}, r, { estado: 'inactivo' }) : r;
                    });
                    updates.roles = rolesActuales;
                } else if (accion === 'principal') {
                    // Cambiar el rol raíz del documento
                    updates.rol = rolNuevo;
                    // Actualizar también el array (marcar el nuevo como activo)
                    var existe = rolesActuales.some(function(r) { return r.rol === rolNuevo; });
                    if (!existe) {
                        rolesActuales.push({ rol: rolNuevo, estado: 'activo', carrera: data.carrera || '', seccion: data.seccion || '' });
                    } else {
                        rolesActuales = rolesActuales.map(function(r) {
                            return r.rol === rolNuevo ? Object.assign({}, r, { estado: 'activo' }) : r;
                        });
                    }
                    updates.roles = rolesActuales;
                } else {
                    // agregar: añadir si no existe, o reactivar si estaba inactivo
                    var yaExiste = rolesActuales.some(function(r) { return r.rol === rolNuevo; });
                    if (yaExiste) {
                        rolesActuales = rolesActuales.map(function(r) {
                            return r.rol === rolNuevo ? Object.assign({}, r, { estado: 'activo', carrera: data.carrera || r.carrera || '', seccion: data.seccion || r.seccion || '' }) : r;
                        });
                    } else {
                        rolesActuales.push({ rol: rolNuevo, estado: 'activo', carrera: data.carrera || '', seccion: data.seccion || '' });
                    }
                    updates.roles = rolesActuales;
                    // Si era el único rol o no tenía rol raíz, establecerlo
                    if (!d.rol || d.rol === 'alumno') updates.rol = rolNuevo;
                }
                await doc.ref.update(updates);
                return { ok: true, roles: updates.roles || rolesActuales };
            })();

            case 'desactivar_rol': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                return snap.docs[0].ref.update({ estado: 'inactivo', updated_at: new Date().toISOString() }).then(() => ({ ok: true }));
            });
            case 'registrar_pago': return (async () => {
                const id = 'PAGO-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                await db.collection('pagos').doc(id).set(Object.assign({}, data, { fecha: new Date().toISOString(), estado: data.estado || 'pagado' }));
                return { ok: true, id: id };
            })();
            case 'consultar_pagos': {
                // Si hay cédula, filtramos en Firestore (más eficiente y permite que las reglas funcionen).
                // El alumno solo puede leer sus propios documentos gracias a getCedulaForUid() en las reglas.
                var pagosQuery = data.cedula
                    ? db.collection('pagos').where('cedula', '==', data.cedula)
                    : db.collection('pagos');
                return pagosQuery.get().then(function(snap) {
                    return { ok: true, pagos: snap.docs.map(function(doc) { return Object.assign({ id: doc.id }, doc.data()); }) };
                }).catch(function() { return { ok: true, pagos: [] }; });
            }

            case 'pagos.stats': return db.collection('pagos').get().then(snap => {
                const pagos = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                const total = pagos.length;
                const pagados = pagos.filter(p => p.estado === 'pagado').length;
                const pendientes = pagos.filter(p => p.estado !== 'pagado').length;
                return { ok: true, total, pagados, pendientes };
            }).catch(() => ({ ok: true, total: 0, pagados: 0, pendientes: 0 }));
            case 'registrar_alumno': return { ok: false, error: 'El alta directa está deshabilitada. Usa el registro público o el servicio administrativo autorizado.' };
            case 'subir_csv': return Promise.resolve({ ok: true, imported: 0 });
            case 'tesoreria_listar_estudiantes': return db.collection('usuarios').get().then(snap => ({
                ok: true, estudiantes: snap.docs.map(doc => {
                    const d = doc.data();
                    return { cedula: d.cedula || doc.id, nombre: d.nombre || '', apellido: d.apellido || '', estado_pago: d.estado_pago || 'pendiente' };
                })
            })).catch(() => ({ ok: true, estudiantes: [] }));
            case 'tesoreria_historial_pagos': return db.collection('pagos').get().then(snap => ({
                ok: true, pagos: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data())).filter(p => p.cedula === data.alumno_cedula)
            })).catch(() => ({ ok: true, pagos: [] }));
            case 'tesoreria_obtener_exoneracion': return db.collection('pagos').get().then(snap => {
                const ex = snap.docs.find(doc => doc.data().cedula === data.alumno_cedula && doc.data().concepto === 'Exoneración');
                return { ok: true, tiene_exoneracion: !!ex, porcentaje: ex ? (ex.data().porcentaje || 0) : 0 };
            }).catch(() => ({ ok: true, tiene_exoneracion: false, porcentaje: 0 }));
            case 'tesoreria_reporte_cobranzas': return db.collection('pagos').get().then(snap => ({
                ok: true, total_recaudado: snap.docs.filter(d => d.data().estado === 'pagado').length,
                total_pendiente: snap.docs.filter(d => d.data().estado !== 'pagado').length, pagos: snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
            })).catch(() => ({ ok: true, total_recaudado: 0, total_pendiente: 0, pagos: [] }));
            case 'asignaciones_docentes': return ensureAnonAuth().then(function () {
                const qs = [
                    db.collection('usuarios').where('rol', '==', 'docente').limit(500).get(),
                    db.collection('usuarios').where('es_docente', '==', true).limit(500).get()
                ];
                return Promise.all(qs.map(p => p.catch(() => ({ docs: [] })))).then(function (resps) {
                    const mapa = {};
                    resps.forEach(snap => snap.docs.forEach(doc => { mapa[doc.id] = doc.data(); }));
                    const docentes = Object.keys(mapa).map(function (id) {
                        const d = mapa[id];
                        const asgs = Array.isArray(d.asignaciones) ? d.asignaciones : [];
                        const activas = asgs.filter(a => a && a.estado === 'activo');
                        return {
                            cedula: d.cedula || id,
                            nombre: ((d.nombre || '') + ' ' + (d.apellido || '')).trim() || d.nombre_completo || d.cedula || id,
                            email: d.email || '',
                            estado: d.estado || 'activo',
                            pendiente: d.estado === 'pendiente',
                            declarado: { grado: d.grado || '', carrera: d.carrera || '', seccion: d.seccion || '' },
                            asignaciones: asgs.map(a => ({
                                fila: a.fila, asignatura: a.asignatura, carrera: a.carrera, seccion: a.seccion,
                                grado: a.grado || '', estado: a.estado, asignado_por: a.asignado_por || ''
                            })),
                            activas: activas.length
                        };
                    });
                    return {
                        ok: true, docentes: docentes,
                        pendientes: docentes.filter(d => d.pendiente).length,
                        sin_asignar: docentes.filter(d => !d.pendiente && d.activas === 0).length
                    };
                });
            }).catch(e => ({ ok: true, docentes: [], error: e.message }));
            case 'asignacion_guardar': return (async () => {
                await ensureAnonAuth();
                const ced = String(data.docente_cedula || '').trim();
                const asig = String(data.asignatura || '').trim();
                if (!ced || !asig) return { ok: false, error: 'Faltan datos: docente y asignatura.' };
                const grupos = Array.isArray(data.grupos) ? data.grupos : [];
                if (!grupos.length) return { ok: false, error: 'Agregá al menos un grupo.' };
                const snap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (snap.empty) return { ok: false, error: 'No se encontró al docente con cédula ' + ced + '.' };
                const doc = snap.docs[0], cur = doc.data();
                const curArr = (Array.isArray(cur.asignaciones) ? cur.asignaciones : []).filter(Boolean);
                const vivos = curArr.filter(a => a.estado === 'activo');
                const ahora = new Date().toISOString();
                const quemados = {};
                vivos.forEach(a => { quemados[(a.asignatura || '') + '|' + (a.carrera || '') + '|' + (a.seccion || '')] = 1; });
                const nuevos = [];
                grupos.forEach(g => {
                    const carrera = String(g.carrera || '').trim();
                    const seccion = String(g.seccion || '').trim().toUpperCase();
                    if (!carrera || !seccion) return;
                    const k = asig + '|' + carrera + '|' + seccion;
                    if (quemados[k]) return;
                    quemados[k] = 1;
                    nuevos.push({
                        fila: 'ASG-' + Date.now().toString(36) + '-' + (nuevos.length + 1) + Math.random().toString(36).substring(2, 4).toUpperCase(),
                        asignatura: asig, carrera: carrera, seccion: seccion,
                        grado: String(g.grado || '').trim(),
                        estado: 'activo', asignado_por: String(data.academico_cedula || '').trim(), asignado_en: ahora
                    });
                });
                if (!nuevos.length) return { ok: false, error: 'Esos grupos ya están asignados al docente.' };
                const update = { asignaciones: vivos.concat(nuevos), es_docente: true, updated_at: ahora };
                if (data.aprobar) {
                    update.estado = 'activo';
                    const rolCur = String(cur.rol || '').toLowerCase();
                    if (!['admin', 'administrador_plataforma', 'academico', 'academic', 'administracion_general', 'admin_general', 'administracion'].includes(rolCur)) update.rol = 'docente';
                }
                await doc.ref.update(update);
                return {
                    ok: true, mensaje: 'Asignación guardada (' + nuevos.length + ' grupo(s) en ' + asig + ').',
                    asignaciones: update.asignaciones.length, activas: vivos.length + nuevos.length
                };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'asignacion_revocar': return (async () => {
                await ensureAnonAuth();
                const ced = String(data.docente_cedula || '').trim();
                if (!ced) return { ok: false, error: 'Falta la cédula del docente.' };
                const filas = String(data.fila || '').split(',').map(f => f.trim()).filter(Boolean);
                if (!filas.length) return { ok: false, error: 'Falta el grupo a quitar.' };
                const snap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (snap.empty) return { ok: false, error: 'Docente no encontrado.' };
                const doc = snap.docs[0], cur = doc.data();
                const arr = (Array.isArray(cur.asignaciones) ? cur.asignaciones : []).map(a => {
                    if (a.fila && filas.indexOf(String(a.fila)) >= 0 && a.estado === 'activo') return Object.assign({}, a, { estado: 'inactivo', revocado_por: String(data.academico_cedula || ''), revocado_en: new Date().toISOString() });
                    return a;
                });
                await doc.ref.update({ asignaciones: arr, updated_at: new Date().toISOString() });
                return { ok: true, mensaje: 'Grupo(s) quitado(s).' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'asignacion_docente_decidir': return (async () => {
                await ensureAnonAuth();
                const ced = String(data.docente_cedula || '').trim();
                if (!ced) return { ok: false, error: 'Falta la cédula del docente.' };
                const snap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (snap.empty) return { ok: false, error: 'Docente no encontrado.' };
                const doc = snap.docs[0], cur = doc.data();
                const update = { updated_at: new Date().toISOString() };
                if (data.decision === 'aprobar') {
                    update.estado = 'activo'; update.es_docente = true;
                    const rolCur = String(cur.rol || '').toLowerCase();
                    if (!['admin', 'administrador_plataforma', 'academico', 'academic', 'administracion_general', 'admin_general', 'administracion'].includes(rolCur)) update.rol = 'docente';
                } else {
                    update.estado = 'inactivo';
                }
                await doc.ref.update(update);
                return { ok: true, mensaje: data.decision === 'aprobar' ? 'Docente aprobado.' : 'Docente rechazado.' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'mis_cursos_docente': return (async () => {
                const ced = String(data.cedula || '').trim();
                await ensureAnonAuth();
                const [asigSnap, usrSnap] = await Promise.all([
                    db.collection('asignaturas').get(),
                    ced ? db.collection('usuarios').where('cedula', '==', ced).limit(1).get() : Promise.resolve({ empty: true, docs: [] })
                ]);
                const asigs = {};
                asigSnap.docs.forEach(d => { const dd = d.data(); asigs[String(dd.codigo || d.id).toUpperCase()] = dd; });
                let asignaciones = [];
                if (!usrSnap.empty) {
                    const dd = usrSnap.docs[0].data();
                    asignaciones = (Array.isArray(dd.asignaciones) ? dd.asignaciones : []).filter(a => a && a.estado === 'activo');
                }
                const subjects = asignaciones.map(a => {
                    const base = asigs[String(a.asignatura || '').toUpperCase()] || {};
                    return {
                        id: a.asignatura, codigo: a.asignatura,
                        nombre: base.nombre_completo || base.nombre || a.asignatura,
                        seccion_asignada: a.seccion, seccion: a.seccion,
                        carrera: a.carrera || base.carrera || '',
                        color: base.color || '#2563EB', icono: base.icono || 'bi-book',
                        semestre: base.semestre || '', carga_horaria: base.carga_horaria || 0, unidades: base.unidades || 10
                    };
                });
                return {
                    ok: true, subjects: subjects,
                    assignments: asignaciones.map(a => ({ asignatura: a.asignatura, rol: 'docente', estado: 'activo', carrera: a.carrera || '', seccion: a.seccion || '' }))
                };
            })().catch(e => ({ ok: false, subjects: [], assignments: [], error: e.message }));
            case 'docente_pendientes': return ensureAnonAuth().then(() => db.collection('usuarios').where('rol', '==', 'docente').where('estado', '==', 'pendiente').limit(500).get()).then(snap => ({
                ok: true, pendientes: snap.docs.map(doc => {
                    const d = doc.data();
                    return { id: doc.id, cedula: d.cedula || '', nombre: d.nombre || '', apellido: d.apellido || '', email: d.email || '', telefono: d.telefono || '', estado: d.estado || 'pendiente', created_at: d.created_at || '' };
                })
            })).catch(() => ({ ok: true, pendientes: [] }));
            case 'docente_aprobar': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                // Verificar que el solicitante sea administrador
                // v2026-10-07: se verifica el rol de QUIEN aprueba (antes se miraba el del usuario aprobado).
                const authUser = await ensureAnonAuth();
                const miCed = String(authUser.email || '').split('@')[0];
                const miFicha = await cvCargarFicha(db, authUser, miCed).catch(() => null);
                const allowedRoles = ['admin','administrador_plataforma','administracion_general','admin_general','administracion'];
                if (!miFicha || !allowedRoles.includes(String(miFicha.data().rol || '').toLowerCase())) return { ok: false, error: 'No tenés permisos de administrador (tu rol en la base: ' + ((miFicha && miFicha.data().rol) || 'desconocido') + ').' };
                const uSnap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (uSnap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                await db.collection('cedulas').doc(ced).set({ estado: 'activo' }, { merge: true }).catch(() => {});
                await uSnap.docs[0].ref.update({ estado: 'activo', updated_at: new Date().toISOString() });
                return { ok: true, mensaje: 'Usuario aprobado y habilitado.' };
            })().catch(e => ({ ok: false, error: e.message || 'Error interno.' }));
            case 'docente_rechazar': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                // Verificar que el solicitante sea administrador
                // v2026-10-07: se verifica el rol de QUIEN aprueba (antes se miraba el del usuario aprobado).
                const authUser = await ensureAnonAuth();
                const miCed = String(authUser.email || '').split('@')[0];
                const miFicha = await cvCargarFicha(db, authUser, miCed).catch(() => null);
                const allowedRoles = ['admin','administrador_plataforma','administracion_general','admin_general','administracion'];
                if (!miFicha || !allowedRoles.includes(String(miFicha.data().rol || '').toLowerCase())) return { ok: false, error: 'No tenés permisos de administrador (tu rol en la base: ' + ((miFicha && miFicha.data().rol) || 'desconocido') + ').' };
                const uSnap = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (uSnap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                await uSnap.docs[0].ref.update({ estado: 'inactivo', updated_at: new Date().toISOString() });
                await db.collection('cedulas').doc(ced).set({ estado: 'inactivo' }, { merge: true }).catch(() => {});
                return { ok: true, mensaje: 'Docente rechazado.' };
            })().catch(e => ({ ok: false, error: e.message || 'Error interno.' }));
            case 'usuarios_pendientes': return ensureAnonAuth().then(() => db.collection('usuarios').where('estado', '==', 'pendiente').limit(500).get()).then(snap => ({
                ok: true, pendientes: snap.docs.map(doc => {
                    const d = doc.data();
                    return { id: doc.id, cedula: d.cedula || '', nombre: d.nombre || '', apellido: d.apellido || '', email: d.email || '', telefono: d.telefono || '', rol: d.rol || '', estado: d.estado || 'pendiente', carrera: d.carrera || '', seccion: d.seccion || '', created_at: d.created_at || '' };
                })
            })).catch(() => ({ ok: false, pendientes: [], error: 'No fue posible cargar solicitudes. Verifica el acceso administrativo.' }));
            case 'listar_eventos_calendario': return db.collection('eventos').get().then(snap => ({
                ok: true, eventos: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, eventos: [] }));
            case 'crear_evento_calendario': return (async () => {
                const id = 'EVT-' + Date.now().toString(36);
                await db.collection('eventos').doc(id).set(Object.assign({}, data, { created_at: new Date().toISOString() }));
                return { ok: true, id: id };
            })();
            case 'eliminar_evento_calendario': return db.collection('eventos').doc(data.id).delete().then(() => ({ ok: true })).catch(() => ({ ok: false }));
            case 'crear_filial': return (async () => {
                const id = 'FIL-' + Date.now().toString(36);
                await db.collection('filiales').doc(id).set(Object.assign({}, data, { created_at: new Date().toISOString() }));
                return { ok: true, id: id };
            })();
            case 'eliminar_filial': return db.collection('filiales').doc(data.id).delete().then(() => ({ ok: true })).catch(() => ({ ok: false }));
            case 'guardar_configuracion': return db.collection('configuracion').doc(data.key || 'default').set({ valor: data.valor, updated_at: new Date().toISOString() }).then(() => ({ ok: true }));
            case 'listar_notas': {
                // Con cédula: query filtrada en Firestore (alumno ve solo las suyas; staff pasa cedula vacía).
                var notasQuery = data.cedula
                    ? db.collection('notas').where('cedula', '==', data.cedula)
                    : db.collection('notas');
                return notasQuery.get().then(function(snap) {
                    return { ok: true, data: snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); }) };
                }).catch(function() { return { ok: true, data: [] }; });
            }

            case 'guardar_nota': case 'guardar_notas_asignatura': return (async () => {
                const id = data.id || 'NOTA-' + Date.now().toString(36);
                await db.collection('notas').doc(id).set(Object.assign({}, data, { updated_at: new Date().toISOString() }));
                return { ok: true };
            })();
            case 'examen_guardar_intento': case 'guardar_respuestas_examen': return (async () => {
                const ced = String(data.alumno_cedula || data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                // Normaliza el id del examen para que coincida con el historial del alumno (dashboard).
                const mapaEv = { parcial1: 'examen_parcial_1', parcial2: 'examen_parcial_2', virtual: 'examen_virtual', final_virtual: 'examen_final_virtual', final_escrito: 'examen_final_escrito' };
                const ev = String(data.evaluacion || '').toLowerCase().trim();
                const examId = data.examen_id || mapaEv[ev] || (ev ? 'examen_' + ev : 'examen_generico');
                const resp = Array.isArray(data.respuestas) ? data.respuestas : [];
                let puntaje = Number(data.puntaje);
                let total = Number(data.total);
                let pct = Number(data.pct);
                if (!Number.isFinite(puntaje)) puntaje = resp.filter(r => r && r.correcta === true).length;
                if (!Number.isFinite(total)) total = resp.length;
                if (!Number.isFinite(pct)) pct = total ? Math.round(puntaje / total * 100) : 0;
                const intento = {
                    timestamp: data.timestamp || new Date().toISOString(),
                    puntaje: puntaje,
                    total: total,
                    pct: pct,
                    correctas: data.correctas !== undefined ? data.correctas : resp.filter(r => r && r.correcta === true).length,
                    respuestas: resp
                };
                const docId = examId + '__' + ced;
                const ref = db.collection('intentos').doc(docId);
                const curr = await ref.get();
                let intentos = [];
                if (curr.exists) {
                    const d = curr.data() || {};
                    intentos = Array.isArray(d.intentos) ? d.intentos : [];
                }
                intentos.push(intento);
                const mejor = intentos.reduce((m, i) => Math.max(m, Number(i.puntaje) || 0), 0);
                await ref.set({
                    examen_id: examId,
                    alumno_cedula: ced,
                    nombre: data.nombre || '',
                    asignatura: data.asignatura || '',
                    evaluacion: ev,
                    intentos: intentos,
                    mejor_intento: mejor,
                    updated_at: new Date().toISOString()
                });
                return { ok: true, intentos: intentos, mejor_intento: mejor };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_obtener_intentos': return (async () => {
                const ced = String(data.alumno_cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: true, intentos: [], mejor_intento: null };
                const docId = String(data.examen_id || '') + '__' + ced;
                const snap = await db.collection('intentos').doc(docId).get();
                if (!snap.exists) return { ok: true, intentos: [], mejor_intento: null };
                const d = snap.data() || {};
                return { ok: true, intentos: Array.isArray(d.intentos) ? d.intentos : [], mejor_intento: d.mejor_intento || null };
            })().catch(e => ({ ok: true, intentos: [], mejor_intento: null, error: e.message }));
            case 'examen_config_listar': return db.collection('config_examen').get().then(snap => {
                const asig = cvT(data.asignatura);
                const configs = snap.docs.map(d => cvConfigNorm(d.data())).filter(c => !asig || c.asignatura === asig);
                return { ok: true, configs: configs };
            }).catch(e => ({ ok: false, error: e.message }));
            case 'examen_config_guardar': return (async () => {
                const examenId = cvT(data.examen_id), asig = cvT(data.asignatura);
                if (!examenId || !asig) return { ok: false, error: 'Faltan el examen y la asignatura.' };
                const habilitado = !(data.habilitado === false || cvT(data.habilitado).toLowerCase() === 'false');
                const fi = cvT(data.fecha_inicio), hi = cvT(data.hora_inicio), fc = cvT(data.fecha_cierre), hc = cvT(data.hora_cierre);
                const intentos = parseInt(data.intentos, 10) || 1;
                if (habilitado) {
                    const ini = cvLocalMs(fi, hi), cie = cvLocalMs(fc, hc);
                    if (!ini || !cie) return { ok: false, error: 'Indicá fecha y hora de inicio y de cierre.' };
                    if (cie <= ini) return { ok: false, error: 'El cierre debe ser posterior al inicio.' };
                    if (!(intentos >= 1 && intentos <= 99)) return { ok: false, error: 'La cantidad de intentos debe ser entre 1 y 99.' };
                }
                const id = 'cfg_' + examenId + '_' + (cvDkey(asig) || 'x');
                await db.collection('config_examen').doc(id).set({
                    examen_id: examenId, asignatura: asig, habilitado: cvSi(habilitado),
                    fecha_inicio: fi, hora_inicio: hi, fecha_cierre: fc, hora_cierre: hc,
                    intentos: intentos, configuradopor: cvT(data.docente_cedula || data.cedula || ''),
                    actualizado: new Date().toISOString()
                }, { merge: true });
                return { ok: true, mensaje: habilitado ? 'Examen habilitado con la ventana e intentos indicados.' : 'Examen deshabilitado.' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_abrir': return (async () => {
                const examenId = cvT(data.examen_id), asig = cvT(data.asignatura);
                if (!examenId || !asig) return { ok: false, error: 'Faltan el examen y la asignatura.' };
                const abrir = !(data.abierto === false || cvT(data.abierto).toLowerCase() === 'false');
                const id = 'cfg_' + examenId + '_' + (cvDkey(asig) || 'x');
                const ref = db.collection('config_examen').doc(id);
                const cur = await ref.get();
                if (abrir) {
                    if (!cur.exists || !cvBool(cur.data().habilitado))
                        return { ok: false, error: 'Primero guardá fecha/hora e intentos del examen en el panel Config.' };
                    const hoy = cvToday();
                    await ref.update({
                        abierto: 'Sí', abierto_hasta: cvT(data.fecha) || hoy,
                        abierto_por: cvT(data.docente_cedula || data.cedula || ''), actualizado: new Date().toISOString()
                    });
                    return { ok: true, mensaje: 'Restricciones levantadas: todos los alumnos pueden rendir hoy (ventana ' + cvT(cur.data().fecha_inicio) + ' ' + cvT(cur.data().hora_inicio) + ' → ' + cvT(cur.data().fecha_cierre) + ' ' + cvT(cur.data().hora_cierre) + ').' };
                }
                await ref.update({ abierto: 'No', abierto_hasta: '', actualizado: new Date().toISOString() });
                return { ok: true, mensaje: 'Restricciones activadas de nuevo: acceso por factura/clave.' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_config_publica': return (async () => {
                const examenId = cvT(data.examen_id);
                const snap = await db.collection('config_examen').get();
                const ahora = Date.now();
                const configs = snap.docs.map(d => cvConfigNorm(d.data()))
                    .filter(c => c.examen_id === examenId && c.habilitado && c.cierre_ms > ahora)
                    .map(c => ({ asignatura: c.asignatura, fecha_inicio: c.fecha_inicio, hora_inicio: c.hora_inicio, fecha_cierre: c.fecha_cierre, hora_cierre: c.hora_cierre, intentos: c.intentos, habilitado: true, abierto: c.abierto, abierto_hasta: c.abierto_hasta, inicio_ms: c.inicio_ms, cierre_ms: c.cierre_ms }));
                return { ok: true, configs: configs };
            })().catch(e => ({ ok: false, configs: [], error: e.message }));
            case 'examen_estado_aprobacion': return db.collection('aprobacion_examen').doc(cvT(data.examen_id)).get().then(d => {
                const e = d.exists ? cvT(d.data().estado) : 'pendiente';
                return { ok: true, estado: e, aprobado: e === 'aprobado' };
            }).catch(e => ({ ok: false, error: e.message, aprobado: false }));
            case 'examen_codigo_guardar': return (async () => {
                const id = cvT(data.examen_id), codigo = cvT(data.codigo).toUpperCase();
                if (!id || !codigo) return { ok: false, error: 'Faltan el examen o el código.' };
                const ref = db.collection('codigo_examen').doc(id);
                const cur = await ref.get();
                await ref.set({
                    examen_id: id, codigo: codigo,
                    activo: cur.exists ? cur.data().activo !== false : true,
                    docente_cedula: cvT(data.docente_cedula || ''), actualizado: new Date().toISOString()
                }, { merge: true });
                return { ok: true, mensaje: 'Código guardado.', codigo: codigo };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_codigo_obtener': return db.collection('codigo_examen').doc(cvT(data.examen_id)).get().then(d => {
                if (!d.exists || !cvT(d.data().codigo)) return { ok: true, codigo: null, activo: false };
                return { ok: true, codigo: cvT(d.data().codigo), activo: d.data().activo !== false };
            }).catch(e => ({ ok: true, codigo: null, activo: false }));
            case 'examen_codigo_toggle': return (async () => {
                const id = cvT(data.examen_id);
                const ref = db.collection('codigo_examen').doc(id);
                const cur = await ref.get();
                if (!cur.exists || !cvT(cur.data().codigo)) return { ok: false, error: 'Primero guardá un código.' };
                const activo = !(data.activo === false || cvT(data.activo).toLowerCase() === 'false');
                await ref.update({ activo: activo, actualizado: new Date().toISOString() });
                return { ok: true, activo: activo, mensaje: activo ? 'Código activado.' : 'Código desactivado.' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_listar_con_codigos': return (async () => {
                const cods = await db.collection('codigo_examen').get();
                const porId = {};
                cods.docs.forEach(d => { porId[d.id] = d.data(); });
                const cfgs = await db.collection('config_examen').get();
                const asigPorExa = {};
                cfgs.docs.forEach(d => {
                    const dd = d.data();
                    if (!asigPorExa[cvT(dd.examen_id)]) asigPorExa[cvT(dd.examen_id)] = [];
                    if (asigPorExa[cvT(dd.examen_id)].indexOf(cvT(dd.asignatura)) < 0) asigPorExa[cvT(dd.examen_id)].push(cvT(dd.asignatura));
                });
                const examenes = CV_EXAMENES_LISTA.map(function (e) {
                    const cod = porId[e.id] || {};
                    return { examen_id: e.id, examen_nombre: e.nombre, asignaturas: asigPorExa[e.id] || [], codigo: cvT(cod.codigo), activo: cod.activo !== false && !!cvT(cod.codigo) };
                });
                return { ok: true, examenes: examenes };
            })().catch(e => ({ ok: false, examenes: [], error: e.message }));
            case 'pagos_ultimos': return cvPagosUltimos(data.cedulas || data.cedula || '', data.limite).then(r => ({ ok: true, limite: 4, resultados: r.resultados })).catch(e => ({ ok: false, error: e.message }));
            case 'examen_solicitudes': return (async () => {
                const examenId = cvT(data.examen_id), asig = cvT(data.asignatura);
                const snap = await db.collection('acceso_examen').get();
                const sols = snap.docs.map(d => d.data())
                    .filter(s => (!examenId || cvT(s.examen_id) === examenId) && (!asig || cvT(s.asignatura) === asig))
                    .map(s => ({
                        cedula: cvT(s.cedula), nombre: cvT(s.nombre) || '—', email: cvT(s.email),
                        asignatura: cvT(s.asignatura), examen_id: cvT(s.examen_id), factura: cvT(s.factura),
                        factura_verificada: cvT(s.facturaverificada || s.factura_verificada) || 'No',
                        estado: cvT(s.estado) || 'solicitado', resuelto_por: cvT(s.resuelto_por),
                        fecha: cvT(s.fecha), observacion: cvT(s.observacion), intentos_usados: 0
                    }));
                const ceds = [];
                sols.forEach(s => { if (ceds.indexOf(s.cedula) < 0) ceds.push(s.cedula); });
                const pagosRes = ceds.length ? (await cvPagosUltimos(ceds.join(','), 4)).resultados : {};
                return { ok: true, solicitudes: sols, pagos: pagosRes };
            })().catch(e => ({ ok: false, solicitudes: [], pagos: {}, error: e.message }));
            case 'examen_solicitar': return (async () => {
                const ced = cvT(data.cedula).replace(/[\.\s\-]/g, '');
                const examenId = cvT(data.examen_id), asig = cvT(data.asignatura), factura = cvT(data.factura);
                if (!ced) return { ok: false, error: 'Falta tu cédula.' };
                if (!asig) return { ok: false, error: 'Elegí la asignatura.' };
                if (!/^[A-Za-z0-9][A-Za-z0-9\-\/\. ]{2,39}$/.test(factura)) return { ok: false, error: 'Ingresá el N° de factura tal como figura en tu comprobante.' };
                const cfg = await cvBuscarCfg(examenId, asig);
                if (!cfg || !cfg.habilitado || cfg.cierre_ms <= Date.now()) return { ok: false, error: 'Este examen todavía no fue habilitado por el docente para esa asignatura.' };
                const id = 'acc_' + ced + '_' + examenId + '_' + (cvDkey(asig) || 'x');
                const ref = db.collection('acceso_examen').doc(id);
                const prev = await ref.get();
                if (prev.exists && cvT(prev.data().estado) === 'rechazado') return { ok: false, error: 'Tu solicitud fue rechazada. Consultá con el docente.' };
                const pg = (await cvPagosUltimos(ced, 12)).resultados[ced] || { pagos: [] };
                const verificada = cvFacturaEstado(pg.pagos, factura);
                const base = { cedula: ced, examen_id: examenId, asignatura: asig, factura: factura, facturaverificada: verificada, email: cvT(data.email), nombre: cvT(data.nombre), actualizado: new Date().toISOString() };
                if (verificada === 'Sí') {
                    const clave = cvQuizClave();
                    await ref.set(Object.assign({ estado: 'habilitado', clave: clave }, base), { merge: true });
                    return { ok: true, estado: 'habilitado', clave: clave, mensaje: 'Factura verificada. Tu clave de acceso es ' + clave + ' (ingresá con tu mail y esta clave).' };
                }
                await ref.set(Object.assign({ estado: 'solicitado' }, base), { merge: true });
                return { ok: true, estado: 'solicitado', mensaje: verificada === 'Pendiente' ? 'Tu factura figura con pago pendiente. El docente revisará tu solicitud.' : 'No pudimos verificar esa factura automáticamente. El docente revisará tu solicitud.' };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_resolver': return (async () => {
                const ced = cvT(data.cedula).replace(/[\.\s\-]/g, '');
                const examenId = cvT(data.examen_id), asig = cvT(data.asignatura);
                const decision = cvT(data.decision);
                if (['habilitar', 'rechazar'].indexOf(decision) < 0) return { ok: false, error: 'Decisión no válida.' };
                const id = 'acc_' + ced + '_' + examenId + '_' + (cvDkey(asig) || 'x');
                const ref = db.collection('acceso_examen').doc(id);
                const cur = await ref.get();
                if (!cur.exists) return { ok: false, error: 'No hay solicitud de ese alumno para este examen.' };
                if (decision === 'rechazar') {
                    await ref.update({ estado: 'rechazado', resuelto_por: cvT(data.docente_cedula || ''), observacion: cvT(data.observacion), actualizado: new Date().toISOString() });
                    return { ok: true, estado: 'rechazado', mensaje: 'Solicitud rechazada.' };
                }
                const cfg = await cvBuscarCfg(examenId, asig);
                if (!cfg || !cfg.habilitado) return { ok: false, error: 'Primero configurá fecha, hora e intentos del examen.' };
                if (cfg.cierre_ms <= Date.now()) return { ok: false, error: 'La ventana del examen ya cerró. Actualizá las fechas.' };
                const clave = cvQuizClave();
                await ref.update({ estado: 'habilitado', clave: clave, resuelto_por: cvT(data.docente_cedula || ''), observacion: cvT(data.observacion), actualizado: new Date().toISOString() });
                return { ok: true, estado: 'habilitado', clave: clave, mensaje: 'Alumno habilitado. Clave a entregarle: ' + clave };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'examen_acceso_validar': return (async () => {
                const examenId = cvT(data.examen_id);
                const email = cvT(data.email).toLowerCase(), clave = cvT(data.clave).toUpperCase();
                if (!email || !clave) return { ok: false, motivo: 'datos', mensaje: 'Ingresá tu mail y la clave.' };
                const snap = await db.collection('acceso_examen').where('examen_id', '==', examenId).get();
                const rows = snap.docs.map(d => d.data());
                const f = rows.filter(r => cvT(r.email).toLowerCase() === email && cvT(r.estado) === 'habilitado' && cvT(r.clave) === clave)[0];
                if (!f) return { ok: false, motivo: 'clave', mensaje: 'Mail o clave incorrectos.' };
                const ced = cvT(f.cedula), asig = cvT(f.asignatura);
                const cfg = await cvBuscarCfg(examenId, asig);
                if (!cfg || !cfg.habilitado) return { ok: false, motivo: 'deshabilitado', mensaje: 'El docente deshabilitó este examen.' };
                const ahora = Date.now();
                if (ahora < cfg.inicio_ms) return { ok: false, motivo: 'no_iniciado', mensaje: 'El examen todavía no comenzó.' };
                if (ahora >= cfg.cierre_ms) return { ok: false, motivo: 'cerrado', mensaje: 'El examen cerró.' };
                const intSnap = await db.collection('intentos').doc(examenId + '__' + ced).get();
                const usados = intSnap.exists && Array.isArray(intSnap.data().intentos) ? intSnap.data().intentos.length : 0;
                if (usados >= cfg.intentos) return { ok: false, motivo: 'sin_intentos', mensaje: 'Ya usaste todos tus intentos (' + cfg.intentos + ').' };
                return { ok: true, sesion_id: 's-' + Date.now().toString(36), intento: usados + 1, intentos_max: cfg.intentos, cierre_ms: cfg.cierre_ms, cedula: ced, nombre: cvT(f.nombre), asignatura: asig };
            })().catch(e => ({ ok: false, error: e.message }));
            case 'cumple_mio': return Promise.resolve({ ok: true, cumpleano: false });
            case 'diagnostico': return Promise.resolve({ ok: true, diagnostico: {} });
            case 'qr_credencial': {
                // Lote de códigos para las próximas ventanas (la cédula sale de la sesión).
                const qrCed = cvQrTokenCedula(data.token) ||
                    (typeof localStorage !== 'undefined' ? (localStorage.getItem('centuria_cedula') || '') : '') ||
                    (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('current_cedula') || '') : '');
                if (!qrCed) return { ok: false, error: 'No se pudo identificar tu cédula de sesión.' };
                const ahora = Date.now();
                const wIni = cvQrWindow(ahora);
                const codigos = [];
                for (let i = 0; i < 6; i++) {
                    codigos.push({ codigo: cvQrCode(qrCed, wIni + i), desde_en: i * CV_QR_PASO_S });
                }
                return { ok: true, codigos: codigos, paso: CV_QR_PASO_S };
            }
            case 'qr_verificar': {
                // El personal escanea el texto del QR y este módulo lo valida (ventana + firma).
                const code = String(data.codigo || '').trim();
                const partes = code.split('|');
                if (partes.length !== 4 || partes[0] !== 'CV1') return { ok: true, valido: false, motivo: 'Código no reconocido.' };
                const ced = partes[1], w = parseInt(partes[2], 10), sig = partes[3];
                if (!Number.isFinite(w)) return { ok: true, valido: false, motivo: 'Código inválido.' };
                const wAux = cvQrWindow(Date.now());
                if (Math.abs(wAux - w) > 3) {            // tolerancia de ±3 ventanas (más de 1 min)
                    const pasados = wAux > w;
                    return { ok: true, valido: false, motivo: pasados ? 'El código ya venció.' : 'El código aún no está vigente.' };
                }
                if (sig !== cvQrSig(ced, w)) return { ok: true, valido: false, motivo: 'Firma no válida.' };
                return { ok: true, valido: true, alumno: { cedula: ced } };
            }

            // ── Asistencia (v2026-10-07): cada marca se guarda en 'asistencia' con fecha y hora de Asunción ──
            case 'marcar_asistencia': case 'registrar_asistencia_codigo': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                const momento = cvFechaHoraPy(new Date());
                const estado = cvEstadoAsistencia(data.estado);
                const id = 'ASI-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
                const registro = {
                    id: id, cedula: ced, user_id: ced,
                    nombre: String(data.nombre || ''), carrera: String(data.carrera || ''), seccion: String(data.seccion || ''),
                    asignatura: String(data.asignatura || ''),
                    codigo: String(data.codigo || data.code || ''), evento_id: String(data.evento_id || ''),
                    estado: estado.es, status: estado.en,
                    observacion: String(data.observacion || data.observaciones || ''),
                    fecha: momento.fecha, hora: momento.hora,
                    timestamp: momento.iso, created_at: momento.iso,
                    origen: action === 'marcar_asistencia' ? 'presencial' : 'codigo'
                };
                await db.collection('asistencia').doc(id).set(registro);
                return { ok: true, status: 'Éxito', id: id, fecha: momento.fecha, hora: momento.hora, registro: registro };
            })().catch(e => ({ ok: false, error: cvErrorAsistencia(e) }));

            // Autorregistro del alumno desde la clase: hora del servidor, una sola marca por unidad.
            case 'autoregistro_asistencia': return (async () => {
                const u = window.firebase.auth().currentUser;
                const ced = cvCedulaDeAuth(u);
                if (!ced) return { ok: false, error: 'Tu sesión expiró. Volvé a ingresar con tu cédula y contraseña.' };
                const asig = String(data.asignatura || '').trim();
                const unidad = String(data.unidad || '').trim();
                if (!asig || !unidad) return { ok: false, error: 'Falta la asignatura o la unidad.' };
                const previa = await cvAsistenciaClase(db, ced, asig, unidad);
                if (previa) return { ok: true, ya_registrada: true, fecha: previa.fecha, hora: previa.hora, registro: previa };
                const id = 'ASI-' + ced + '-' + asig.replace(/[^A-Za-z0-9]/g, '') + '-U' + unidad;
                const ficha = cvFichaSesion();
                await db.collection('asistencia').doc(id).set({
                    id: id, cedula: ced, user_id: ced,
                    nombre: ficha.nombre, carrera: ficha.carrera, seccion: ficha.seccion,
                    asignatura: asig, unidad: unidad,
                    estado: 'presente', status: 'present', observacion: '',
                    origen: 'autoregistro', server_ts: F.FieldValue.serverTimestamp()
                });
                const guardada = await cvAsistenciaClase(db, ced, asig, unidad);
                return { ok: true, fecha: guardada && guardada.fecha, hora: guardada && guardada.hora, registro: guardada };
            })().catch(e => ({ ok: false, error: cvErrorAsistencia(e) }));

            case 'estado_asistencia_clase': return (async () => {
                const ced = cvCedulaDeAuth(window.firebase.auth().currentUser);
                if (!ced) return { ok: false, error: 'Sin sesión.' };
                const reg = await cvAsistenciaClase(db, ced, String(data.asignatura || ''), String(data.unidad || ''));
                return { ok: true, registrada: !!reg, fecha: reg && reg.fecha, hora: reg && reg.hora };
            })().catch(e => ({ ok: false, error: cvErrorAsistencia(e) }));

            // ── Facturas del alumno (v2026-10-07): datos en 'facturas', foto privada en 'facturas_fotos' ──
            // Mismas reglas que el antiguo 09_Facturas (Apps Script); los permisos los hace cumplir firestore.rules.
            case 'fac_crear': case 'fac_editar': return (async () => {
                const ced = cvCedulaDeAuth((await ensureAnonAuth()));
                if (!ced) return { ok: false, error: 'Tu sesión expiró. Volvé a ingresar.' };
                const v = cvFacValidar(data);
                if (v.error) return { ok: false, error: v.error };
                const propias = (await db.collection('facturas').where('cedula', '==', ced).get()).docs.map(d => Object.assign({ id: d.id }, d.data()));
                const editando = action === 'fac_editar';
                const previa = editando ? propias.find(f => f.id === String(data.id)) : null;
                if (editando && !previa) return { ok: false, error: 'No se encontró la factura.' };
                if (previa && previa.estado === 'verificada') return { ok: false, error: 'La factura ya fue verificada: no se puede cambiar. Si hay un error, consulta en Atención al Alumno.' };
                if (previa && previa.estado === 'anulada') return { ok: false, error: 'La factura está anulada.' };
                if (propias.some(f => f.id !== (previa && previa.id) && f.estado !== 'anulada' && f.numero_clave === v.numero_clave))
                    return { ok: false, error: 'Ya registraste ' + (editando ? 'otra factura' : 'una factura') + ' con el número ' + v.numero + '.' };
                let foto = null;
                if (data.foto) { foto = cvFacFoto(data.foto); if (foto.error) return { ok: false, error: foto.error }; }
                else if (!editando) return { ok: false, error: 'Falta la foto de la factura.' };
                const ahora = new Date().toISOString();
                if (!editando) {
                    const hoy = cvFechaHoraPy(new Date()).fecha;
                    if (propias.filter(f => String(f.creada || '').slice(0, 10) === hoy).length >= 30) return { ok: false, error: 'Registraste muchas facturas hoy. Vuelve más tarde.' };
                    const id = 'FAC-' + ced + '-' + Date.now().toString(36);
                    const ficha = cvFichaSesion();
                    // La foto primero: si falla, no queda una factura sin imagen.
                    await db.collection('facturas_fotos').doc(id).set({ cedula: ced, imagen: foto.imagen });
                    await db.collection('facturas').doc(id).set(Object.assign({
                        id: id, cedula: ced, nombre: ficha.nombre, carrera: ficha.carrera, grado: ficha.grado, seccion: ficha.seccion,
                        tiene_foto: true, estado: 'registrada', observacion: '', revisado_por: '', fecha_revision: '', creada: ahora, actualizada: ahora
                    }, v.campos));
                    return { ok: true, id: id, mensaje: 'Factura registrada.' };
                }
                const cambios = Object.assign({ estado: 'registrada', actualizada: ahora }, v.campos);
                if (previa.estado === 'observada') Object.assign(cambios, { observacion: '', revisado_por: '', fecha_revision: '' });
                if (foto) await db.collection('facturas_fotos').doc(previa.id).set({ cedula: ced, imagen: foto.imagen });
                await db.collection('facturas').doc(previa.id).update(cambios);
                return { ok: true, mensaje: 'Factura actualizada.' };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_mias': return (async () => {
                const ced = cvCedulaDeAuth((await ensureAnonAuth()));
                const snap = await db.collection('facturas').where('cedula', '==', ced).get();
                const lista = snap.docs.map(d => cvFacPublico(Object.assign({ id: d.id }, d.data())))
                    .sort((a, b) => a.fecha === b.fecha ? String(b.creada).localeCompare(String(a.creada)) : String(b.fecha).localeCompare(String(a.fecha)));
                const total = lista.reduce((s, f) => s + (f.estado !== 'anulada' && f.monto ? f.monto : 0), 0);
                return { ok: true, facturas: lista, total_monto: total, conceptos: CV_FAC_CONCEPTOS };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_anular': return (async () => {
                const u = await ensureAnonAuth();
                const ced = cvCedulaDeAuth(u);
                const ref = db.collection('facturas').doc(String(data.id || ''));
                const doc = await ref.get();
                if (!doc.exists) return { ok: false, error: 'No se encontró la factura.' };
                const f = doc.data();
                if (f.estado === 'anulada') return { ok: false, error: 'La factura ya está anulada.' };
                const propia = f.cedula === ced;
                const cambios = { estado: 'anulada', actualizada: new Date().toISOString() };
                if (!propia) Object.assign(cambios, { revisado_por: cvNombreSesion(), fecha_revision: cambios.actualizada });
                await ref.update(cambios);
                return { ok: true, mensaje: 'Factura anulada.' };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_foto': return (async () => {
                await ensureAnonAuth();
                const doc = await db.collection('facturas_fotos').doc(String(data.id || '')).get();
                if (!doc.exists) return { ok: false, error: 'La factura no tiene foto.' };
                return { ok: true, imagen: doc.data().imagen };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_permisos': return (async () => {
                await ensureAnonAuth();
                // Las reglas deciden: si la consulta general se permite, la persona es personal habilitado.
                const prueba = (q) => q.limit(1).get().then(() => true, () => false);
                const [ver, accesos] = await Promise.all([prueba(db.collection('facturas')), prueba(db.collection('facturas_accesos'))]);
                return { ok: true, puede_ver: ver, puede_accesos: accesos };
            })().catch(() => ({ ok: true, puede_ver: false, puede_accesos: false }));

            case 'fac_listar': return (async () => {
                await ensureAnonAuth();
                const todas = (await db.collection('facturas').get()).docs.map(d => Object.assign({ id: d.id }, d.data()));
                const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
                const estado = norm(data.estado), txt = norm(data.q), desde = String(data.desde || ''), hasta = String(data.hasta || '');
                const cuenta = {};
                todas.forEach(f => { if (f.estado !== 'anulada') cuenta[f.numero_clave] = (cuenta[f.numero_clave] || 0) + 1; });
                const conteo = { registrada: 0, verificada: 0, observada: 0, anulada: 0, total: todas.length };
                todas.forEach(f => { if (conteo[f.estado] != null) conteo[f.estado]++; });
                const lista = todas.filter(f => (!estado || f.estado === estado) && (!desde || f.fecha >= desde) && (!hasta || f.fecha <= hasta) &&
                        (!txt || norm([f.nombre, f.cedula, f.numero, f.concepto, f.carrera].join(' ')).indexOf(txt) >= 0))
                    .sort((a, b) => String(b.creada).localeCompare(String(a.creada)));
                const total = lista.reduce((s, f) => s + (f.estado !== 'anulada' && f.monto ? f.monto : 0), 0);
                return { ok: true, conteo: conteo, total_monto: total, total: lista.length,
                         facturas: lista.slice(0, 300).map(f => cvFacPublico(f, { repetida: f.estado !== 'anulada' && cuenta[f.numero_clave] > 1 })) };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_revisar': return (async () => {
                await ensureAnonAuth();
                const estado = String(data.estado || '').toLowerCase();
                if (['verificada', 'observada', 'registrada'].indexOf(estado) < 0) return { ok: false, error: 'Estado no válido.' };
                const obs = String(data.observacion || '').trim().slice(0, 300);
                if (estado === 'observada' && obs.length < 3) return { ok: false, error: 'Explica qué debe corregir el alumno.' };
                const ref = db.collection('facturas').doc(String(data.id || ''));
                const doc = await ref.get();
                if (!doc.exists) return { ok: false, error: 'No se encontró la factura.' };
                if (doc.data().estado === 'anulada') return { ok: false, error: 'La factura está anulada.' };
                const ahora = new Date().toISOString();
                await ref.update({ estado: estado, observacion: estado === 'observada' ? obs : '', revisado_por: estado === 'registrada' ? '' : cvNombreSesion(),
                                   fecha_revision: estado === 'registrada' ? '' : ahora, actualizada: ahora });
                return { ok: true, mensaje: estado === 'verificada' ? 'Factura verificada.' : (estado === 'observada' ? 'Factura observada: el alumno verá tu comentario.' : 'Factura devuelta a «registrada».') };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_accesos': return (async () => {
                await ensureAnonAuth();
                const snap = await db.collection('facturas_accesos').get();
                return { ok: true, accesos: snap.docs.map(d => d.data()).filter(a => a.estado !== 'inactivo')
                    .map(a => ({ cedula: a.cedula, nombre: a.nombre || '', habilitado_por: a.habilitado_por || '', fecha: a.fecha || '' })) };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_habilitar': return (async () => {
                await ensureAnonAuth();
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Escribe la cédula de la persona.' };
                const p = await db.collection('cedulas').doc(ced).get();
                if (!p.exists) return { ok: false, error: 'No hay ningún usuario con la cédula ' + ced + '.' };
                const nombre = [p.data().nombre, p.data().apellido].filter(Boolean).join(' ') || ced;
                const ref = db.collection('facturas_accesos').doc(ced);
                const previo = await ref.get();
                if (previo.exists && previo.data().estado !== 'inactivo') return { ok: false, error: nombre + ' ya tiene acceso.' };
                await ref.set({ cedula: ced, nombre: nombre, habilitado_por: cvNombreSesion(), fecha: new Date().toISOString(), estado: 'activo' });
                return { ok: true, mensaje: nombre + ' ya puede ver las facturas.' };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            case 'fac_quitar_acceso': return (async () => {
                await ensureAnonAuth();
                const ref = db.collection('facturas_accesos').doc(String(data.cedula || '').replace(/[\.\s\-]/g, '').trim() || '-');
                const previo = await ref.get();
                if (!previo.exists || previo.data().estado === 'inactivo') return { ok: false, error: 'Esa persona no tenía acceso.' };
                await ref.update({ estado: 'inactivo' });
                return { ok: true, mensaje: 'Acceso quitado.' };
            })().catch(e => ({ ok: false, error: cvErrorFacturas(e) }));

            // ── Trabajos prácticos en PDF (v2026-10-07) ──
            // Firebase Storage no está habilitado: el PDF se guarda en Firestore en partes (trabajos/{id}/partes/{n}).
            case 'trab_entregar': return (async () => {
                const ced = cvCedulaDeAuth(await ensureAnonAuth());
                if (!ced) return { ok: false, error: 'Tu sesión expiró. Volvé a ingresar.' };
                const asig = String(data.asignatura || '').replace(/[^A-Za-z0-9]/g, '');
                const unidad = String(parseInt(data.unidad, 10) || '');
                if (!asig || !unidad) return { ok: false, error: 'Elegí la unidad del trabajo.' };
                const m = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/.exec(String(data.archivo || ''));
                if (!m || m[1].indexOf('JVBERi0') !== 0) return { ok: false, error: 'El archivo debe ser un PDF.' };
                const b64 = m[1];
                if (b64.length * 0.75 > CV_TRAB_MAX_BYTES) return { ok: false, error: 'El PDF supera los 8 MB. Comprimilo e intentá de nuevo.' };
                const id = 'TRA-' + ced + '-' + asig + '-U' + unidad;
                const ref = db.collection('trabajos').doc(id);
                const previo = await ref.get();
                if (previo.exists && previo.data().estado === 'calificado') return { ok: false, error: 'Este trabajo ya fue calificado: no se puede reemplazar.' };
                const partes = [];
                for (let i = 0; i < b64.length; i += CV_TRAB_PARTE) partes.push(b64.slice(i, i + CV_TRAB_PARTE));
                for (let i = 0; i < partes.length; i++) {
                    await ref.collection('partes').doc(String(i)).set({ cedula: ced, datos: partes[i] });
                }
                const ficha = cvFichaSesion();
                await ref.set({
                    id: id, cedula: ced, nombre: ficha.nombre, carrera: ficha.carrera, seccion: ficha.seccion,
                    asignatura: asig, unidad: unidad, titulo: String(data.titulo || '').trim().slice(0, 120),
                    archivo_nombre: String(data.nombre_archivo || 'trabajo.pdf').slice(0, 120), tamano: Math.round(b64.length * 0.75),
                    partes: partes.length, estado: 'entregado', calificacion: null, puntaje_max: null, comentario: '',
                    calificado_por: '', calificado_en: '', entregado_ts: F.FieldValue.serverTimestamp()
                });
                return { ok: true, id: id, mensaje: previo.exists ? 'Trabajo reemplazado.' : 'Trabajo entregado.' };
            })().catch(e => ({ ok: false, error: cvErrorTrabajos(e) }));

            case 'trab_mios': case 'trab_listar': return (async () => {
                const ced = cvCedulaDeAuth(await ensureAnonAuth());
                const q = action === 'trab_mios' ? db.collection('trabajos').where('cedula', '==', ced) : db.collection('trabajos');
                const lista = (await q.get()).docs.map(cvTrabPublico)
                    .filter(t => !data.asignatura || t.asignatura === String(data.asignatura))
                    .sort((a, b) => action === 'trab_mios' ? (+a.unidad - +b.unidad) : String(b.entregado).localeCompare(String(a.entregado)));
                return { ok: true, trabajos: lista };
            })().catch(e => ({ ok: false, trabajos: [], error: cvErrorTrabajos(e) }));

            case 'trab_pdf': return (async () => {
                await ensureAnonAuth();
                const ref = db.collection('trabajos').doc(String(data.id || ''));
                const doc = await ref.get();
                if (!doc.exists) return { ok: false, error: 'No se encontró el trabajo.' };
                const n = doc.data().partes || 0;
                const partes = await Promise.all(Array.from({ length: n }, (_, i) => ref.collection('partes').doc(String(i)).get()));
                if (partes.some(p => !p.exists)) return { ok: false, error: 'El archivo está incompleto. Pedí al alumno que lo vuelva a subir.' };
                return { ok: true, nombre: doc.data().archivo_nombre, base64: partes.map(p => p.data().datos).join('') };
            })().catch(e => ({ ok: false, error: cvErrorTrabajos(e) }));

            case 'trab_calificar': return (async () => {
                await ensureAnonAuth();
                const max = Number(data.puntaje_max);
                const nota = Number(String(data.calificacion).replace(',', '.'));
                if (!(max > 0 && max <= 100)) return { ok: false, error: 'El puntaje máximo debe estar entre 1 y 100.' };
                if (!(nota >= 0 && nota <= max)) return { ok: false, error: 'La calificación debe estar entre 0 y ' + max + '.' };
                await db.collection('trabajos').doc(String(data.id || '')).update({
                    estado: 'calificado', calificacion: Math.round(nota * 100) / 100, puntaje_max: max,
                    comentario: String(data.comentario || '').trim().slice(0, 500),
                    calificado_por: cvNombreSesion(), calificado_en: new Date().toISOString()
                });
                return { ok: true, mensaje: 'Calificación guardada.' };
            })().catch(e => ({ ok: false, error: cvErrorTrabajos(e) }));

            // ── Justificación de ausencias (v2026-10-07): 'justificaciones' + comprobante en partes ──
            case 'justificar_ausencia': return (async () => {
                const ced = cvCedulaDeAuth(await ensureAnonAuth());
                if (!ced) return { ok: false, error: 'Tu sesión expiró. Volvé a ingresar.' };
                const fecha = String(data.fechaAusencia || '').slice(0, 10);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: 'Elegí la fecha de la ausencia.' };
                if (fecha > cvFechaHoraPy(new Date(Date.now() + 30 * 86400000)).fecha) return { ok: false, error: 'La fecha es demasiado lejana.' };
                const motivo = String(data.motivo || '');
                if (CV_JUS_MOTIVOS.indexOf(motivo) < 0) return { ok: false, error: 'Elegí el motivo de la inasistencia.' };
                let partes = [], tipo = '';
                if (data.fileData) {
                    const m = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(data.fileData));
                    if (!m) return { ok: false, error: 'El comprobante debe ser PDF, JPG, PNG o WEBP.' };
                    if (m[2].length * 0.75 > 4 * 1024 * 1024) return { ok: false, error: 'El comprobante no debe superar 4 MB.' };
                    tipo = m[1];
                    for (let i = 0; i < m[2].length; i += CV_TRAB_PARTE) partes.push(m[2].slice(i, i + CV_TRAB_PARTE));
                }
                const id = 'JUS-' + ced + '-' + Date.now().toString(36);
                const ref = db.collection('justificaciones').doc(id);
                for (let i = 0; i < partes.length; i++) await ref.collection('partes').doc(String(i)).set({ cedula: ced, datos: partes[i] });
                await ref.set({
                    id: id, cedula: ced, nombre: cvFichaSesion().nombre || String(data.nombre || ''),
                    fecha_ausencia: fecha, motivo: motivo, observacion: String(data.observacion || '').trim().slice(0, 1000),
                    archivo_nombre: partes.length ? String(data.fileName || 'comprobante').slice(0, 120) : '', archivo_tipo: tipo,
                    partes: partes.length, estado: 'Pendiente', creada: F.FieldValue.serverTimestamp()
                });
                return { ok: true, id: id, mensaje: 'Justificación enviada.' };
            })().catch(e => ({ ok: false, error: cvErrorAsistencia(e) }));

            case 'mis_justificaciones': return (async () => {
                const ced = cvCedulaDeAuth(await ensureAnonAuth());
                const snap = await db.collection('justificaciones').where('cedula', '==', ced).get();
                const lista = snap.docs.map(d => {
                    const j = d.data();
                    const ts = j.creada && typeof j.creada.toDate === 'function' ? j.creada.toDate().toISOString() : '';
                    return { id: d.id, fechaAusencia: j.fecha_ausencia, motivo: j.motivo, observacion: j.observacion || '',
                             estado: j.estado || 'Pendiente', archivo: j.archivo_nombre || '', MarcaTemporal: ts };
                }).sort((a, b) => String(b.MarcaTemporal).localeCompare(String(a.MarcaTemporal)));
                return { ok: true, justificaciones: lista };
            })().catch(e => ({ ok: false, justificaciones: [], error: cvErrorAsistencia(e) }));

            case 'listar_eventos_asistencia': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                const q = ced ? db.collection('asistencia').where('cedula', '==', ced) : db.collection('asistencia');
                const snap = await q.get();
                const igual = (a, b) => !b || String(a || '').toLowerCase() === String(b).toLowerCase();
                const regs = snap.docs.map(cvRegAsistencia)
                    .filter(r => igual(r.fecha, data.fecha) && igual(r.carrera, data.carrera) &&
                                 igual(r.seccion, data.seccion) && igual(r.asignatura, data.asignatura))
                    .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
                return { ok: true, data: regs, records: regs, asistencias: regs };
            })().catch(e => ({ ok: false, data: [], records: [], asistencias: [], error: cvErrorAsistencia(e) }));

            default: return Promise.resolve({ ok: true, data: data || {} });
        }
    } catch (err) {
        console.error('[Firestore] Error en action=' + action + ':', err.code || '', err.message);
        return Promise.resolve({ ok: false, error: 'Firestore: ' + (err.code || '') + ' ' + err.message });
    }
}

// ── Asistencia: fecha/hora oficial (America/Asuncion) y estado normalizado ─────
function cvFechaHoraPy(d) {
    const p = {};
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Asuncion', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return { fecha: p.year + '-' + p.month + '-' + p.day, hora: p.hour + ':' + p.minute + ':' + p.second, iso: d.toISOString() };
}

function cvEstadoAsistencia(e) {
    const v = String(e || 'presente').toLowerCase();
    if (v === 'late' || v === 'tarde' || v === 'tardanza') return { es: 'tarde', en: 'late' };
    if (v === 'absent' || v === 'ausente' || v === 'ausencia') return { es: 'ausente', en: 'absent' };
    if (v === 'justified' || v === 'justificado') return { es: 'justificado', en: 'justified' };
    return { es: 'presente', en: 'present' };
}

// Cédula de la sesión Firebase: claim o parte local de <cedula>@campus-centuria.local (igual que las reglas).
function cvCedulaDeAuth(u) {
    if (!u) return '';
    const m = /^([^@]+)@campus-centuria\.local$/i.exec(u.email || '');
    return m ? m[1] : '';
}

function cvFichaSesion() {
    let user = {};
    try { user = JSON.parse(sessionStorage.getItem('centuria_user') || localStorage.getItem('centuria_user') || '{}') || {}; } catch (_) {}
    const nombre = [user.nombre, user.apellido].filter(Boolean).join(' ') || sessionStorage.getItem('current_nombre') || '';
    return {
        nombre: String(nombre),
        carrera: String(user.carrera || sessionStorage.getItem('current_carrera') || ''),
        grado: String(user.grado || ''),
        seccion: String(user.seccion || sessionStorage.getItem('current_seccion') || '')
    };
}

// Normaliza un documento de 'asistencia': si tiene marca del servidor, fecha/hora salen de ahí.
function cvRegAsistencia(doc) {
    const r = Object.assign({ id: doc.id }, doc.data());
    const ts = r.server_ts && typeof r.server_ts.toDate === 'function' ? r.server_ts.toDate() : null;
    if (ts) {
        const m = cvFechaHoraPy(ts);
        r.fecha = m.fecha; r.hora = m.hora; r.timestamp = m.iso; r.created_at = r.created_at || m.iso;
        delete r.server_ts;
    }
    return r;
}

function cvAsistenciaClase(db, ced, asig, unidad) {
    return db.collection('asistencia').where('cedula', '==', ced).get().then(snap => {
        const doc = snap.docs.find(d => {
            const x = d.data();
            return String(x.asignatura) === asig && String(x.unidad) === unidad;
        });
        return doc ? cvRegAsistencia(doc) : null;
    });
}

// ── Facturas del alumno ──────────────────────────────────────────────────────
const CV_FAC_CONCEPTOS = ['Matrícula', 'Cuota mensual', 'Derecho de examen', 'Certificado / Constancia', 'Material de estudio', 'Otro'];
const CV_FAC_FOTO_MAX = 950000;   // caracteres del dataURL: entra en un documento de Firestore (límite 1 MiB)

function cvFacValidar(d) {
    const fecha = String(d.fecha || '').slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    const f = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    if (!f || f.getUTCMonth() !== +m[2] - 1 || f.getUTCDate() !== +m[3]) return { error: 'Elige la fecha de la factura.' };
    const h = cvFechaHoraPy(new Date()).fecha.split('-');
    const dif = Math.round((f - Date.UTC(+h[0], +h[1] - 1, +h[2])) / 86400000);
    if (dif > 1) return { error: 'La fecha de la factura no puede ser futura.' };
    if (dif < -1100) return { error: 'La fecha de la factura es demasiado antigua.' };
    const numero = String(d.numero || '').trim().slice(0, 30);
    const clave = numero.toLowerCase().replace(/[^0-9a-z]/g, '');
    if (numero.length < 3 || !/^[0-9A-Za-z\-\/\. ]+$/.test(numero) || clave.length < 3) return { error: 'Escribe el número de factura (ej.: 001-001-0001234).' };
    const concepto = String(d.concepto || '').trim().slice(0, 120);
    if (concepto.length < 3) return { error: 'Escribe el concepto del pago.' };
    const ms = String(d.monto == null ? '' : d.monto).replace(/[.\s]/g, '').replace(',', '.');
    let monto = null;
    if (ms !== '') {
        monto = Number(ms);
        if (isNaN(monto) || monto < 0 || monto > 1000000000) return { error: 'El monto no es válido.' };
        monto = Math.round(monto);
    }
    return { numero: numero, numero_clave: clave, campos: { fecha: fecha, numero: numero, numero_clave: clave, concepto: concepto, monto: monto } };
}

function cvFacFoto(foto) {
    const s = String(foto || '');
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return { error: 'La foto debe ser una imagen JPG, PNG o WEBP.' };
    if (s.length < 700) return { error: 'La foto está vacía o dañada.' };
    if (s.length > CV_FAC_FOTO_MAX) return { error: 'La foto es muy pesada. Intenta con otra o sácala con menos resolución.' };
    return { imagen: s };
}

function cvFacPublico(f, extra) {
    return Object.assign({
        id: f.id, cedula: f.cedula, nombre: f.nombre || '', carrera: f.carrera || '', grado: f.grado || '', seccion: f.seccion || '',
        fecha: f.fecha || '', numero: f.numero || '', concepto: f.concepto || '', monto: f.monto == null ? null : Number(f.monto),
        tiene_foto: !!f.tiene_foto, estado: f.estado || 'registrada', observacion: f.observacion || '', revisado_por: f.revisado_por || '',
        fecha_revision: f.fecha_revision || '', creada: f.creada || ''
    }, extra || {});
}

function cvNombreSesion() {
    const f = cvFichaSesion();
    return f.nombre || cvCedulaDeAuth(window.firebase.auth().currentUser) || 'Personal';
}

function cvErrorFacturas(e) {
    if (e && e.code === 'permission-denied') return 'No tienes permiso para esta acción con las facturas.';
    if (e && e.code === 'SIN_SESION') return e.message;
    return (e && e.message) || 'Error al procesar la factura.';
}

// ── Trabajos prácticos en PDF ────────────────────────────────────────────────
const CV_TRAB_MAX_BYTES = 8 * 1024 * 1024;
const CV_TRAB_PARTE = 700000;      // caracteres base64 por documento (Firestore admite 1 MiB)
const CV_JUS_MOTIVOS = ['salud', 'laboral', 'familiar', 'academico', 'otro'];

function cvTrabPublico(doc) {
    const t = doc.data();
    const ts = t.entregado_ts && typeof t.entregado_ts.toDate === 'function' ? cvFechaHoraPy(t.entregado_ts.toDate()) : null;
    return {
        id: doc.id, cedula: t.cedula, nombre: t.nombre || '', carrera: t.carrera || '', seccion: t.seccion || '',
        asignatura: t.asignatura || '', unidad: t.unidad || '', titulo: t.titulo || '', archivo_nombre: t.archivo_nombre || '',
        tamano: t.tamano || 0, estado: t.estado || 'entregado', calificacion: t.calificacion == null ? null : Number(t.calificacion),
        puntaje_max: t.puntaje_max == null ? null : Number(t.puntaje_max), comentario: t.comentario || '',
        calificado_por: t.calificado_por || '', calificado_en: t.calificado_en || '',
        entregado: ts ? ts.iso : '', entregado_fecha: ts ? ts.fecha : '', entregado_hora: ts ? ts.hora.slice(0, 5) : ''
    };
}

function cvErrorTrabajos(e) {
    if (e && e.code === 'permission-denied') return 'No tienes permiso para esta acción con los trabajos.';
    if (e && e.code === 'SIN_SESION') return e.message;
    return (e && e.message) || 'Error al procesar el trabajo.';
}

function cvErrorAsistencia(e) {
    if (e && e.code === 'permission-denied') return 'Sin permiso para registrar o leer asistencia con esta cuenta.';
    return (e && e.message) || 'Error al procesar la asistencia.';
}

// ── Credencial QR dinámico (código por ventana de tiempo) ─────────────────────
// Genera códigos determinísticos por ventana (~20 s) con una clave compartida en el
// cliente: funcionan entre dispositivos (alumno genera, personal verifica) sin depender
// de un backend. El QR embebe el código que el verificador recalcula y compara.
// Limitación conocida: la clave vive en el código del cliente (como todo el modelo
// pseudo-token de la app), así que no es de seguridad criptográfica; garantiza rotación
// temporal y consistencia entre quien emite y quien valida.
const CV_QR_SECRET = 'cv-qr-dyn-2026-centuria';
const CV_QR_PASO_S = 20;

function cvQrTokenCedula(token) {
    try {
        token = token || '';
        var parts = token.split('.');
        if (parts.length < 2) return '';
        var pad = parts[1];
        while (pad.length % 4) pad += '=';
        return (JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/'))).cedula || '').toString();
    } catch (e) { return ''; }
}

function cvQrHash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h.toString(36);
}

function cvQrWindow(tsMs) {
    return Math.floor(tsMs / 1000 / CV_QR_PASO_S);
}

function cvQrSig(cedula, w) {
    return cvQrHash(CV_QR_SECRET + '|' + cedula + '|' + w);
}

function cvQrCode(cedula, w) {
    return 'CV1|' + cedula + '|' + w + '|' + cvQrSig(cedula, w);
}

// ── Helpers de exámenes (configuración, acceso por factura/clave y códigos) ──
function cvT(v) { return String(v == null ? '' : v).trim(); }
function cvDkey(v) { return cvT(v).replace(/[^A-Za-z0-9]/g, '').toLowerCase(); }
function cvLocalMs(fecha, hora) {
    var f = cvT(fecha).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    var h = cvT(hora).match(/^(\d{1,2}):(\d{2})$/);
    if (!f || !h) return 0;
    return new Date(+f[1], +f[2] - 1, +f[3], +h[1], +h[2], 0).getTime();
}
function cvSi(v) {
    return v === true || cvT(v) === 'Sí' || cvT(v).toLowerCase() === 'si' || cvT(v).toLowerCase() === 'true' || cvT(v) === '1' ? 'Sí' : 'No';
}
function cvBool(v) { return cvSi(v) === 'Sí'; }
function cvToday() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function cvQuizClave() {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', i;
    for (i = 0; i < 8; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
    return s;
}
function cvConfigNorm(d) {
    d = d || {};
    var fi = cvT(d.fecha_inicio), hi = cvT(d.hora_inicio), fc = cvT(d.fecha_cierre), hc = cvT(d.hora_cierre);
    return {
        examen_id: cvT(d.examen_id), asignatura: cvT(d.asignatura),
        habilitado: cvBool(d.habilitado), fecha_inicio: fi, hora_inicio: hi, fecha_cierre: fc, hora_cierre: hc,
        intentos: parseInt(d.intentos, 10) || 1, configuradopor: cvT(d.configuradopor),
        abierto: cvBool(d.abierto), abierto_hasta: cvT(d.abierto_hasta),
        inicio_ms: cvLocalMs(fi, hi), cierre_ms: cvLocalMs(fc, hc), actualizado: cvT(d.actualizado)
    };
}
async function cvBuscarCfg(examenId, asig) {
    var snap = await db.collection('config_examen').where('examen_id', '==', examenId).get();
    for (var i = 0; i < snap.docs.length; i++) {
        var c = cvConfigNorm(snap.docs[i].data());
        if (c.asignatura === asig) return c;
    }
    return null;
}
async function cvPagosUltimos(cedulasTxt, limiteRaw) {
    var lista = cvT(cedulasTxt).split(',').map(function (c) { return cvT(c).replace(/[\.\s\-]/g, ''); }).filter(Boolean);
    var limite = Math.max(1, Math.min(12, parseInt(limiteRaw, 10) || 4));
    var resultados = {};
    for (var j = 0; j < lista.length; j++) {
        var ced = lista[j];
        var q = await db.collection('pagos').where('cedula', '==', ced).limit(20).get();
        var pagos = q.docs.map(function (d) {
            var dd = d.data();
            return {
                concepto: cvT(dd.modulo || dd.concepto), monto: Number(dd.monto) || 0,
                fecha: cvT(dd.fecha), estado: cvT(dd.estado) || 'pendiente',
                comprobante: cvT(dd.comprobante), factura: cvT(dd.factura), tipo: cvT(dd.tipo) || 'modulo'
            };
        }).filter(function (p) { return p.estado !== 'anulado'; })
            .sort(function (a, b) {
                var t = function (s) { return new Date(s).getTime() || 0; };
                return t(b.fecha) - t(a.fecha);
            }).slice(0, limite);
        var pendientes = pagos.filter(function (p) { return p.estado !== 'pagado'; }).length;
        resultados[ced] = { pagos: pagos, total: pagos.length, pendientes: pendientes, al_dia: pagos.length > 0 && pendientes === 0 };
    }
    return { resultados: resultados };
}
function cvFacturaEstado(pagos, factura) {
    var f = cvT(factura).toLowerCase(), res = 'No';
    for (var i = 0; i < pagos.length; i++) {
        if (cvT(pagos[i].factura).toLowerCase() !== f) continue;
        if (pagos[i].estado === 'anulado') continue;
        if (pagos[i].estado === 'pagado') return 'Sí';
        res = 'Pendiente';
    }
    return res;
}
const CV_EXAMENES_LISTA = [
    { id: 'examen_parcial_1', nombre: 'Parcial 1' }, { id: 'examen_parcial_2', nombre: 'Parcial 2' },
    { id: 'examen_virtual', nombre: 'Examen Virtual' }, { id: 'examen_virtual_completo', nombre: 'Examen Virtual Completo' },
    { id: 'examen_final_virtual', nombre: 'Final Virtual' }, { id: 'examen_final_escrito', nombre: 'Final Escrito' }
];

// ══════════════════════════════════════════════════════════════
// HELPERS DE AUTENTICACIÓN DIRECTOS AL SERVIDOR CLOUD
// ══════════════════════════════════════════════════════════════

function gasLogin(cedula, password) {
    return callGas('login', {
        cedula: String(cedula || '').replace(/[\.\s\-]/g, '').trim(),
        password: String(password || '').trim()
    }, 'POST');
}

function gasRegister(userData) {
    userData = userData || {};
    return callGas('register', {
        cedula: String(userData.cedula || '').replace(/[\.\s\-]/g, '').trim(),
        nombre: userData.nombre || '',
        apellido: userData.apellido || '',
        email: (userData.email || '').toLowerCase().trim(),
        telefono: userData.telefono || '',
        password: userData.password || '',
        rol: userData.rol || 'alumno',
        grado: userData.grado || '',
        carrera: userData.carrera || '',
        seccion: userData.seccion || '',
        asignatura: userData.asignatura || '',
        foto: userData.foto || userData.foto_url || '',
        requiere_aprobacion: userData.requiere_aprobacion || false
    }, 'POST');
}

function gasValidateSession(token) {
    if (!token) return Promise.resolve({ ok: false, valid: false });
    return callGas('validar_sesion', { token: token }, 'GET');
}

function gasLogout(token) {
    if (!token) return Promise.resolve({ ok: true });
    return callGas('logout', { token: token }, 'POST');
}

function gasUpdateProfile(data) {
    return callGas('actualizar_perfil', data, 'POST');
}

function gasChangePassword(cedula, oldPassword, newPassword, token) {
    return callGas('cambiar_password', {
        cedula: String(cedula || '').replace(/[\.\s\-]/g, '').trim(),
        old_password: oldPassword,
        new_password: newPassword,
        token: token || ''
    }, 'POST');
}

function gasRecoverAccess(cedula, email) {
    return callGas('recuperar_acceso', {
        cedula: String(cedula || '').replace(/[\.\s\-]/g, '').trim(),
        email: String(email || '').toLowerCase().trim()
    }, 'POST');
}

function gasCheckStudent(cedula) {
    return callGas('verificar_alumno', { cedula: String(cedula || '').replace(/[\.\s\-]/g, '').trim() }, 'GET');
}

function gasGetRoles(cedula) {
    return callGas('verificar_roles', { cedula: String(cedula || '').replace(/[\.\s\-]/g, '').trim() }, 'GET');
}

function gasGetSubjects() {
    return callGas('listar_asignaturas', {}, 'GET');
}

function mapUser(u) {
    if (!u) return null;
    const role = (u.rol || u.role || 'alumno').toLowerCase();
    return {
        id: u.id || u.cedula || '',
        cedula: u.cedula || u.username || '',
        username: u.username || u.cedula || '',
        nombre: u.firstname || u.nombre || '',
        apellido: u.lastname || u.apellido || '',
        rol: ROLE_ES[role] || role || 'alumno',
        firstname: u.firstname || u.nombre || '',
        lastname: u.lastname || u.apellido || '',
        role: role,
        email: u.email || '',
        telefono: u.telefono || '',
        telefono_alternativo: u.telefono_alternativo || u.telefono_fijo || '',
        telefono_fijo: u.telefono_fijo || u.telefono_alternativo || '',
        contacto_emergencia: u.contacto_emergencia || '',
        fecha_nacimiento: u.fecha_nacimiento || '',
        lugar_nacimiento: u.lugar_nacimiento || '',
        nacionalidad: u.nacionalidad || u.pais || '',
        pais: u.pais || u.nacionalidad || '',
        direccion_calle: u.direccion_calle || u.calle || '',
        barrio: u.barrio || u.barrio_compania || '',
        ciudad: u.ciudad || '',
        departamento: u.departamento || '',
        direccion: u.direccion || '',
        latitud: u.latitud || u.lat || '',
        longitud: u.longitud || u.lng || '',
        estado_civil: u.estado_civil || '',
        grado: u.grado || '',
        carrera: u.carrera || '',
        seccion: u.seccion || '',
        legajo_numero: u.legajo_numero || u.legajo || u.expediente || '',
        fecha_inscripcion: u.fecha_inscripcion || '',
        matricula: u.matricula || u.matricula_numero || '',
        estado_pago: u.estado_pago || u.plan_pago || '',
        grupo_sanguineo: u.grupo_sanguineo || '',
        alergias: u.alergias || u.condiciones_medicas || '',
        seguro_medico: u.seguro_medico || '',
        becas: u.becas || u.becas_solicitadas || '',
        beneficios_institucionales: u.beneficios_institucionales || u.beneficios || '',
        foto: u.foto || u.foto_url || '',
        foto_url: u.foto_url || u.foto || '',
        must_change_password: u.must_change_password ? 1 : 0,
        estado: u.estado || 'activo',
        matricula_completa: !!u.matricula_completa
    };
}

// ══════════════════════════════════════════════════════════════
// OBJETO API CENTRAL (CenturiaAPI)
// ══════════════════════════════════════════════════════════════

const API = {
    baseUrl: 'firestore',
    callGas: callGas,

    // --- Autenticación ---

    login(cedula, password) {
        cedula = String(cedula || '').replace(/[\.\s\-]/g, '').trim();
        password = String(password || '').trim();

        if (!cedula || !password) {
            return Promise.resolve({ ok: false, message: 'Debes ingresar tu cédula y contraseña.' });
        }

        return gasLogin(cedula, password).then(res => {
            if (res && res.ok && res.token && res.user) {
                const user = mapUser(res.user);
                const token = res.token;
                try {
                    localStorage.setItem('centuria_auth_token', token);
                    localStorage.setItem('centuria_user', JSON.stringify(user));
                    sessionStorage.setItem('centuria_auth_token', token);
                    sessionStorage.setItem('centuria_user', JSON.stringify(user));
                    if (res.token_expires) {
                        sessionStorage.setItem('centuria_token_expires', res.token_expires);
                        localStorage.setItem('centuria_token_expires', res.token_expires);
                    }
                } catch (e) {}
                return { ok: true, user: user, token: token, must_change_password: res.must_change_password || 0 };
            }
            return { ok: false, message: (res && res.error) || 'Cédula o contraseña incorrecta.' };
        }).catch(e => { console.error('[login catch]', e); return { ok: false, message: 'Error: ' + (e && e.message ? e.message : 'comunicación') }; });
    },

    authLogin(cedula, password) {
        return this.login(cedula, password);
    },

    authRegister(userData) {
        userData = userData || {};
        const c = String(userData.cedula || userData.username || '').replace(/[\.\s\-]/g, '').trim();
        const p = String(userData.password || '').trim();
        const n = String(userData.nombre || userData.firstname || '').trim();
        const a = String(userData.apellido || userData.lastname || '').trim();
        const e = String(userData.email || '').toLowerCase().trim();

        if (!c) return Promise.resolve({ ok: false, error: 'Cédula requerida.', message: 'Cédula requerida.' });
        if (!n || !a) return Promise.resolve({ ok: false, error: 'Nombre y apellido requeridos.', message: 'Nombre y apellido requeridos.' });
        if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
            return Promise.resolve({ ok: false, error: 'Correo electrónico inválido.', message: 'Correo electrónico inválido.' });
        }
        if (!p || p.length < 6) {
            return Promise.resolve({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.', message: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const payload = Object.assign({}, userData, {
            cedula: c,
            nombre: n,
            apellido: a,
            email: e,
            password: p,
            rol: userData.rol || 'alumno'
        });

        return gasRegister(payload).then(res => {
            if (res && res.ok) {
                if (res.token && res.user) {
                    const user = mapUser(res.user);
                    try {
                        localStorage.setItem('centuria_auth_token', res.token);
                        localStorage.setItem('centuria_user', JSON.stringify(user));
                        sessionStorage.setItem('centuria_auth_token', res.token);
                        sessionStorage.setItem('centuria_user', JSON.stringify(user));
                        if (res.token_expires) {
                            sessionStorage.setItem('centuria_token_expires', res.token_expires);
                            localStorage.setItem('centuria_token_expires', res.token_expires);
                        }
                    } catch (ex) {}
                }
                return { ok: true, message: res.mensaje || 'Registro exitoso.', user: res.user ? mapUser(res.user) : null, token: res.token };
            }
            return { ok: false, error: (res && res.error) || 'Error al registrar.', message: (res && res.error) || 'Error al registrar.' };
        }).catch(() => ({ ok: false, error: 'Error de comunicación con el servidor.', message: 'Error de comunicación con el servidor.' }));
    },

    register(username, password, firstname, lastname, email, courseId = null, role = 'student') {
        return this.authRegister({
            cedula: username,
            password: password,
            nombre: firstname,
            apellido: lastname,
            email: email,
            carrera: courseId,
            rol: role
        });
    },

    validateSession() {
        const token = this.getToken();
        if (!token) return Promise.resolve({ valid: false, user: null });

        return gasValidateSession(token).then(res => {
            if (res && res.valid) {
                if (res.user) {
                    const user = mapUser(res.user);
                    try {
                        localStorage.setItem('centuria_user', JSON.stringify(user));
                        sessionStorage.setItem('centuria_user', JSON.stringify(user));
                    } catch (e) {}
                    return { valid: true, user: user };
                }
                const cached = this.getCurrentUser();
                if (cached) return { valid: true, user: cached };
                return { valid: true, user: null };
            }
            this.logout();
            return { valid: false, user: null };
        }).catch(() => {
            const cachedUser = this.getCurrentUser();
            if (cachedUser) return { valid: true, user: cachedUser, offline: true };
            return { valid: false, user: null };
        });
    },

    getCurrentUser() {
        try {
            const userStr = sessionStorage.getItem('centuria_user') || localStorage.getItem('centuria_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) { return null; }
    },

    getToken() {
        try {
            return sessionStorage.getItem('centuria_auth_token') ||
                   localStorage.getItem('centuria_auth_token') ||
                   sessionStorage.getItem('token') || null;
        } catch (e) { return null; }
    },

    // v2026-10-11: cierra la sesión de Firebase Auth (antes no se esperaba y la redirección la cortaba)
    // y borra del navegador la sesión y los datos personales. Se conservan solo preferencias del equipo.
    logout() {
        cvLimpiarSesionLocal();
        _cvAuthListo = null;
        // Se carga el SDK de Auth si la página no lo tenía: la sesión de Firebase queda guardada en el navegador (IndexedDB).
        const fin = cvCargarAuthSdk().then(function () { getDb(); return window.firebase.auth().signOut(); }).catch(function () {});
        // Como máximo 3 s: si la red falla, igual se sale (la sesión local ya se borró).
        return Promise.race([fin, new Promise(function (r) { setTimeout(r, 3000); })]).then(function () { return { ok: true }; });
    },

    updateProfile(data) {
        data = data || {};
        const user = this.getCurrentUser() || {};
        const cedula = data.cedula || user.cedula || user.username;
        const payload = Object.assign({}, data, { cedula: cedula });

        return gasUpdateProfile(payload).then(res => {
            if (res && res.ok && res.user) {
                const updated = mapUser(res.user);
                try {
                    localStorage.setItem('centuria_user', JSON.stringify(updated));
                    sessionStorage.setItem('centuria_user', JSON.stringify(updated));
                } catch (e) {}
                return { ok: true, user: updated };
            }
            return { ok: false, error: (res && res.error) || 'No se pudo actualizar el perfil.' };
        }).catch(() => ({ ok: false, error: 'Error al conectar con el servidor.' }));
    },

    changePassword(oldPassword, newPassword) {
        const user = this.getCurrentUser() || {};
        const cedula = user.cedula || user.username;
        const token = this.getToken();
        if (!cedula) return Promise.resolve({ ok: false, error: 'Sesión no válida.' });
        return gasChangePassword(cedula, oldPassword, newPassword, token);
    },

    recoverAccess(cedula, email) {
        return gasRecoverAccess(cedula, email);
    },

    // --- Cursos y Asignaturas ---

    listCourses(cedula, rol, carrera) {
        const u = this.getCurrentUser() || {};
        cedula = cedula || u.cedula || '';
        rol = rol || u.rol || 'alumno';
        carrera = carrera || u.carrera || '';
        return callGas('listar_cursos', { cedula: cedula, rol: rol, carrera: carrera }, 'GET').then(r => r.cursos || []);
    },

    getCourse(courseId) {
        return this.listCourses().then(list => list.find(c => String(c.id || c.codigo) === String(courseId)) || null);
    },

    enrollCourse(courseId) {
        const u = this.getCurrentUser() || {};
        return callGas('matricular_alumno', { cedula: u.cedula, curso_id: courseId }, 'POST');
    },

    getMyGrades(courseId) {
        const u = this.getCurrentUser() || {};
        return callGas('listar_notas', { cedula: u.cedula, asignatura: courseId || '' }, 'GET').then(r => r.data || []);
    },

    getGrades(courseId) {
        return callGas('listar_notas', { asignatura: courseId || '' }, 'GET').then(r => r.data || []);
    },

    recordSubjectGrades(courseId, grades) {
        return callGas('guardar_notas_asignatura', { asignatura: courseId, notas: grades }, 'POST');
    },

    listSubjects(career) {
        return callGas('listar_asignaturas', { carrera: career || '' }, 'GET').then(r => r.asignaturas || []);
    },

    getSubject(code) {
        return this.listSubjects().then(list => list.find(s => s.codigo === code) || null);
    },

    saveDocument(docData) {
        return callGas('guardar_documento', docData, 'POST');
    },

    getRoles(cedula) {
        return gasGetRoles(cedula);
    },

    _adminRolesAll() {
        return callGas('verificar_roles', {}, 'GET');
    },

    _adminAssign(data) {
        return callGas('asignar_rol', data, 'POST');
    },

    _adminRevoke(cedula, rol, carrera) {
        return callGas('desactivar_rol', { cedula, rol, carrera }, 'POST');
    },

    _attByDate(course, date) {
        return callGas('listar_eventos_asistencia', { asignatura: course, fecha: date }, 'GET');
    },

    _attMark(code, cedula, estado, obs) {
        return callGas('registrar_asistencia_codigo', { codigo: code, cedula: cedula, estado: estado, observaciones: obs }, 'POST');
    },

    _uploadCSV(data, type) {
        return callGas('subir_csv', { data: data, tipo: type }, 'POST');
    },

    roster(curso) {
        const u = this.getCurrentUser() || {};
        return callGas('mis_alumnos', { carrera: u.carrera || '', seccion: u.seccion || '' }, 'GET')
            .then(r => (r.alumnos || []).map(a => ({
                id: a.id || a.cedula,
                cedula: a.cedula,
                nombre: a.nombre || a.nombre_completo || '',
                apellido: '',
                email: a.email || '',
                carrera: a.carrera || '',
                seccion: a.seccion || ''
            })))
            .catch(() => []);
    },

    notasFinales(courseId) {
        return this.getGrades(courseId).catch(() => ({}));
    }
};

// ══════════════════════════════════════════════════════════════
// ESPACIOS DE NOMBRES MODULARES (Zero-PHP)
// ══════════════════════════════════════════════════════════════

API.checkStudent = (cedula) => {
    const normalized = String(cedula || '').replace(/[\.\s\-]/g, '').trim();
    return callGas('verificar_alumno', { cedula: normalized }, 'GET');
};

API.auth = {
    register: (d) => API.authRegister(d),
    verify: (cedula) => API.checkStudent(cedula).then(result => Object.assign({}, result, { valid: !!(result && result.ok && result.existe), user: result && result.estudiante ? mapUser(result.estudiante) : null })),
    login: (c, p) => API.authLogin(c, p),
    validateSession: () => API.validateSession(),
    logout: () => API.logout(),
    getCurrentUser: () => API.getCurrentUser(),
    getToken: () => API.getToken(),
    updateProfile: (d) => API.updateProfile(d),
    changePassword: (oldP, newP) => API.changePassword(oldP, newP),
    recoverAccess: (c, e) => API.recoverAccess(c, e)
};

API.catalogos = {
    getGrados: () => callGas('listar_grados', {}, 'GET'),
    getCarreras: (grado) => callGas('listar_carreras', { grado: grado || '' }, 'GET'),
    getSecciones: () => callGas('listar_secciones', {}, 'GET'),
    getFiliales: () => callGas('listar_filiales', {}, 'GET'),
    getAsignaturas: () => callGas('listar_asignaturas', {}, 'GET'),
    list: (tipo) => {
        if (tipo === 'grados') return callGas('listar_grados', {}, 'GET');
        if (tipo === 'carreras') return callGas('listar_carreras', {}, 'GET');
        if (tipo === 'secciones') return callGas('listar_secciones', {}, 'GET');
        if (tipo === 'filiales') return callGas('listar_filiales', {}, 'GET');
        return callGas('listar_asignaturas', {}, 'GET');
    },
    save: (data) => callGas('guardar_asignatura', data, 'POST'),
    delete: (id) => callGas('eliminar_asignatura', { id }, 'POST')
};

API.docente = {
    getMySubjects: (cedula) => callGas('mis_cursos_docente', { cedula: cedula || '' }, 'GET').then(r => ({
        ok: true,
        subjects: r.subjects || [],
        assignments: r.assignments || [],
        subjectsCount: (r.subjects || []).length
    })),
    getStudents: (carrera, seccion) => callGas('mis_alumnos', { carrera: carrera || '', seccion: seccion || '' }, 'GET'),
    getPendingRequests: () => callGas('docente_pendientes', {}, 'POST'),
    approveRequest: (cedula, adminKey) => callGas('docente_aprobar', { cedula, admin_key: adminKey }, 'POST'),
    rejectRequest: (cedula, motivo, adminKey) => callGas('docente_rechazar', { cedula, motivo, admin_key: adminKey }, 'POST'),
    getMyRequests: (cedula) => callGas('docente_estado', { cedula }, 'POST').then(r => ({ ok: true, solicitudes: r.solicitudes || [] })),
    requestSubject: (cedula, asignatura) => callGas('docente_solicitud', { cedula, asignatura }, 'POST')
};

// Acceso Académico: asignación de docentes a grupos (asignatura + carrera + sección)
API.academico = {
    listTeachers: (academico_cedula) => callGas('asignaciones_docentes', { academico_cedula: academico_cedula }, 'GET'),
    // d: { academico_cedula, docente_cedula, asignatura, grupos: [{ grado, carrera, seccion }], aprobar }
    saveAssignment: (d) => callGas('asignacion_guardar', d, 'POST'),
    // d: { academico_cedula, docente_cedula, fila }
    revokeAssignment: (d) => callGas('asignacion_revocar', d, 'POST'),
    // d: { academico_cedula, docente_cedula, decision: 'aprobar' | 'rechazar' }
    decideTeacher: (d) => callGas('asignacion_docente_decidir', d, 'POST')
};

API.grades = {
    // Listado existente (mantenemos compatibilidad)
    list: (params) => callGas('listar_notas', params || {}, 'GET'),
    save: (data) => {
        if (data && (Array.isArray(data.notas) || data.notas)) {
            return callGas('guardar_notas_asignatura', data, 'POST');
        }
        return callGas('guardar_nota', data, 'POST');
    },
    recordSubject: (data) => callGas('guardar_notas_asignatura', data, 'POST'),
    
    // NUEVO: Panel de gestión completo
    
    // Listar todas las notas (admin/doctor ve todo, alumno solo las suyas)
    listAll: (params = {}) => callGas('listar_notas', params || {}, 'GET'),
    
    // Listar notas por curso/asignatura específico
    listByCourse: (courseId, params = {}) => 
        callGas('listar_notas', { curso: courseId, ...params }, 'GET'),
    
    // Obtener estadísticas generales del curso
    getStats: (courseId) => callGas('obtener_estadisticas_notas', { curso: courseId }, 'GET'),
    
    // Exportar calificaciones a formato CSV
    exportGrades: (courseId) => callGas('exportar_notas', { curso: courseId }, 'GET'),
    
    // Obtener promedio de un alumno específico en un curso
    getStudentAverage: (cedula, courseId) => callGas('obtener_promedio_alumno', { cedula, curso: courseId }, 'GET'),
    
    // Listar estudiantes aprobados/desaprobados
    listByStatus: (courseId, status) => callGas('listar_notas_por_estado', { curso: courseId, status }, 'GET'),
};

API.exams = {
    saveAnswers: (data) => callGas('guardar_respuestas_examen', data, 'POST'),

    // ── Exámenes por factura (v08.1): ventana horaria, intentos, clave por mail ──
    // Últimos 4 pagos de uno o varios alumnos: { ok, resultados: { cedula: { pagos:[...], pendientes, al_dia } } }
    getLastPayments: (cedulas) => callGas('pagos_ultimos', { cedulas: [].concat(cedulas).join(',') }, 'GET'),
    // Docente: configuración por examen y asignatura
    getExamConfigs: (asignatura) => callGas('examen_config_listar', { asignatura: asignatura || '' }, 'GET'),
    saveExamConfig: (d) => callGas('examen_config_guardar', d, 'POST'),
    // Docente: solicitudes de alumnos (con sus últimos 4 pagos) y decisión
    getExamRequests: (asignatura, examenId) => callGas('examen_solicitudes', { asignatura: asignatura || '', examen_id: examenId || '' }, 'GET'),
    resolveExamRequest: (d) => callGas('examen_resolver', d, 'POST'),
    // Alumno: ventana vigente, carga de factura y validación de mail + clave
    getPublicExamConfig: (examenId) => callGas('examen_config_publica', { examen_id: examenId }, 'GET'),
    // Docente: levanta las restricciones para que todos los alumnos rindan ese día (sin clave/factura)
    openAccess: (d) => callGas('examen_abrir', {
        examen_id: d.examen_id, asignatura: d.asignatura, abierto: d.abierto,
        fecha: d.fecha || new Date().toISOString().slice(0, 10), docente_cedula: d.docente_cedula
    }, 'POST'),
    requestExamAccess: (d) => callGas('examen_solicitar', d, 'POST'),
    validateExamAccess: (d) => callGas('examen_acceso_validar', d, 'POST'),
    
    // Códigos de acceso a exámenes — Docente configura, Alumno valida
    setAccessCode: (examenId, codigo, docente_cedula) => callGas('examen_codigo_guardar', {
        examen_id: examenId,
        codigo: codigo,
        docente_cedula: docente_cedula,
        timestamp: new Date().toISOString()
    }, 'POST'),
    
    getAccessCode: (examenId) => callGas('examen_codigo_obtener', {
        examen_id: examenId
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        codigo: r.codigo || null,
        activo: r.activo !== false
    })),
    
    myExamsWithCodes: (docente_cedula) => callGas('examen_listar_con_codigos', {
        docente_cedula: docente_cedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        examenes: r.examenes || []
    })),
    
    toggleAccessCode: (examenId, activo) => callGas('examen_codigo_toggle', {
        examen_id: examenId,
        activo: activo
    }, 'POST'),
    
    // ═══ MÚLTIPLES INTENTOS Y ANÁLISIS ═══
    saveAttempt: (data) => callGas('examen_guardar_intento', {
        examen_id: data.examen_id,
        alumno_cedula: data.alumno_cedula,
        nombre: data.nombre || '',
        asignatura: data.asignatura || '',
        evaluacion: data.evaluacion || '',
        respuestas: data.respuestas,
        puntaje: data.puntaje,
        total: data.total,
        pct: data.pct,
        correctas: data.correctas,
        timestamp: new Date().toISOString()
    }, 'POST'),
    
    getAttempts: (examenId, alumnoCedula) => callGas('examen_obtener_intentos', {
        examen_id: examenId,
        alumno_cedula: alumnoCedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        intentos: r.intentos || [],
        mejor_intento: r.mejor_intento || null
    })),
    
    getIndicatorAnalysis: (examenId) => callGas('examen_analisis_indicadores', {
        examen_id: examenId
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        indicadores: r.indicadores || [],
        promedio_general: r.promedio_general || 0
    })),
    
    getResultsList: (examenId) => callGas('examen_listado_resultados', {
        examen_id: examenId
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        alumnos: r.alumnos || [],
        estadisticas: r.estadisticas || {}
    })),
    
    exportPDF: (examenId, docente_cedula) => callGas('examen_exportar_pdf', {
        examen_id: examenId,
        docente_cedula: docente_cedula
    }, 'POST').then(r => ({
        ok: r.ok !== false,
        pdf_url: r.pdf_url || null
    })),
    
    // ═══ APROBACIÓN DE EXÁMENES POR ACADÉMICO ═══
    approveExam: (examenId, academico_cedula) => callGas('examen_aprobar', {
        examen_id: examenId,
        academico_cedula: academico_cedula,
        estado: 'aprobado',
        fecha_aprobacion: new Date().toISOString()
    }, 'POST'),
    
    rejectExam: (examenId, academico_cedula, motivo) => callGas('examen_rechazar', {
        examen_id: examenId,
        academico_cedula: academico_cedula,
        estado: 'rechazado',
        motivo: motivo || 'No especificado',
        fecha_rechazo: new Date().toISOString()
    }, 'POST'),
    
    getExamsForApproval: (academico_cedula) => callGas('examen_listar_pendientes_aprobacion', { academico_cedula: academico_cedula || '' }, 'GET').then(r => ({
        ok: r.ok !== false,
        error: r.error || null,
        examenes: r.examenes || [],
        pendientes_count: r.pendientes_count || 0
    })),

    // Devuelve un examen aprobado a "pendiente"
    revokeExamApproval: (examenId, academico_cedula) => callGas('examen_revocar_aprobacion', {
        examen_id: examenId,
        academico_cedula: academico_cedula
    }, 'POST'),
    
    getExamApprovalStatus: (examenId) => callGas('examen_estado_aprobacion', {
        examen_id: examenId
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        estado: r.estado || 'pendiente',
        aprobado: r.aprobado === true,
        fecha_aprobacion: r.fecha_aprobacion || null,
        academico_cedula: r.academico_cedula || null
    })),
};

API.attendance = {
    list: (params) => callGas('listar_eventos_asistencia', params || {}, 'GET'),
    myEvents: (cedula) => callGas('mis_eventos_asistencia', { cedula }, 'GET'),
    validateCode: (code) => callGas('validar_codigo_asistencia', { codigo: code }, 'GET'),
    createEvent: (data) => callGas('crear_evento_asistencia', data, 'POST'),
    mark: (data) => callGas('registrar_asistencia_codigo', data, 'POST'),
    getEvent: (id) => callGas('detalle_evento_asistencia', { evento_id: id }, 'GET'),
    closeEvent: (id) => callGas('cerrar_evento_asistencia', { evento_id: id }, 'POST'),
    selfMark: (asignatura, unidad) => callGas('autoregistro_asistencia', { asignatura, unidad }, 'POST'),
    classStatus: (asignatura, unidad) => callGas('estado_asistencia_clase', { asignatura, unidad }, 'GET'),
    getByCourseAndDate: (c, f) => API._attByDate(c, f),
    markAttendance: (a, b, c, d) => API._attMark(a, b, c, d)
};

API.calendar = {
    list: (inicio, fin) => callGas('listar_eventos_calendario', { fecha_inicio: inicio || '', fecha_fin: fin || '' }, 'GET'),
    get: (id) => callGas('detalle_evento_calendario', { evento_id: id }, 'GET'),
    checkConflicts: (fecha, inicio, fin, excludeId) => callGas('verificar_conflictos_calendario', {
        fecha: fecha, hora_inicio: inicio, hora_fin: fin, exclude_id: excludeId || ''
    }, 'GET'),
    create: (data) => callGas('crear_evento_calendario', data, 'POST'),
    update: (data) => callGas('actualizar_evento_calendario', data, 'POST'),
    delete: (id) => callGas('eliminar_evento_calendario', { id: id }, 'POST'),
    carreras: () => callGas('listar_carreras', {}, 'GET').then(r => ({
        ok: true,
        carreras: (r.carreras || []).map(c => c.nombre || c)
    }))
};

API.matricula = {
    my: (cedula) => callGas('obtener_matricula', { cedula }, 'GET'),
    save: (data) => callGas('guardar_matricula', data, 'POST'),
    list: () => callGas('listar_matriculas', {}, 'GET'),
    detail: (id, cedula) => callGas('detalle_matricula', { id, cedula }, 'GET'),
    stats: () => callGas('estadisticas_matricula', {}, 'GET'),
    updateStatus: (id, estado) => callGas('actualizar_estado_matricula', { id, estado }, 'POST'),
    delete: (id) => callGas('eliminar_matricula', { id }, 'POST')
};

API.formularios = {
    list: (carrera) => callGas('listar_formularios', { carrera: carrera || '' }, 'GET'),
    get: (codigo) => callGas('obtener_formulario', { codigo }, 'GET'),
    my: (cedula) => callGas('mis_formularios', { cedula }, 'GET'),
    save: (data) => callGas('registrar_formulario', data, 'POST'),
    completions: (formId) => callGas('completitud_formularios', { formulario_id: formId }, 'GET')
};

API.pagos = {
    list: (cedula) => callGas('consultar_pagos', { cedula: cedula || '' }, 'GET'),
    stats: (cedula) => callGas('consultar_pagos', { cedula: cedula || '' }, 'GET').then(r => {
        const pagos = (r && (r.pagos || r.data)) || [];
        let total_pagado = 0, total_pendiente = 0, total_vencido = 0;
        pagos.forEach(p => {
            const m = Number(p.monto || p.Monto || 0) || 0;
            const est = String(p.estado || p.Estado || '').toLowerCase();
            if (est === 'pagado' || est === 'confirmado' || est === 'cobrado') total_pagado += m;
            else if (est === 'vencido' || est === 'mora') total_vencido += m;
            else total_pendiente += m;
        });
        return Object.assign({}, r, {
            ok: !r || r.ok !== false,
            pagos: pagos,
            total_pagado: total_pagado,
            total_cobrado: total_pagado,
            total_pendiente: total_pendiente,
            total_vencido: total_vencido
        });
    }),
    save: (data) => callGas('registrar_pago', data, 'POST'),
    updateStatus: (data) => callGas('actualizar_pago', data, 'POST'),
    delete: (data) => callGas('actualizar_pago', Object.assign({}, data, { estado: 'anulado' }), 'POST')
};

// Asistencia al Estudiante (v08.5): todo va por POST con el token de sesión (el token no viaja en la URL).
API.asistente = {
    _p: (accion, datos) => callGas(accion, Object.assign({ token: API.getToken() }, datos || {}), 'POST'),
    catalogos: () => API.asistente._p('asist_catalogos'),
    buscar: (q) => API.asistente._p('asist_buscar', { q }),
    ficha: (cedula) => API.asistente._p('asist_ficha', { cedula }),
    cumpleanos: (periodo, mes) => API.asistente._p('asist_cumpleanos', { periodo, mes }),
    otorgarBeneficio: (datos) => API.asistente._p('asist_beneficio_otorgar', datos),
    estadoBeneficio: (id, accion) => API.asistente._p('asist_beneficio_estado', { id, accion }),   // accion: canjear | anular
    registrarQueja: (datos) => API.asistente._p('asist_queja_registrar', datos),
    listarQuejas: (filtros) => API.asistente._p('asist_queja_listar', filtros),
    enviarQueja: (id, destino, nota) => API.asistente._p('asist_queja_enviar', { id, destino, nota }),
    cerrarQueja: (id, accion, respuesta) => API.asistente._p('asist_queja_cerrar', { id, accion, respuesta })   // accion: resolver | anular
};

// Mensaje de cumpleaños del alumno: el servidor usa la cédula de SU sesión, nunca un parámetro.
API.cumple = {
    mio: () => callGas('cumple_mio', { token: API.getToken() }, 'POST')
};

// Credencial con QR dinámico: el alumno pide un código de vida corta (su cédula sale de la sesión) y el personal lo verifica (un solo uso).
API.credencial = {
    generar: () => callGas('qr_credencial', { token: API.getToken() }, 'POST'),
    verificar: (codigo) => callGas('qr_verificar', { token: API.getToken(), codigo }, 'POST')
};

// Atención al Alumno: consultas con expediente (el alumno escribe; atención/académico responden; se puede sumar gente o derivar a un área).
// Todo por POST con token de sesión.
API.consultas = {
    _p: (accion, datos) => callGas(accion, Object.assign({ token: API.getToken() }, datos || {}), 'POST'),
    crear: (categoria, asunto, mensaje) => API.consultas._p('con_crear', { categoria, asunto, mensaje }),
    listar: (filtros) => API.consultas._p('con_listar', filtros),                       // { mias, atender, conteo, sin_leer, es_personal }
    ver: (id) => API.consultas._p('con_ver', { id }),                                    // expediente completo
    responder: (id, texto, interna) => API.consultas._p('con_responder', { id, texto, interna: !!interna }),
    estado: (id, estado) => API.consultas._p('con_estado', { id, estado }),              // abierta | en_proceso | resuelta
    compartir: (id, cedula) => API.consultas._p('con_compartir', { id, cedula }),
    quitar: (id, cedula) => API.consultas._p('con_quitar', { id, cedula }),
    derivar: (id, area, quitar) => API.consultas._p('con_derivar', { id, area, quitar: !!quitar }),
    pendientes: () => API.consultas._p('con_pendientes')                                 // { sin_leer, por_atender, es_personal }
};

// Facturas del alumno: fecha, número, concepto y foto. Las ve el personal habilitado (foto privada: se pide aparte con foto()).
API.trabajos = {
    entregar: (datos) => callGas('trab_entregar', datos, 'POST'),   // { asignatura, unidad, titulo, archivo (dataURL PDF), nombre_archivo }
    mios: (asignatura) => callGas('trab_mios', { asignatura: asignatura || '' }, 'GET'),
    listar: (asignatura) => callGas('trab_listar', { asignatura: asignatura || '' }, 'GET'),
    pdf: (id) => callGas('trab_pdf', { id }, 'GET'),                 // { nombre, base64 }
    calificar: (id, calificacion, puntaje_max, comentario) => callGas('trab_calificar', { id, calificacion, puntaje_max, comentario }, 'POST')
};

API.facturas = {
    _p: (accion, datos) => callGas(accion, Object.assign({ token: API.getToken() }, datos || {}), 'POST'),
    crear: (datos) => API.facturas._p('fac_crear', datos),               // { fecha, numero, concepto, monto?, foto (dataURL) }
    mias: () => API.facturas._p('fac_mias'),
    editar: (id, datos) => API.facturas._p('fac_editar', Object.assign({ id }, datos)),
    anular: (id) => API.facturas._p('fac_anular', { id }),
    foto: (id) => API.facturas._p('fac_foto', { id }),                   // { imagen: dataURL }
    permisos: () => API.facturas._p('fac_permisos'),                     // { puede_ver, puede_accesos }
    listar: (filtros) => API.facturas._p('fac_listar', filtros),
    revisar: (id, estado, observacion) => API.facturas._p('fac_revisar', { id, estado, observacion }),
    accesos: () => API.facturas._p('fac_accesos'),
    habilitar: (cedula) => API.facturas._p('fac_habilitar', { cedula }),
    quitarAcceso: (cedula) => API.facturas._p('fac_quitar_acceso', { cedula })
};

// Mensajes de la plataforma a los alumnos (los envía el personal; el alumno los ve en su dashboard). Todo por POST con token.
API.mensajes = {
    _p: (accion, datos) => callGas(accion, Object.assign({ token: API.getToken() }, datos || {}), 'POST'),
    mios: () => API.mensajes._p('msg_mios'),                             // { mensajes:[{id,titulo,texto,tono,emisor,rol,fecha}] } vigentes y sin descartar
    leer: (id) => API.mensajes._p('msg_leer', { id }),                   // «Entendido»: lo descarta para este alumno
    destinos: () => API.mensajes._p('msg_destinos'),                     // { grados, carreras, secciones }
    enviar: (datos) => API.mensajes._p('msg_enviar', datos),             // { titulo, texto, tono, grado, carrera, seccion, cedulas, dias | desde, hasta }
    listar: () => API.mensajes._p('msg_listar'),
    retirar: (id) => API.mensajes._p('msg_retirar', { id })
};

// Eventos ligados al calendario: gestión (admin, filial, académico) u organizador con código de activación.
// Todo por POST con token; el código de activación viaja en el cuerpo, nunca en la URL.
API.eventos = {
    _p: (accion, datos) => callGas(accion, Object.assign({ token: API.getToken() }, datos || {}), 'POST'),
    listar: (filtros) => API.eventos._p('evt_listar', filtros),
    info: (id) => API.eventos._p('evt_info', { evento_id: id }),
    guardar: (datos) => API.eventos._p('evt_guardar', datos),
    estado: (id, accion, codigo) => API.eventos._p('evt_estado', { evento_id: id, accion, codigo_activacion: codigo || '' }),   // activar | cerrar | cancelar | reprogramar
    codigoNuevo: (id) => API.eventos._p('evt_codigo_nuevo', { evento_id: id }),
    panel: (id, codigo) => API.eventos._p('evt_panel', { evento_id: id, codigo_activacion: codigo || '' }),
    asistentes: (id, codigo) => API.eventos._p('evt_asistentes', { evento_id: id, codigo_activacion: codigo || '' }),
    marcar: (id, datos, codigo) => API.eventos._p('evt_marcar', Object.assign({ evento_id: id, codigo_activacion: codigo || '' }, datos))   // datos: { qr:[…] } o { cedula, nombre? }
};

// Cursos y asignaturas reales del alumno según la hoja Cursos (Activo · Pendiente · Desarrollado).
API.cursos = {
    mios: () => callGas('mis_cursos', { token: API.getToken() }, 'POST')   // { alumno, ficha, cursos:[{estado, materiales, asignatura}], materiales:[codigos], resumen, diagnostico }
};

API.filiales = {
    list: () => callGas('listar_filiales', {}, 'GET'),
    create: (data) => callGas('crear_filial', data, 'POST'),
    toggle: (id) => callGas('toggle_filial', { id }, 'POST'),
    adminsByFilial: (filial) => callGas('admins_por_filial', { filial }, 'GET'),
    assignAdmin: (data) => callGas('asignar_admin_filial', data, 'POST'),
    update: (data) => callGas('actualizar_filial', data, 'POST'),
    delete: (id) => callGas('eliminar_filial', { id }, 'POST')
};

API.asignaturas = {
    list: (params) => {
        if (typeof params === 'string') params = { q: params };
        return callGas('listar_asignaturas', params || {}, 'GET');
    },
    create: (data) => callGas('guardar_asignatura', data, 'POST'),
    update: (data) => callGas('guardar_asignatura', data, 'POST'),
    save: (data) => callGas('guardar_asignatura', data, 'POST'),
    delete: (id) => callGas('eliminar_asignatura', { id }, 'POST'),
    setEstado: (id, estado) => callGas('asignatura_estado', { id: id, estado: estado }, 'POST')
};

// Alias usado por dashboard-admin.html: CenturiaAPI.materias.listar()
API.materias = {
    listar: (params) => callGas('materias.listar', params || {}, 'GET').then(r => {
        const list = (r && (r.materias || r.asignaturas)) || [];
        return { ok: !!(r && r.ok !== false), materias: list, asignaturas: list };
    })
};

API.usuarios = {
    list: () => callGas('listar_usuarios', {}, 'GET'),
    get: (cedula) => callGas('verificar_alumno', { cedula }, 'GET'),
    update: (data) => callGas('actualizar_perfil', data, 'POST'),
    addRole: (data) => callGas('asignar_rol', data, 'POST'),
    removeRole: (data) => callGas('desactivar_rol', data, 'POST'),
    getPending: () => callGas('docente_pendientes', {}, 'POST'),
    pendientes: () => callGas('usuarios_pendientes', {}, 'GET').then(r => ({ ok: r.ok !== false, pendientes: (r && r.pendientes) || [] })),
    approve: (data) => callGas('asignar_rol', data, 'POST'),
    aprobar: (cedulaOrData) => {
        const d = (typeof cedulaOrData === 'string') ? { cedula: cedulaOrData } : (cedulaOrData || {});
        return callGas('docente_aprobar', { cedula: d.cedula || '' }, 'POST').then(r => Object.assign({ ok: !!(r && r.ok) }, r || {}));
    },
    actualizar: (cedulaOrData, data) => {
        const payload = Object.assign({}, data || {}, (typeof cedulaOrData === 'string') ? { cedula: cedulaOrData } : (cedulaOrData || {}));
        return callGas('actualizar_perfil', payload, 'POST').then(r => Object.assign({ ok: !!(r && r.ok) }, r || {}));
    },
    reject: (data) => callGas('desactivar_rol', data, 'POST'),
    registerDirect: (data) => callGas('preregistrar_usuario', data, 'POST'),
    anularPreregistro: (cedula) => callGas('anular_preregistro', { cedula: cedula }, 'POST'),
    resetPassword: (cedula) => callGas('recuperar_acceso', { cedula: cedula }, 'POST')
};

API.roles = {
    list: () => callGas('verificar_roles', {}, 'GET').then(r => ({ roles: r.roles || [] })),
    create: (data) => callGas('asignar_rol', data, 'POST'),
    update: (data) => callGas('asignar_rol', data, 'POST'),
    save: (data) => callGas('asignar_rol', data, 'POST'),
    delete: (id) => callGas('desactivar_rol', { id }, 'POST')
};

API.teachers = {
    list: () => callGas('listar_usuarios', {}, 'GET').then(r => {
        const users = r.usuarios || r.data || [];
        const docentes = users.filter(u => (u.roles || []).some(ro => ['docente', 'teacher'].includes(ro.rol)));
        return { docentes, items: docentes };
    }),
    assign: (data) => callGas('asignar_rol', Object.assign({ rol: 'docente' }, data), 'POST')
};

API.kit = {
    status: (asig) => callGas('listar_asignaturas', { asignatura: asig || '' }, 'GET'),
    getHabilitadas: () => callGas('listar_asignaturas', {}, 'GET'),
    upload: (data) => callGas('guardar_asignatura', data, 'POST')
};

API.constructor = {
    listDrafts: () => callGas('constructor_list_drafts', {}, 'GET'),
    getSubject: (codigo) => callGas('constructor_get_subject', { codigo }, 'GET'),
    saveSubject: (data) => callGas('guardar_asignatura', data, 'POST'),
    listBank: () => callGas('constructor_list_bank', {}, 'GET'),
    listReviews: () => callGas('constructor_list_reviews', {}, 'GET')
};

API.configuracion = {
    get: () => callGas('diagnostico', {}, 'GET'),
    set: (data) => callGas('guardar_configuracion', data, 'POST'),
    testMail: (data) => callGas('enviar_provisoria', data, 'POST')
};

API.admin = {
    getRoles: () => API._adminRolesAll(),
    assignRole: (o) => API._adminAssign(o),
    revokeRole: (c, r, ca) => API._adminRevoke(c, r, ca)
};

API.upload = {
    importUsersFromCSV: (a, b) => API._uploadCSV(a, b)
};

// Adaptador universal para peticiones hacia endpoints
API.request = function (action, data, method) {
    return callGas(action, data, method);
};

// Exportar para uso en módulos o navegador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

// Helpers globales
function isAuthenticated() {
    const token = localStorage.getItem('centuria_auth_token') || sessionStorage.getItem('centuria_auth_token');
    return !!token;
}

function getInitials(name) {
    if (!name) return 'US';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : 'US';
}

function getCurrentUser() {
    return API.getCurrentUser();
}

// Objeto global usado por todas las pantallas
window.CenturiaAPI = API;
var CenturiaAPI = window.CenturiaAPI;

// ═══ CIERRE DE SESIÓN (v2026-10-11) ═══
// Claves del navegador que NO son de la sesión (preferencias y avance en este equipo); todo lo demás «centuria_*» se borra.
const CV_CLAVES_EQUIPO = ['centuria_dark', 'centuria_remember_cedula', 'centuria_custom_evals', 'tic026_dispositivo_id'];
function cvLimpiarSesionLocal() {
    try { sessionStorage.clear(); } catch (e) {}
    try {
        const borrar = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.indexOf('centuria_') === 0 || k === 'token') && CV_CLAVES_EQUIPO.indexOf(k) < 0) borrar.push(k);
        }
        borrar.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
}
function cvEsPaginaDeIngreso() {
    try { return [appUrl('index.html'), appUrl('')].some(function (u) { return new URL(u).pathname === location.pathname; }); }
    catch (e) { return false; }
}
// Botón «Salir» de cualquier página que cargue api.js (logout.js, si está, define la misma función).
if (typeof window.centuriaLogout !== 'function') {
    window.centuriaLogout = function (confirmar) {
        if (confirmar && !confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
        API.logout().then(function () { window.location.replace(appUrl('index.html')); });
    };
}
// «Atrás» después de salir: el navegador puede mostrar la página guardada sin volver a ejecutarla.
window.addEventListener('pageshow', function (e) {
    if (e.persisted && !API.getToken() && !cvEsPaginaDeIngreso()) window.location.replace(appUrl('index.html'));
});
// Salir en una pestaña cierra también las demás pestañas abiertas del Campus.
window.addEventListener('storage', function (e) {
    if (e.key === 'centuria_auth_token' && !e.newValue && e.oldValue && !cvEsPaginaDeIngreso()) {
        cvLimpiarSesionLocal();
        window.location.replace(appUrl('index.html'));
    }
});

// ═══ TESORERÍA - PAGOS Y EXONERACIONES ═══
API.tesoreria = {
    // Listar estudiantes con montos y estado de pago
    listarEstudiantes: () => callGas('tesoreria_listar_estudiantes', {}, 'GET').then(r => ({
        ok: r.ok !== false,
        estudiantes: r.estudiantes || [],
        total_pendiente: r.total_pendiente || 0
    })),
    
    // Asignar exoneración a estudiante
    asignarExoneracion: (alumno_cedula, porcentaje, concepto, responsable_cedula) => callGas('tesoreria_asignar_exoneracion', {
        alumno_cedula: alumno_cedula,
        porcentaje: porcentaje,
        concepto: concepto || 'Beca',
        responsable_cedula: responsable_cedula,
        fecha_aplicacion: new Date().toISOString()
    }, 'POST'),
    
    // Registrar pago
    registrarPago: (alumno_cedula, monto, concepto, comprobante) => callGas('tesoreria_registrar_pago', {
        alumno_cedula: alumno_cedula,
        monto: monto,
        concepto: concepto,
        comprobante: comprobante,
        fecha_pago: new Date().toISOString()
    }, 'POST'),
    
    // Obtener historial de pagos de estudiante
    obtenerHistorialPagos: (alumno_cedula) => callGas('tesoreria_historial_pagos', {
        alumno_cedula: alumno_cedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        pagos: r.pagos || [],
        total_pagado: r.total_pagado || 0,
        saldo_pendiente: r.saldo_pendiente || 0
    })),
    
    // Obtener exoneración vigente
    obtenerExoneracion: (alumno_cedula) => callGas('tesoreria_obtener_exoneracion', {
        alumno_cedula: alumno_cedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        tiene_exoneracion: r.tiene_exoneracion || false,
        porcentaje: r.porcentaje || 0,
        concepto: r.concepto || null,
        fecha_desde: r.fecha_desde || null
    })),
    
    // Generar reporte de cobranzas
    reporteCobranzas: (fecha_desde, fecha_hasta) => callGas('tesoreria_reporte_cobranzas', {
        fecha_desde: fecha_desde,
        fecha_hasta: fecha_hasta
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        total_recaudado: r.total_recaudado || 0,
        total_pendiente: r.total_pendiente || 0,
        pagos: r.pagos || []
    }))
};

// ═══ GESTIÓN DE ESTUDIANTES - BAJAS, BLOQUEOS, RUC ═══
API.gestionEstudiantes = {
    // Actualizar RUC de estudiante
    actualizarRUC: (alumno_cedula, ruc) => callGas('estudiante_actualizar_ruc', {
        alumno_cedula: alumno_cedula,
        ruc: ruc,
        fecha_actualizacion: new Date().toISOString()
    }, 'POST'),
    
    // Obtener datos de facturación
    obtenerDatosFacturacion: (alumno_cedula) => callGas('estudiante_datos_facturacion', {
        alumno_cedula: alumno_cedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        ruc: r.ruc || null,
        nombre: r.nombre || '',
        apellido: r.apellido || '',
        email: r.email || ''
    })),
    
    // Dar de baja estudiante
    darDeBaja: (alumno_cedula, motivo, detalles, responsable_cedula) => callGas('estudiante_dar_de_baja', {
        alumno_cedula: alumno_cedula,
        motivo: motivo, // 'pago', 'academico', 'otro'
        detalles: detalles,
        responsable_cedula: responsable_cedula,
        fecha_baja: new Date().toISOString(),
        estado: 'baja'
    }, 'POST'),
    
    // Reactivar estudiante
    reactivarEstudiante: (alumno_cedula, responsable_cedula) => callGas('estudiante_reactivar', {
        alumno_cedula: alumno_cedula,
        responsable_cedula: responsable_cedula,
        fecha_reactivacion: new Date().toISOString(),
        estado: 'activo'
    }, 'POST'),
    
    // Bloquear estudiante
    bloquearEstudiante: (alumno_cedula, motivo, responsable_cedula) => callGas('estudiante_bloquear', {
        alumno_cedula: alumno_cedula,
        motivo: motivo,
        responsable_cedula: responsable_cedula,
        fecha_bloqueo: new Date().toISOString(),
        estado: 'bloqueado'
    }, 'POST'),
    
    // Desbloquear estudiante
    desbloquearEstudiante: (alumno_cedula, responsable_cedula) => callGas('estudiante_desbloquear', {
        alumno_cedula: alumno_cedula,
        responsable_cedula: responsable_cedula,
        fecha_desbloqueo: new Date().toISOString(),
        estado: 'activo'
    }, 'POST'),
    
    // Obtener estado del estudiante
    obtenerEstado: (alumno_cedula) => callGas('estudiante_obtener_estado', {
        alumno_cedula: alumno_cedula
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        estado: r.estado || 'activo', // 'activo', 'bloqueado', 'baja'
        motivo_bloqueo: r.motivo_bloqueo || null,
        fecha_bloqueo: r.fecha_bloqueo || null,
        puede_acceder: r.puede_acceder || r.estado === 'activo'
    })),
    
    // Listar estudiantes con bajas
    listarBajas: (fecha_desde, fecha_hasta) => callGas('estudiante_listar_bajas', {
        fecha_desde: fecha_desde,
        fecha_hasta: fecha_hasta
    }, 'GET').then(r => ({
        ok: r.ok !== false,
        bajas: r.bajas || []
    }))
};

// Arqueo de caja (métodos de API.tesoreria; usa CenturiaAPI.tesoreria.arqueoCaja en admin/sections/arqueo-caja.html)
Object.assign(API.tesoreria, {
    arqueoCaja: async function(fechaDesde, fechaHasta, segmentarPor = 'general') {
        /**
         * Arqueo de caja con segmentación flexible
         * @param fechaDesde {string} Fecha inicio (YYYY-MM-DD)
         * @param fechaHasta {string} Fecha fin (YYYY-MM-DD)
         * @param segmentarPor {string} general|carrera|grado|seccion|carrera-grado
         * @returns {object} Datos de arqueo con general y segmentado[]
         */
        const response = await google.script.run
            .withSuccessHandler(data => data)
            .arqueoCaja(fechaDesde, fechaHasta, segmentarPor);
        
        return {
            general: {
                totalIngresos: response.total || 0,
                cantidadPagos: response.cantidad || 0,
                promedioPago: response.promedio || 0,
                minPago: response.minimo || 0,
                maxPago: response.maximo || 0,
                estudiantes: response.estudiantes || 0,
                porcentajePago: response.porcentaje || 0
            },
            segmentado: response.segmentos || []
        };
    },

    obtenerPagosPorSegmento: async function(segmentoId) {
        /**
         * Obtener detalle de pagos de un segmento específico
         * @param segmentoId {string} ID del segmento
         * @returns {array} Array de pagos {nombreEstudiante, cedula, fecha, monto, comprobante}
         */
        return await google.script.run
            .withSuccessHandler(data => data)
            .obtenerPagosPorSegmento(segmentoId);
    },

    reporteArqueoDetallado: async function(fechaDesde, fechaHasta, formato = 'json') {
        /**
         * Generar reporte detallado de arqueo con múltiples vistas
         * @param fechaDesde {string} Fecha inicio
         * @param fechaHasta {string} Fecha fin
         * @param formato {string} json|csv|pdf
         * @returns {object} Reporte con múltiples segmentaciones
         */
        return await google.script.run
            .withSuccessHandler(data => data)
            .reporteArqueoDetallado(fechaDesde, fechaHasta, formato);
    },

    arqueoDiscrepancias: async function(fechaDesde, fechaHasta) {
        /**
         * Detectar discrepancias en el arqueo de caja
         * @param fechaDesde {string} Fecha inicio
         * @param fechaHasta {string} Fecha fin
         * @returns {array} Array de discrepancias detectadas
         */
        return await google.script.run
            .withSuccessHandler(data => data)
            .arqueoDiscrepancias(fechaDesde, fechaHasta);
    }
});
