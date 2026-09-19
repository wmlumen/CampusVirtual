/**
 * exam-lock.js — Bloquea el acceso a un examen hasta ingresar el código de acceso.
 * El código lo configura el docente a través del panel docente.
 * Se incluye al inicio del <head> de cada página de examen.
 */
(function () {
    'use strict';

    // Extrae el ID del examen de la URL actual (ej: examen_parcial1.html)
    function getExamId() {
        const filename = location.pathname.split('/').pop().replace('.html', '');
        // Mapeo de archivos a IDs
        const examMap = {
            'examen_parcial1': 'examen_parcial_1',
            'examen_parcial2': 'examen_parcial_2',
            'examen_final_virtual': 'examen_final_virtual',
            'examen_final_escrito': 'examen_final_escrito',
            'examen_virtual': 'examen_virtual',
            'examen_virtual_completo': 'examen_virtual_completo'
        };
        return examMap[filename] || filename;
    }

    var EXAM_ID = getExamId();
    var STORAGE_KEY = 'centuria_exam_unlocked::' + EXAM_ID;
    var ACCESS_CODE = null; // Se cargará desde la API

    function isUnlocked() {
        try {
            return sessionStorage.getItem(STORAGE_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function markUnlocked() {
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch (e) {}
    }

    // Ya desbloqueado en esta pestaña/sesión
    if (isUnlocked()) return;

    // Oculta el contenido de inmediato
    var hideStyle = document.createElement('style');
    hideStyle.id = 'examLockHideStyle';
    hideStyle.textContent = 'html{visibility:hidden !important}';
    (document.head || document.documentElement).appendChild(hideStyle);

    function reveal() {
        var hs = document.getElementById('examLockHideStyle');
        if (hs) hs.remove();
        var ov = document.getElementById('examLockOverlay');
        if (ov) ov.remove();
        markUnlocked();
    }

    function buildOverlay(loadingCode) {
        var overlay = document.createElement('div');
        overlay.id = 'examLockOverlay';
        overlay.style.cssText = [
            'visibility:visible', 'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:rgba(0,20,10,.94)', 'display:flex', 'align-items:center',
            'justify-content:center', 'font-family:Montserrat,Arial,sans-serif', 'padding:16px'
        ].join(';');

        var codeTxt = loadingCode
            ? '<div style="font-size:.8rem;color:#999;margin-bottom:8px">Cargando código...</div>'
            : '<input id="examLockInput" type="text" autocomplete="off" placeholder="Código de acceso" ' +
                'style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:.95rem;text-align:center;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;font-family:Montserrat,Arial,sans-serif">';

        overlay.innerHTML =
            '<div style="background:#fff;border-radius:14px;padding:28px 26px;max-width:360px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.35)">' +
                '<div style="font-size:1.8rem;margin-bottom:8px">&#128274;</div>' +
                '<h2 style="font-size:1.05rem;margin:0 0 6px;color:#1e293b;font-family:Montserrat,Arial,sans-serif">Examen bloqueado</h2>' +
                '<p style="font-size:.8rem;color:#64748b;margin:0 0 16px">Ingresá el código de acceso proporcionado por el docente para comenzar el examen.</p>' +
                codeTxt +
                '<div id="examLockError" style="color:#dc2626;font-size:.72rem;min-height:16px;margin-bottom:6px"></div>' +
                '<button id="examLockBtn" type="button" ' +
                    'style="width:100%;padding:10px;border:none;border-radius:8px;background:#007A33;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;font-family:Montserrat,Arial,sans-serif" ' +
                    (loadingCode ? 'disabled style="opacity:.6"' : '') + '>' +
                    (loadingCode ? 'Cargando...' : 'Desbloquear') +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        return overlay;
    }

    function attachHandlers() {
        var overlay = document.getElementById('examLockOverlay');
        if (!overlay) return;

        var input = overlay.querySelector('#examLockInput');
        var btn = overlay.querySelector('#examLockBtn');
        var err = overlay.querySelector('#examLockError');

        if (!input || !btn) return;

        function tryUnlock() {
            var val = (input.value || '').trim().toUpperCase();
            if (val === ACCESS_CODE) {
                reveal();
            } else {
                err.textContent = 'Código incorrecto. Intentá nuevamente.';
                input.value = '';
                input.focus();
            }
        }

        btn.addEventListener('click', tryUnlock);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') tryUnlock();
        });
        setTimeout(function () { input.focus(); }, 50);
    }

    function loadAccessCode() {
        // Si no hay CenturiaAPI disponible aún, esperar a que cargue
        if (typeof CenturiaAPI === 'undefined' || typeof CenturiaAPI.exams === 'undefined') {
            setTimeout(loadAccessCode, 100);
            return;
        }

        buildOverlay(true); // Mostrar overlay de carga

        CenturiaAPI.exams.getAccessCode(EXAM_ID).then(function (res) {
            if (res.ok && res.codigo) {
                ACCESS_CODE = res.codigo.toUpperCase();
                if (!res.activo) {
                    // Código desactivado por docente — permitir acceso sin código
                    reveal();
                    return;
                }
                // Reemplazar overlay de carga con input
                var ov = document.getElementById('examLockOverlay');
                if (ov) ov.remove();
                buildOverlay(false);
                attachHandlers();
            } else {
                // Sin código configurado — permitir acceso
                reveal();
            }
        }).catch(function (err) {
            console.error('Error cargando código de examen:', err);
            // Si falla, permitir acceso (fallback seguro)
            reveal();
        });
    }

    // Esperar a que el DOM esté listo
    if (document.body) {
        loadAccessCode();
    } else {
        document.addEventListener('DOMContentLoaded', loadAccessCode);
    }
})();
