/* Materiales de clase habilitados solo si el curso del alumno está ACTIVO o DESARROLLADO.
 * Uso (en el <head>, después de session-guard.js):
 *   <script src="../js/acceso-curso.js" data-asignatura="TIC"></script>
 * Consulta mis_cursos (hoja Cursos: Activo · Pendiente · Desarrollado). El personal (no alumno) entra sin restricción.
 * Nota: es un control de la interfaz; los archivos de Materiales_Clases son estáticos (GitHub Pages) y no pueden protegerse en el servidor. */
(function () {
    'use strict';
    var tag = document.currentScript;
    var ASIG = String((tag && tag.getAttribute('data-asignatura')) || 'TIC').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var RAIZ = (function () {
        try { return new URL('../', tag.src).href; } catch (e) { return '../'; }
    })();

    function rol() {
        try { if (window.CenturiaSession && CenturiaSession.getRole) return CenturiaSession.getRole() || ''; } catch (e) {}
        try { return sessionStorage.getItem('rol') || ''; } catch (e) { return ''; }
    }
    if (rol() && rol() !== 'alumno') return;   // docentes, académico, admin… sin bloqueo

    // Oculta el contenido hasta saber la respuesta (evita el «parpadeo» de un material que luego se bloquea)
    var css = document.createElement('style');
    css.id = 'cv-acceso-css';
    css.textContent = 'html.cv-acceso-pendiente body > *:not(#cv-acceso-aviso){visibility:hidden!important}' +
        '#cv-acceso-aviso{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:#f4f7f5;font-family:system-ui,Segoe UI,Roboto,sans-serif}' +
        '#cv-acceso-aviso .cv-caja{max-width:460px;width:100%;background:#fff;border:1px solid #d7e3dc;border-radius:16px;padding:28px 24px;text-align:center;box-shadow:0 8px 30px rgba(0,60,30,.10)}' +
        '#cv-acceso-aviso h1{font-size:1.15rem;margin:10px 0 8px;color:#007A33}#cv-acceso-aviso p{font-size:.86rem;color:#475569;margin:0 0 14px;line-height:1.5}' +
        '#cv-acceso-aviso .cv-ic{font-size:2.2rem;color:#d4a843}#cv-acceso-aviso a,#cv-acceso-aviso button{display:inline-block;margin:4px;padding:9px 16px;border-radius:10px;border:1px solid #007A33;background:#007A33;color:#fff;font-weight:700;font-size:.8rem;text-decoration:none;cursor:pointer}' +
        '#cv-acceso-aviso button.cv-sec{background:#fff;color:#007A33}';
    document.head.appendChild(css);
    document.documentElement.classList.add('cv-acceso-pendiente');

    function liberar() { document.documentElement.classList.remove('cv-acceso-pendiente'); var a = document.getElementById('cv-acceso-aviso'); if (a) a.remove(); }

    function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

    function bloquear(titulo, texto, reintentar) {
        var prev = document.getElementById('cv-acceso-aviso'); if (prev) prev.remove();
        var box = el('div'); box.id = 'cv-acceso-aviso'; box.setAttribute('role', 'alert');
        var c = el('div', 'cv-caja');
        var ic = el('div', 'cv-ic'); ic.textContent = '🔒';
        c.appendChild(ic); c.appendChild(el('h1', '', titulo)); c.appendChild(el('p', '', texto));
        var volver = el('a', '', 'Volver a mi panel'); volver.href = RAIZ + 'dashboard.html'; c.appendChild(volver);
        if (reintentar) { var b = el('button', 'cv-sec', 'Reintentar'); b.type = 'button'; b.onclick = function () { verificar(true); }; c.appendChild(b); }
        box.appendChild(c); document.body.appendChild(box);
    }

    function decidir(d) {
        if (!d || d.ok === false) throw new Error((d && d.error) || 'No se pudo verificar tu curso.');
        if (d.alumno === false) { liberar(); return; }
        var mat = (d.materiales || []).map(function (k) { return String(k).toUpperCase().replace(/[^A-Z0-9]/g, ''); });
        if (mat.indexOf(ASIG) >= 0 || mat.indexOf('ASIG' + ASIG) >= 0) { liberar(); return; }
        var c = (d.cursos || []).filter(function (x) {
            var a = x.asignatura || {};
            return [a.codigo, a.uuid, a.id].some(function (k) { var n = String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return n === ASIG || n === 'ASIG' + ASIG; });
        })[0];
        if (c && c.estado === 'pendiente') bloquear('Materiales todavía no habilitados', 'Tu curso de ' + ((c.asignatura && c.asignatura.nombre) || ASIG) + ' figura como Pendiente. Los materiales se habilitan cuando el curso esté Activo (o ya Desarrollado).', false);
        else bloquear('Materiales no habilitados', 'No tienes un curso activo ni desarrollado de esta asignatura' + (d.ficha && d.ficha.carrera ? ' en ' + d.ficha.carrera + (d.ficha.seccion ? ' · ' + d.ficha.seccion : '') : '') + '. Si crees que es un error, consulta con Acceso Académico desde Atención al Alumno.', false);
    }

    function pedir() {
        return Promise.resolve().then(function () { return window.CenturiaAPI.cursos.mios(); });
    }

    function verificar(forzar) {
        var ced = ''; try { ced = sessionStorage.getItem('current_cedula') || ''; } catch (e) {}
        var clave = 'cv_mc_' + ced;
        if (!forzar) {
            try {
                var g = JSON.parse(sessionStorage.getItem(clave) || 'null');
                if (g && Date.now() - g.t < 60000) { decidir(g.d); return; }
            } catch (e) {}
        }
        pedir().then(function (d) {
            try { sessionStorage.setItem(clave, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
            decidir(d);
        }).catch(function (e) {
            bloquear('No pudimos verificar tu curso', 'Revisa tu conexión e inténtalo de nuevo. ' + ((e && e.message) || ''), true);
        });
    }

    function iniciar() {
        if (window.CenturiaAPI && window.CenturiaAPI.cursos) { verificar(false); return; }
        var s = document.createElement('script'); s.src = RAIZ + 'js/api.js?v=19';
        s.onload = function () { verificar(false); };
        s.onerror = function () { bloquear('No pudimos verificar tu curso', 'No se pudo cargar el servicio. Inténtalo de nuevo.', true); };
        document.head.appendChild(s);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
