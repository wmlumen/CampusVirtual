// api.js - Centuria Portal API Client (v12)
// Cliente unificado para Servidor Cloud + Base de Datos / Almacenamiento Cloud
// 100% compatible con GitHub Pages (sin dependencia de PHP ni SQLite)
// Usado por: index.html, dashboard.html, docente.html, libreta.html, attendance.html,
//            calendario.html, formulario-matricula.html, tesoreria.html, perfil.html, admin/

const ROLE_ES = {student:'alumno',teacher:'docente',admin:'admin',academic:'academico',inactive:'inactivo'};
const ROLE_EN = {alumno:'student',docente:'docente',admin:'admin',academico:'academic',inactivo:'inactive',student:'student',teacher:'docente',academic:'academic',inactive:'inactive'};

// Servidor Cloud URL (planilla BasedeDatosCampus = única base en la nube).
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxek9YPO_GaFBMwqrBnmzqt9Ooh1w7VP9kbfTN64y-af9PrhWyZ_xWkdT5IFpwAIcR1/exec';

// Configuración central institucional
window.CENTURIA_CONFIG = {
    environment: 'production',
    appBasePath: (function () {
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
        if (base === './') return new URL(relativePath, document.baseURI).href;
        return new URL(relativePath.replace(/^\.\//, ''), location.origin + base).href;
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
        foto: userData.foto || userData.foto_url || ''
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

API.grades = {
    list: (params) => callGas('listar_notas', params || {}, 'GET'),
    save: (data) => callGas('guardar_nota', data, 'POST'),
    recordSubject: (data) => callGas('guardar_notas_asignatura', data, 'POST')
};

API.exams = {
    saveAnswers: (data) => callGas('guardar_respuestas_examen', data, 'POST')
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
    resetPassword: (userId) => callGas('recuperar_acceso', { user_id: userId }, 'POST')
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
