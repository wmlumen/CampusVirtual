/**
 * Importa el desarrollo de cada unidad (archivos UNIDAD_<n>_MATERIAL_DE_ESTUDIO.html) como bloques de la
 * asignatura en el Constructor: una sección del material = un bloque HTML (Ficha de clase, Desarrollo teórico,
 * Guía de actividades, Análisis de caso, Materiales, Evaluación, Conexión profesional).
 * Uso, en la PC, desde la carpeta del proyecto:
 *   node tools/importar-unidades.js SOC "C:\...\SOCIOLOGIA - COMERCIAL\DESARROLLO"             → simulación
 *   node tools/importar-unidades.js SOC "C:\...\SOCIOLOGIA - COMERCIAL\DESARROLLO" --aplicar   → escribe los bloques
 * Reemplaza solo los bloques importados antes (Formato 'html'); el bloque «Contenidos de la unidad» se conserva.
 * Para que lo vean los alumnos hay que volver a publicar la asignatura en el Constructor.
 */
const fs = require('fs');
const path = require('path');
const { iniciar } = require('./cv-admin-comun');

const [codigo, carpeta] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const APLICAR = process.argv.includes('--aplicar');

// Tipo de bloque según el título de la sección.
function tipoDe(titulo) {
  const t = titulo.toLowerCase();
  if (t.startsWith('ficha')) return 'resumen';
  if (t.startsWith('desarrollo')) return 'texto';
  if (t.startsWith('guía') || t.startsWith('guia')) return 'actividad';
  if (t.startsWith('análisis') || t.startsWith('analisis')) return 'ejemplo';
  if (t.startsWith('materiales')) return 'bibliografia';
  if (t.startsWith('evaluación') || t.startsWith('evaluacion')) return 'rubrica';
  if (t.startsWith('conexión') || t.startsWith('conexion')) return 'aviso';
  return 'texto';
}

// Limpieza: sin scripts, estilos, eventos ni enlaces javascript:; los enlaces a otros archivos locales del material se quitan.
function limpiar(html) {
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/<a\s[^>]*href="(?!https?:|#|mailto:)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$2')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function secciones(html) {
  const out = [];
  const re = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html))) {
    const interior = m[1];
    const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(interior);
    if (!h2) continue;
    const titulo = h2[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    // El encabezado (número + título) lo dibuja el aula; queda solo el contenido.
    // (algunos encabezados traen style="…", por eso [^>]*)
    const contenido = limpiar(interior.replace(/<div class="step-header"[^>]*>[\s\S]*?<\/h2>\s*<\/div>/i, ''));
    out.push({ titulo, tipo: tipoDe(titulo), contenido });
  }
  return out;
}

(async () => {
  if (!codigo || !carpeta) throw new Error('Uso: node tools/importar-unidades.js CODIGO CARPETA [--aplicar]');
  const archivos = fs.readdirSync(carpeta).map(f => ({ f, m: /^UNIDAD_(\d+)_MATERIAL_DE_ESTUDIO\.html$/i.exec(f) })).filter(x => x.m)
    .map(x => ({ numero: Number(x.m[1]), ruta: path.join(carpeta, x.f) })).sort((a, b) => a.numero - b.numero);
  if (!archivos.length) throw new Error('No hay archivos UNIDAD_<n>_MATERIAL_DE_ESTUDIO.html en ' + carpeta);
  const porUnidad = archivos.map(a => ({ numero: a.numero, secciones: secciones(fs.readFileSync(a.ruta, 'utf8')) }));

  console.log((APLICAR ? 'IMPORTAR' : 'SIMULACIÓN (no se escribe nada)') + ' — ' + codigo);
  porUnidad.forEach(u => console.log('  U' + u.numero + ': ' + u.secciones.map(s => s.titulo + ' (' + Math.round(s.contenido.length / 1024 * 10) / 10 + ' KB)').join(' · ')));
  if (!APLICAR) { console.log('\nPara escribir: agregar --aplicar.'); return; }

  console.log('Credenciales: ' + iniciar());
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const drafts = (await db.collection('constructor_asignaturas').where('Codigo', '==', String(codigo).toUpperCase()).get()).docs
    .filter(d => d.data().Estado !== 'archivado');
  if (drafts.length !== 1) throw new Error('Se esperaba 1 asignatura con código ' + codigo + ' en el Constructor y hay ' + drafts.length + '.');
  const sid = drafts[0].id;
  const unidades = (await db.collection('constructor_unidades').where('SubjectID', '==', sid).get()).docs;
  let sec = 0;
  for (const u of porUnidad) {
    const doc = unidades.find(d => Number(d.data().Numero) === u.numero);
    if (!doc) { console.log('  U' + u.numero + ': no existe en el Constructor, se omite.'); continue; }
    const previos = (await db.collection('constructor_bloques').where('UnitID', '==', doc.id).get()).docs;
    const lote = db.batch();
    previos.filter(b => b.data().Formato === 'html').forEach(b => lote.delete(b.ref));
    u.secciones.forEach((s, i) => {
      lote.set(db.collection('constructor_bloques').doc('BLQ-' + Date.now().toString(36) + (++sec).toString(36)), {
        SubjectID: sid, UnitID: doc.id, Tipo: s.tipo, Titulo: s.titulo, Contenido: s.contenido, Formato: 'html',
        Orden: i + 2, Visible: true, Fuente: path.basename(archivos.find(a => a.numero === u.numero).ruta)
      });
    });
    await lote.commit();
    console.log('  U' + u.numero + ': ' + u.secciones.length + ' bloque(s) importado(s).');
  }
  await db.collection('constructor_asignaturas').doc(sid).update({ UpdatedAt: new Date().toISOString() });
  console.log('Listo. Abrí la asignatura en el Constructor y usá «Volver a publicar» para que lo vean los alumnos.');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
