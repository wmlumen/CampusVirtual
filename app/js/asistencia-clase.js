// asistencia-clase.js (v2026-10-07)
// Botón "Asistencia en Clase Presencial" de Materiales_Clases/Unidad_XX.html:
// la marca se guarda en Firestore ('asistencia') con la hora del servidor, una vez por unidad.
// Reemplaza marcarAsistenciaClase() de cada página, que antes solo guardaba en localStorage.
(function () {
    'use strict';

    function unidadActual() {
        if (typeof UNIDAD_ACTUAL !== 'undefined') return String(UNIDAD_ACTUAL);
        const m = /Unidad_0*(\d+)/i.exec(location.pathname);
        return m ? m[1] : '';
    }

    function asignaturaActual() {
        const s = document.querySelector('script[data-asignatura]');
        return (s && s.dataset.asignatura) || 'TIC';
    }

    function fechaLegible(f) {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f || '');
        return m ? m[3] + '/' + m[2] + '/' + m[1] : (f || '');
    }

    function boton() { return document.getElementById('btn-asis-clase'); }
    function aviso(texto) {
        const el = document.getElementById('estado-guardado');
        if (el) el.textContent = texto;
    }

    function pintarRegistrada(fecha, hora) {
        const b = boton();
        if (!b) return;
        b.disabled = true;
        b.classList.replace('btn-primary', 'btn-success');
        b.textContent = 'Presente registrado' + (fecha ? ' · ' + fechaLegible(fecha) + ' ' + String(hora || '').slice(0, 5) : '');
    }

    function pintarPendiente() {
        const b = boton();
        if (!b) return;
        b.disabled = false;
        b.classList.replace('btn-success', 'btn-primary');
        b.innerHTML = '<i class="bi bi-hand-index-thumb"></i> Poner Presente';
    }

    async function marcar() {
        const b = boton();
        if (!b || !window.CenturiaAPI) return;
        b.disabled = true;
        b.textContent = 'Guardando…';
        const r = await CenturiaAPI.attendance.selfMark(asignaturaActual(), unidadActual())
            .catch(e => ({ ok: false, error: e && e.message }));
        if (r && r.ok) {
            pintarRegistrada(r.fecha, r.hora);
            aviso(r.ya_registrada
                ? 'Tu asistencia a esta unidad ya estaba registrada.'
                : 'Asistencia guardada en el campus el ' + fechaLegible(r.fecha) + ' a las ' + String(r.hora || '').slice(0, 5) + '.');
        } else {
            pintarPendiente();
            aviso('No se pudo guardar la asistencia: ' + ((r && r.error) || 'error de conexión') + ' Volvé a intentarlo.');
        }
    }

    window.marcarAsistenciaClase = marcar;

    // El estado del botón sale de la nube, no del navegador.
    document.addEventListener('DOMContentLoaded', function () {
        if (!boton() || !window.CenturiaAPI) return;
        const b = boton();
        b.disabled = true;
        b.textContent = 'Verificando…';
        CenturiaAPI.attendance.classStatus(asignaturaActual(), unidadActual())
            .then(r => { if (r && r.registrada) pintarRegistrada(r.fecha, r.hora); else pintarPendiente(); })
            .catch(pintarPendiente);
    });
})();
