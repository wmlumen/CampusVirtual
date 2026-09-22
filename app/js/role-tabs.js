/**
 * role-tabs.js — Pestañas de roles de una persona (multirrol)
 * Muestra una barra flotante inferior con los roles activos del usuario (ej: Admin | Docente TIC S026 | Docente TIC LV026).
 * Al tocar una pestaña cambia el rol de sesión y navega al panel de ese rol.
 * La lista de roles se persiste en login (sessionStorage.centuria_roles).
 */
(function () {
    function getRoles() {
        try {
            var raw = sessionStorage.getItem('centuria_roles');
            if (!raw) return [];
            var arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return [];
            return arr.filter(function (r) { return r && r.rol && r.estado === 'activo'; });
        } catch (e) { return []; }
    }

    var HOME = {
        alumno: 'dashboard.html',
        docente: 'docente.html',
        admin: 'dashboard-admin.html',
        administrador_plataforma: 'dashboard-admin.html',
        administrador: 'dashboard-admin.html',
        admin_filial: 'dashboard-admin.html',
        academico: 'academic/index.html',
        academic: 'academic/index.html',
        asistencia_estudiante: 'atencion-estudiante.html'
    };

    var COLORES = {
        alumno: ['#10b981', '#0891b2'],
        docente: ['#2563eb', '#1d4ed8'],
        admin: ['#8b5cf6', '#5b21b6'],
        academico: ['#ec4899', '#9f1239'],
        asistencia_estudiante: ['#f59e0b', '#b45309']
    };
    var ICONOS = { alumno: 'bi-mortarboard-fill', docente: 'bi-person-badge-fill', admin: 'bi-gear-fill', academico: 'bi-building', asistencia_estudiante: 'bi-headset' };
    var ETIQ = { alumno: 'Alumno', docente: 'Docente', admin: 'Administrador', academico: 'Académico', asistencia_estudiante: 'Atención' };

    function rootOf(page) {
        var scripts = document.getElementsByTagName('script');
        for (var k = 0; k < scripts.length; k++) {
            var m = (scripts[k].getAttribute('src') || '').match(/^((?:\.\.\/)*)js\/role-tabs\.js/);
            if (m) return m[1] || './';
        }
        var i = location.pathname.indexOf('/app/');
        return i >= 0 ? location.pathname.slice(0, i) + '/app/' : './';
    }

    function currentRol() {
        return String(sessionStorage.getItem('rol') || localStorage.getItem('centuria_rol') || '').toLowerCase();
    }

    function esc(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function build() {
        var roles = getRoles();
        if (roles.length <= 1) return;
        var actual = currentRol();
        var root = rootOf('index.html');
        var html = '<span style="font-size:.62rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.85;margin-right:8px;color:#cbd5e1"><i class="bi bi-person-gear me-1"></i>Roles</span>';
        roles.forEach(function (r) {
            var key = String(r.rol || '').toLowerCase();
            var col = COLORES[key] || ['#64748b', '#334155'];
            var label = ETIQ[key] || key;
            var meta = (r.asignatura ? esc(r.asignatura) + ' · ' : '') + (r.seccion ? 'Secc. ' + esc(r.seccion) : (r.carrera ? esc(r.carrera) : ''));
            var activo = key === actual;
            html += '<button type="button" data-role="' + esc(r.rol) + '" data-carrera="' + esc(r.carrera || '') + '" data-seccion="' + esc(r.seccion || '') + '" data-asignatura="' + esc(r.asignatura || '') + '" style="display:inline-flex;align-items:center;gap:6px;border:1px solid ' + col[0] + ';background:' + (activo ? col[1] : 'rgba(15,23,42,.55)') + ';color:#fff;padding:7px 13px;border-radius:24px;font-family:Montserrat;font-size:.68rem;font-weight:700;cursor:pointer;margin:0 3px;box-shadow:0 2px 10px rgba(0,0,0,.25)"><i class="bi ' + (ICONOS[key] || 'bi-person-fill') + '"></i>' + label + (meta ? '<span style="opacity:.8;font-weight:500">(' + meta + ')</span>' : '') + (activo ? ' <i class="bi bi-arrow-left-circle-fill" style="opacity:.7"></i>' : '') + '</button>';
        });
        var bar = document.createElement('div');
        bar.id = 'role-tabs-bar';
        bar.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;align-items:center;flex-wrap:nowrap;gap:4px;background:rgba(2,6,23,.72);backdrop-filter:blur(10px);padding:8px 12px;border-radius:30px;border:1px solid rgba(148,163,184,.25);box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:94vw;overflow-x:auto;';
        bar.innerHTML = html;
        document.body.appendChild(bar);
        bar.addEventListener('click', function (ev) {
            var b = ev.target.closest('[data-role]');
            if (!b) return;
            sessionStorage.setItem('rol', b.getAttribute('data-role'));
            sessionStorage.setItem('current_carrera', b.getAttribute('data-carrera') || '');
            sessionStorage.setItem('current_seccion', b.getAttribute('data-seccion') || '');
            sessionStorage.setItem('current_asignatura', b.getAttribute('data-asignatura') || '');
            localStorage.setItem('centuria_rol', b.getAttribute('data-role'));
            window.location.href = root + (HOME[String(b.getAttribute('data-role')).toLowerCase()] || 'dashboard.html');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();