/**
 * Carga en Firestore (config_carreras) el catálogo oficial de carreras por nivel, tomado de la lista de respaldo
 * de app/js/api.js (listar_carreras → CATALOGO_DEFAULT), para que la oferta académica viva en la base de datos.
 * IDs fijos por nombre: volver a correrlo no duplica; no pisa carreras ya cargadas a mano (solo agrega las que faltan).
 * Uso: node tools/sembrar-carreras.js            → simulación
 *      node tools/sembrar-carreras.js --aplicar  → escribe
 */
const fs = require('fs');
const path = require('path');
const { iniciar, RAIZ } = require('./cv-admin-comun');
const APLICAR = process.argv.includes('--aplicar');

const src = fs.readFileSync(path.join(RAIZ, 'app', 'js', 'api.js'), 'utf8');
const bloque = (src.split('const CATALOGO_DEFAULT = [')[1] || '').split('];')[0];
const carreras = Array.from(bloque.matchAll(/\{\s*nombre:\s*'([^']+)',\s*grado:\s*'([^']+)'\s*\}/g)).map(m => ({ nombre: m[1], grado: m[2] }));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

(async () => {
  if (!carreras.length) throw new Error('No se encontró CATALOGO_DEFAULT en app/js/api.js');
  console.log((APLICAR ? 'CARGAR' : 'SIMULACIÓN') + ': ' + carreras.length + ' carreras');
  const porNivel = {};
  carreras.forEach(c => { (porNivel[c.grado] = porNivel[c.grado] || []).push(c.nombre); });
  Object.entries(porNivel).forEach(([g, l]) => console.log('  ' + g + ' (' + l.length + '): ' + l.join(' · ')));
  iniciar();
  const { getFirestore } = require('firebase-admin/firestore');
  const db = getFirestore();
  const existentes = new Set((await db.collection('config_carreras').get()).docs.map(d => slug(String(d.data().nombre || ''))));
  const nuevas = carreras.filter(c => !existentes.has(slug(c.nombre)));
  console.log('Ya en la base: ' + (carreras.length - nuevas.length) + ' · a cargar: ' + nuevas.length);
  if (!APLICAR) { console.log('\nPara escribir: agregar --aplicar.'); return; }
  const ahora = new Date().toISOString(), lote = db.batch();
  nuevas.forEach(c => lote.set(db.collection('config_carreras').doc('CAR-' + slug(c.nombre)), {
    nombre: c.nombre, grado: c.grado, codigo: slug(c.nombre), estado: 'ACTIVO', origen: 'catalogo oficial (api.js)', creado: ahora
  }));
  await lote.commit();
  console.log('Listo: ' + nuevas.length + ' carrera(s) cargadas en config_carreras.');
})().catch(e => { console.error('ERROR:', e.message || e); process.exit(1); });
