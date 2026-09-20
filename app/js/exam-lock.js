/**
 * exam-lock.js — Control de acceso a cada examen.
 *
 * Orden de controles (todos en el servidor salvo la interfaz):
 *   1. El ACADÉMICO debe haber aprobado el examen.
 *   2. El alumno entra con su MAIL + CLAVE (enviados por mail cuando cargó su N° de factura y el docente
 *      —o el sistema, si la factura figura pagada— lo habilitó), o con el enlace directo del mail
 *      (?em=...&k=...) que trae la clave ya completada.
 *   3. El servidor valida la ventana horaria (fecha/hora de inicio y cierre) y los intentos (N) que fijó el docente.
 * Sin clave, el alumno puede cargar su N° de factura desde esta misma pantalla para recibir el enlace por mail.
 * Se incluye al inicio del <head> de cada página de examen.
 */
(function () {
    'use strict';

    var FILE_TO_ID = {
        'examen_parcial1': 'examen_parcial_1',
        'examen_parcial2': 'examen_parcial_2',
        'examen_final_virtual': 'examen_final_virtual',
        'examen_final_escrito': 'examen_final_escrito',
        'examen_virtual': 'examen_virtual',
        'examen_virtual_completo': 'examen_virtual_completo'
    };
    var filename = location.pathname.split('/').pop().replace('.html', '');
    var EXAM_ID = FILE_TO_ID[filename] || filename;
    var SESS_KEY = 'centuria_exam_sess::' + EXAM_ID;
    var FONT = 'Montserrat,Arial,sans-serif';

    // ── Estado guardado de la pestaña (sesión de examen abierta) ──
    function loadSess() {
        try { return JSON.parse(sessionStorage.getItem(SESS_KEY) || 'null'); } catch (e) { return null; }
    }
    function saveSess(s) { try { sessionStorage.setItem(SESS_KEY, JSON.stringify(s)); } catch (e) {} }
    function clearSess() { try { sessionStorage.removeItem(SESS_KEY); } catch (e) {} }

    // ── Parámetros del enlace del mail; se borran de la barra de direcciones apenas se leen ──
    var qs = new URLSearchParams(location.search);
    var linkEmail = qs.get('em') || '';
    var linkKey = qs.get('k') || '';
    if (linkEmail || linkKey) {
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }

    // Oculta el contenido hasta validar
    var hideStyle = document.createElement('style');
    hideStyle.id = 'examLockHideStyle';
    hideStyle.textContent = 'html{visibility:hidden !important}';
    (document.head || document.documentElement).appendChild(hideStyle);

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function fmtCfg(fecha, hora) {
        var p = String(fecha || '').split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] + ' ' + hora : '';
    }

    function reveal() {
        var hs = document.getElementById('examLockHideStyle');
        if (hs) hs.remove();
        var ov = document.getElementById('examLockOverlay');
        if (ov) ov.remove();
    }

    function overlay(inner) {
        var ov = document.getElementById('examLockOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'examLockOverlay';
            ov.style.cssText = 'visibility:visible;position:fixed;inset:0;z-index:2147483647;background:rgba(0,20,10,.94);' +
                'display:flex;align-items:center;justify-content:center;font-family:' + FONT + ';padding:16px;overflow:auto';
            document.body.appendChild(ov);
        }
        ov.innerHTML = '<div style="background:#fff;border-radius:14px;padding:26px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.35)">' + inner + '</div>';
        return ov;
    }

    var S = {
        input: 'width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:.9rem;margin-bottom:8px;font-family:' + FONT + ';box-sizing:border-box',
        btn: 'width:100%;padding:10px;border:none;border-radius:8px;background:#007A33;color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;font-family:' + FONT,
        h2: 'font-size:1.05rem;margin:0 0 6px;color:#1e293b;font-family:' + FONT,
        p: 'font-size:.78rem;color:#64748b;margin:0 0 14px;line-height:1.45'
    };

    function showApprovalError() {
        overlay('<div style="font-size:1.8rem;margin-bottom:8px">⛔</div>' +
            '<h2 style="' + S.h2 + '">Examen no disponible</h2>' +
            '<p style="' + S.p + '">Este examen aún no ha sido aprobado por el académico. Esperá a que sea aprobado antes de intentar acceder.</p>' +
            '<button type="button" disabled style="' + S.btn + ';background:#6B7280;cursor:not-allowed">Esperando aprobación...</button>');
    }

    function api() { return window.CenturiaAPI && window.CenturiaAPI.exams; }

    // ── Pantalla de ingreso: mail + clave / cargar factura ──
    var configs = [];

    function showAccess(tab, msg, prefillEmail) {
        var tabBtn = function (id, label) {
            var on = tab === id;
            return '<button type="button" data-tab="' + id + '" style="flex:1;padding:8px;border:none;border-bottom:3px solid ' + (on ? '#007A33' : '#e2e8f0') +
                ';background:none;font-weight:700;font-size:.72rem;color:' + (on ? '#007A33' : '#94a3b8') + ';cursor:pointer;font-family:' + FONT + '">' + label + '</button>';
        };
        var info = configs.length ? configs.map(function (c) {
            return '<div style="font-size:.68rem;color:#334155;background:#f1f5f9;border-radius:8px;padding:6px 10px;margin-bottom:6px;text-align:left">' +
                '<strong>' + esc(c.asignatura) + '</strong><br>📅 ' + esc(fmtCfg(c.fecha_inicio, c.hora_inicio)) + ' → ' + esc(fmtCfg(c.fecha_cierre, c.hora_cierre)) +
                ' · 🔁 ' + esc(c.intentos) + (c.intentos === 1 ? ' intento' : ' intentos') + '</div>';
        }).join('') : '<div style="font-size:.68rem;color:#92400e;background:#fef3c7;border-radius:8px;padding:6px 10px;margin-bottom:6px">El docente todavía no habilitó fecha y hora para este examen.</div>';

        var body;
        if (tab === 'clave') {
            body = '<p style="' + S.p + '">Ingresá el mail y la clave que te enviamos. Si abriste el enlace del mail, la clave ya viene cargada.</p>' +
                '<input id="exEmail" type="email" autocomplete="email" placeholder="Tu mail" value="' + esc(prefillEmail || '') + '" style="' + S.input + '">' +
                '<input id="exClave" type="text" autocomplete="off" placeholder="Clave" style="' + S.input + ';text-align:center;letter-spacing:3px;text-transform:uppercase">';
        } else {
            var user = (window.CenturiaAPI && window.CenturiaAPI.getCurrentUser && window.CenturiaAPI.getCurrentUser()) || {};
            var ced = user.cedula || user.username || '';
            body = info +
                '<p style="' + S.p + '">Cargá el N° de tu factura. Si figura como pagada, te enviamos por mail el enlace y la clave del examen; si no, el docente lo revisa.</p>' +
                (ced ? '' : '<input id="exCedula" type="text" inputmode="numeric" placeholder="Tu cédula" style="' + S.input + '">') +
                (configs.length > 1 ? '<select id="exAsig" style="' + S.input + '">' + configs.map(function (c) { return '<option value="' + esc(c.asignatura) + '">' + esc(c.asignatura) + '</option>'; }).join('') + '</select>' : '') +
                '<input id="exFactura" type="text" autocomplete="off" placeholder="N° de factura (ej: 001-001-0000123)" style="' + S.input + '">';
        }
        overlay('<div style="font-size:1.8rem;margin-bottom:4px">&#128274;</div><h2 style="' + S.h2 + '">Examen protegido</h2>' +
            '<div style="display:flex;margin-bottom:14px">' + tabBtn('clave', 'Tengo mi clave') + tabBtn('factura', 'Cargar factura') + '</div>' +
            (tab === 'clave' ? info : '') + body +
            '<div id="examLockMsg" style="font-size:.72rem;min-height:16px;margin-bottom:8px;color:' + (msg && msg.ok ? '#065f46' : '#dc2626') + '">' + esc(msg ? msg.text : '') + '</div>' +
            '<button id="examLockBtn" type="button" style="' + S.btn + '">' + (tab === 'clave' ? 'Ingresar al examen' : 'Enviarme el enlace por mail') + '</button>');

        var ov = document.getElementById('examLockOverlay');
        ov.querySelectorAll('[data-tab]').forEach(function (b) {
            b.addEventListener('click', function () { showAccess(b.getAttribute('data-tab')); });
        });
        var btn = ov.querySelector('#examLockBtn');
        var setMsg = function (t, ok) {
            var m = ov.querySelector('#examLockMsg');
            m.style.color = ok ? '#065f46' : '#dc2626'; m.textContent = t;
        };
        var busy = function (on) { btn.disabled = on; btn.style.opacity = on ? '.6' : '1'; };

        if (tab === 'clave') {
            var go = function () {
                var em = ov.querySelector('#exEmail').value, ck = ov.querySelector('#exClave').value;
                busy(true); setMsg('Verificando...', true);
                validate(em, ck, '').then(function (r) { if (r) { busy(false); setMsg(r, false); } });
            };
            btn.addEventListener('click', go);
            ov.querySelector('#exClave').addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
            setTimeout(function () { var f = ov.querySelector(prefillEmail ? '#exClave' : '#exEmail'); if (f) f.focus(); }, 50);
        } else {
            btn.addEventListener('click', function () {
                var user = (window.CenturiaAPI.getCurrentUser && window.CenturiaAPI.getCurrentUser()) || {};
                var ced = user.cedula || user.username || (ov.querySelector('#exCedula') || {}).value || '';
                var asig = configs.length === 1 ? configs[0].asignatura : ((ov.querySelector('#exAsig') || {}).value || '');
                var fac = ov.querySelector('#exFactura').value;
                if (!configs.length) { setMsg('El docente todavía no habilitó este examen.', false); return; }
                busy(true); setMsg('Enviando...', true);
                api().requestExamAccess({ cedula: ced, examen_id: EXAM_ID, asignatura: asig, factura: fac }).then(function (r) {
                    busy(false);
                    if (r && r.ok) setMsg(r.mensaje, true);
                    else setMsg((r && (r.error || r.mensaje)) || 'No se pudo procesar la solicitud.', false);
                }).catch(function () { busy(false); setMsg('Error de conexión. Probá de nuevo.', false); });
            });
        }
    }

    // Devuelve una promesa con un mensaje de error (o undefined si entró)
    function validate(email, clave, sesionId) {
        return api().validateExamAccess({ examen_id: EXAM_ID, email: email, clave: clave, sesion_id: sesionId || '' }).then(function (r) {
            if (r && r.ok) {
                saveSess({ email: String(email).trim(), clave: String(clave).trim(), sesion_id: r.sesion_id });
                reveal();
                showBadge(r);
                return undefined;
            }
            clearSess();
            return (r && (r.mensaje || r.error)) || 'No se pudo validar el acceso.';
        }).catch(function () { return 'Error de conexión. Probá de nuevo.'; });
    }

    // Etiqueta con intento y cuenta regresiva hasta el cierre
    function showBadge(r) {
        var b = document.createElement('div');
        b.style.cssText = 'position:fixed;top:8px;right:8px;z-index:2147483000;background:#007A33;color:#fff;font:700 11px/1 ' + FONT +
            ';padding:7px 11px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.25)';
        document.body.appendChild(b);
        function tick() {
            var left = Math.max(0, r.cierre_ms - Date.now());
            var m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
            b.textContent = 'Intento ' + r.intento + '/' + r.intentos_max + ' · ' + (left ? 'cierra en ' + (m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ':' + ('0' + s).slice(-2)) : 'ventana cerrada');
            if (!left) b.style.background = '#dc2626';
        }
        tick();
        setInterval(tick, 1000);
    }

    function start() {
        if (!api()) { setTimeout(start, 100); return; }

        // 1) Aprobación académica
        api().getExamApprovalStatus(EXAM_ID).then(function (res) {
            if (!res || !res.ok || !res.aprobado) { showApprovalError(); return; }

            // 2) Sesión ya abierta en esta pestaña (recarga) → se revalida en el servidor sin gastar otro intento
            var sess = loadSess();
            if (sess && sess.email && sess.clave) {
                validate(sess.email, sess.clave, sess.sesion_id).then(function (err) { if (err) begin(err, sess.email); });
                return;
            }
            // 3) Enlace directo del mail (clave incluida)
            if (linkEmail && linkKey) {
                validate(linkEmail, linkKey, '').then(function (err) { if (err) begin(err, linkEmail); });
                return;
            }
            begin('', linkEmail);
        }).catch(function () { showApprovalError(); });
    }

    // Carga la ventana/intentos vigentes y muestra la pantalla de ingreso
    function begin(errText, email) {
        var open = function () { showAccess('clave', errText ? { ok: false, text: errText } : null, email); };
        overlay('<p style="' + S.p + '">Cargando...</p>');
        api().getPublicExamConfig(EXAM_ID).then(function (r) {
            configs = (r && r.configs) || [];
            open();
        }).catch(function () { open(); });
    }

    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();
