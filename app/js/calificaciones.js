/**
 * calificaciones.js — Cálculo único de la nota de una asignatura a partir de su plan de evaluación (v2026-10-11).
 * El plan lo arma el Constructor y se publica en asignaturas/{codigo}.evaluaciones y .reglas.
 * Lo usan la libreta, la planilla del docente y los paneles; también corre en Node (tests).
 *
 * plan.evaluaciones: [{ id, nombre, tipo, origen, unidad, puntaje_max, ponderacion, requisito }]
 *   tipo:    parcial | trabajo_practico | monografia | asistencia | final | recuperatorio
 *   origen:  examen_online | entrega_pdf | asistencia | manual
 *   requisito: true → hay que aprobarla para rendir el examen final (puede pesar 0 %)
 * plan.reglas: { aprobacion_pct (70), asistencia_min_pct (80), escala: [{ desde, nota, texto }] }
 * notas: { [evaluacion_id]: { obtenido, maximo } }   ·   asistenciaPct: número 0-100 o null
 */
(function (raiz) {
    'use strict';

    const TIPOS = {
        parcial: 'Examen parcial', trabajo_practico: 'Trabajo práctico', monografia: 'Monografía',
        asistencia: 'Asistencia / participación', final: 'Examen final', recuperatorio: 'Recuperatorio'
    };
    const ORIGENES = {
        examen_online: 'Examen online', entrega_pdf: 'Entrega de PDF', asistencia: 'Asistencia registrada', manual: 'Carga del docente'
    };
    // Origen por defecto de cada tipo.
    const ORIGEN_DE_TIPO = {
        parcial: 'examen_online', final: 'examen_online', recuperatorio: 'examen_online',
        trabajo_practico: 'entrega_pdf', monografia: 'entrega_pdf', asistencia: 'asistencia'
    };
    // Escala del programa oficial (1 a 5).
    const ESCALA = [
        { desde: 94, nota: 5, texto: 'Sobresaliente' }, { desde: 86, nota: 4, texto: 'Distinguido' },
        { desde: 78, nota: 3, texto: 'Bueno' }, { desde: 70, nota: 2, texto: 'Aprobado' },
        { desde: 0, nota: 1, texto: 'Insuficiente' }
    ];
    const REGLAS = { aprobacion_pct: 70, asistencia_min_pct: 80, escala: ESCALA };

    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
    const red = (n, d) => { const f = Math.pow(10, d == null ? 1 : d); return Math.round(n * f) / f; };

    // Nombres viejos del Constructor («trabajo», «proyecto») se leen como trabajo práctico / monografía.
    function normalizarTipo(t) {
        t = String(t || '').toLowerCase().trim();
        if (t === 'trabajo') return 'trabajo_practico';
        if (t === 'proyecto') return 'monografia';
        return TIPOS[t] ? t : 'parcial';
    }

    function escalaDe(pct, escala) {
        const e = (escala && escala.length ? escala : ESCALA).slice().sort((a, b) => b.desde - a.desde);
        return e.find(x => pct >= x.desde) || e[e.length - 1];
    }

    /**
     * Devuelve { evaluaciones:[{...ev, obtenido, maximo, pct, aporte, aprobada, pendiente}], acumulado_pct,
     *            ponderacion_cargada, ponderacion_total, nota, texto, aprobado, derecho_final, faltan:[motivos], completo }
     * - acumulado_pct: suma de los aportes ya calificados (lo que lleva sumado sobre 100).
     * - nota/texto: escala aplicada al acumulado (definitiva sólo cuando completo === true).
     */
    function calcular(plan, notas, asistenciaPct) {
        plan = plan || {};
        notas = notas || {};
        const reglas = Object.assign({}, REGLAS, plan.reglas || {});
        const evs = (plan.evaluaciones || []).map(function (ev) {
            const tipo = normalizarTipo(ev.tipo);
            const maximo = num(ev.puntaje_max) || null;
            let obtenido = null, max = maximo;
            const n = notas[ev.id];
            if (n && num(n.obtenido) !== null) { obtenido = num(n.obtenido); max = num(n.maximo) || maximo || 100; }
            else if (tipo === 'asistencia' && (ev.origen || ORIGEN_DE_TIPO[tipo]) === 'asistencia' && num(asistenciaPct) !== null) {
                obtenido = num(asistenciaPct); max = 100;
            }
            const pct = obtenido === null ? null : Math.max(0, Math.min(100, obtenido / max * 100));
            const pond = num(ev.ponderacion) || 0;
            return Object.assign({}, ev, {
                tipo: tipo, origen: ev.origen || ORIGEN_DE_TIPO[tipo] || 'manual', ponderacion: pond,
                obtenido: obtenido, maximo: max, pct: pct === null ? null : red(pct),
                aporte: pct === null ? null : red(pct * pond / 100, 2),
                aprobada: pct === null ? null : pct >= reglas.aprobacion_pct,
                pendiente: pct === null
            });
        });
        // Si hay recuperatorio calificado, reemplaza al parcial más bajo (mismo peso).
        const recup = evs.find(e => e.tipo === 'recuperatorio' && !e.pendiente);
        if (recup) {
            const parciales = evs.filter(e => e.tipo === 'parcial' && !e.pendiente).sort((a, b) => a.pct - b.pct);
            if (parciales.length && recup.pct > parciales[0].pct) {
                const p = parciales[0];
                p.reemplazado_por = recup.id; p.pct = recup.pct; p.aporte = red(recup.pct * p.ponderacion / 100, 2); p.aprobada = recup.pct >= reglas.aprobacion_pct;
            }
        }
        const cuentan = evs.filter(e => e.tipo !== 'recuperatorio');
        const ponderacion_total = red(cuentan.reduce((s, e) => s + e.ponderacion, 0), 2);
        const calificadas = cuentan.filter(e => !e.pendiente);
        const acumulado = red(calificadas.reduce((s, e) => s + e.aporte, 0), 2);
        const ponderacion_cargada = red(calificadas.reduce((s, e) => s + e.ponderacion, 0), 2);

        // Derecho a examen final: asistencia mínima + todas las evaluaciones marcadas como requisito aprobadas.
        const faltan = [];
        if (num(asistenciaPct) !== null && num(asistenciaPct) < reglas.asistencia_min_pct)
            faltan.push('Asistencia ' + red(asistenciaPct, 0) + '% (mínimo ' + reglas.asistencia_min_pct + '%)');
        cuentan.filter(e => e.requisito && e.tipo !== 'final').forEach(function (e) {
            if (e.pendiente) faltan.push(e.nombre + ': pendiente');
            else if (!e.aprobada) faltan.push(e.nombre + ': no aprobado (' + e.pct + '%)');
        });
        const esc = escalaDe(acumulado, reglas.escala);
        const completo = calificadas.length === cuentan.length && cuentan.length > 0;
        return {
            evaluaciones: evs, acumulado_pct: acumulado, ponderacion_cargada: ponderacion_cargada, ponderacion_total: ponderacion_total,
            nota: esc.nota, texto: esc.texto, aprobado: completo && acumulado >= reglas.aprobacion_pct,
            derecho_final: faltan.length === 0, faltan: faltan, completo: completo, reglas: reglas
        };
    }

    // Problemas del plan antes de publicar (los muestra el Constructor).
    function validarPlan(plan) {
        const evs = (plan && plan.evaluaciones) || [];
        const errores = [];
        const total = red(evs.filter(e => normalizarTipo(e.tipo) !== 'recuperatorio').reduce((s, e) => s + (num(e.ponderacion) || 0), 0), 2);
        if (!evs.length) errores.push('No hay evaluaciones.');
        if (total !== 100) errores.push('La ponderación suma ' + total + '% (tiene que dar 100%).');
        if (!evs.some(e => normalizarTipo(e.tipo) === 'final')) errores.push('Falta el examen final.');
        evs.forEach(function (e) {
            if ((normalizarTipo(e.tipo) === 'trabajo_practico') && !num(e.unidad)) errores.push(e.nombre + ': indicá la unidad del trabajo práctico.');
        });
        return errores;
    }

    const api = { TIPOS, ORIGENES, ORIGEN_DE_TIPO, ESCALA, REGLAS, normalizarTipo, escalaDe, calcular, validarPlan };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else raiz.CenturiaNotas = api;
})(typeof window !== 'undefined' ? window : this);
