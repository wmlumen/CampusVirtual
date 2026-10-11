/**
 * Importa los resultados de un examen rendido fuera de la plataforma (backend de Apps Script, p. ej. TIC026)
 * a la colección 'intentos' (un documento por examen y alumno: <CODIGO>__<cedula>, el formato que lee la
 * plataforma) y pre-registra en 'cedulas' a los alumnos que todavía no figuran.
 * Entrada: JSON con { envios: [...], resultados: [...] } generado desde la planilla de respuestas
 * (se guarda en _local/, que no se sube a git: tiene datos personales). No se importan IP ni huellas de dispositivo.
 * Uso:
 *   node tools/importar-examen.js _local/examen.json --asignatura=TIC --excluir=1340130              → simulación
 *   node tools/importar-examen.js _local/examen.json --asignatura=TIC --excluir=1340130 --aplicar    → escribe
 * Volver a correrlo reemplaza los intentos importados (no duplica).
 */
const fs = require('fs');
const path = require('path');
const { iniciar, normalizarCedula } = require('./cv-admin-comun');

const arg = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=').slice(1).join('=') : d; };
const archivo = process.argv.slice(2).find(a => !a.startsWith('--'));
const APLICAR = process.argv.includes('--aplicar');
const ASIG = String(arg('asignatura', '')).toUpperCase();
const EXCLUIR = new Set(String(arg('excluir', '')).split(',').map(normalizarCedula).filter(Boolean));
const PREGUNTAS = Number(arg('preguntas', 0)) || null;   // por defecto: cantidad de respuestas del envío

// Cédulas mal escritas, verificadas a mano contra la asistencia (mismo nombre, un dígito cambiado).
// Las cuatro primeras son las de tools/importar-asistencia.js; se agregan las detectadas en los exámenes TIC026.
const CORRECCIONES = { '629374': '6293724', '4935985': '4935984', '4821499': '4821399', '6181944': '6181954', '3625672': '3525672', '6046954': '6046953' };
const corregir = (c) => CORRECCIONES[normalizarCedula(c)] || normalizarCedula(c);

// Fecha de planilla (número de serie, hora de Paraguay UTC-3) → ISO.
const iso = (serial) => serial ? new Date(Math.round((serial - 25569) * 86400000) + 3 * 3600000).toISOString() : '';
const evaluacionDe = (codigo) => { const m = /-P(\d+)$/i.exec(codigo); return m ? 'parcial' + m[1] : String(codigo).toLowerCase(); };

(async () => {
  if (!archivo || !ASIG) throw new Error('Uso: node tools/importar-examen.js ARCHIVO.json --asignatura=TIC [--excluir=CEDULA,...] [--aplicar]');
  const D = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const envios = D.envios.filter(e => e.cedula && e.examen && !EXCLUIR.has(normalizarCedula(e.cedula)))
    .map(e => Object.assign({}, e, { cedula: corregir(e.cedula) }));

  // Agrupar por examen + alumno, en orden de intento.
  const docs = {};
  envios.forEach(e => {
    const ced = normalizarCedula(e.cedula), id = e.examen + '__' + ced;
    const total = PREGUNTAS || Object.keys(e.respuestas || {}).length || 10;
    const d = docs[id] || (docs[id] = {
      examen_id: e.examen, alumno_cedula: ced, nombre: e.nombre, carrera: e.carrera, seccion: e.seccion,
      asignatura: ASIG, evaluacion: evaluacionDe(e.examen), intentos: []
    });
    if (e.nombre && e.nombre.length > d.nombre.length) d.nombre = e.nombre;
    d.intentos.push({
      intento: e.intento, timestamp: iso(e.fecha_serial), puntaje: e.puntaje, total: total,
      pct: e.puntaje == null ? null : Math.round(e.puntaje / total * 1000) / 10,
      respuestas: e.respuestas || {}, tipo: e.tipo || 'Regular', id_envio: e.id_envio || ''
    });
  });
  Object.values(docs).forEach(d => {
    d.intentos.sort((a, b) => (a.intento - b.intento) || String(a.timestamp).localeCompare(String(b.timestamp)));
    d.mejor_intento = Math.max(...d.intentos.map(i => Number(i.puntaje) || 0));
    d.mejor_pct = Math.max(...d.intentos.map(i => Number(i.pct) || 0));
  });

  // Control contra la hoja de resultados finales de la misma planilla.
  const difs = [];
  (D.resultados || []).filter(r => !EXCLUIR.has(normalizarCedula(r.cedula))).forEach(r => {
    const d = docs[r.examen + '__' + corregir(r.cedula)];
    if (!d) difs.push(r.cedula + ' ' + r.examen + ': está en resultados y no tiene envíos');
    else {
      if (r.mejor != null && Number(r.mejor) !== d.mejor_intento) difs.push(r.cedula + ' ' + r.examen + ': mejor puntaje ' + d.mejor_intento + ' (resultados dice ' + r.mejor + ')');
      if (r.intentos && Number(r.intentos) !== d.intentos.length) difs.push(r.cedula + ' ' + r.examen + ': ' + d.intentos.length + ' intento(s) (resultados dice ' + r.intentos + ')');
    }
  });

  const lista = Object.values(docs);
  const alumnos = {};
  lista.forEach(d => { alumnos[d.alumno_cedula] = d.nombre; });
  const porExamen = {};
  lista.forEach(d => { porExamen[d.examen_id] = (porExamen[d.examen_id] || 0) + 1; });
  console.log((APLICAR ? 'IMPORTAR' : 'SIMULACIÓN (no se escribe nada)') + ' — ' + path.basename(archivo) + ' → asignatura ' + ASIG);
  console.log('  Envíos: ' + envios.length + (EXCLUIR.size ? ' (excluidas: ' + Array.from(EXCLUIR).join(', ') + ')' : ''));
  console.log('  Documentos de intentos: ' + lista.length + ' ' + JSON.stringify(porExamen) + ' · alumnos: ' + Object.keys(alumnos).length);
  console.log('  Aprobados (mejor ≥ 70%): ' + lista.filter(d => d.mejor_pct >= 70).length + ' · reprobados: ' + lista.filter(d => d.mejor_pct < 70).length);
  console.log('  Control con la hoja de resultados: ' + (difs.length ? difs.length + ' diferencia(s):\n    ' + difs.join('\n    ') : 'sin diferencias'));

  if (!APLICAR) {
    if (!process.argv.includes('--sin-base')) {
      iniciar();
      const { getFirestore } = require('firebase-admin/firestore');
      const db = getFirestore();
      const existentes = new Set((await db.collection('cedulas').get()).docs.map(d => d.id));
      const nuevos = Object.keys(alumnos).filter(c => !existentes.has(c));
      console.log('  A pre-registrar (no figuran en el índice de cédulas): ' + nuevos.length);
    }
    console.log('\nPara escribir: agregar --aplicar.');
    return;
  }

  console.log('Credenciales: ' + iniciar());
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const ahora = new Date().toISOString();
  const existentes = new Set((await db.collection('cedulas').get()).docs.map(d => d.id));
  const nuevos = Object.keys(alumnos).filter(c => !existentes.has(c));
  const ops = lista.map(d => ['intentos', d.examen_id + '__' + d.alumno_cedula, Object.assign({}, d, { fuente: 'importacion:' + path.basename(archivo), updated_at: ahora })])
    .concat(nuevos.map(c => ['cedulas', c, { cedula: c, nombre: alumnos[c], apellido: '', estado: 'pre_registro', rol: 'alumno', uid: '', actualizado: ahora }]));
  for (let i = 0; i < ops.length; i += 400) {
    const lote = db.batch();
    ops.slice(i, i + 400).forEach(([col, id, data]) => lote.set(db.collection(col).doc(id), data));
    await lote.commit();
  }
  // Documentos de una importación anterior del mismo archivo que ya no corresponden (cédula corregida o excluida).
  const vigentes = new Set(lista.map(d => d.examen_id + '__' + d.alumno_cedula));
  const viejos = (await db.collection('intentos').where('fuente', '==', 'importacion:' + path.basename(archivo)).get()).docs.filter(d => !vigentes.has(d.id));
  for (const d of viejos) await d.ref.delete();
  console.log('Listo: ' + lista.length + ' documento(s) de intentos y ' + nuevos.length + ' alumno(s) pre-registrado(s).' + (viejos.length ? ' Borrados ' + viejos.length + ' de la importación anterior: ' + viejos.map(d => d.id).join(', ') : ''));
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
