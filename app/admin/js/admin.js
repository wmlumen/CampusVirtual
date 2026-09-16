/**
 * admin.js — Lógica del Panel Administrativo Centuria v2
 * Módulos: Usuarios (pendientes, perfil, multi-roles), Catálogos, Reportes, Config
 * Carga secciones HTML dinámicamente via fetch + Alpine.initTree()
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('adminPanel', () => ({

        // ═══════════════════════════════════════
        // ESTADO GLOBAL
        // ═══════════════════════════════════════
        userRole: '',
        userName: '',
        rolLabel: 'Usuario',
        activeTab: 'usuarios',
        loading: false,
        loadingText: 'Cargando...',
        sectionHtml: '',

        // ═══ USUARIOS ═══
        usuariosTab: 'pendientes',
        pendientes: [],
        usuarios: [],
        selectedUser: null,
        userSearch: '',
        userFilterRol: '',
        userFilterEstado: '',
        userFilterGrupo: '',
        showRegistroRapido: false,
        showCrearRol: false,
        showCrearFilial: false,
        showCatalogForm: false,
        stats: { totalCedulas: 0, alumnos: 0, docentes: 0 },
        rolesConfig: [],
        filiales: [],
        adminsPorFilial: [],
        nuevaFilial: { nombre: '', codigo: '', direccion: '' },
        permisosDisponibles: [
            { id: 'ver_cursos', label: 'Ver cursos' },
            { id: 'editar_cursos', label: 'Editar cursos' },
            { id: 'ver_notas', label: 'Ver notas' },
            { id: 'editar_notas', label: 'Editar notas' },
            { id: 'ver_asistencia', label: 'Ver asistencia' },
            { id: 'editar_asistencia', label: 'Editar asistencia' },
            { id: 'ver_calendario', label: 'Ver calendario' },
            { id: 'editar_calendario', label: 'Editar calendario' },
            { id: 'ver_documentos', label: 'Ver documentos' },
            { id: 'editar_documentos', label: 'Editar documentos' },
            { id: 'gestionar_usuarios', label: 'Gestionar usuarios' },
            { id: 'gestionar_roles', label: 'Gestionar roles' },
            { id: 'ver_reportes', label: 'Ver reportes' },
            { id: 'ver_tesoreria', label: 'Ver tesorería' },
            { id: 'ver_config', label: 'Ver configuración' },
        ],
        formPendiente: { cedula: '', nombre: '', apellido: '', email: '', telefono: '', grado: '', carrera: '', seccion: '', rol: 'alumno' },
        formUsuario: { firstname: '', lastname: '', email: '', telefono: '', grado: '', carrera: '', seccion: '', estado: 'activo' },
        nuevoRol: { rol: 'alumno', carrera: '', seccion: '', asignatura: '' },
        catalogosCarreras: [],
        catalogosSecciones: [],
        catalogosGrados: [],
        cfgMail: { remitente: '', nombre: '' },
        formRol: { nombre: '', descripcion: '', permisos: [], color: '#64748b', icono: 'bi-person', base_rol: '' },
        editRol: null,

        // ═══ VISTA PREVIA POR ROL ═══
        viewMode: false,
        viewRol: '',
        viewRolLabel: '',
        viewRolIcon: '',
        viewRolColor: '',
        viewRolUrl: '',
        vistasDisponibles: [
            { id: 'alumno',    label: 'Alumno',           icon: 'bi-mortarboard-fill', color: '#10b981', url: '../dashboard.html', desc: 'Dashboard del alumno: asignaturas, progreso, eventos' },
            { id: 'docente',   label: 'Docente',          icon: 'bi-person-badge-fill', color: '#3b82f6', url: '../docente.html', desc: 'Panel docente: asignaturas, calificaciones, planificación' },
            { id: 'academico', label: 'Acceso Académico', icon: 'bi-building', color: '#8b5cf6', url: '../dashboard.html', desc: 'Coordinación académica: indicadores, reportes' },
            { id: 'admin',     label: 'Administrador',    icon: 'bi-shield-fill-check', color: '#f43f5e', url: 'index.html', desc: 'Panel administrativo central' },
        ],

        // ═══ CATÁLOGOS ═══
        catalogTabs: [
            { id: 'secciones',   label: 'Secciones',   icon: 'bi-collection-fill' },
            { id: 'carreras',    label: 'Carreras',    icon: 'bi-book-fill' },
            { id: 'grados',      label: 'Grados',      icon: 'bi-diagram-3-fill' },
            { id: 'programas',   label: 'Programas',   icon: 'bi-calendar-event-fill' },
            { id: 'modalidades', label: 'Modalidades',  icon: 'bi-layers-fill' }
        ],
        catalogTab: 'secciones',
        catalogData: { secciones: [], carreras: [], grados: [], programas: [], modalidades: [] },
        catalogSearch: '',
        editItem: null,
        form: { codigo: '', nombre: '', carrera: '', grado: '', capacidad: 40, tipo_prog: '' },

        // ═══ REPORTES ═══
        rolesPorTipo: [],
        carrerasTop: [],
        accesosRecientes: [],
        catalogStats: { totalSecciones: 0, totalCarreras: 0, totalGrados: 0, totalProgramas: 0, totalModalidades: 0 },

        // ═══════════════════════════════════════
        // INICIALIZACIÓN
        // ═══════════════════════════════════════
        async initPanel() {
            const esAdminGeneral = sessionStorage.getItem('current_cedula') === '1340130';
            this.userRole = esAdminGeneral ? 'admin' : sessionStorage.getItem('rol');
            if (esAdminGeneral) {
                sessionStorage.setItem('rol', 'admin');
                sessionStorage.setItem('admin_general', 'true');
            }
            // Roles que pueden acceder al panel admin
            const rolesPermitidos = ['admin', 'academico', 'admin_filial', 'administrador_plataforma'];
            if (!rolesPermitidos.includes(this.userRole)) {
                alert('Acceso denegado. No tienes permisos para acceder al panel de administración.');
                window.location.href = '../dashboard.html';
                return;
            }
            this.userName = sessionStorage.getItem('current_nombre') || 'Usuario';
            
            // Determinar nombre del rol para mostrar
            const rolLabels = {
                'admin': 'Administrador General',
                'academico': 'Acceso Académico',
                'admin_filial': 'Administrador de Filial',
                'administrador_plataforma': 'Administrador de Plataforma'
            };
            this.rolLabel = rolLabels[this.userRole] || this.userRole;
            
            await this.loadSection('usuarios');
        },

        cerrarSesion() {
            if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
            sessionStorage.clear();
            localStorage.removeItem('centuria_remember');
            localStorage.removeItem('centuria_token');
            window.location.replace('../dashboard.html');
        },

        // ═══════════════════════════════════════
        // CARGA DINÁMICA DE SECCIONES
        // ═══════════════════════════════════════
        async loadSection(tab) {
            const container = document.getElementById('section-container');
            if (!container) return;
            const urls = {
                usuarios:   'sections/usuarios.html',
                asignaturas: 'sections/asignaturas.html',
                filiales:   'sections/filiales.html',
                cursos:     'sections/catalogos.html',
                reportes:   'sections/reportes.html',
                config:     'sections/config.html',
                vistas:     'sections/vistas.html',
                formularios: 'sections/formularios.html'
            };
            const url = urls[tab];
            if (!url) return;
            this.loading = true;
            this.loadingText = 'Cargando módulo...';
            try {
                const resp = await fetch(url);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                container.innerHTML = await resp.text();
                if (tab === 'usuarios') await this.initUsuarios();
                if (tab === 'asignaturas') await this.cargarAsignaturas();
                if (tab === 'filiales') await this.cargarFiliales();
                if (tab === 'cursos') await this.loadCatalogData();
                if (tab === 'reportes') await this.loadReportData();
                Alpine.initTree(container);
            } catch (err) {
                console.error('Error cargando sección:', err);
                container.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-slate-400">
                    <i class="bi bi-exclamation-triangle text-4xl text-amber-300 mb-3"></i>
                    <p class="text-sm font-bold">Error al cargar</p>
                    <p class="text-xs mt-1">${err.message}</p></div>`;
            } finally { this.loading = false; }
        },

        async switchTab(tab) {
            if (this.activeTab === tab) return;
            this.activeTab = tab;
            await this.loadSection(tab);
        },

        // ═══════════════════════════════════════
        // MÓDULO 1: USUARIOS
        // ═══════════════════════════════════════
        async initUsuarios() {
            await Promise.all([
                this.cargarPendientes(),
                this.cargarUsuarios(),
                this.cargarRolesConfig(),
                this.cargarFiliales(),
                this.cargarAdminsPorFilial(),
                this.cargarSolicitudes(),
                this.cargarCatalogosAdmin(),
                this.cargarRemitente()
            ]);
        },

        // --- Correo remitente de comunicaciones ---
        async cargarRemitente() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'configuracion.php?action=get', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const d = await r.json();
                const c = d.config || {};
                this.cfgMail = { remitente: c.mail_remitente || '', nombre: c.mail_nombre || '' };
            } catch (e) { console.error('Error cargando remitente:', e); }
        },

        async guardarRemitente() {
            if (this.cfgMail.remitente && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.cfgMail.remitente)) {
                alert('El mail remitente no es válido'); return;
            }
            try {
                const pares = [['mail_remitente', this.cfgMail.remitente || ''], ['mail_nombre', this.cfgMail.nombre || 'Instituto Superior Centuria']];
                for (const [clave, valor] of pares) {
                    const fd = new FormData();
                    fd.append('clave', clave);
                    fd.append('valor', valor);
                    await fetch(CenturiaAPI.baseUrl + 'configuracion.php?action=set', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                        body: fd
                    });
                }
                alert('Remitente guardado. Las provisorias saldrán desde: ' + (this.cfgMail.remitente || '(Gmail del sistema)'));
            } catch (e) { alert('Error de conexión'); }
        },

        async probarRemitente() {
            if (!this.cfgMail.remitente) { alert('Primero guarda un mail remitente'); return; }
            if (!confirm('Enviar correo de prueba a ' + this.cfgMail.remitente + '?')) return;
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'configuracion.php?action=test_mail', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const d = await r.json();
                alert(d.mensaje || d.error || 'Listo');
            } catch (e) { alert('Error de conexión'); }
        },

        // --- Catálogos para asignar roles y unir asignaturas (carrera + sección + grado) ---
        async cargarCatalogosAdmin() {
            try {
                const [rc, rs, rg] = await Promise.all([
                    fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=list&tipo=carreras', {
                        headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                    }).then(r => r.json()).catch(() => ({})),
                    fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=list&tipo=secciones', {
                        headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                    }).then(r => r.json()).catch(() => ({})),
                    fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=list&tipo=grados', {
                        headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                    }).then(r => r.json()).catch(() => ({}))
                ]);
                this.catalogosCarreras = rc.carreras || rc.items || [];
                this.catalogosSecciones = rs.secciones || rs.items || [];
                this.catalogosGrados = rg.grados || rg.items || [];
            } catch (e) { console.error('Error cargando catálogos:', e); }
        },

        // Al elegir sección, trae su carrera automáticamente
        alCambiarSeccionRol() {
            if (!this.nuevoRol.carrera && this.nuevoRol.seccion) {
                const s = (this.catalogosSecciones || []).find(x => x.codigo === this.nuevoRol.seccion);
                if (s && s.carrera) this.nuevoRol.carrera = s.carrera;
            }
        },

        // --- Solicitudes de cátedra (docente pide, admin aprueba con carrera+sección) ---
        solicitudes: [],

        async cargarSolicitudes() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'docente.php?action=pending_requests', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.solicitudes = (data.solicitudes || []).map(s => ({
                    ...s,
                    carrera_aprob: s.carrera_sugerida || s.carrera || '',
                    seccion_aprob: s.seccion || ''
                }));
            } catch (e) { console.error('Error cargando solicitudes:', e); this.solicitudes = []; }
        },

        async aprobarSolicitud(s) {
            if (!s.carrera_aprob) { alert('Indica la carrera para aprobar'); return; }
            if (!confirm('Aprobar "' + (s.asignatura_nombre || s.asignatura) + '" a ' + s.docente + ' (' + s.cedula + ') en ' + s.carrera_aprob + (s.seccion_aprob ? ' • ' + s.seccion_aprob : '') + '?')) return;
            try {
                const fd = new FormData();
                fd.append('id', s.id);
                fd.append('carrera', s.carrera_aprob || '');
                fd.append('seccion', s.seccion_aprob || '');
                const r = await fetch(CenturiaAPI.baseUrl + 'docente.php?action=approve_request', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    alert(data.mensaje || 'Aprobada');
                    await this.cargarSolicitudes();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error de conexión'); }
        },

        async rechazarSolicitud(s) {
            if (!confirm('¿Rechazar la solicitud de ' + s.docente + ' (' + (s.asignatura_nombre || s.asignatura) + ')?')) return;
            try {
                const fd = new FormData();
                fd.append('id', s.id);
                const r = await fetch(CenturiaAPI.baseUrl + 'docente.php?action=reject_request', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    await this.cargarSolicitudes();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error de conexión'); }
        },

        async cargarAdminsPorFilial() {
            try {
                const response = await fetch(CenturiaAPI.baseUrl + 'filiales.php?action=admins-by-filial', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await response.json();
                if (!response.ok || data.success === false) {
                    throw new Error(data.error || 'No se pudieron cargar los administradores por filial');
                }
                this.adminsPorFilial = data.admins || [];
            } catch (error) {
                this.adminsPorFilial = [];
                console.error('Error cargando administradores por filial:', error);
            }
        },

        // --- PENDIENTES ---
        async cargarPendientes() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=pendientes', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.pendientes = (data.pendientes || []).map(p => ({ ...p, _rolAsignar: 'alumno' }));
            } catch (e) { console.error('Error cargando pendientes:', e); }
        },

        async registrarPendiente() {
            const f = this.formPendiente;
            if (!f.cedula || !f.nombre || !f.apellido) { alert('Cedula, nombre y apellido requeridos'); return; }
            this.loading = true;
            this.loadingText = 'Registrando...';
            try {
                const fd = new FormData();
                fd.append('cedula', f.cedula);
                fd.append('nombre', f.nombre.toUpperCase());
                fd.append('apellido', f.apellido.toUpperCase());
                fd.append('email', f.email);
                fd.append('telefono', f.telefono);
                fd.append('grado', f.grado);
                fd.append('carrera', f.carrera.toUpperCase());
                fd.append('seccion', f.seccion);
                fd.append('rol', f.rol);
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=registrar_directo', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    this.formPendiente = { cedula: '', nombre: '', apellido: '', email: '', telefono: '', grado: '', carrera: '', seccion: '', rol: 'alumno' };
                    this.showRegistroRapido = false;
                    await this.cargarPendientes();
                    await this.cargarUsuarios();
                } else {
                    alert('Error: ' + (data.error || data.mensaje || 'No se pudo registrar'));
                }
            } catch (e) { console.error(e); alert('Error al registrar.'); }
            finally { this.loading = false; }
        },

        async aprobarPendiente(p) {
            this.loading = true;
            this.loadingText = 'Aprobando usuario...';
            try {
                const fd = new FormData();
                fd.append('id', p.id);
                fd.append('rol', p._rolAsignar || 'alumno');
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=aprobar', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    alert('Aprobado. Pass: ' + (data.password_generado || 'ver consola'));
                    await Promise.all([this.cargarPendientes(), this.cargarUsuarios()]);
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al aprobar.'); }
            finally { this.loading = false; }
        },

        async rechazarPendiente(p) {
            if (!confirm('¿Rechazar registro de ' + p.nombre + '?')) return;
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('id', p.id);
                await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=rechazar', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                await this.cargarPendientes();
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },

        // --- USUARIOS ---
        async cargarUsuarios() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=list', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.usuarios = data.usuarios || [];
                // Recalcular stats para reportes
                const unicas = new Set(this.usuarios.map(u => u.cedula));
                const rolesFlat = [];
                this.usuarios.forEach(u => (u.roles || []).forEach(r => rolesFlat.push(r)));
                this.stats = {
                    totalCedulas: unicas.size,
                    alumnos: rolesFlat.filter(r => r.rol === 'alumno').length,
                    docentes: rolesFlat.filter(r => r.rol === 'docente').length
                };
            } catch (e) { console.error('Error cargando usuarios:', e); }
        },

        // Grupos: sistema (admin/académico), docente, alumno
        get gruposRoles() {
            return {
                sistema: ['admin', 'administrador_plataforma', 'academico', 'academic'],
                docente: ['docente', 'teacher'],
                alumno: ['alumno', 'student']
            };
        },

        // Roles personalizados del catálogo (para asignar)
        get rolesPersonalizados() {
            const base = ['alumno', 'docente', 'academico', 'admin'];
            return (this.rolesConfig || []).filter(r => !base.includes((r.nombre || '').toLowerCase()));
        },

        // Color de insignia por rol (personalizados en gris)
        claseBadgeRol(rol) {
            const n = (rol || '').toLowerCase();
            if (n === 'alumno' || n === 'student') return 'bg-emerald-100 text-emerald-700';
            if (n === 'docente' || n === 'teacher') return 'bg-blue-100 text-blue-700';
            if (n === 'academico' || n === 'academic') return 'bg-purple-100 text-purple-700';
            if (n === 'admin' || n === 'administrador_plataforma') return 'bg-rose-100 text-rose-700';
            return 'bg-slate-200 text-slate-600';
        },

        // Grupo de un rol (personalizados resuelven por base_rol del catálogo)
        grupoDeRol(rolNombre) {
            const n = (rolNombre || '').toLowerCase();
            const g = this.gruposRoles;
            if (g.sistema.includes(n)) return 'sistema';
            if (g.docente.includes(n)) return 'docente';
            if (g.alumno.includes(n)) return 'alumno';
            const cfg = (this.rolesConfig || []).find(r => (r.nombre || '').toLowerCase() === n);
            const b = ((cfg && cfg.base_rol) || '').toLowerCase();
            if (g.sistema.includes(b)) return 'sistema';
            if (g.docente.includes(b)) return 'docente';
            if (g.alumno.includes(b)) return 'alumno';
            return '';
        },

        get filteredUsuarios() {
            let result = this.usuarios;
            if (this.userSearch.trim()) {
                const q = this.userSearch.toLowerCase();
                result = result.filter(u =>
                    (u.cedula || '').includes(q) ||
                    (u.nombre_completo || '').toLowerCase().includes(q)
                );
            }
            if (this.userFilterGrupo) {
                const gr = this.userFilterGrupo;
                result = result.filter(u => (u.roles || []).some(r => this.grupoDeRol(r.rol) === gr));
            }
            if (this.userFilterRol) {
                result = result.filter(u => (u.roles || []).some(r => r.rol === this.userFilterRol));
            }
            if (this.userFilterEstado) {
                result = result.filter(u => u.estado === this.userFilterEstado);
            }
            return result;
        },

        seleccionarUsuario(u) {
            this.selectedUser = u;
            this.formUsuario = {
                firstname: u.firstname || '',
                lastname: u.lastname || '',
                email: u.email || '',
                telefono: u.telefono || '',
                grado: u.grado || '',
                carrera: u.carrera || '',
                seccion: u.seccion || '',
                estado: u.estado || 'activo'
            };
        },

        async guardarUsuario() {
            if (!this.selectedUser) return;
            this.loading = true;
            this.loadingText = 'Guardando...';
            try {
                const fd = new FormData();
                fd.append('id', this.selectedUser.id);
                fd.append('firstname', this.formUsuario.firstname.toUpperCase());
                fd.append('lastname', this.formUsuario.lastname.toUpperCase());
                fd.append('email', this.formUsuario.email);
                fd.append('telefono', this.formUsuario.telefono);
                fd.append('grado', this.formUsuario.grado);
                fd.append('carrera', this.formUsuario.carrera.toUpperCase());
                fd.append('seccion', this.formUsuario.seccion);
                fd.append('estado', this.formUsuario.estado);
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=update', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    await this.cargarUsuarios();
                    // Re-seleccionar usuario actualizado
                    const updated = this.usuarios.find(u => u.id === this.selectedUser.id);
                    if (updated) this.seleccionarUsuario(updated);
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al guardar.'); }
            finally { this.loading = false; }
        },

        // --- RESET PASSWORD: provisoria aleatoria + aviso por mail + cambio obligatorio ---
        async resetPasswordUsuario(usuario) {
            if (!usuario) return;
            if (!confirm('¿Generar provisoria a ' + usuario.nombre_completo + '? Se envía a su mail y deberá cambiarla.')) return;
            this.loading = true;
            this.loadingText = 'Generando provisoria...';
            try {
                const fd = new FormData();
                fd.append('user_id', usuario.id);
                const r = await fetch(CenturiaAPI.baseUrl + 'auth.php?action=reset_password', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (!(data.ok || data.success)) {
                    alert('Error: ' + (data.error || 'No se pudo resetear'));
                    return;
                }
                // Intentar envío por Gmail del sistema si PHP no pudo
                let mailedMsg = data.email_enviado || '';
                if (!data.mailed && typeof gasEnviarProvisoria === 'function' && usuario.email) {
                    try {
                        const g = await gasEnviarProvisoria(
                            usuario.email, usuario.nombre_completo,
                            data.new_password, this.cfgMail.remitente, this.cfgMail.nombre
                        );
                        if (g && g.ok) mailedMsg = 'Enviada por Google a ' + usuario.email;
                    } catch (e) {}
                }
                alert('Provisoria generada: ' + (data.new_password || '?') +
                    '\n' + mailedMsg +
                    '\nEl usuario deberá cambiarla al entrar (seguridad).');
                await this.cargarUsuarios();
            } catch (e) { console.error(e); alert('Error de conexion.'); }
            finally { this.loading = false; }
        },

        // --- MULTI-ROLES ---
        async agregarRol() {
            if (!this.selectedUser) return;
            this.loading = true;
            this.loadingText = 'Asignando rol...';
            try {
                const fd = new FormData();
                fd.append('user_id', this.selectedUser.id);
                fd.append('rol', this.nuevoRol.rol);
                fd.append('carrera', this.nuevoRol.carrera.toUpperCase());
                fd.append('seccion', this.nuevoRol.seccion);
                fd.append('asignatura', this.nuevoRol.asignatura);
                const r = await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=add_role', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    this.nuevoRol = { rol: 'alumno', carrera: '', seccion: '', asignatura: '' };
                    await this.cargarUsuarios();
                    const updated = this.usuarios.find(u => u.id === this.selectedUser.id);
                    if (updated) this.seleccionarUsuario(updated);
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al asignar rol.'); }
            finally { this.loading = false; }
        },

        async quitarRol(r) {
            const miCedula = sessionStorage.getItem('current_cedula') || '';
            const esMio = this.selectedUser && String(this.selectedUser.cedula) === String(miCedula);
            const esAdmin = ['admin', 'administrador_plataforma'].includes(r.rol);
            if (esMio && esAdmin) {
                if (!confirm('OJO: es tu propio rol ADMIN. Si lo quitas pierdes el acceso. ¿Seguir?')) return;
            } else if (!confirm('¿Quitar rol ' + r.rol.toUpperCase() + ' a ' + ((this.selectedUser && this.selectedUser.nombre_completo) || '') + '?')) {
                return;
            }
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('role_id', r.id);
                await fetch(CenturiaAPI.baseUrl + 'usuarios.php?action=remove_role', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                await this.cargarUsuarios();
                const updated = this.usuarios.find(u => u.id === this.selectedUser?.id);
                if (updated) this.seleccionarUsuario(updated);
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },

        // --- ROLES CONFIG ---
        async cargarRolesConfig() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'roles.php?action=list', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.rolesConfig = data.roles || [];
            } catch (e) { console.error('Error cargando roles config:', e); }
        },

        async guardarRol() {
            const isEdit = !!this.editRol;
            this.loading = true;
            this.loadingText = isEdit ? 'Actualizando rol...' : 'Creando rol...';
            try {
                const fd = new FormData();
                fd.append('nombre', this.formRol.nombre);
                fd.append('descripcion', this.formRol.descripcion);
                fd.append('permisos', JSON.stringify(this.formRol.permisos));
                fd.append('color', this.formRol.color);
                fd.append('icono', this.formRol.icono);
                fd.append('base_rol', this.formRol.base_rol || '');
                const action = isEdit ? 'update' : 'create';
                if (isEdit) fd.append('id', this.editRol.id);
                const r = await fetch(CenturiaAPI.baseUrl + 'roles.php?action=' + action, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    this.cancelarEditRol();
                    await this.cargarRolesConfig();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al guardar rol.'); }
            finally { this.loading = false; }
        },

        editarRol(r) {
            this.editRol = r;
            this.formRol = {
                nombre: r.nombre,
                descripcion: r.descripcion || '',
                permisos: [...(r.permisos || [])],
                color: r.color || '#64748b',
                icono: r.icono || 'bi-person',
                base_rol: r.base_rol || ''
            };
            this.showCrearRol = true;
        },

        cancelarEditRol() {
            this.editRol = null;
            this.showCrearRol = false;
            this.formRol = { nombre: '', descripcion: '', permisos: [], color: '#64748b', icono: 'bi-person', base_rol: '' };
        },

        async eliminarRol(r) {
            if (!confirm('¿Desactivar el rol "' + r.nombre + '"?')) return;
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('id', r.id);
                await fetch(CenturiaAPI.baseUrl + 'roles.php?action=delete', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                await this.cargarRolesConfig();
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },

        // ═══════════════════════════════════════
        // MÓDULO: ASIGNATURAS
        // ═══════════════════════════════════════
        asignaturas: [],
        asignaturaSearch: '',
        asignaturaFilterCarrera: '',
        selectedAsignatura: null,
        showAsignaturaForm: false,
        formAsignatura: { nombre: '', codigo: '', carrera: '', grado: '', semestre: 1, modulo: '', carga_horaria: 0, color: '#10b981', icono: 'bi-book' },
        filtroEstadoAsig: 'todas',

        // Filtro: Activa = CON docente asignado · Inactiva = SIN docente
        async cargarAsignaturas() {
            try {
                const f = this.filtroEstadoAsig || 'todas';
                const q = f === 'todas' ? '' : ('&con_docente=' + (f === 'activo' ? 'si' : 'no'));
                const r = await fetch(CenturiaAPI.baseUrl + 'asignaturas.php?action=list&estado=todas' + q, {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.asignaturas = data.asignaturas || data.items || [];
            } catch (e) { console.error('Error cargando asignaturas:', e); }
        },

        get filteredAsignaturas() {
            let result = this.asignaturas;
            if (this.asignaturaSearch.trim()) {
                const q = this.asignaturaSearch.toLowerCase();
                result = result.filter(a =>
                    (a.nombre || '').toLowerCase().includes(q) ||
                    (a.codigo || '').toLowerCase().includes(q)
                );
            }
            if (this.asignaturaFilterCarrera) {
                result = result.filter(a => a.carrera === this.asignaturaFilterCarrera);
            }
            return result;
        },

        seleccionarAsignatura(a) {
            this.selectedAsignatura = a;
            this.formAsignatura = {
                nombre: a.nombre || '',
                codigo: a.codigo || '',
                carrera: a.carrera || '',
                grado: a.grado || '',
                semestre: a.semestre || 1,
                modulo: a.modulo || '',
                carga_horaria: a.carga_horaria || 0,
                color: a.color || '#10b981',
                icono: a.icono || 'bi-book'
            };
        },

        // Editar desde la pestaña (abre el formulario colapsable con los datos)
        editarAsignatura(a) {
            this.seleccionarAsignatura(a);
            this.showAsignaturaForm = true;
        },

        async guardarAsignatura() {
            const f = this.formAsignatura;
            if (!f.nombre || !f.codigo) { alert('Nombre y código requeridos'); return; }
            this.loading = true;
            this.loadingText = this.selectedAsignatura ? 'Actualizando...' : 'Creando...';
            try {
                const fd = new FormData();
                fd.append('nombre', f.nombre);
                fd.append('codigo', f.codigo.toUpperCase());
                fd.append('carrera', f.carrera);
                fd.append('grado', f.grado || '');
                fd.append('semestre', f.semestre);
                fd.append('modulo', f.modulo || '');
                fd.append('carga_horaria', f.carga_horaria);
                fd.append('color', f.color);
                fd.append('icono', f.icono);
                const action = this.selectedAsignatura ? 'update' : 'create';
                if (this.selectedAsignatura) fd.append('id', this.selectedAsignatura.id);
                const r = await fetch(CenturiaAPI.baseUrl + 'asignaturas.php?action=' + action, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    this.cancelarEditAsignatura();
                    await this.cargarAsignaturas();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al guardar.'); }
            finally { this.loading = false; }
        },

        cancelarEditAsignatura() {
            this.selectedAsignatura = null;
            this.showAsignaturaForm = false;
            this.formAsignatura = { nombre: '', codigo: '', carrera: '', grado: '', semestre: 1, modulo: '', carga_horaria: 0, color: '#10b981', icono: 'bi-book' };
        },

        // --- Espejo a Google: misma base en SQLite y Sheets ---
        async subirAsignaturasGoogle() {
            if (!this.asignaturas.length) { alert('No hay asignaturas para subir'); return; }
            if (!confirm('Subir ' + this.asignaturas.length + ' asignaturas a Google (misma base)?')) return;
            this.loading = true;
            let ok = 0, fail = 0;
            for (const a of this.asignaturas) {
                try {
                    const r = await gasUploadSubject(a);
                    if (r && r.ok) ok++; else fail++;
                } catch (e) { fail++; }
                this.loadingText = 'Subiendo ' + (ok + fail) + '/' + this.asignaturas.length + '...';
            }
            this.loading = false;
            alert('Espejo listo: ' + ok + ' subidas' + (fail ? ', ' + fail + ' con error' : '') + '.');
        },

        async eliminarAsignatura(a) {
            if (!confirm('¿Eliminar asignatura "' + a.nombre + '"?')) return;
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('id', a.id);
                await fetch(CenturiaAPI.baseUrl + 'asignaturas.php?action=delete', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                await this.cargarAsignaturas();
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },

        // --- Asignar docente a una asignatura (por cédula) ---
        assignTarget: null,
        assignCedula: '',
        assignFound: null,
        assignCarrera: '',
        assignSeccion: '',
        docentesCache: [],

        abrirAsignar(a) {
            this.assignTarget = a;
            this.assignCedula = '';
            this.assignFound = null;
            this.assignCarrera = a.carrera || '';
            this.assignSeccion = '';
        },

        cerrarAsignar() {
            this.assignTarget = null;
            this.assignCedula = '';
            this.assignFound = null;
            this.assignCarrera = '';
            this.assignSeccion = '';
        },

        async buscarDocenteAsignar() {
            const ced = (this.assignCedula || '').trim().replace(/\./g, '');
            if (!ced) { alert('Ingresa la cédula del docente'); return; }
            this.assignFound = null;
            try {
                if (!this.docentesCache.length) {
                    const r = await fetch(CenturiaAPI.baseUrl + 'teachers.php?action=list', {
                        headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                    });
                    const d = await r.json();
                    this.docentesCache = d.docentes || [];
                }
                let f = this.docentesCache.find(x => String(x.cedula) === ced);
                if (!f) {
                    if (!this.usuarios.length) await this.cargarUsuarios();
                    const u = (this.usuarios || []).find(x => String(x.cedula) === ced);
                    if (u) f = { id: u.id, cedula: u.cedula, nombre_completo: u.nombre_completo };
                }
                if (f) {
                    this.assignFound = f;
                } else {
                    alert('No se encontró la cédula ' + ced);
                }
            } catch (e) { console.error(e); alert('Error al buscar docente'); }
        },

        async confirmarAsignacion() {
            if (!this.assignTarget || !this.assignFound) return;
            if (!confirm('Asignar "' + this.assignTarget.codigo + '" a ' + this.assignFound.nombre_completo + ' (' + this.assignFound.cedula + ')?')) return;
            try {
                const fd = new FormData();
                fd.append('user_id', this.assignFound.id);
                fd.append('asignatura', this.assignTarget.codigo);
                fd.append('carrera', this.assignCarrera || this.assignTarget.carrera || '');
                fd.append('seccion', this.assignSeccion || '');
                const r = await fetch(CenturiaAPI.baseUrl + 'teachers.php?action=assign', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    alert(data.mensaje || 'Asignatura asignada. El docente ya la ve en su panel.');
                    this.cerrarAsignar();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error de conexión'); }
        },

        // ═══════════════════════════════════════
        // MÓDULO: FILIALES
        // ═══════════════════════════════════════
        filiales: [],
        filialSearch: '',
        selectedFilial: null,
        formFilial: { nombre: '', codigo: '', direccion: '' },

        async cargarFiliales() {
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'filiales.php?action=list', {
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() }
                });
                const data = await r.json();
                this.filiales = data.filiales || [];
            } catch (e) { console.error('Error cargando filiales:', e); }
        },

        async crearFilial() {
            const f = this.formFilial;
            if (!f.nombre || !f.codigo) { alert('Nombre y código requeridos'); return; }
            this.loading = true;
            this.loadingText = this.selectedFilial ? 'Actualizando...' : 'Creando...';
            try {
                const fd = new FormData();
                fd.append('nombre', f.nombre);
                fd.append('codigo', f.codigo.toUpperCase());
                fd.append('direccion', f.direccion);
                const action = this.selectedFilial ? 'update' : 'create';
                if (this.selectedFilial) fd.append('id', this.selectedFilial.id);
                const r = await fetch(CenturiaAPI.baseUrl + 'filiales.php?action=' + action, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                const data = await r.json();
                if (data.status === 'Exito' || data.status === 'Éxito') {
                    this.selectedFilial = null;
                    this.formFilial = { nombre: '', codigo: '', direccion: '' };
                    this.showForm = false;
                    await this.cargarFiliales();
                } else {
                    alert('Error: ' + (data.error || data.mensaje));
                }
            } catch (e) { console.error(e); alert('Error al guardar.'); }
            finally { this.loading = false; }
        },

        async eliminarFilial(id) {
            if (!confirm('¿Eliminar esta filial?')) return;
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('id', id);
                await fetch(CenturiaAPI.baseUrl + 'filiales.php?action=delete', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                await this.cargarFiliales();
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },

        async crearFilial() {
            if (!this.nuevaFilial.nombre || !this.nuevaFilial.codigo) {
                alert('Nombre y código requeridos');
                return;
            }
            try {
                const fd = new FormData();
                fd.append('nombre', this.nuevaFilial.nombre);
                fd.append('codigo', this.nuevaFilial.codigo.toUpperCase());
                fd.append('direccion', this.nuevaFilial.direccion);
                await fetch(CenturiaAPI.baseUrl + 'filiales.php?action=create', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + CenturiaAPI.getToken() },
                    body: fd
                });
                this.nuevaFilial = { nombre: '', codigo: '', direccion: '' };
                await this.cargarFiliales();
            } catch (e) { console.error('Error creando filial:', e); }
        },

        // ═══════════════════════════════════════
        // MÓDULO: VISTA PREVIA POR ROL
        // ═══════════════════════════════════════
        abrirVistaPrevia(v) {
            this.viewMode = true;
            this.viewRol = v.id;
            this.viewRolLabel = v.label;
            this.viewRolIcon = v.icon;
            this.viewRolColor = v.color;
            // Construir URL con token de admin para que la pagina objetivo sepa que es una vista previa
            const token = CenturiaAPI.getToken();
            const user = CenturiaAPI.getCurrentUser() || {};
            const sep = v.url.includes('?') ? '&' : '?';
            this.viewRolUrl = v.url + sep + 'view_as=admin&admin_token=' + encodeURIComponent(token) + '&admin_user=' + encodeURIComponent(user.firstname || this.userName);
            this.activeTab = 'vistas';
            this.loadSection('vistas');
        },

        cerrarVistaPrevia() {
            this.viewMode = false;
            this.viewRol = '';
            this.viewRolUrl = '';
        },

        abrirEnNuevaTab(v) {
            const token = CenturiaAPI.getToken();
            const user = CenturiaAPI.getCurrentUser() || {};
            const sep = v.url.includes('?') ? '&' : '?';
            const url = v.url + sep + 'view_as=admin&admin_token=' + encodeURIComponent(token) + '&admin_user=' + encodeURIComponent(user.firstname || this.userName);
            window.open(url, '_blank');
        },

        // ═══════════════════════════════════════
        // MÓDULO 2: CATÁLOGOS CRUD
        // ═══════════════════════════════════════
        get catalogItems() {
            let items = this.catalogData[this.catalogTab] || [];
            if (this.catalogSearch.trim()) {
                const q = this.catalogSearch.toLowerCase();
                items = items.filter(i =>
                    (i.nombre && i.nombre.toLowerCase().includes(q)) ||
                    (i.codigo && i.codigo.toLowerCase().includes(q))
                );
            }
            return items;
        },

        async loadCatalogData() {
            this.loading = true;
            this.loadingText = 'Cargando catalogos...';
            try {
                const r = await fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=list');
                const data = await r.json();
                this.catalogData = {
                    secciones:   data.secciones   || [],
                    carreras:    data.carreras    || [],
                    grados:      data.grados      || [],
                    programas:   data.programas   || [],
                    modalidades: data.modalidades || []
                };
                this.catalogStats.totalSecciones   = this.catalogData.secciones.length;
                this.catalogStats.totalCarreras    = this.catalogData.carreras.length;
                this.catalogStats.totalGrados      = this.catalogData.grados.length;
                this.catalogStats.totalProgramas   = this.catalogData.programas.length;
                this.catalogStats.totalModalidades = this.catalogData.modalidades.length;
            } catch (e) { console.error('Error cargando catalogos:', e); }
            finally { this.loading = false; }
        },

        switchCatalogTab(tab) {
            this.catalogTab = tab;
            this.editItem = null;
            this.showCatalogForm = false;
            this.catalogSearch = '';
            this.form = { codigo: '', nombre: '', carrera: '', grado: '', capacidad: 40, tipo_prog: '' };
        },

        editarItem(item) {
            this.editItem = { ...item, _tipo: this.catalogTab };
            this.form = {
                codigo: item.codigo || '', nombre: item.nombre || '',
                carrera: item.carrera || '', grado: item.grado || '',
                capacidad: item.capacidad || 40, tipo_prog: item.tipo || ''
            };
            this.showCatalogForm = true;
        },

        cancelarEdicion() {
            this.editItem = null;
            this.showCatalogForm = false;
            this.form = { codigo: '', nombre: '', carrera: '', grado: '', capacidad: 40, tipo_prog: '' };
        },

        async guardarCatalogo(tipo) {
            const isEdit = this.editItem && this.editItem._tipo === tipo;
            this.loading = true;
            this.loadingText = isEdit ? 'Actualizando...' : 'Creando...';
            const fd = new FormData();
            fd.append('tipo', tipo);
            if (tipo === 'secciones') {
                fd.append('codigo', this.form.codigo.toUpperCase());
                fd.append('nombre', this.form.nombre);
                // Las secciones no llevan carrera: en edición se conserva la existente sin mostrarla
                fd.append('carrera', isEdit ? (this.editItem.carrera || '') : '');
                fd.append('grado', this.form.grado);
                fd.append('capacidad', this.form.capacidad || 40);
                if (!this.form.codigo) { alert('Codigo requerido'); this.loading = false; return; }
            } else if (tipo === 'carreras') {
                fd.append('nombre', this.form.nombre);
                fd.append('codigo', this.form.codigo.toUpperCase());
                fd.append('grado', this.form.grado);
                if (!this.form.nombre) { alert('Nombre requerido'); this.loading = false; return; }
            } else if (tipo === 'grados') {
                fd.append('nombre', this.form.nombre);
                if (!this.form.nombre) { alert('Nombre requerido'); this.loading = false; return; }
            } else if (tipo === 'programas') {
                fd.append('nombre', this.form.nombre);
                fd.append('tipo_prog', this.form.tipo_prog);
                if (!this.form.nombre) { alert('Nombre requerido'); this.loading = false; return; }
            } else if (tipo === 'modalidades') {
                fd.append('nombre', this.form.nombre);
                if (!this.form.nombre) { alert('Nombre requerido'); this.loading = false; return; }
            }
            const action = isEdit ? 'update' : 'create';
            if (isEdit) fd.append('id', this.editItem.id);
            try {
                const token = CenturiaAPI.getToken();
                const r = await fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=' + action, {
                    method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd
                });
                const data = await r.json();
                if (data.status === 'Éxito') {
                    this.cancelarEdicion();
                    await this.loadCatalogData();
                } else { alert('Error: ' + (data.error || data.mensaje)); }
            } catch (e) { console.error(e); alert('Error al guardar.'); }
            finally { this.loading = false; }
        },

        async eliminarCatalogo(item) {
            const tipo = this.catalogTab;
            if (!confirm('¿Eliminar "' + item.nombre + '" de ' + tipo + '?')) return;
            this.loading = true;
            try {
                const fd = new FormData();
                fd.append('tipo', tipo);
                fd.append('id', item.id);
                const token = CenturiaAPI.getToken();
                const r = await fetch(CenturiaAPI.baseUrl + 'catalogos.php?action=delete', {
                    method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd
                });
                const data = await r.json();
                if (data.status === 'Éxito') {
                    if (this.editItem && this.editItem.id === item.id) this.cancelarEdicion();
                    await this.loadCatalogData();
                } else { alert('Error: ' + (data.error || data.mensaje)); }
            } catch (e) { console.error(e); alert('Error al eliminar.'); }
            finally { this.loading = false; }
        },

        // ═══════════════════════════════════════
        // MÓDULO 3: REPORTES
        // ═══════════════════════════════════════
        async loadReportData() {
            this.calcularRolesPorTipo();
            this.calcularCarrerasTop();
            this.calcularAccesosRecientes();
        },

        calcularRolesPorTipo() {
            const conteo = {};
            this.usuarios.forEach(u => (u.roles || []).forEach(r => {
                conteo[r.rol] = (conteo[r.rol] || 0) + 1;
            }));
            const total = Object.values(conteo).reduce((a, b) => a + b, 0) || 1;
            const colores = { alumno: '#10b981', docente: '#3b82f6', academico: '#8b5cf6', admin: '#f43f5e' };
            this.rolesPorTipo = Object.entries(conteo).map(([tipo, cantidad]) => ({
                tipo, cantidad, porcentaje: Math.round((cantidad / total) * 100),
                color: colores[tipo] || '#94a3b8'
            })).sort((a, b) => b.cantidad - a.cantidad);
        },

        calcularCarrerasTop() {
            const conteo = {};
            this.usuarios.forEach(u => {
                const c = u.carrera || 'Sin carrera';
                conteo[c] = (conteo[c] || 0) + 1;
            });
            const colores = ['#00B140', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
            this.carrerasTop = Object.entries(conteo).map(([nombre, cantidad], i) => ({
                nombre, cantidad, color: colores[i % colores.length]
            })).sort((a, b) => b.cantidad - a.cantidad);
        },

        calcularAccesosRecientes() {
            this.accesosRecientes = this.usuarios.slice(0, 5).map(u => ({
                username: u.cedula,
                firstname: u.firstname || '',
                lastname: u.lastname || ''
            }));
        },

        // ═══════════════════════════════════════
        // MÓDULO 4: CONFIGURACIÓN
        // ═══════════════════════════════════════
    }));
});
