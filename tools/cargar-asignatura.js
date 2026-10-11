/**
 * Carga una asignatura completa en el Constructor (programa, unidades con sus temas y evaluaciones)
 * a partir de un archivo JSON, con el mismo modelo que app/js/constructor-api.js.
 * Uso, en la PC, desde la carpeta del proyecto:
 *   node tools/cargar-asignatura.js tools/asignaturas/sociologia.json              → simulación (no escribe)
 *   node tools/cargar-asignatura.js tools/asignaturas/sociologia.json --aplicar    → queda como borrador en el Constructor
 *   node tools/cargar-asignatura.js tools/asignaturas/sociologia.json --publicar   → además la aprueba y la publica en el catálogo
 * Si ya hay un borrador con el mismo código no hace nada (agregar --reemplazar para archivarlo y cargar de nuevo).
 * Publicar conserva el estado y el docente de asignaturas/{código} si ya existía; si es nueva queda «inactivo».
 * Con la variable FIRESTORE_EMULATOR_HOST trabaja contra el emulador local en vez de producción.
 */
const fs = require('fs');
const { iniciar } = require('./cv-admin-comun');

const args = process.argv.slice(2);
const archivo = args.find(a => !a.startsWith('--'));
const PUBLICAR = args.includes('--publicar');
const APLICAR = PUBLICAR || args.includes('--aplicar');
const REEMPLAZAR = args.includes('--reemplazar');

const C = {
  asig: 'constructor_asignaturas', unid: 'constructor_unidades', bloq: 'constructor_bloques',
  evals: 'constructor_evaluaciones', rev: 'constructor_revisiones'
};
const ahora = () => new Date().toISOString();
let sec = 0;
const nuevoId = (p) => p + '-' + Date.now().toString(36) + (++sec).toString(36) + Math.random().toString(36).slice(2, 5);
const carrerasDe = (s) => String(s || '').split(/\s*[\/,;]\s*/).map(x => x.trim()).filter(Boolean);

(async () => {
  if (!archivo) throw new Error('Uso: node tools/cargar-asignatura.js ARCHIVO.json [--aplicar | --publicar] [--reemplazar]');
  const A = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const codigo = String(A.codigo || '').trim().toUpperCase();
  if (!codigo || !A.nombre) throw new Error('El JSON necesita "codigo" y "nombre".');
  const suma = (A.evaluaciones || []).reduce((s, e) => s + (Number(e.ponderacion) || 0), 0);
  if (suma !== 100) throw new Error('Las evaluaciones suman ' + suma + '%, tienen que sumar 100%.');
  const carreras = carrerasDe(A.carrera);

  console.log((process.env.FIRESTORE_EMULATOR_HOST ? '[EMULADOR ' + process.env.FIRESTORE_EMULATOR_HOST + '] ' : '') +
    (APLICAR ? (PUBLICAR ? 'CARGAR Y PUBLICAR' : 'CARGAR COMO BORRADOR') : 'SIMULACIÓN (no se escribe nada)'));
  console.log('  ' + codigo + ' — ' + A.nombre + ' | ' + A.grado + ' · ' + (A.curso || '') + ' · ' + (A.semestre || '') + ' · ' + (A.carga_horaria || 0) + ' h');
  console.log('  Carreras: ' + carreras.join(' | '));
  (A.unidades || []).forEach(u => console.log('  U' + u.numero + ' ' + u.titulo + ' (' + (u.temas || []).length + ' temas)'));
  console.log('  Evaluaciones: ' + (A.evaluaciones || []).map(e => e.nombre + ' ' + e.ponderacion + '%').join(', '));
  if (!APLICAR) { console.log('\nPara escribir: agregar --aplicar (borrador) o --publicar.'); return; }

  if (!process.env.FIRESTORE_EMULATOR_HOST) console.log('Credenciales: ' + iniciar());
  else require('firebase-admin/app').initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-centuria' });
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();

  const previos = (await db.collection(C.asig).where('Codigo', '==', codigo).get()).docs.filter(d => d.data().Estado !== 'archivado');
  if (previos.length && !REEMPLAZAR) throw new Error('Ya hay un borrador con el código ' + codigo + ' (' + previos.map(d => d.id).join(', ') + '). Usá --reemplazar para archivarlo.');
  for (const d of previos) await d.ref.update({ Estado: 'archivado', UpdatedAt: ahora() });

  const sid = nuevoId('SUB');
  const P = A.programa || {};
  const Program = {
    Fundamentacion: P.fundamentacion || '', ObjetivoGeneral: P.objetivo_general || '', ObjetivosEspecificos: P.objetivos_especificos || '',
    Competencias: P.competencias || '', Capacidades: P.capacidades || '', Metodologia: P.metodologia || '',
    Requisitos: P.requisitos || '', Bibliografia: P.bibliografia || ''
  };
  await db.collection(C.asig).doc(sid).set({
    Codigo: codigo, Nombre: A.nombre, Carrera: A.carrera, Carreras: carreras, Grado: A.grado || '', Curso: A.curso || '',
    Semestre: A.semestre || '', CargaHoraria: Number(A.carga_horaria) || 0, Program: Program, Fundamentacion: Program.Fundamentacion,
    Estado: 'borrador', Version: 1, DocenteCedula: '', CreadoPor: 'tools/cargar-asignatura.js', CreatedAt: ahora(), UpdatedAt: ahora()
  });
  for (const u of A.unidades || []) {
    const uid = nuevoId('UNI');
    await db.collection(C.unid).doc(uid).set({
      SubjectID: sid, Numero: u.numero, Titulo: u.titulo, Resumen: u.resumen || (u.temas || []).join('. ') + '.',
      Objetivos: u.objetivos || '', Indicadores: u.indicadores || '', DuracionMin: Number(u.duracion_min) || 0, Orden: u.numero
    });
    await db.collection(C.bloq).doc(nuevoId('BLQ')).set({
      SubjectID: sid, UnitID: uid, Tipo: 'lista', Titulo: 'Contenidos de la unidad', Contenido: (u.temas || []).join('\n'), Orden: 1, Visible: true
    });
  }
  for (const e of A.evaluaciones || []) {
    await db.collection(C.evals).doc(nuevoId('EVA')).set({
      SubjectID: sid, Nombre: e.nombre, Tipo: e.tipo || 'parcial', PuntajeMax: Number(e.puntaje_max) || 0, Ponderacion: Number(e.ponderacion) || 0,
      FechaApertura: '', FechaCierre: '', DuracionMin: 0, IntentosMax: 1, Modalidad: 'presencial', Aleatorizar: false, PublicarResultados: false
    });
  }
  console.log('Borrador creado: ' + sid);
  if (!PUBLICAR) { console.log('Abrilo en el Constructor para revisarlo, enviarlo a revisión y publicarlo.'); return; }

  const revision = (de, a, com) => db.collection(C.rev).doc(nuevoId('REV')).set({
    SubjectID: sid, DeEstado: de, AEstado: a, PorRol: 'sistema', PorCedula: 'tools/cargar-asignatura.js', Comentario: com, CreatedAt: ahora()
  });
  await revision('borrador', 'aprobado', 'Cargado desde el programa oficial (' + (A._fuente || archivo) + ').');
  const ref = db.collection('asignaturas').doc(codigo);
  const prev = await ref.get();
  const p = prev.exists ? prev.data() : {};
  await ref.set({
    codigo: codigo, nombre: A.nombre, carrera: carreras[0] || '', carreras: carreras, grado: A.grado || '', curso: A.curso || '',
    semestre: A.semestre || '', carga_horaria: Number(A.carga_horaria) || 0, programa_id: sid, programa_version: 1,
    unidades: (A.unidades || []).map(u => ({ numero: u.numero, titulo: u.titulo })),
    evaluaciones: (A.evaluaciones || []).map(e => ({ nombre: e.nombre, tipo: e.tipo || 'parcial', ponderacion: Number(e.ponderacion) || 0 })),
    estado: p.estado || 'inactivo', docente_cedula: p.docente_cedula || '',
    icono: p.icono || 'bi-journal-text', color: p.color || '#007A33', modulo: p.modulo || '',
    publicado_por: 'tools/cargar-asignatura.js', updated_at: ahora()
  }, { merge: true });
  await revision('aprobado', 'publicado', 'Publicada en asignaturas/' + codigo + '.');
  await db.collection(C.asig).doc(sid).update({ Estado: 'publicado', UpdatedAt: ahora() });
  console.log('Publicada en asignaturas/' + codigo + ' (estado: ' + (p.estado || 'inactivo') + ', docente: ' + (p.docente_cedula || 'sin asignar') + ').');
  if (prev.exists) console.log('Antes era: ' + JSON.stringify({ nombre: p.nombre, carrera: p.carrera, semestre: p.semestre, carga_horaria: p.carga_horaria }));
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
