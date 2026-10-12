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
            if (!String(e.nombre || '').trim()) errores.push('Hay una evaluación sin nombre.');
            if (normalizarTipo(e.tipo) === 'recuperatorio' && num(e.ponderacion)) errores.push(e.nombre + ': el recuperatorio no lleva ponderación (reemplaza al parcial más bajo).');
        });
        return errores;
    }

    // ── Etapa 3: notas automáticas a partir de sus fuentes ──────────────────────────────
    const PRESENTE = ['presente', 'present', 'justificado', 'tardanza', 'late'];
    const sinTilde = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

    // Clave de la sesión de clase de un registro de asistencia (por fecha o, en el autorregistro, por unidad).
    function sesionDe(r) {
        if (r.fecha) return 'F' + String(r.fecha).slice(0, 10);
        if (r.unidad != null && r.unidad !== '') return 'U' + String(r.unidad);
        const ts = r.timestamp || r.created_at || '';
        return ts ? 'F' + String(ts).slice(0, 10) : '';
    }
    // ¿El registro es de esta asignatura? Acepta el código o el nombre (los importados traen el nombre o vacío).
    function esDeAsignatura(r, asig) {
        const a = sinTilde(r.asignatura);
        return !!a && (a === sinTilde(asig.codigo) || a === sinTilde(asig.nombre));
    }
    /**
     * % de asistencia: sesiones con presencia del alumno / sesiones dictadas.
     * sesionesDictadas: número (calculado por el docente sobre toda la sección) o null → se usa la cantidad de unidades del plan.
     */
    function asistenciaPct(registros, asig, sesionesDictadas) {
        const mias = new Set((registros || []).filter(r => esDeAsignatura(r, asig) && PRESENTE.indexOf(String(r.estado || r.status || '').toLowerCase()) >= 0).map(sesionDe).filter(Boolean));
        const total = num(sesionesDictadas) || ((asig.unidades || []).length) || null;
        if (!total) return null;
        return red(Math.min(100, mias.size / total * 100), 0);
    }
    // Clases dictadas en una sección: sesiones con al menos 2 alumnos presentes
    // (un aviso de ausencia aislado o una prueba de una sola persona no es una clase).
    function sesionesDictadas(registrosSeccion, asig) {
        const n = {};
        (registrosSeccion || []).filter(r => esDeAsignatura(r, asig) && PRESENTE.indexOf(String(r.estado || r.status || '').toLowerCase()) >= 0)
            .forEach(r => { const s = sesionDe(r); if (s) (n[s] = n[s] || new Set()).add(String(r.cedula)); });
        return Object.values(n).filter(c => c.size >= 2).length;
    }

    /**
     * Asistencia contra las clases DECLARADAS por el docente (colección clases).
     * clases: [{ fecha:'aaaa-mm-dd', secciones:[...], modalidad, tipo:'clase'|'examen', examen_id, estado }]
     * Cuentan las clases dictadas de la sección del alumno; está presente si tiene una marca «presente» ese día
     * (presencial o virtual) o, si la clase es un examen, si rindió ese examen (tiene intentos).
     * Devuelve { pct, presentes, total, detalle:[{ fecha, modalidad, tipo, presente, por }] } o null si no hay clases.
     */
    function asistenciaPorClases(registros, intentos, clases, seccion, asig) {
        const sec = String(seccion || '').toUpperCase();
        const dictadas = (clases || []).filter(c => c.estado !== 'suspendida' && (!sec || !(c.secciones || []).length || (c.secciones || []).map(s => String(s).toUpperCase()).indexOf(sec) >= 0))
            .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
        if (!dictadas.length) return null;
        const diasPresente = new Set((registros || []).filter(r => esDeAsignatura(r, asig) && PRESENTE.indexOf(String(r.estado || r.status || '').toLowerCase()) >= 0)
            .map(r => String(r.fecha || r.timestamp || r.created_at || '').slice(0, 10)).filter(Boolean));
        const rindio = new Set((intentos || []).filter(i => Array.isArray(i.intentos) && i.intentos.length).map(i => i.examen_id));
        const detalle = dictadas.map(c => {
            const porExamen = c.tipo === 'examen' && c.examen_id && rindio.has(c.examen_id);
            const porMarca = diasPresente.has(String(c.fecha).slice(0, 10));
            return { fecha: c.fecha, modalidad: c.modalidad || '', tipo: c.tipo || 'clase', presente: porMarca || porExamen, por: porMarca ? 'asistencia' : (porExamen ? 'examen' : '') };
        });
        const presentes = detalle.filter(d => d.presente).length;
        return { pct: red(presentes / dictadas.length * 100, 0), presentes: presentes, total: dictadas.length, detalle: detalle };
    }

    /**
     * Notas de un alumno para cada evaluación del plan, tomadas de sus fuentes.
     * fuentes: { intentos:[docs intentos], trabajos:[docs trabajos], guardadas:[docs notas], asistencia_pct }
     * Prioridad: nota guardada por el docente (planilla) > fuente automática.
     * Devuelve { notas: {evalId:{obtenido,maximo}}, fuente: {evalId:'guardada'|'examen'|'trabajo'|'asistencia'} }
     */
    function notasDesdeFuentes(plan, fuentes, codigo) {
        fuentes = fuentes || {};
        const notas = {}, fuente = {};
        const guardadas = {};
        (fuentes.guardadas || []).forEach(g => { if (g && g.evaluacion_id) guardadas[g.evaluacion_id] = g; });
        ((plan && plan.evaluaciones) || []).forEach(function (ev) {
            const g = guardadas[ev.id];
            if (g && num(g.obtenido) !== null) {
                notas[ev.id] = { obtenido: num(g.obtenido), maximo: num(g.maximo) || num(ev.puntaje_max) || 100 };
                fuente[ev.id] = 'guardada';
                return;
            }
            const origen = ev.origen || ORIGEN_DE_TIPO[normalizarTipo(ev.tipo)] || 'manual';
            if (origen === 'examen_online' && ev.examen_id) {
                const doc = (fuentes.intentos || []).find(i => i.examen_id === ev.examen_id);
                const intentos = (doc && Array.isArray(doc.intentos)) ? doc.intentos : [];
                // Mejor intento por porcentaje; se lleva a la escala de la evaluación.
                const mejor = intentos.map(i => (num(i.pct) !== null ? num(i.pct) : (num(i.total) ? num(i.puntaje) / num(i.total) * 100 : null)))
                    .filter(p => p !== null).sort((a, b) => b - a)[0];
                if (mejor != null) {
                    const max = num(ev.puntaje_max) || 100;
                    notas[ev.id] = { obtenido: red(mejor * max / 100, 2), maximo: max };
                    fuente[ev.id] = 'examen';
                }
            } else if (origen === 'entrega_pdf') {
                const u = num(ev.unidad) || 0;
                const t = (fuentes.trabajos || []).find(x => sinTilde(x.asignatura) === sinTilde(codigo) && Number(x.unidad) === u && x.estado === 'calificado');
                if (t && num(t.calificacion) !== null) {
                    notas[ev.id] = { obtenido: num(t.calificacion), maximo: num(t.puntaje_max) || 10 };
                    fuente[ev.id] = 'trabajo';
                }
            } else if (origen === 'asistencia' && num(fuentes.asistencia_pct) !== null) {
                notas[ev.id] = { obtenido: num(fuentes.asistencia_pct), maximo: 100 };
                fuente[ev.id] = 'asistencia';
            }
        });
        return { notas: notas, fuente: fuente };
    }

    // Clave de carrera para comparar: la misma carrera llega escrita de muchas formas
    // («Administración de Empresa», «Licenciatura en Administración de Empresas», «ADMINISTRACION DE EMPRESAS»…).
    function carreraClave(s) {
        const t = sinTilde(s);
        if (!t) return '';
        if (t.includes('MAESTRIA') || t.includes('MASTER') || t.includes('MBA')) return 'MAESTRIA: ' + t.replace(/^(MAESTRIA|MASTER|MBA)\s+(EN\s+)?/, '');
        if (t.includes('DOCTORADO') || t.includes('PHD')) return 'DOCTORADO: ' + t.replace(/^(DOCTORADO|PHD)\s+(EN\s+)?/, '');
        if (t.includes('ESPECIALIZACION') || t.includes('DIPLOMADO')) return 'ESPECIALIZACION: ' + t.replace(/^(ESPECIALIZACION|DIPLOMADO)\s+(EN\s+)?/, '');
        if (t.includes('ADUANER')) return 'ADUANERA';
        if (t.includes('GESTION PUBLICA') || t.includes('GESTION Y POLITICAS') || /GESTION\s*$/.test(t)) return 'GESTION PUBLICA';
        if (t.includes('EMPRESA')) return 'ADMINISTRACION DE EMPRESAS';
        if (t.includes('COMERCIAL') && !t.includes('INTERNACIONAL')) return 'INGENIERIA COMERCIAL';
        if (t.includes('CONTAB') || t.includes('CONTABLES')) return 'CONTABILIDAD';
        return t.replace(/^(LICENCIATURA|LIC\.?)\s+EN\s+/, '');
    }

    // ID del documento de una nota: una por alumno, asignatura y evaluación del plan.
    const idNota = (cedula, codigo, evalId) => [cedula, String(codigo).toUpperCase(), evalId].join('__');

    const api = { TIPOS, ORIGENES, ORIGEN_DE_TIPO, ESCALA, REGLAS, normalizarTipo, escalaDe, calcular, validarPlan,
        sesionDe, esDeAsignatura, asistenciaPct, sesionesDictadas, asistenciaPorClases, notasDesdeFuentes, idNota, sinTilde, carreraClave };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else raiz.CenturiaNotas = api;
})(typeof window !== 'undefined' ? window : this);
