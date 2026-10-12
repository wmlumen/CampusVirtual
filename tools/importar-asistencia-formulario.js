/**
 * Importa la asistencia tomada con el formulario de Google (columna OBSERVACIÓN = palabra clave dicha en clase).
 * Guarda TODO en Firestore:
 *   asistencia_formulario/{FRM-<asig>-<fila>}  copia íntegra de cada respuesta (solo personal)
 *   asistencia/ASI-<asig>-<cedula>-<aaaammdd>   una marca por alumno y día, verificada con la palabra de esa clase:
 *       presente  → escribió la palabra (o una variante: y/j, k/c/g, ñ/n, letras dobles, una letra de diferencia)
 *       observado → palabra incorrecta o vacía (no cuenta como presencia hasta que el docente lo revise)
 *       ausente   → avisó que no asistía (el texto queda en la observación)
 * La palabra de cada clase es la más escrita ese día (todas las secciones). IDs fijos: volver a correrlo no duplica.
 * Uso: node tools/importar-asistencia-formulario.js _local/asistencia.json --asignatura=TIC [--aplicar]
 */
const fs = require('fs');
const path = require('path');
const { iniciar, normalizarCedula } = require('./cv-admin-comun');

const archivo = process.argv.slice(2).find(a => !a.startsWith('--'));
const APLICAR = process.argv.includes('--aplicar');
const ASIG = String((process.argv.find(a => a.startsWith('--asignatura=')) || '').split('=')[1] || '').toUpperCase();

const sinTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
// Forma comparable de una palabra en guaraní/castellano: minúsculas, sin tildes ni símbolos, y/j, k/c/g, sin letras dobles.
const clave = (s) => sinTildes(s).toLowerCase().replace(/[^a-z]/g, '').replace(/j/g, 'y').replace(/[cg]/g, 'k').replace(/(.)\1+/g, '$1');
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const AVISO_AUSENCIA = /(\bausen|no vino|no pude|no podre|no podré|no puedo asistir|no asist|\bfalt[eé]\b|enferm|salud|guardia)/i;
// Correcciones de cédula ya verificadas a mano en tools/importar-asistencia.js (mismo alumno, dígito cambiado).
const CORRECCIONES = { '629374': '6293724', '4935985': '4935984', '4821499': '4821399', '6181944': '6181954', '3625672': '3525672',
  // Detectadas en el formulario TIC (mismo correo/nombre; la correcta es la que aparece en exámenes y asistencias anteriores).
  '4090949': '4090940', '591072': '5910772', '6046954': '6046953' };

function seccionCanonica(s) {
  const t = sinTildes(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!t) return '';
  if (t.startsWith('S')) return 'S026';
  if (/^(LV|VL|LYV|V)/.test(t)) return 'LV026';
  if (t.startsWith('MJ')) return 'MJ026';
  return t;
}
function carreraCanonica(c) {
  const s = sinTildes(c).toUpperCase();
  if (s.includes('ADUANER')) return 'Administración Aduanera';
  if (s.includes('GESTION')) return 'Administración y Gestión Pública';
  if (s.includes('EMPRESA')) return 'Administración de Empresas';
  if (s.includes('COMERCIAL')) return 'Ingeniería Comercial';
  if (s.includes('CONTAB')) return 'Contabilidad';
  return String(c || '').trim();
}

(async () => {
  if (!archivo || !ASIG) throw new Error('Uso: node tools/importar-asistencia-formulario.js ARCHIVO.json --asignatura=TIC [--aplicar]');
  const D = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const avisos = [];
  // Cédula por correo: si una fila no trae cédula válida, se toma la de otra respuesta con el mismo correo.
  const cedPorCorreo = {};
  D.respuestas.forEach(r => {
    const c = normalizarCedula(String(r.cedula_original).replace(/-\d$/, '')), e = String(r.email || '').trim().toLowerCase();
    if (/@/.test(e) && /^\d{5,9}$/.test(c)) cedPorCorreo[e] = CORRECCIONES[c] || c;
  });
  const filas = D.respuestas.map(r => {
    let ced = normalizarCedula(String(r.cedula_original).replace(/-\d$/, ''));
    if (CORRECCIONES[ced]) { avisos.push('Fila ' + r.fila + ': cédula corregida ' + ced + ' → ' + CORRECCIONES[ced] + ' (' + r.nombre.trim() + ')'); ced = CORRECCIONES[ced]; }
    const porCorreo = cedPorCorreo[String(r.email || '').trim().toLowerCase()];
    if (!/^\d{5,9}$/.test(ced) && porCorreo) { avisos.push('Fila ' + r.fila + ': «' + r.cedula_original + '» no es una cédula; se toma ' + porCorreo + ' por el correo (' + r.nombre.trim() + ')'); ced = porCorreo; }
    return Object.assign({}, r, {
      cedula: /^\d{5,9}$/.test(ced) ? ced : '', fecha: String(r.marca_temporal).slice(0, 10), hora: String(r.marca_temporal).slice(11, 19),
      seccion_n: seccionCanonica(r.seccion), carrera_n: carreraCanonica(r.carrera), k: clave(r.observacion)
    });
  });
  filas.filter(f => !f.cedula).forEach(f => avisos.push('Fila ' + f.fila + ': cédula no válida «' + f.cedula_original + '» (' + f.nombre + ') — queda solo en la copia del formulario.'));

  // Palabra de cada clase (por fecha): la forma más escrita, sin contar avisos de ausencia.
  const palabra = {};
  const porFecha = {};
  filas.forEach(f => { if (f.k && !AVISO_AUSENCIA.test(f.observacion)) (porFecha[f.fecha] = porFecha[f.fecha] || {})[f.k] = ((porFecha[f.fecha] || {})[f.k] || 0) + 1; });
  Object.entries(porFecha).forEach(([fecha, c]) => {
    const [k, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    const original = filas.find(f => f.fecha === fecha && f.k === k).observacion;
    palabra[fecha] = { k, texto: sinTildes(original).trim().toLowerCase() === k ? original.trim() : original.trim(), votos: n };
  });

  function verificar(f) {
    const p = palabra[f.fecha];
    if (AVISO_AUSENCIA.test(f.observacion)) return 'aviso_ausencia';
    if (!f.k) return 'vacia';
    if (!p || p.votos < 2) return 'sin_referencia';   // clase con una sola respuesta: no hay con qué comparar
    if (f.k === p.k) return 'ok';
    const tope = p.k.length >= 5 ? 2 : 1;
    if (lev(f.k, p.k) <= tope || (f.k.length > p.k.length && f.k.includes(p.k))) return 'variante';
    return 'incorrecta';
  }
  const ESTADO = { ok: 'presente', variante: 'presente', incorrecta: 'observado', vacia: 'observado', sin_referencia: 'observado', aviso_ausencia: 'ausente' };
  const RANGO = { presente: 0, observado: 1, ausente: 2 };

  // Una marca por alumno y día: gana presente, después observado, después ausente; a igual estado, la más temprana.
  const marcas = {};
  filas.filter(f => f.cedula).forEach(f => {
    const v = verificar(f), estado = ESTADO[v];
    const reg = Object.assign({}, f, { verificacion: v, estado });
    const id = 'ASI-' + ASIG + '-' + f.cedula + '-' + f.fecha.replace(/-/g, '');
    const prev = marcas[id];
    if (!prev || RANGO[estado] < RANGO[prev.estado] || (RANGO[estado] === RANGO[prev.estado] && f.marca_temporal < prev.marca_temporal)) marcas[id] = Object.assign(reg, { id, envios: (prev ? prev.envios : 0) + 1 });
    else prev.envios++;
  });
  const lista = Object.values(marcas);
  // Sección del alumno: la más usada en sus respuestas (las vacías o mal escritas se completan con ella).
  const secAlumno = {};
  filas.filter(f => f.cedula && f.seccion_n).forEach(f => { (secAlumno[f.cedula] = secAlumno[f.cedula] || {})[f.seccion_n] = ((secAlumno[f.cedula] || {})[f.seccion_n] || 0) + 1; });
  const secDe = (c) => Object.entries(secAlumno[c] || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const nombreDe = {}, carreraDe = {}, emailDe = {};
  filas.filter(f => f.cedula).forEach(f => {
    if (f.nombre.length > (nombreDe[f.cedula] || '').length) nombreDe[f.cedula] = f.nombre.replace(/\s+/g, ' ').trim();
    if (f.carrera_n) carreraDe[f.cedula] = f.carrera_n;
    if (/@/.test(f.email)) emailDe[f.cedula] = f.email.toLowerCase();
  });

  // ── Resumen ──
  console.log((APLICAR ? 'IMPORTAR' : 'SIMULACIÓN (no se escribe nada)') + ' — ' + path.basename(archivo) + ' → ' + ASIG);
  console.log('Respuestas: ' + filas.length + ' · marcas alumno+día: ' + lista.length + ' · alumnos: ' + Object.keys(nombreDe).length);
  Object.keys(palabra).sort().forEach(fecha => {
    const m = lista.filter(x => x.fecha === fecha), c = (e) => m.filter(x => x.estado === e).length;
    console.log('  ' + fecha + '  palabra «' + palabra[fecha].texto + '» (' + palabra[fecha].votos + ')  presentes ' + c('presente') + ' · observados ' + c('observado') + ' · ausentes ' + c('ausente'));
  });
  const fechasSinPalabra = Array.from(new Set(lista.map(x => x.fecha))).filter(f => !palabra[f]);
  if (fechasSinPalabra.length) console.log('  Fechas sin palabra (solo avisos o vacías): ' + fechasSinPalabra.join(', '));
  console.log('Por verificación: ' + JSON.stringify(lista.reduce((a, x) => (a[x.verificacion] = (a[x.verificacion] || 0) + 1, a), {})));
  console.log('\nVariantes aceptadas:');
  lista.filter(x => x.verificacion === 'variante').forEach(x => console.log('  ' + x.fecha + ' ' + x.cedula + ' «' + x.observacion + '» ≈ «' + palabra[x.fecha].texto + '»'));
  console.log('\nObservados (para revisar):');
  lista.filter(x => x.estado === 'observado').forEach(x => console.log('  ' + x.fecha + ' ' + x.cedula + ' ' + (nombreDe[x.cedula] || '').padEnd(36).slice(0, 36) + ' «' + x.observacion + '» (' + x.verificacion + ')'));
  if (avisos.length) console.log('\nAvisos:\n  ' + avisos.join('\n  '));

  iniciar();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  // Marcas ya cargadas del mismo alumno y día (otra importación): se informan para no contar dos veces.
  const existentes = (await db.collection('asistencia').get()).docs.map(d => d.data());
  const cruce = lista.filter(x => existentes.some(e => String(e.cedula) === x.cedula && e.fecha === x.fecha && e.id !== x.id));
  console.log('\nYa había otra marca del mismo alumno y día: ' + cruce.length);
  if (!APLICAR) { console.log('\nPara escribir: agregar --aplicar.'); return; }

  const ahora = new Date().toISOString(), fuente = 'formulario:' + (D.fuente || path.basename(archivo));
  const ops = [];
  filas.forEach(f => ops.push(['asistencia_formulario', 'FRM-' + ASIG + '-' + String(f.fila).padStart(4, '0'), {
    asignatura: ASIG, fila: f.fila, marca_temporal: f.marca_temporal, nombre: f.nombre, cedula_original: f.cedula_original, cedula: f.cedula,
    asignatura_formulario: f.asignatura, email: f.email, carrera: f.carrera, seccion: f.seccion, observacion: f.observacion,
    seccion_normalizada: f.seccion_n, verificacion: f.cedula ? verificar(f) : 'cedula_invalida', palabra_clase: (palabra[f.fecha] || {}).texto || '',
    archivo: D.fuente || path.basename(archivo), importado_en: ahora
  }]));
  lista.forEach(x => {
    const ts = new Date(x.marca_temporal).toISOString();
    const seccion = x.seccion_n === 'S026' || x.seccion_n === 'LV026' || x.seccion_n === 'MJ026' ? x.seccion_n : secDe(x.cedula);
    ops.push(['asistencia', x.id, {
      id: x.id, cedula: x.cedula, user_id: x.cedula, nombre: nombreDe[x.cedula], carrera: carreraDe[x.cedula] || '', email: emailDe[x.cedula] || '',
      seccion, grupo: seccion, asignatura: ASIG, estado: x.estado,
      status: { presente: 'present', observado: 'pending', ausente: 'absent' }[x.estado],
      verificacion: x.verificacion, palabra_clase: (palabra[x.fecha] || {}).texto || '', palabra_escrita: x.observacion,
      observacion: x.estado === 'presente' ? '' : x.observacion, envios_del_dia: x.envios,
      fecha: x.fecha, hora: x.hora, timestamp: ts, created_at: ts, origen: 'formulario', fuente: fuente + ':' + x.fila, importado_en: ahora
    }]);
  });
  // Hoja 1 de la planilla (lista de cédulas) también queda guardada.
  if (Array.isArray(D.hoja1_cedulas)) ops.push(['asistencia_formulario', 'HOJA1-' + ASIG, { asignatura: ASIG, hoja: 'Hoja 1', cedulas: D.hoja1_cedulas, archivo: D.fuente || path.basename(archivo), importado_en: ahora }]);
  // Alumnos que todavía no figuran en el índice de cédulas → pre-registro (para que puedan registrarse).
  const enIndice = new Set((await db.collection('cedulas').get()).docs.map(d => d.id));
  const nuevos = Object.keys(nombreDe).filter(c => !enIndice.has(c));
  nuevos.forEach(c => ops.push(['cedulas', c, { cedula: c, nombre: nombreDe[c], apellido: '', estado: 'pre_registro', rol: 'alumno', uid: '', actualizado: ahora }]));
  console.log('Pre-registro de alumnos nuevos: ' + nuevos.length);
  for (let i = 0; i < ops.length; i += 400) {
    const lote = db.batch();
    ops.slice(i, i + 400).forEach(([col, id, data]) => lote.set(db.collection(col).doc(id), data));
    await lote.commit();
  }
  // Marcas de una importación anterior de este formulario que ya no corresponden (cédula corregida).
  const vigentes = new Set(lista.map(x => x.id));
  const viejas = (await db.collection('asistencia').where('origen', '==', 'formulario').get()).docs
    .filter(d => String(d.data().fuente || '').startsWith(fuente + ':') && !vigentes.has(d.id));
  for (const d of viejas) await d.ref.delete();
  console.log('\nGuardado: ' + filas.length + ' respuesta(s) del formulario y ' + lista.length + ' marca(s) de asistencia.' +
    (viejas.length ? ' Borradas ' + viejas.length + ' marca(s) con cédula corregida: ' + viejas.map(d => d.id).join(', ') : ''));
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
