/**
 * notas-plan.js — Notas por plan de evaluación (v2026-10-11, etapas 2 y 3).
 * Lee el plan publicado por el Constructor (asignaturas/{codigo}.evaluaciones/.reglas), junta las fuentes
 * automáticas (exámenes online, trabajos calificados, asistencia) y las notas guardadas, y calcula con
 * calificaciones.js. Se carga después de api.js y calificaciones.js.
 *
 *   CenturiaPlan.plan(codigo)                       → plan publicado o null (si la asignatura no tiene plan)
 *   CenturiaPlan.alumno(codigo, cedula)             → libreta del alumno (solo lee lo propio)
 *   CenturiaPlan.planilla(codigo, { seccion })      → planilla del docente (todos los alumnos de la asignatura)
 *   CenturiaPlan.guardar(codigo, filas, quien)      → guarda las notas confirmadas en notas/{cedula}__{codigo}__{evaluacion}
 */
(function () {
    'use strict';
    const N = () => window.CenturiaNotas;
    const listo = () => (typeof authListo === 'function' ? authListo() : Promise.resolve());
    const datos = (snap) => snap.docs.map(d => Object.assign({ _id: d.id }, d.data()));
    // Escala en la que se carga cada evaluación en la planilla: su puntaje máximo o, si no tiene, porcentaje.
    const escala = (ev) => Number(ev.puntaje_max) || 100;
    // Lleva una nota { obtenido, maximo } a la escala de la evaluación.
    const enEscala = (ev, n) => (n && n.obtenido != null) ? Math.round(n.obtenido / (n.maximo || escala(ev)) * escala(ev) * 100) / 100 : null;

    async function plan(codigo) {
        await listo();
        const cod = String(codigo || '').toUpperCase();
        if (!cod) return null;
        const d = await getDb().collection('asignaturas').doc(cod).get();
        if (!d.exists) return null;
        const a = d.data();
        if (!Array.isArray(a.evaluaciones) || !a.evaluaciones.length || !a.evaluaciones[0].id) return null;
        return {
            codigo: cod, nombre: a.nombre || cod, carreras: Array.isArray(a.carreras) && a.carreras.length ? a.carreras : (a.carrera ? [a.carrera] : []),
            unidades: a.unidades || [], evaluaciones: a.evaluaciones, reglas: a.reglas || {}, docente_cedula: a.docente_cedula || '',
            sesiones_por_seccion: a.sesiones_por_seccion || {}
        };
    }

    function resolver(p, fuentes) {
        const r = N().notasDesdeFuentes(p, fuentes, p.codigo);
        return { notas: r.notas, fuente: r.fuente, resultado: N().calcular(p, r.notas, fuentes.asistencia_pct) };
    }

    // Libreta: el alumno solo puede leer lo suyo (las reglas filtran por cédula).
    async function alumno(codigo, cedula) {
        const p = await plan(codigo);
        if (!p) return null;
        const db = getDb(), ced = String(cedula);
        const [intentos, trabajos, asistencia, notas] = await Promise.all([
            db.collection('intentos').where('alumno_cedula', '==', ced).get().then(datos).catch(() => []),
            db.collection('trabajos').where('cedula', '==', ced).get().then(datos).catch(() => []),
            db.collection('asistencia').where('cedula', '==', ced).get().then(datos).catch(() => []),
            db.collection('notas').where('cedula', '==', ced).get().then(datos).catch(() => [])
        ]);
        const guardadas = notas.filter(n => String(n.asignatura || '').toUpperCase() === p.codigo && n.evaluacion_id);
        // Clases dictadas en su sección: las registra la planilla del docente al guardar (asignaturas.sesiones_por_seccion);
        // si todavía no hay dato, se usa la cantidad de unidades. La asistencia guardada por el docente manda.
        const mias = asistencia.filter(r => N().esDeAsignatura(r, p));
        const sec = (mias.find(r => r.seccion) || {}).seccion || '';
        const fuentes = { intentos, trabajos, guardadas, asistencia_pct: N().asistenciaPct(mias, p, p.sesiones_por_seccion[String(sec).toUpperCase()] || null) };
        return Object.assign({ plan: p, cedula: ced, asistencia_pct: fuentes.asistencia_pct }, resolver(p, fuentes));
    }

    // Planilla: alumnos de las carreras de la asignatura (fichas) y quienes tienen asistencia en ella.
    async function planilla(codigo, opts) {
        opts = opts || {};
        const p = await plan(codigo);
        if (!p) return null;
        const db = getDb();
        const [usuarios, intentos, trabajos, asistencia, notas] = await Promise.all([
            db.collection('usuarios').where('rol', '==', 'alumno').get().then(datos).catch(() => []),
            db.collection('intentos').get().then(datos).catch(() => []),
            db.collection('trabajos').where('asignatura', '==', p.codigo).get().then(datos).catch(() => []),
            db.collection('asistencia').get().then(datos).catch(() => []),
            db.collection('notas').where('asignatura', '==', p.codigo).get().then(datos).catch(() => [])
        ]);
        const carreras = p.carreras.map(N().carreraClave);
        const asisAsig = asistencia.filter(r => N().esDeAsignatura(r, p));
        const roster = {};
        usuarios.filter(u => carreras.indexOf(N().carreraClave(u.carrera)) >= 0 && String(u.estado || 'activo') === 'activo').forEach(u => {
            roster[u.cedula] = { cedula: String(u.cedula), nombre: ((u.nombre || '') + ' ' + (u.apellido || '')).trim(), seccion: String(u.seccion || '').toUpperCase(), carrera: u.carrera || '' };
        });
        asisAsig.forEach(r => {
            if (!roster[r.cedula]) roster[r.cedula] = { cedula: String(r.cedula), nombre: r.nombre || '', seccion: String(r.seccion || '').toUpperCase(), carrera: r.carrera || '' };
            else if (!roster[r.cedula].seccion && r.seccion) roster[r.cedula].seccion = String(r.seccion).toUpperCase();
        });
        notas.forEach(n => { if (!roster[n.cedula]) roster[n.cedula] = { cedula: String(n.cedula), nombre: n.nombre || '', seccion: String(n.seccion || '').toUpperCase(), carrera: '' }; });
        // Quienes rindieron un examen enlazado al plan (aunque no tengan asistencia ni ficha).
        const examenes = new Set(p.evaluaciones.map(e => e.examen_id).filter(Boolean));
        intentos.filter(i => examenes.has(i.examen_id)).forEach(i => {
            const c = String(i.alumno_cedula);
            if (!roster[c]) roster[c] = { cedula: c, nombre: i.nombre || '', seccion: String(i.seccion || '').toUpperCase(), carrera: i.carrera || '' };
            else { if (!roster[c].seccion && i.seccion) roster[c].seccion = String(i.seccion).toUpperCase(); if (!roster[c].carrera && i.carrera) roster[c].carrera = i.carrera; }
        });
        // Clases dictadas por sección (sesiones distintas con alguna presencia).
        const sesiones = {};
        Object.values(roster).forEach(a => {
            if (sesiones[a.seccion] == null) sesiones[a.seccion] = N().sesionesDictadas(asisAsig.filter(r => String(r.seccion || '').toUpperCase() === a.seccion), p) || null;
        });
        const secciones = Array.from(new Set(Object.values(roster).map(a => a.seccion))).filter(Boolean).sort();
        const filas = Object.values(roster)
            .filter(a => !opts.seccion || a.seccion === String(opts.seccion).toUpperCase())
            .sort((x, y) => x.nombre.localeCompare(y.nombre))
            .map(a => {
                const fuentes = {
                    intentos: intentos.filter(i => String(i.alumno_cedula) === a.cedula),
                    trabajos: trabajos.filter(t => String(t.cedula) === a.cedula),
                    guardadas: notas.filter(n => String(n.cedula) === a.cedula),
                    asistencia_pct: N().asistenciaPct(asisAsig.filter(r => String(r.cedula) === a.cedula), p, sesiones[a.seccion])
                };
                return Object.assign({}, a, { asistencia_pct: fuentes.asistencia_pct, sesiones: sesiones[a.seccion] }, resolver(p, fuentes));
            });
        return { plan: p, filas: filas, secciones: secciones, sesiones: sesiones };
    }

    /**
     * filas: [{ cedula, nombre, seccion, valores: { evalId: número | null }, fuente: { evalId } }]
     * Número → se guarda (queda como nota confirmada). null en una nota que existía → se borra.
     */
    async function guardar(codigo, filas, quien, opts) {
        await listo();
        const p = await plan(codigo);
        if (!p) return { ok: false, error: 'La asignatura no tiene plan de evaluación publicado.' };
        const db = getDb(), ahora = new Date().toISOString();
        const existentes = new Set(datos(await db.collection('notas').where('asignatura', '==', p.codigo).get()).map(n => n._id));
        const ops = [];
        filas.forEach(f => p.evaluaciones.forEach(ev => {
            if (!(ev.id in (f.valores || {}))) return;
            const v = f.valores[ev.id], id = N().idNota(f.cedula, p.codigo, ev.id);
            if (v === null || v === '' || isNaN(Number(v))) { if (existentes.has(id)) ops.push(['del', id]); return; }
            ops.push(['set', id, {
                cedula: String(f.cedula), nombre: f.nombre || '', seccion: f.seccion || '', asignatura: p.codigo,
                evaluacion_id: ev.id, evaluacion: ev.nombre, tipo: ev.tipo, obtenido: Number(v),
                maximo: escala(ev),
                origen: (f.fuente && f.fuente[ev.id]) || 'manual', guardado_por: quien || '', updated_at: ahora
            }]);
        }));
        // Clases dictadas por sección (las usa la libreta del alumno para su % de asistencia).
        if (opts && opts.sesiones) {
            const ses = {};
            Object.entries(opts.sesiones).forEach(([k, v]) => { if (k && v) ses[k] = v; });
            if (Object.keys(ses).length) await db.collection('asignaturas').doc(p.codigo).set({ sesiones_por_seccion: Object.assign({}, p.sesiones_por_seccion, ses) }, { merge: true });
        }
        // Lotes de 400 escrituras (límite de Firestore: 500).
        for (let i = 0; i < ops.length; i += 400) {
            const lote = db.batch();
            ops.slice(i, i + 400).forEach(o => o[0] === 'del' ? lote.delete(db.collection('notas').doc(o[1])) : lote.set(db.collection('notas').doc(o[1]), o[2]));
            await lote.commit();
        }
        return { ok: true, guardadas: ops.filter(o => o[0] === 'set').length, borradas: ops.filter(o => o[0] === 'del').length };
    }

    window.CenturiaPlan = { plan, alumno, planilla, guardar, escala, enEscala };
})();
