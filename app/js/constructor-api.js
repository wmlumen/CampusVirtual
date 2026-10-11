/**
 * constructor-api.js — Backend del Constructor de Asignaturas sobre Firestore (v2026-10-11).
 * Antes estas acciones vivían en Google Apps Script y al pasar a Firebase quedaron sin implementar.
 * Se carga después de api.js (usa getDb, ensureAnonAuth, cvCargarFicha) y define CenturiaAPI.constructor.submit().
 *
 * Colecciones (planas, cada documento lleva SubjectID para poder borrar/editar por ID):
 *   constructor_asignaturas  borrador + programa (campo Program) + flujo (Estado, Version)
 *   constructor_unidades     constructor_bloques     constructor_actividades
 *   constructor_evaluaciones constructor_preguntas   constructor_revisiones
 * Publicar copia los datos generales a asignaturas/{Codigo}: así queda lista para asignar a un docente.
 * El mismo modelo lo usa tools/cargar-asignatura.js.
 */
(function () {
    'use strict';
    const C = {
        asig: 'constructor_asignaturas', unid: 'constructor_unidades', bloq: 'constructor_bloques',
        acts: 'constructor_actividades', evals: 'constructor_evaluaciones', preg: 'constructor_preguntas',
        rev: 'constructor_revisiones'
    };
    const ROLES_PUBLICAN = ['admin', 'administrador_plataforma', 'administracion_general', 'admin_general', 'administracion'];
    const ROLES_REVISAN = ROLES_PUBLICAN.concat(['academico', 'academic']);

    const ahora = () => new Date().toISOString();
    const nuevoId = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
    const txt = (v) => (v == null ? '' : String(v));
    const filas = (snap) => snap.docs.map(d => Object.assign({ ID: d.id }, d.data()));
    const porOrden = (a, b) => num(a.Orden) - num(b.Orden);
    // «Ingeniería Comercial / Contabilidad» → ['Ingeniería Comercial', 'Contabilidad']
    const listaCarreras = (s) => txt(s).split(/\s*[\/,;]\s*/).map(x => x.trim()).filter(Boolean);

    // Rol de quien está usando el Constructor, leído de su ficha (no de sessionStorage).
    async function miRol(db) {
        const u = await ensureAnonAuth();
        if (!u) throw new Error('Tu sesión expiró. Volvé a ingresar.');
        const ced = String(u.email || '').split('@')[0];
        const f = await cvCargarFicha(db, u, ced).catch(() => null);
        const d = f ? f.data() : {};
        return { rol: String(d.rol || '').toLowerCase(), cedula: ced, estado: String(d.estado || 'activo') };
    }

    async function borrarDonde(db, col, campo, valor) {
        const s = await db.collection(col).where(campo, '==', valor).get();
        await Promise.all(s.docs.map(d => d.ref.delete()));
        return s.size;
    }

    async function leerTodo(db, id) {
        const d = await db.collection(C.asig).doc(id).get();
        if (!d.exists) return { ok: false, error: 'No existe la asignatura ' + id + '.' };
        const draft = Object.assign({ ID: d.id }, d.data());
        const [u, b, a, e, r] = await Promise.all([C.unid, C.bloq, C.acts, C.evals, C.rev]
            .map(col => db.collection(col).where('SubjectID', '==', id).get()));
        const bloques = filas(b);
        const units = filas(u).sort(porOrden).map(x => Object.assign(x, { blocks: bloques.filter(k => k.UnitID === x.ID).sort(porOrden) }));
        const todo = {
            ok: true, draft: draft, program: draft.Program || {}, units: units,
            activities: filas(a), evaluations: filas(e),
            reviews: filas(r).sort((x, y) => txt(x.CreatedAt).localeCompare(txt(y.CreatedAt)))
        };
        todo.plan = planDe(todo);
        todo.problemas = window.CenturiaNotas ? CenturiaNotas.validarPlan(todo.plan) : [];
        return todo;
    }

    async function cambiarEstado(db, id, aEstado, data, quien) {
        const ref = db.collection(C.asig).doc(id);
        const d = await ref.get();
        if (!d.exists) return { ok: false, error: 'No existe la asignatura.' };
        const de = d.data().Estado || 'borrador';
        await ref.update({ Estado: aEstado, UpdatedAt: ahora() });
        await db.collection(C.rev).doc(nuevoId('REV')).set({
            SubjectID: id, DeEstado: de, AEstado: aEstado, PorRol: quien.rol, PorCedula: quien.cedula,
            Comentario: txt(data.comentario), CreatedAt: ahora()
        });
        return { ok: true, estado: aEstado };
    }

    // Plan de evaluación en el formato que usa calificaciones.js (el que se publica en asignaturas/{Codigo}).
    // El orden es: parciales, trabajos y monografía por unidad, asistencia, final, recuperatorio.
    function planDe(todo) {
        const N = window.CenturiaNotas;
        const orden = ['parcial', 'trabajo_practico', 'monografia', 'asistencia', 'final', 'recuperatorio'];
        const evaluaciones = todo.evaluations.map(e => {
            const tipo = N ? N.normalizarTipo(e.Tipo) : txt(e.Tipo);
            return {
                id: e.ID, nombre: txt(e.Nombre), tipo: tipo, origen: txt(e.Origen) || (N && N.ORIGEN_DE_TIPO[tipo]) || 'manual',
                unidad: num(e.Unidad) || null, puntaje_max: num(e.PuntajeMax) || null, ponderacion: num(e.Ponderacion),
                requisito: !!e.Requisito, fecha_apertura: txt(e.FechaApertura), fecha_cierre: txt(e.FechaCierre)
            };
        }).sort((a, b) => (orden.indexOf(a.tipo) - orden.indexOf(b.tipo)) || ((a.unidad || 0) - (b.unidad || 0)) || a.nombre.localeCompare(b.nombre));
        const R = todo.draft.Reglas || {};
        return { evaluaciones: evaluaciones, reglas: { aprobacion_pct: num(R.aprobacion_pct) || 70, asistencia_min_pct: R.asistencia_min_pct == null ? 80 : num(R.asistencia_min_pct) } };
    }

    // Publicar: copia a asignaturas/{Codigo}. Conserva estado y docente si la asignatura ya existía;
    // si es nueva queda «inactivo» hasta que Administración la active y se asigne un docente.
    async function publicar(db, id, data, quien) {
        if (ROLES_PUBLICAN.indexOf(quien.rol) < 0) return { ok: false, error: 'Solo Administración puede publicar.' };
        const todo = await leerTodo(db, id);
        if (!todo.ok) return todo;
        const dr = todo.draft;
        if (['aprobado', 'publicado'].indexOf(dr.Estado) < 0) return { ok: false, error: 'Primero tiene que estar aprobada.' };
        const codigo = txt(dr.Codigo).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!codigo) return { ok: false, error: 'Falta el código de la asignatura.' };
        const plan = planDe(todo);
        const errores = window.CenturiaNotas ? CenturiaNotas.validarPlan(plan) : [];
        if (errores.length) return { ok: false, error: 'El plan de evaluación tiene problemas: ' + errores.join(' ') };
        const ref = db.collection('asignaturas').doc(codigo);
        const prev = await ref.get();
        const p = prev.exists ? prev.data() : {};
        const carreras = Array.isArray(dr.Carreras) && dr.Carreras.length ? dr.Carreras : listaCarreras(dr.Carrera);
        await ref.set({
            codigo: codigo, nombre: txt(dr.Nombre), carrera: carreras[0] || '', carreras: carreras,
            grado: txt(dr.Grado), curso: txt(dr.Curso), semestre: txt(dr.Semestre), carga_horaria: num(dr.CargaHoraria),
            programa_id: id, programa_version: num(dr.Version) || 1,
            unidades: todo.units.map(u => ({ numero: num(u.Numero), titulo: txt(u.Titulo) })),
            evaluaciones: plan.evaluaciones, reglas: plan.reglas,
            estado: p.estado || 'inactivo', docente_cedula: p.docente_cedula || '',
            icono: p.icono || 'bi-journal-text', color: p.color || '#007A33', modulo: p.modulo || '',
            publicado_por: quien.cedula, updated_at: ahora()
        }, { merge: true });
        const r = await cambiarEstado(db, id, 'publicado', data, quien);
        return Object.assign(r, { codigo: codigo, mensaje: 'Publicada en asignaturas/' + codigo + ' (estado: ' + (p.estado || 'inactivo') + ').' });
    }

    async function duplicar(db, id, data) {
        const todo = await leerTodo(db, id);
        if (!todo.ok) return todo;
        const nid = nuevoId('SUB');
        const dr = Object.assign({}, todo.draft);
        delete dr.ID;
        await db.collection(C.asig).doc(nid).set(Object.assign(dr, {
            Estado: 'borrador', Version: (num(todo.draft.Version) || 1) + 1, DuplicadoDe: id,
            DocenteCedula: txt(data.docente_cedula) || dr.DocenteCedula || '', CreatedAt: ahora(), UpdatedAt: ahora()
        }));
        const mapaUnid = {};
        for (const u of todo.units) {
            const uid = nuevoId('UNI');
            mapaUnid[u.ID] = uid;
            const x = Object.assign({}, u, { SubjectID: nid });
            delete x.ID; delete x.blocks;
            await db.collection(C.unid).doc(uid).set(x);
            for (const b of u.blocks) {
                const y = Object.assign({}, b, { SubjectID: nid, UnitID: uid });
                delete y.ID;
                await db.collection(C.bloq).doc(nuevoId('BLQ')).set(y);
            }
        }
        for (const [col, lista] of [[C.acts, todo.activities], [C.evals, todo.evaluations]]) {
            for (const a of lista) {
                const x = Object.assign({}, a, { SubjectID: nid });
                if (x.UnitID && mapaUnid[x.UnitID]) x.UnitID = mapaUnid[x.UnitID];
                delete x.ID;
                await db.collection(col).doc(nuevoId('CPY')).set(x);
            }
        }
        const q = await db.collection(C.preg).where('SubjectID', '==', id).get();
        for (const d of q.docs) {
            const x = Object.assign({}, d.data(), { SubjectID: nid });
            if (x.UnitID && mapaUnid[x.UnitID]) x.UnitID = mapaUnid[x.UnitID];
            await db.collection(C.preg).doc(nuevoId('PRE')).set(x);
        }
        return { ok: true, id: nid };
    }

    async function ejecutar(accion, data) {
        data = data || {};
        const db = getDb();
        const quien = await miRol(db);
        if (quien.estado !== 'activo') return { ok: false, error: 'Tu cuenta no está activa.' };
        switch (accion) {
            case 'constructor_list_drafts': {
                const s = await db.collection(C.asig).get();
                const drafts = filas(s).filter(x => x.Estado !== 'archivado')
                    .sort((a, b) => txt(b.UpdatedAt).localeCompare(txt(a.UpdatedAt)));
                return { ok: true, drafts: drafts };
            }
            case 'constructor_get_subject': return leerTodo(db, txt(data.id || data.subjectID));
            case 'constructor_save_draft': {
                const id = txt(data.subjectID) || nuevoId('SUB');
                const ref = db.collection(C.asig).doc(id);
                const prev = await ref.get();
                const base = {
                    Codigo: txt(data.codigo).trim().toUpperCase(), Nombre: txt(data.nombre).trim(),
                    Carrera: txt(data.carrera).trim(), Carreras: listaCarreras(data.carrera),
                    Grado: txt(data.grado).trim(), Curso: txt(data.curso).trim(), Semestre: txt(data.semestre).trim(),
                    CargaHoraria: num(data.carga_horaria), UpdatedAt: ahora()
                };
                if (!prev.exists) Object.assign(base, { Estado: 'borrador', Version: 1, DocenteCedula: txt(data.docente_cedula) || quien.cedula, CreadoPor: quien.cedula, CreatedAt: ahora() });
                await ref.set(base, { merge: true });
                return { ok: true, id: id };
            }
            case 'constructor_save_program': {
                const id = txt(data.subjectID);
                if (!id) return { ok: false, error: 'Falta la asignatura.' };
                const P = {};
                [['fundamentacion', 'Fundamentacion'], ['objetivo_general', 'ObjetivoGeneral'], ['objetivos_especificos', 'ObjetivosEspecificos'],
                 ['competencias', 'Competencias'], ['capacidades', 'Capacidades'], ['metodologia', 'Metodologia'],
                 ['requisitos', 'Requisitos'], ['bibliografia', 'Bibliografia']].forEach(([k, K]) => { P[K] = txt(data[k]); });
                // Reglas de aprobación del plan de evaluación (por defecto las del programa oficial: 70% y 80% de asistencia).
                const Reglas = { aprobacion_pct: num(data.aprobacion_pct) || 70, asistencia_min_pct: data.asistencia_min_pct === '' || data.asistencia_min_pct == null ? 80 : num(data.asistencia_min_pct) };
                await db.collection(C.asig).doc(id).set({ Program: P, Reglas: Reglas, Fundamentacion: P.Fundamentacion, UpdatedAt: ahora() }, { merge: true });
                return { ok: true, id: id };
            }
            case 'constructor_save_unit': {
                const id = txt(data.id) || nuevoId('UNI');
                if (!data.subjectID && !data.id) return { ok: false, error: 'Falta la asignatura.' };
                const x = {
                    Numero: num(data.numero) || num(data.orden), Titulo: txt(data.titulo), Resumen: txt(data.resumen),
                    Objetivos: txt(data.objetivos), Indicadores: txt(data.indicadores), DuracionMin: num(data.duracion_min), Orden: num(data.orden)
                };
                if (data.subjectID) x.SubjectID = txt(data.subjectID);
                await db.collection(C.unid).doc(id).set(x, { merge: true });
                return { ok: true, id: id };
            }
            case 'constructor_delete_unit': {
                const id = txt(data.id);
                await borrarDonde(db, C.bloq, 'UnitID', id);
                await db.collection(C.unid).doc(id).delete();
                return { ok: true };
            }
            case 'constructor_save_block': {
                const id = txt(data.id) || nuevoId('BLQ');
                const u = await db.collection(C.unid).doc(txt(data.unitID)).get();
                if (!u.exists) return { ok: false, error: 'La unidad no existe.' };
                await db.collection(C.bloq).doc(id).set({
                    SubjectID: u.data().SubjectID, UnitID: u.id, Tipo: txt(data.tipo || 'texto'), Titulo: txt(data.titulo),
                    Contenido: txt(data.contenido), Orden: num(data.orden), Visible: data.visible !== false && data.visible !== 'false'
                });
                return { ok: true, id: id };
            }
            case 'constructor_delete_block': await db.collection(C.bloq).doc(txt(data.id)).delete(); return { ok: true };
            case 'constructor_save_activity': {
                const id = txt(data.id) || nuevoId('ACT');
                await db.collection(C.acts).doc(id).set({
                    SubjectID: txt(data.subjectID), UnitID: txt(data.unitID), Titulo: txt(data.titulo), Instrucciones: txt(data.instrucciones),
                    Puntaje: num(data.puntaje), Rubrica: txt(data.rubrica), FechaEntrega: txt(data.fecha_entrega),
                    PermiteTardia: !!data.permite_tardia, Modalidad: txt(data.modalidad || 'individual'), Retroalimentacion: txt(data.retroalimentacion)
                }, { merge: true });
                return { ok: true, id: id };
            }
            case 'constructor_delete_activity': await db.collection(C.acts).doc(txt(data.id)).delete(); return { ok: true };
            case 'constructor_save_evaluation': {
                const sid = txt(data.subjectID);
                const nombre = txt(data.nombre).trim();
                if (!sid || !nombre) return { ok: false, error: 'Falta el nombre de la evaluación.' };
                const id = txt(data.id) || nuevoId('EVA');
                const N = window.CenturiaNotas;
                const tipo = N ? N.normalizarTipo(data.tipo) : txt(data.tipo || 'parcial');
                // El recuperatorio no suma: reemplaza al parcial más bajo (ver calificaciones.js).
                const pesa = (t, p) => (N ? N.normalizarTipo(t) : t) === 'recuperatorio' ? 0 : num(p);
                const otras = filas(await db.collection(C.evals).where('SubjectID', '==', sid).get()).filter(e => e.ID !== id);
                const suma = otras.reduce((s, e) => s + pesa(e.Tipo, e.Ponderacion), 0) + pesa(tipo, data.ponderacion);
                if (suma > 100) return { ok: false, error: 'La ponderación total quedaría en ' + suma + '% (máximo 100%).' };
                await db.collection(C.evals).doc(id).set({
                    SubjectID: sid, Nombre: nombre, Tipo: tipo,
                    Origen: txt(data.origen) || (N && N.ORIGEN_DE_TIPO[tipo]) || 'manual', Unidad: num(data.unidad) || null,
                    Requisito: data.requisito === true || data.requisito === 'true', PuntajeMax: num(data.puntaje_max),
                    Ponderacion: num(data.ponderacion), FechaApertura: txt(data.fecha_apertura), FechaCierre: txt(data.fecha_cierre),
                    DuracionMin: num(data.duracion_min), IntentosMax: num(data.intentos_max) || 1, Modalidad: txt(data.modalidad || 'virtual'),
                    Aleatorizar: !!data.aleatorizar, PublicarResultados: !!data.publicar_resultados
                });
                return { ok: true, id: id, suma_ponderacion: suma };
            }
            case 'constructor_delete_evaluation': await db.collection(C.evals).doc(txt(data.id)).delete(); return { ok: true };
            case 'constructor_save_question': {
                const id = txt(data.id) || nuevoId('PRE');
                let opciones = [];
                try { opciones = JSON.parse(data.opciones_json || '[]'); } catch (e) {}
                await db.collection(C.preg).doc(id).set({
                    SubjectID: txt(data.subjectID), UnitID: txt(data.unitID), Tipo: txt(data.tipo || 'multiple'), Pregunta: txt(data.pregunta),
                    Opciones: Array.isArray(opciones) ? opciones.map(txt) : [], Correcta: txt(data.correcta), Indicador: txt(data.indicador),
                    Dificultad: txt(data.dificultad || 'media'), Puntaje: num(data.puntaje), Retroalimentacion: txt(data.retroalimentacion)
                });
                return { ok: true, id: id };
            }
            case 'constructor_delete_question': await db.collection(C.preg).doc(txt(data.id)).delete(); return { ok: true };
            case 'constructor_list_bank': return { ok: true, questions: filas(await db.collection(C.preg).where('SubjectID', '==', txt(data.subjectID)).get()) };
            case 'constructor_list_reviews': return { ok: true, reviews: filas(await db.collection(C.rev).where('SubjectID', '==', txt(data.subjectID || data.id)).get()) };
            case 'constructor_submit_review': return cambiarEstado(db, txt(data.id), 'en_revision', data, quien);
            case 'constructor_review_decision': {
                if (ROLES_REVISAN.indexOf(quien.rol) < 0) return { ok: false, error: 'Solo Académico o Administración pueden revisar.' };
                return cambiarEstado(db, txt(data.id), data.decision === 'aprobar' ? 'aprobado' : 'observado', data, quien);
            }
            case 'constructor_publish': return publicar(db, txt(data.id), data, quien);
            case 'constructor_archive': return cambiarEstado(db, txt(data.id), 'archivado', data, quien);
            case 'constructor_duplicate': return duplicar(db, txt(data.id), data);
            default: return { ok: false, error: 'Acción desconocida: ' + accion };
        }
    }

    window.CenturiaAPI = window.CenturiaAPI || {};
    CenturiaAPI.constructor = Object.assign(CenturiaAPI.constructor || {}, {
        submit: function (accion, data) {
            return (typeof authListo === 'function' ? authListo() : Promise.resolve())
                .then(() => ejecutar(accion, data))
                .catch(e => ({ ok: false, error: (e && (e.code === 'permission-denied' ? 'Sin permiso para esta acción.' : e.message)) || 'Error' }));
        }
    });
})();
