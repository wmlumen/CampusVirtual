/**
 * Asigna la materia a asistencias importadas que quedaron sin asignatura (planillas históricas).
 * Solo toca registros con asignatura vacía dentro del rango de fechas; deja constancia en asignatura_asignada_en.
 * Uso:
 *   node tools/asignar-materia-asistencia.js --asignatura=SOC --desde=2026-04-18 --hasta=2026-06-02            → simulación
 *   node tools/asignar-materia-asistencia.js --asignatura=SOC --desde=2026-04-18 --hasta=2026-06-02 --aplicar  → escribe
 */
const { iniciar } = require('./cv-admin-comun');
const arg = (n) => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=').slice(1).join('=');
const ASIG = arg('asignatura').toUpperCase(), DESDE = arg('desde'), HASTA = arg('hasta');
const APLICAR = process.argv.includes('--aplicar');

(async () => {
  if (!ASIG || !/^\d{4}-\d{2}-\d{2}$/.test(DESDE) || !/^\d{4}-\d{2}-\d{2}$/.test(HASTA)) throw new Error('Uso: --asignatura=COD --desde=aaaa-mm-dd --hasta=aaaa-mm-dd [--aplicar]');
  iniciar();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const docs = (await db.collection('asistencia').get()).docs.filter(d => {
    const x = d.data();
    return !String(x.asignatura || '').trim() && x.fecha >= DESDE && x.fecha <= HASTA;
  });
  const porFecha = {};
  docs.forEach(d => { const x = d.data(); const k = x.fecha + ' ' + (x.seccion || '—'); porFecha[k] = (porFecha[k] || 0) + 1; });
  console.log((APLICAR ? 'ASIGNAR' : 'SIMULACIÓN') + ': ' + docs.length + ' asistencia(s) sin materia entre ' + DESDE + ' y ' + HASTA + ' → ' + ASIG);
  Object.keys(porFecha).sort().forEach(k => console.log('  ' + k + ': ' + porFecha[k]));
  console.log('  Alumnos: ' + new Set(docs.map(d => String(d.data().cedula))).size);
  if (!APLICAR) { console.log('\nPara escribir: agregar --aplicar.'); return; }
  const ahora = new Date().toISOString();
  for (let i = 0; i < docs.length; i += 400) {
    const lote = db.batch();
    docs.slice(i, i + 400).forEach(d => lote.update(d.ref, { asignatura: ASIG, asignatura_asignada_en: ahora }));
    await lote.commit();
  }
  console.log('Listo: ' + docs.length + ' asistencia(s) asignadas a ' + ASIG + '.');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
