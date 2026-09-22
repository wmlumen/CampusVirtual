/* Mensajes al alumno + avance de la ficha (dashboard.html)
 * - Fichas: % de datos completados según los campos visibles del perfil (p-*), con lista de lo que falta.
 * - Mensajes: cumpleaños (fijado el día), mensajes de los roles (msg_mios) y frases de superación al azar.
 * Todo el texto se inserta con textContent (nunca innerHTML) y el módulo nunca rompe el dashboard. */
(function () {
    'use strict';

    var CAMPOS = [
        ['p-telefono', 'Teléfono'], ['p-email', 'Correo'], ['p-fecha-nacimiento', 'Fecha de nacimiento'],
        ['p-lugar-nacimiento', 'Lugar de nacimiento'], ['p-estado-civil', 'Estado civil'], ['p-nacionalidad', 'Nacionalidad'],
        ['p-direccion-departamento', 'Departamento'], ['p-direccion-ciudad', 'Ciudad'], ['p-direccion-barrio', 'Barrio'],
        ['p-direccion-calle', 'Calle y número'], ['p-latitud', 'Ubicación en el mapa'], ['p-contacto-emergencia', 'Contacto de emergencia']
    ];
    var VACIOS = ['', '-', '—', 'no registrado', 'sin datos', 'sin registrar', 'null', 'undefined'];
    var ROTACION_MS = 10000;

    var estado = { pool: [], actual: -1, timer: null, pausado: false, cumple: null, cargado: false };

    function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
    function $(id) { return document.getElementById(id); }
    function esAlumno() { try { return window.CenturiaSession && CenturiaSession.getRole() === 'alumno'; } catch (e) { return false; } }
    function reducido() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

    // ── Cumpleaños: una sola llamada compartida con el aviso flotante ──
    var promesaCumple = null;
    window.cvCumpleMio = function () {
        if (!promesaCumple) promesaCumple = Promise.resolve().then(function () { return CenturiaAPI.cumple.mio(); }).catch(function () { return null; });
        return promesaCumple;
    };

    // ── Avance de la ficha ──
    function calcularFicha() {
        var faltan = [], hechos = 0, total = 0;
        CAMPOS.forEach(function (c) {
            var n = $(c[0]); if (!n) return;
            total++;
            var v = String(n.textContent || '').trim().toLowerCase();
            if (VACIOS.indexOf(v) >= 0) faltan.push(c[1]); else hechos++;
        });
        return { total: total, hechos: hechos, faltan: faltan, pct: total ? Math.round(hechos * 100 / total) : 100 };
    }

    function pintarFicha() {
        var box = $('ficha-avance'); if (!box) return;
        if (!esAlumno()) { box.hidden = true; return; }
        var f = calcularFicha();
        var pendienteMat = !!window.cvMatriculaPendiente;
        if (!f.total || (f.pct >= 100 && !pendienteMat)) { box.hidden = true; return; }
        box.hidden = false;
        box.innerHTML = '';
        var cab = el('div', 'fa-cab');
        cab.appendChild(el('span', 'fa-tit', f.pct >= 100 ? 'Ficha de datos completa' : 'Te falta completar el ' + (100 - f.pct) + '% de tus datos'));
        cab.appendChild(el('span', 'fa-pct', f.pct + '%'));
        box.appendChild(cab);
        var barra = el('div', 'fa-barra'); barra.setAttribute('role', 'progressbar');
        barra.setAttribute('aria-valuemin', '0'); barra.setAttribute('aria-valuemax', '100'); barra.setAttribute('aria-valuenow', String(f.pct));
        var rel = el('div', 'fa-rell'); rel.style.width = f.pct + '%'; barra.appendChild(rel); box.appendChild(barra);
        if (f.faltan.length) box.appendChild(el('div', 'fa-falta', 'Falta: ' + f.faltan.join(', ') + '.'));
        var acc = el('div', 'fa-acc');
        var b = el('button', 'dash-btn dash-btn-primary'); b.type = 'button';
        b.appendChild(el('i', 'bi bi-pencil-square')); b.appendChild(document.createTextNode(' Completar mis datos'));
        b.onclick = function () { if (window.cambiarPestana) cambiarPestana('perfil'); };
        acc.appendChild(b);
        if (pendienteMat) {
            var a = el('a', 'dash-btn'); a.href = 'formulario-matricula.html';
            a.appendChild(el('i', 'bi bi-file-earmark-text')); a.appendChild(document.createTextNode(' Formulario de matrícula'));
            acc.appendChild(a);
        }
        box.appendChild(acc);
    }

    // ── Mensajes ──
    function barajarSuperacion() {
        var f = window.CV_SUPERACION || [];
        return f.length ? f[Math.floor(Math.random() * f.length)] : null;
    }

    function siguienteSuperacion() {
        var f = window.CV_SUPERACION || [];
        if (!f.length) return null;
        var t, intentos = 0, previo = estado.ultimaFrase;
        do { t = f[Math.floor(Math.random() * f.length)]; intentos++; } while (t === previo && f.length > 1 && intentos < 8);
        estado.ultimaFrase = t;
        return { id: 'sup', tono: 'superacion', titulo: 'Para seguir adelante', texto: t, emisor: '', propio: true };
    }

    function tituloTono(t) {
        return { superacion: 'Superación', cumple: 'Cumpleaños', info: 'Información', aviso: 'Aviso', urgente: 'Importante', felicitacion: 'Felicitación' }[t] || 'Mensaje';
    }

    function fmtFecha(f) {
        var m = String(f || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
    }

    function pintarMensaje(m) {
        var card = $('dash-mensajes'); if (!card) return;
        var cuerpo = $('dm-cuerpo'); if (!cuerpo) return;
        card.setAttribute('data-tono', m.tono || 'info');
        cuerpo.innerHTML = '';
        var top = el('div', 'dm-top');
        var ic = el('i', 'bi ' + ({ superacion: 'bi-stars', cumple: 'bi-cake2-fill', info: 'bi-chat-left-text', aviso: 'bi-exclamation-circle', urgente: 'bi-exclamation-triangle-fill', felicitacion: 'bi-balloon-heart-fill' }[m.tono] || 'bi-chat-left-text'));
        top.appendChild(ic);
        top.appendChild(el('span', 'dm-tipo', tituloTono(m.tono)));
        var meta = [];
        if (m.emisor) meta.push('de ' + m.emisor);
        if (m.fecha && fmtFecha(m.fecha)) meta.push(fmtFecha(m.fecha));
        if (meta.length) top.appendChild(el('span', 'dm-meta', meta.join(' · ')));
        cuerpo.appendChild(top);
        if (m.titulo && !m.propio) cuerpo.appendChild(el('div', 'dm-titulo', m.titulo));
        cuerpo.appendChild(el('div', 'dm-texto', m.texto));
        if (m.extra) cuerpo.appendChild(m.extra);
        var acc = el('div', 'dm-acc');
        if (!m.propio && m.id && m.leible) {
            var ok = el('button', 'dm-btn', 'Entendido'); ok.type = 'button';
            ok.onclick = function () { descartar(m); };
            acc.appendChild(ok);
        }
        if (estado.pool.length > 1 || m.propio) {
            var otro = el('button', 'dm-btn dm-btn-suave'); otro.type = 'button';
            otro.appendChild(el('i', 'bi bi-arrow-repeat')); otro.appendChild(document.createTextNode(' Otro mensaje'));
            otro.onclick = function () { avanzar(true); };
            acc.appendChild(otro);
        }
        if (acc.childNodes.length) cuerpo.appendChild(acc);
        card.hidden = false;
    }

    function descartar(m) {
        estado.pool = estado.pool.filter(function (x) { return x !== m; });
        try { CenturiaAPI.mensajes.leer(m.id).catch(function () {}); } catch (e) {}
        estado.actual = -1;
        avanzar(true);
    }

    // Orden: cumpleaños y mensajes de los roles primero (rotan entre sí); las frases de superación se intercalan al azar.
    function avanzar(manual) {
        var reales = estado.pool;
        var candidato;
        if (reales.length && (manual ? true : true)) {
            // alterna: real, superación, real, superación… (si no hay frases, solo reales)
            estado.turno = (estado.turno || 0) + 1;
            var tocaReal = reales.length && (estado.turno % 2 === 1 || !(window.CV_SUPERACION || []).length);
            if (tocaReal) {
                estado.actual = (estado.actual + 1) % reales.length;
                candidato = reales[estado.actual];
            } else candidato = siguienteSuperacion();
        } else candidato = siguienteSuperacion();
        if (!candidato) { var c = $('dash-mensajes'); if (c) c.hidden = true; return; }
        pintarMensaje(candidato);
    }

    function programar() {
        if (estado.timer) clearInterval(estado.timer);
        if (reducido()) return;
        estado.timer = setInterval(function () {
            if (estado.pausado || document.hidden) return;
            avanzar(false);
        }, ROTACION_MS);
    }

    function armarCumple(d) {
        if (!d || !d.ok || !d.cumple) return null;
        var primero = String(d.nombre || '').trim().split(/\s+/)[0] || '';
        var extra = null;
        if (d.beneficios && d.beneficios.length) {
            extra = el('div', 'dm-extra');
            d.beneficios.forEach(function (b) {
                var t = (b.tipo === 'Descuento' && b.porcentaje ? 'Descuento ' + b.porcentaje + '%' : (b.tipo || 'Beneficio')) + (b.detalle ? ' — ' + b.detalle : '');
                var v = fmtFecha(b.vence); if (v) t += ' (válido hasta ' + v + ')';
                extra.appendChild(el('div', '', t));
            });
            extra.appendChild(el('small', '', 'Preséntate en Asistencia al Estudiante para canjearlo.'));
        }
        return {
            id: 'cumple', tono: 'cumple', propio: true,
            texto: '¡Feliz cumpleaños' + (primero ? ', ' + primero : '') + '! ' + (d.edad ? 'Hoy cumples ' + d.edad + ' años. ' : '') + 'Todo el Instituto Superior Centuria te desea un día lleno de alegría y muchos éxitos.',
            extra: extra
        };
    }

    function iniciarMensajes() {
        if (!esAlumno()) { var c = $('dash-mensajes'); if (c) c.hidden = true; return; }
        var card = $('dash-mensajes'); if (!card) return;
        card.addEventListener('mouseenter', function () { estado.pausado = true; });
        card.addEventListener('mouseleave', function () { estado.pausado = false; });
        card.addEventListener('focusin', function () { estado.pausado = true; });
        card.addEventListener('focusout', function () { estado.pausado = false; });

        // 1) Ya con una frase de superación, sin esperar al servidor
        avanzar(false);
        programar();

        // 2) Cumpleaños y mensajes de los roles: se incorporan al llegar
        Promise.all([
            window.cvCumpleMio(),
            Promise.resolve().then(function () { return CenturiaAPI.mensajes.mios(); }).catch(function () { return null; })
        ]).then(function (r) {
            var pool = [];
            var cumple = armarCumple(r[0]);
            if (cumple) pool.push(cumple);
            var lista = (r[1] && r[1].ok !== false && r[1].mensajes) || [];
            lista.forEach(function (m) {
                pool.push({ id: m.id, tono: ['info', 'aviso', 'urgente', 'felicitacion'].indexOf(m.tono) >= 0 ? m.tono : 'info', titulo: m.titulo, texto: m.texto, emisor: m.emisor, fecha: m.fecha, leible: true });
            });
            // urgentes primero, luego cumpleaños, luego el resto
            var peso = { urgente: 0, cumple: 1, aviso: 2, felicitacion: 3, info: 4 };
            pool.sort(function (a, b) { return (peso[a.tono] == null ? 5 : peso[a.tono]) - (peso[b.tono] == null ? 5 : peso[b.tono]); });
            estado.pool = pool; estado.actual = -1; estado.turno = 0;
            estado.cargado = true;
            if (pool.length) { avanzar(true); programar(); }
        });
    }

    window.CvMensajes = { iniciar: iniciarMensajes, actualizarFicha: pintarFicha, calcularFicha: calcularFicha };

    document.addEventListener('DOMContentLoaded', function () {
        // La ficha se pinta cuando el perfil ya tiene datos y cada vez que el alumno edita algo
        var perfil = $('view-tab-perfil');
        if (perfil && window.MutationObserver) {
            var t = null;
            new MutationObserver(function () { clearTimeout(t); t = setTimeout(pintarFicha, 150); })
                .observe(perfil, { subtree: true, childList: true, characterData: true });
        }
        setTimeout(function () { iniciarMensajes(); pintarFicha(); }, 400);
    });
})();