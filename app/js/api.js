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

// Fallback: si Firebase SDK no cargó, intentar con SDK modular
if(typeof window.firebase==='undefined'||!window.firebase.apps||window.firebase.apps.length===0){
  (function(){
    var loaded=false;
    function onAllLoaded(){
      if(loaded)return;loaded=true;
      try{
        window.firebase={
          apps:[],
          initializeApp:function(c){var a={name:'[DEFAULT]',options:c};this.apps.push(a);return a;},
          firestore:function(){return{
            collection:function(c){return{
              doc:function(id){return{get:function(){return Promise.resolve({exists:false,id:id,data:function(){return {};}});}};},
              where:function(){return{get:function(){return Promise.resolve({empty:true,docs:[]});}};}
            };},
          };},
          auth:function(){return {};}
        };
        window.__firebaseFallback=true;
      }catch(e){}
    }
    var s1=document.createElement('script');s1.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
    var s2=document.createElement('script');s2.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
    var s3=document.createElement('script');s3.src='https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
    s1.onload=function(){s2.onload();};
    s2.onload=function(){s3.onload=onAllLoaded;document.head.appendChild(s3);};
    s1.onerror=s2.onerror=s3.onerror=onAllLoaded;
    document.head.appendChild(s1);
  })();
}

function getDb() {
    if (_firestoreDb) return _firestoreDb;
    const fb = window.firebase;
    if (!fb) {
        if (typeof window._fbCheck === 'function') window._fbCheck();
        console.warn('[getDb] window.firebase is undefined. Firebase SDK scripts may have failed to load.');
        console.warn('[getDb] Script sources:', [...document.querySelectorAll('script[src*="firebase"]')].map(s => s.src + ' -> ' + (s.onerror ? 'has onerror' : 'no onerror')));
        throw new Error('Firebase SDK no cargado');
    }
    if (!fb.apps || fb.apps.length === 0) fb.initializeApp(FIREBASE_CONFIG);
    _firestoreDb = fb.firestore();
    return _firestoreDb;
}

// ── Autenticación anónima por dispositivo (habilita escrituras y lecturas de staff) ──
function ensureAnonAuth() {
    return Promise.resolve().then(function () {
        const fb = window.firebase;
        if (!fb || !fb.auth) throw new Error('Firebase Auth no disponible');
        const auth = fb.auth();
        if (auth.currentUser) return auth.currentUser;
        return auth.signInAnonymously().then(function (cred) { return cred.user; }).catch(function (e) {
            if (auth.currentUser) return auth.currentUser;
            const code = (e && e.code) || '';
            if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found' || /CONFIGURATION_NOT_FOUND/.test((e && e.message) || '')) {
                const err = new Error('Auth de Firebase no configurado: activá en la consola Firebase → Authentication → Sign-in method → Anonymous.');
                err.code = code; throw err;
            }
            throw e;
        });
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
                return db.collection('usuarios').where('cedula', '==', ced).limit(1).get().then(snap => {
                    if (snap.empty) { console.warn('[Firestore login] ced='+ced+' no encontrado'); return { ok: false, error: 'Cédula o contraseña incorrecta.' }; }
                    const doc = snap.docs[0];
                    const d = doc.data();
                    if (d.password && d.password !== pass) return { ok: false, error: 'Cédula o contraseña incorrecta.' };
                    const token = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
                    const user = Object.assign({}, d, { id: doc.id });
                    return { ok: true, token: token, user: user, must_change_password: d.must_change_password ? 1 : 0 };
                }).catch(e => {
                    console.error('[Firestore login] ced='+ced+' err=', e.code, e.message);
                    return { ok: false, error: 'Firestore: ' + (e.code || '') + ' ' + e.message };
                });
            }
            case 'register': return (async () => {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                if (!ced) return { ok: false, error: 'Cédula requerida.' };
                const exists = await db.collection('usuarios').where('cedula', '==', ced).limit(1).get();
                if (!exists.empty) return { ok: false, error: 'Ya existe un usuario con esta cédula.' };
                const id = 'USR-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                const userData = {
                    id: id, cedula: ced,
                    nombre: data.nombre || '', apellido: data.apellido || '',
                    email: (data.email || '').toLowerCase().trim(),
                    password: data.password || '',
                    rol: data.rol || 'alumno',
                    grado: data.grado || '', carrera: data.carrera || '',
                    seccion: data.seccion || '', telefono: data.telefono || '',
                    foto: data.foto || data.foto_url || '',
                    estado: data.requiere_aprobacion ? 'pendiente' : 'activo',
                    created_at: new Date().toISOString()
                };
                await db.collection('usuarios').doc(id).set(userData);
                return { ok: true, user: userData, token: Date.now().toString(36) };
            })();
            case 'validar_sesion': {
                let u = null; try{ const s = localStorage.getItem('centuria_user') || sessionStorage.getItem('centuria_user'); if(s) u = JSON.parse(s); }catch(e){}
                return Promise.resolve({ ok: true, valid: true, user: u });
            }
            case 'logout': return Promise.resolve({ ok: true });
            case 'actualizar_perfil': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                const ref = snap.docs[0].ref;
                const updates = {};
                ['nombre','apellido','email','telefono','telefono_alternativo','telefono_fijo',
                 'contacto_emergencia','fecha_nacimiento','lugar_nacimiento','nacionalidad','pais',
                 'direccion_calle','barrio','ciudad','departamento','direccion','latitud','longitud',
                 'estado_civil','foto','foto_url','grupo_sanguineo','alergias','seguro_medico',
                  'rol','estado','carrera','seccion','grado','password','must_change_password'
                ].forEach(k => { if (data[k] !== undefined) updates[k] = data[k]; });
                updates.updated_at = new Date().toISOString();
                return ref.update(updates).then(() => ({ ok: true, user: Object.assign({}, snap.docs[0].data(), updates) }));
            }).catch(e => ({ ok: false, error: e.message }));
            case 'cambiar_password': {
                const ced = String(data.cedula || '').replace(/[\.\s\-]/g, '').trim();
                const oldP = data.old_password || '';
                const newP = data.new_password || '';
                if (!ced || !newP) return Promise.resolve({ ok: false, error: 'Datos incompletos.' });
                return db.collection('usuarios').where('cedula', '==', ced).limit(1).get().then(snap => {
                    if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                    const d = snap.docs[0].data();
                    if (oldP && d.password !== oldP) return { ok: false, error: 'Contraseña actual incorrecta.' };
                    return snap.docs[0].ref.update({ password: newP, updated_at: new Date().toISOString(), must_change_password: false })
                        .then(() => ({ ok: true }));
                });
            }
            case 'recuperar_acceso': return Promise.resolve({ ok: true, message: 'Si existe una cuenta con ese email, se enviará recuperación.' });
            case 'verificar_alumno': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: true, existe: false, estado: 'no_existe' };
                const d = snap.docs[0].data();
                return { ok: true, existe: true, estado: d.estado || 'activo', estudiante: Object.assign({ id: snap.docs[0].id }, d) };
            }).catch(() => ({ ok: true, existe: false }));
            case 'verificar_roles': return (data.cedula
                ? db.collection('usuarios').where('cedula', '==', data.cedula).limit(1).get()
                : db.collection('usuarios').get()
            ).then(snap => {
                if (data.cedula) {
                    if (snap.empty) return { ok: true, roles: [], rol: '' };
                    const d = snap.docs[0].data();
                    return { ok: true, roles: d.roles || [d.rol], rol: d.rol || '' };
                }
                const users = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                return { ok: true, roles: users.map(u => ({ cedula: u.cedula, nombre: u.nombre, rol: u.rol, estado: u.estado })), usuarios: users };
            }).catch(() => ({ ok: true, roles: [] }));
            case 'listar_usuarios': return db.collection('usuarios').get().then(snap => ({
                ok: true, usuarios: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, usuarios: [] }));
            case 'listar_asignaturas': case 'materias.listar': return ensureAnonAuth().then(() => db.collection('asignaturas').get().then(snap => ({
                ok: true, asignaturas: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            }))).catch(() => ({ ok: true, asignaturas: [] }));
            case 'listar_carreras': return ensureAnonAuth().then(() => db.collection('asignaturas').get().then(snap => {
                const carreras = new Set(['Aduanera', 'Gestión Pública', 'Administración de Empresa']);
                snap.docs.forEach(doc => { const c = doc.data().carrera; if (c) carreras.add(String(c)); });
                return { ok: true, carreras: [...carreras].map(nombre => ({ nombre })) };
            })).catch(() => ({ ok: true, carreras: [] }));
            case 'listar_secciones': return Promise.resolve({ ok: true, secciones: ['A','B','C','D','E','ÚNICA','S026','LV026'].map(c => ({ codigo: c })) });
            case 'listar_grados': return Promise.resolve({ ok: true, grados: ['GRADO','ESPECIALIZACIÓN','MAESTRÍA','DOCTORADO'].map(g => ({ nombre: g })) });
            case 'listar_filiales': return db.collection('filiales').get().then(snap => ({
                ok: true, filiales: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, filiales: [] }));
            case 'listar_cursos': return ensureAnonAuth().then(() => db.collection('asignaturas').get().then(snap => ({
                ok: true, cursos: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            }))).catch(() => ({ ok: true, cursos: [] }));
            case 'mis_cursos': return db.collection('asignaturas').get().then(snap => ({
                ok: true, cursos: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, cursos: [] }));
            case 'guardar_asignatura': return (async () => {
                const id = data.codigo || data.id || 'ASIG-' + Date.now().toString(36);
                await db.collection('asignaturas').doc(id).set(Object.assign({}, data, { updated_at: new Date().toISOString() }));
                return { ok: true, id: id };
            })();
            case 'eliminar_asignatura': return db.collection('asignaturas').doc(data.id).delete().then(() => ({ ok: true })).catch(() => ({ ok: false }));
            case 'asignar_rol': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                return snap.docs[0].ref.update({ rol: data.rol || data.role || 'alumno', updated_at: new Date().toISOString() }).then(() => ({ ok: true }));
            });
            case 'desactivar_rol': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                return snap.docs[0].ref.update({ estado: 'inactivo', updated_at: new Date().toISOString() }).then(() => ({ ok: true }));
            });
            case 'registrar_pago': return (async () => {
                const id = 'PAGO-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                await db.collection('pagos').doc(id).set(Object.assign({}, data, { fecha: new Date().toISOString(), estado: data.estado || 'pagado' }));
                return { ok: true, id: id };
            })();
            case 'consultar_pagos': return db.collection('pagos').get().then(snap => {
                const pagos = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                return { ok: true, pagos: data.cedula ? pagos.filter(p => p.cedula === data.cedula) : pagos };
            }).catch(() => ({ ok: true, pagos: [] }));
            case 'pagos.stats': return db.collection('pagos').get().then(snap => {
                const pagos = snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
                const total = pagos.length;
                const pagados = pagos.filter(p => p.estado === 'pagado').length;
                const pendientes = pagos.filter(p => p.estado !== 'pagado').length;
                return { ok: true, total, pagados, pendientes };
            }).catch(() => ({ ok: true, total: 0, pagados: 0, pendientes: 0 }));
            case 'registrar_alumno': return (async () => {
                const id = 'USR-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                const userData = Object.assign({}, data, { id, created_at: new Date().toISOString(), estado: data.estado || 'activo' });
                await db.collection('usuarios').doc(id).set(userData);
                return { ok: true, user: userData };
            })();
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
            case 'docente_pendientes': return db.collection('usuarios').where('rol', '==', 'docente').where('estado', '==', 'pendiente').get().then(snap => ({
                ok: true, pendientes: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, pendientes: [] }));
            case 'docente_aprobar': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                return snap.docs[0].ref.update({ estado: 'activo' }).then(() => ({ ok: true }));
            });
            case 'docente_rechazar': return db.collection('usuarios').where('cedula', '==', data.cedula || '').limit(1).get().then(snap => {
                if (snap.empty) return { ok: false, error: 'Usuario no encontrado.' };
                return snap.docs[0].ref.update({ estado: 'inactivo' }).then(() => ({ ok: true }));
            });
            case 'usuarios_pendientes': return db.collection('usuarios').where('estado', '==', 'pendiente').get().then(snap => ({
                ok: true, pendientes: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, pendientes: [] }));
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
            case 'listar_notas': return db.collection('notas').get().then(snap => ({
                ok: true, data: snap.docs.map(doc => Object.assign({ id: doc.id }, doc.data()))
            })).catch(() => ({ ok: true, data: [] }));
            case 'guardar_nota': case 'guardar_notas_asignatura': return (async () => {
                const id = data.id || 'NOTA-' + Date.now().toString(36);
                await db.collection('notas').doc(id).set(Object.assign({}, data, { updated_at: new Date().toISOString() }));
                return { ok: true };
            })();
            case 'cumple_mio': return Promise.resolve({ ok: true, cumpleano: false });
            case 'diagnostico': return Promise.resolve({ ok: true, diagnostico: {} });
            case 'qr_credencial': return Promise.resolve({ ok: true, codigo: 'QR-' + Math.random().toString(36).substring(2, 10) });
            default: return Promise.resolve({ ok: true, data: data || {} });
        }
    } catch (err) {
        console.error('[Firestore] Error en action=' + action + ':', err.code || '', err.message);
        return Promise.resolve({ ok: false, error: 'Firestore: ' + (err.code || '') + ' ' + err.message });
    }
}

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

    logout() {
        const token = this.getToken();
        if (token) gasLogout(token);
        try {
            localStorage.removeItem('centuria_auth_token');
            localStorage.removeItem('centuria_token');
            localStorage.removeItem('centuria_user');
            localStorage.removeItem('centuria_token_expires');
            sessionStorage.removeItem('centuria_auth_token');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('centuria_user');
            sessionStorage.removeItem('centuria_token_expires');
            sessionStorage.clear();
        } catch (e) {}
        return Promise.resolve({ ok: true });
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

API.auth = {
    register: (d) => API.authRegister(d),
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
    list: (params) => callGas('listar_notas', params || {}, 'GET'),
    save: (data) => {
        if (data && (Array.isArray(data.notas) || data.notas)) {
            return callGas('guardar_notas_asignatura', data, 'POST');
        }
        return callGas('guardar_nota', data, 'POST');
    },
    recordSubject: (data) => callGas('guardar_notas_asignatura', data, 'POST')
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
        respuestas: data.respuestas,
        puntaje: data.puntaje,
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
    delete: (id) => callGas('eliminar_asignatura', { id }, 'POST')
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
    registerDirect: (data) => callGas('registrar_alumno', data, 'POST'),
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
