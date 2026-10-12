const path = require('path');
const { iniciar } = require('./cv-admin-comun');
iniciar();
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();
const { MODELO_TIC_UNIDADES, MODELO_TIC_PROGRAMA, MODELO_TIC_EVALUACIONES } = require('../app/js/modelo-tic-data');

const SUBJECT_ID = 'SUB-mv4hv0ui1vv5';
const UNIT_IDS = {
    1: 'UNI-mv4hv14520cr',
    2: 'UNI-mv4hv1v24rsa',
    3: 'UNI-mv4hv2mt6u5l',
    4: 'UNI-mv4hv3f88qxh',
    5: 'UNI-mv4hv47pavg0',
    6: 'UNI-mv4hv4xxcfn7',
    7: 'UNI-mv4hv5pqexf0',
    8: 'UNI-mv4hv6i6gwy2',
    9: 'UNI-mv4hv799i8bx',
    10: 'UNI-mv4hv803kcr5'
};

async function sync() {
    console.log('Iniciando sincronización directa en Firestore...');
    const batchSize = 450;
    let batch = db.batch();
    let opCount = 0;

    async function commitBatchIfNeeded() {
        if (opCount >= batchSize) {
            console.log(`Guardando lote de ${opCount} operaciones...`);
            await batch.commit();
            batch = db.batch();
            opCount = 0;
        }
    }

    // 1. Asignatura Borrador
    const asigRef = db.collection('constructor_asignaturas').doc(SUBJECT_ID);
    batch.set(asigRef, {
        Codigo: 'TIC',
        Nombre: 'Tecnología de la Información y Comunicación',
        Carrera: 'Licenciatura en Administración de Empresas',
        Carreras: ['Licenciatura en Administración de Empresas'],
        Grado: 'Grado',
        Curso: '',
        Semestre: '3er Semestre',
        CargaHoraria: 120,
        Program: MODELO_TIC_PROGRAMA,
        Reglas: { aprobacion_pct: 70, asistencia_min_pct: 80 },
        Estado: 'publicado',
        Version: 1,
        UpdatedAt: new Date().toISOString()
    }, { merge: true });
    opCount++;

    // 2. Unidades y Bloques en el Constructor
    for (const u of MODELO_TIC_UNIDADES) {
        const uid = UNIT_IDS[u.numero] || `UNI-mv4hv-u${u.numero}`;
        const uRef = db.collection('constructor_unidades').doc(uid);
        batch.set(uRef, {
            SubjectID: SUBJECT_ID,
            Numero: u.numero,
            Titulo: u.titulo,
            Resumen: u.resumen,
            Objetivos: 'Desarrollar el dominio conceptual y analítico de los temas de la Unidad ' + u.numero + '.',
            Indicadores: 'Aplica los criterios en evaluaciones formativas y análisis de casos.',
            DuracionMin: 120,
            Orden: u.numero
        }, { merge: true });
        opCount++;
        await commitBatchIfNeeded();

        // Bloques de la unidad
        for (let bIdx = 0; bIdx < u.bloques.length; bIdx++) {
            const b = u.bloques[bIdx];
            const bid = `BLQ-mv4hv-u${u.numero}-b${bIdx + 1}`;
            const bRef = db.collection('constructor_bloques').doc(bid);
            batch.set(bRef, {
                SubjectID: SUBJECT_ID,
                UnitID: uid,
                Tipo: b.tipo || 'html',
                Titulo: b.titulo,
                Contenido: b.contenido,
                Formato: 'html',
                Orden: bIdx + 1,
                Visible: true
            }, { merge: true });
            opCount++;
            await commitBatchIfNeeded();
        }
    }

    // 3. Contenidos publicados para el Aula (contenidos/TIC__U1 .. contenidos/TIC__U10)
    for (const u of MODELO_TIC_UNIDADES) {
        const cid = `TIC__U${u.numero}`;
        const cRef = db.collection('contenidos').doc(cid);
        batch.set(cRef, {
            asignatura: 'TIC',
            unidad: u.numero,
            titulo: u.titulo,
            resumen: u.resumen,
            bloques: u.bloques.map(b => ({
                tipo: b.tipo || 'html',
                titulo: b.titulo,
                contenido: b.contenido,
                formato: 'html'
            }))
        });
        opCount++;
        await commitBatchIfNeeded();
    }

    // 4. Asignatura en el Aula (asignaturas/TIC)
    const asigOficialRef = db.collection('asignaturas').doc('TIC');
    batch.set(asigOficialRef, {
        codigo: 'TIC',
        nombre: 'Tecnología de la Información y Comunicación',
        carrera: 'Licenciatura en Administración de Empresas',
        carreras: ['Licenciatura en Administración de Empresas'],
        grado: 'Grado',
        semestre: '3er Semestre',
        carga_horaria: 120,
        unidades: MODELO_TIC_UNIDADES.map(u => ({ numero: u.numero, titulo: u.titulo })),
        evaluaciones: MODELO_TIC_EVALUACIONES,
        reglas: { aprobacion_pct: 70, asistencia_min_pct: 80 },
        programa_id: SUBJECT_ID,
        programa_version: 1,
        updated_at: new Date().toISOString()
    }, { merge: true });
    opCount++;

    if (opCount > 0) {
        console.log(`Guardando lote de ${opCount} operaciones...`);
        await batch.commit();
    }

    console.log('✓ ¡Sincronización completada exitosamente en Firestore!');
}

sync().catch(err => {
    console.error('Error durante la sincronización:', err);
    process.exit(1);
});
