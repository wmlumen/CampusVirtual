/**
 * Carga en Firestore (clases) el calendario de clases de TIC — octubre 2026, según lo informado por el docente:
 *   LV026: presencial lunes y viernes · S026: presencial sábados · martes: virtual para ambas (21:00–22:00, Google Meet).
 *   ✅ = clase dada → estado «dictada» (cuenta para la asistencia)
 *   ⛔ = todavía no → estado «programada» (no cuenta hasta que el docente la confirme en academic/clases.html)
 * IDs fijos (CLA-TIC-aaaammdd-SECCION): volver a correrlo no duplica; no pisa clases que el docente ya confirmó o suspendió.
 * Uso: node tools/cargar-clases-tic.js            → simulación
 *      node tools/cargar-clases-tic.js --aplicar  → escribe
 */
const { iniciar } = require('./cv-admin-comun');
const APLICAR = process.argv.includes('--aplicar');

const MEET = 'https://meet.google.com/xyv-jqsi-eqx';
const DOCENTE = '1340130';
const DADAS = ['2026-10-03', '2026-10-05', '2026-10-06', '2026-10-09', '2026-10-10'];
const PENDIENTES = ['2026-10-12', '2026-10-13', '2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20', '2026-10-23',
                    '2026-10-24', '2026-10-26', '2026-10-27', '2026-10-30', '2026-10-31'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function claseDe(fecha, estado) {
  const dia = new Date(fecha + 'T12:00:00Z').getUTCDay();
  const base = { asignatura: 'TIC', fecha, tipo: 'clase', examen_id: '', unidad: null, estado, declarado_por: DOCENTE,
                 origen: 'calendario docente oct-2026', actualizado: new Date().toISOString() };
  if (dia === 2) return Object.assign(base, { id: 'CLA-TIC-' + fecha.replace(/-/g, '') + '-VIRT', modalidad: 'virtual', secciones: ['LV026', 'S026'],
                                              hora_inicio: '21:00', hora_fin: '22:00', enlace: MEET, tema: 'Clase virtual (Google Meet) — ambas secciones' });
  if (dia === 1 || dia === 5) return Object.assign(base, { id: 'CLA-TIC-' + fecha.replace(/-/g, '') + '-LV026', modalidad: 'presencial', secciones: ['LV026'],
                                                           hora_inicio: '', hora_fin: '', enlace: '', tema: 'Clase presencial' });
  if (dia === 6) return Object.assign(base, { id: 'CLA-TIC-' + fecha.replace(/-/g, '') + '-S026', modalidad: 'presencial', secciones: ['S026'],
                                              hora_inicio: '', hora_fin: '', enlace: '', tema: 'Clase presencial' });
  throw new Error(fecha + ' cae ' + DIAS[dia] + ': no corresponde a ningún día de clase de TIC');
}

// Sesiones anteriores (junio y septiembre) que no estaban declaradas: se declaran como «dictadas» igual que el botón
// «Declarar» de academic/clases.html (fecha con ≥2 presentes en la sección). Si no, al existir clases declaradas
// esas sesiones dejarían de contar y la asistencia de todos quedaría mal. Exámenes: el día en que más lo rindieron.
const PRESENTE = ['presente', 'present', 'tarde', 'late', 'justificado', 'justified', 'observado'];
const esTic = (a) => /^(TIC|TECNOLOGIA DE LA INFORMACION)/.test(String(a || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase());
async function detectadas(db, desdeOficial) {
  const porSesion = {};
  (await db.collection('asistencia').get()).docs.map(d => d.data()).forEach(r => {
    const f = String(r.fecha || '').slice(0, 10), sec = String(r.seccion || '').toUpperCase();
    if (!esTic(r.asignatura || r.materia) || !/^\d{4}-\d{2}-\d{2}$/.test(f) || f >= desdeOficial || !sec) return;
    if (PRESENTE.indexOf(String(r.estado || r.status || '').toLowerCase()) < 0) return;
    ((porSesion[f] = porSesion[f] || {})[sec] = porSesion[f][sec] || new Set()).add(String(r.cedula));
  });
  const out = [];
  Object.keys(porSesion).sort().forEach(f => {
    const secs = Object.keys(porSesion[f]).filter(s => porSesion[f][s].size >= 2).sort();
    if (!secs.length) return;
    const martes = new Date(f + 'T12:00:00Z').getUTCDay() === 2;
    out.push({ id: 'CLA-TIC-' + f.replace(/-/g, '') + '-' + (secs.length > 1 ? 'VARIAS' : secs[0]), asignatura: 'TIC', fecha: f, tipo: 'clase', examen_id: '', unidad: null,
               modalidad: martes ? 'virtual' : 'presencial', secciones: secs, hora_inicio: '', hora_fin: '', enlace: '', tema: '', estado: 'dictada',
               declarado_por: DOCENTE, origen: 'detectada de la asistencia (≥2 presentes)', actualizado: new Date().toISOString() });
  });
  // Exámenes en línea de TIC: cuentan como asistencia de quien los rindió.
  const ex = {};
  (await db.collection('intentos').get()).docs.map(d => d.data()).filter(i => /^TIC026-P\d$/.test(i.examen_id || '')).forEach(i => {
    (i.intentos || []).forEach(t => {
      const f = String(t.timestamp || t.fecha || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return;
      const e = ex[i.examen_id] = ex[i.examen_id] || { dias: {}, secs: new Set() };
      e.dias[f] = (e.dias[f] || 0) + 1; if (i.seccion) e.secs.add(String(i.seccion).toUpperCase());
    });
  });
  Object.entries(ex).forEach(([id, e]) => {
    const f = Object.entries(e.dias).sort((a, b) => b[1] - a[1])[0][0];
    out.push({ id: 'CLA-TIC-' + f.replace(/-/g, '') + '-EX-' + id, asignatura: 'TIC', fecha: f, tipo: 'examen', examen_id: id, unidad: null, modalidad: 'virtual',
               secciones: Array.from(e.secs).filter(s => /^[A-Z]{1,3}\d{3}$/.test(s)).sort(), hora_inicio: '', hora_fin: '', enlace: '', tema: 'Examen ' + id,
               estado: 'dictada', declarado_por: DOCENTE, origen: 'detectada de los intentos del examen', actualizado: new Date().toISOString() });
  });
  return out;
}

(async () => {
  let clases = DADAS.map(f => claseDe(f, 'dictada')).concat(PENDIENTES.map(f => claseDe(f, 'programada')));
  if (process.argv.includes('--con-anteriores')) {
    iniciar();
    const previas = await detectadas(require('firebase-admin/firestore').getFirestore(), DADAS[0]);
    console.log('Sesiones anteriores detectadas: ' + previas.length);
    clases = previas.concat(clases);
  }
  console.log((APLICAR ? 'CARGAR' : 'SIMULACIÓN') + ': ' + clases.length + ' clases de TIC');
  clases.forEach(c => console.log('  ' + c.fecha + ' ' + DIAS[new Date(c.fecha + 'T12:00:00Z').getUTCDay()].padEnd(9) + ' ' +
    c.modalidad.padEnd(10) + ' ' + c.secciones.join('+').padEnd(11) + ' ' + c.estado + (c.hora_inicio ? ' ' + c.hora_inicio + '–' + c.hora_fin : '')));
  if (!require('firebase-admin/app').getApps().length) iniciar();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const existentes = {};
  (await db.collection('clases').where('asignatura', '==', 'TIC').get()).docs.forEach(d => { existentes[d.id] = d.data(); });
  // Mismo día y sección ya declarada a mano por el docente → no se duplica.
  const yaDeclarada = (c) => Object.entries(existentes).some(([id, x]) => id !== c.id && x.fecha === c.fecha && (x.tipo || 'clase') === c.tipo &&
    (x.secciones || []).some(s => c.secciones.includes(String(s).toUpperCase())));
  const lote = db.batch();
  let n = 0, omitidas = 0;
  clases.forEach(c => {
    const previa = existentes[c.id];
    if (yaDeclarada(c)) { omitidas++; console.log('  = ' + c.fecha + ' ya estaba declarada a mano: se deja como está'); return; }
    // Si el docente ya la confirmó o la suspendió, se respeta su estado.
    const estado = previa && previa.estado && previa.estado !== 'programada' ? previa.estado : c.estado;
    const { id, ...datos } = c;
    lote.set(db.collection('clases').doc(id), Object.assign(datos, { estado }), { merge: true });
    n++;
  });
  if (!APLICAR) { console.log('\nSe escribirían ' + n + ' (omitidas ' + omitidas + '). Para escribir: agregar --aplicar.'); return; }
  await lote.commit();
  console.log('Listo: ' + n + ' clase(s) en la colección clases (omitidas ' + omitidas + ').');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
