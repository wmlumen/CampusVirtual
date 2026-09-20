// api.js - Centuria Portal API Client (v13)
// v13 (2026-09-20): GAS_URL apunta al despliegue con backend v08.4.1 (catálogos tolerantes, secciones desde la planilla).
// Cliente unificado para Servidor Cloud + Base de Datos / Almacenamiento Cloud
// 100% compatible con GitHub Pages (sin dependencia de PHP ni SQLite)
// Usado por: index.html, dashboard.html, docente.html, libreta.html, attendance.html,
//            calendario.html, formulario-matricula.html, tesoreria.html, admin/

const ROLE_ES = {student:'alumno',teacher:'docente',admin:'admin',academic:'academico',inactive:'inactivo'};
const ROLE_EN = {alumno:'student',docente:'docente',admin:'admin',academico:'academic',inactivo:'inactive',student:'student',teacher:'docente',academic:'academic',inactive:'inactive'};

// Servidor Cloud URL (planilla BasedeDatosCampus = única base en la nube).
const GAS_URL = 'https://script.google.com/macros/s/AKfycbymm5cpXSVOEBl6ayUQVMk59TfecOZqpErZ9zRLkD4kPAvXUBnYuf14UDf8Bk5w4-EP/exec';

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
    apiProvider: 'cloud-serverless',
    cloudApiUrl: GAS_URL,
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
    const controller = (typeof AbortController !== 'undefined') ? new AbortController() : { signal: null, abort: () => {} };
    const timeout = setTimeout(() => { try { controller.abort(); } catch (e) {} }, window.CENTURIA_CONFIG.requestTimeout || 15000);

    if (method === 'GET') {
        const queryParams = Object.assign({ action: action }, data);
        let search = '';
        if (typeof URLSearchParams !== 'undefined') {
            const sp = new URLSearchParams();
            Object.keys(queryParams).forEach(k => {
                if (queryParams[k] !== undefined && queryParams[k] !== null) {
                    sp.append(k, String(queryParams[k]));
                }
            });
            search = sp.toString();
        } else {
            search = Object.keys(queryParams)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(queryParams[k] !== undefined && queryParams[k] !== null ? queryParams[k] : ''))
                .join('&');
        }
        return fetch(`${GAS_URL}?${search}`, { signal: controller.signal })
            .then(r => r.json())
            .catch(err => {
                console.warn(`[GAS] Error en GET action=${action}:`, err);
                return { ok: false, error: 'Error de comunicación con el servidor en la nube. Verifique su conexión.' };
            })
            .finally(() => clearTimeout(timeout));
    } else {
        const payload = Object.assign({ action: action }, data);
        return fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        .then(r => r.json())
        .catch(err => {
            console.warn(`[GAS] Error en POST action=${action}:`, err);
            return { ok: false, error: 'Error de comunicación con el servidor en la nube. Verifique su conexión.' };
        })
        .finally(() => clearTimeout(timeout));
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
        grado: u.grado || '',
        carrera: u.carrera || '',
        seccion: u.seccion || '',
        foto: u.foto || u.foto_url || '',
        foto_url: u.foto_url || u.foto || '',
        must_change_password: u.must_change_password ? 1 : 0,
        estado: u.estado || 'activo'
    };
}

// ══════════════════════════════════════════════════════════════
// OBJETO API CENTRAL (CenturiaAPI)
// ══════════════════════════════════════════════════════════════

const API = {
    baseUrl: GAS_URL,
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
        }).catch(() => ({ ok: false, message: 'Error de comunicación con el servidor en la nube.' }));
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
            if (res && res.valid && res.user) {
                const user = mapUser(res.user);
                try {
                    localStorage.setItem('centuria_user', JSON.stringify(user));
                    sessionStorage.setItem('centuria_user', JSON.stringify(user));
                } catch (e) {}
                return { valid: true, user: user };
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
                email: a.email || ''
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
    getMySubjects: (cedula) => callGas('listar_cursos', { cedula: cedula, rol: 'docente' }, 'GET').then(r => ({
        ok: true,
        subjects: r.cursos || [],
        assignments: (r.cursos || []).map(c => ({
            asignatura: c.codigo || c.id,
            rol: 'docente',
            estado: 'activo',
            carrera: c.carrera || '',
            seccion: c.seccion || ''
        }))
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
    stats: (cedula) => callGas('consultar_pagos', { cedula: cedula || '' }, 'GET'),
    save: (data) => callGas('registrar_pago', data, 'POST'),
    updateStatus: (data) => callGas('actualizar_pago', data, 'POST'),
    delete: (data) => callGas('actualizar_pago', Object.assign({}, data, { estado: 'anulado' }), 'POST')
};

API.filiales = {
    list: () => callGas('listar_filiales', {}, 'GET'),
    create: (data) => callGas('crear_filial', data, 'POST'),
    toggle: (id) => callGas('toggle_filial', { id }, 'POST'),
    adminsByFilial: (filial) => callGas('admins_por_filial', { filial }, 'GET'),
    assignAdmin: (data) => callGas('asignar_admin_filial', data, 'POST'),
    create: (data) => callGas('crear_filial', data, 'POST'),
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

API.usuarios = {
    list: () => callGas('listar_usuarios', {}, 'GET'),
    get: (cedula) => callGas('verificar_alumno', { cedula }, 'GET'),
    update: (data) => callGas('actualizar_perfil', data, 'POST'),
    addRole: (data) => callGas('asignar_rol', data, 'POST'),
    removeRole: (data) => callGas('desactivar_rol', data, 'POST'),
    getPending: () => callGas('docente_pendientes', {}, 'POST'),
    approve: (data) => callGas('asignar_rol', data, 'POST'),
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
