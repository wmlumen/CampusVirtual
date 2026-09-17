// Importador TIC_BASE_V1 — SOLO LECTURA de app/Materiales_Clases/.
// Genera app/data/courses/TIC/TIC_BASE_V1.json + INVENTARIO.json.
// Uso: node tools/importar_tic.cjs [--validar]  (exit 1 si el espejo no coincide)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const MAT = path.join(ROOT, 'app', 'Materiales_Clases');
const OUT = path.join(ROOT, 'app', 'data', 'courses', 'TIC');
const ARCHIVOS = ['programa.html', 'Unidad_01.html', 'Unidad_02.html', 'Unidad_03.html',
  'Unidad_04.html', 'Unidad_05.html', 'Unidad_06.html', 'Unidad_07.html', 'Unidad_08.html',
  'Unidad_09.html', 'Unidad_10.html', 'planilla.html', 'index.html',
  'Cuaderno_del_Estudiante_TIC_Centuria_2026.pdf'];

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const txt = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function first(re, s, g = 1) { const m = s.match(re); return m ? m[g].trim() : ''; }
function all(re, s) { return [...s.matchAll(re)].map(m => m.slice(1)); }

function parseUnidad(n) {
  const file = `Unidad_${String(n).padStart(2, '0')}.html`;
  const html = fs.readFileSync(path.join(MAT, file), 'utf8');
  const titulo = first(/<h2[^>]*class="[^"]*h2-unidad[^"]*"[^>]*>([\s\S]*?)<\/h2>/i, html);
  // Cards: header + body + data-section del footer
  const cards = [];
  const cardRe = /<div[^>]*class="[^"]*card[^"]*"[^>]*id="card-([^"]+)"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*card[^"]*"[^>]*id="card-|<div class="seccion-bibliografia|<div class="navegacion-unidades|$)/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const inner = m[2];
    const header = first(/<div[^>]*class="[^"]*card-header[^"]*"[^>]*>([\s\S]*?)<\/div>/i, inner);
    const bodyM = inner.match(/<div[^>]*class="[^"]*card-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*card-footer|<\/div>)/i);
    const section = first(/data-section="([^"]+)"/i, inner);
    cards.push({ id: 'card-' + m[1], header: txt(header), body_html: (bodyM ? bodyM[1] : '').trim(), section });
  }
  const bib = first(/<div[^>]*class="[^"]*seccion-bibliografia[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*navegacion-unidades/i, html);
  const nav = first(/<div[^>]*class="[^"]*navegacion-unidades[^"]*"[^>]*>([\s\S]*?)<\/div>/i, html);
  const anchors = all(/<a[^>]*href="(Unidad_\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi, nav);
  const spanTxt = txt(all(/<span[^>]*>([\s\S]*?)<\/span>/gi, nav).map(x => x[0]).join(' '));
  const prevA = anchors.find(x => /Anterior/i.test(x[1]));
  const nextA = anchors.find(x => /Siguiente/i.test(x[1]));
  const prev = prevA ? prevA[0] : (/Anterior/i.test(spanTxt) ? 'INICIO' : '');
  const next = nextA ? nextA[0] : (/Siguiente/i.test(spanTxt) ? 'FIN' : '');
  const flashcards = (html.match(/fcCount|FC_DATA/g) || []).length > 0;
  return { numero: n, archivo: file, titulo: txt(titulo), cards, bibliografia_html: bib.trim(), nav_prev: prev, nav_next: next, flashcards };
}

function parsePrograma() {
  const html = fs.readFileSync(path.join(MAT, 'programa.html'), 'utf8');
  const titulo = first(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html);
  const acordeon = all(/<button[^>]*class="[^"]*accordion-button[^"]*"[^>]*>([\s\S]*?)<\/button>/gi, html).map(x => txt(x[0]));
  const bib = first(/Bibliograf[^<]*<\/h[345]>[^]*?<ul[^>]*>([\s\S]*?)<\/ul>/i, html);
  return { titulo: txt(titulo), unidades_acordeon: acordeon, bibliografia_items: all(/<li[^>]*>([\s\S]*?)<\/li>/gi, bib).map(x => txt(x[0])) };
}

function parseIndex() {
  const html = fs.readFileSync(path.join(MAT, 'index.html'), 'utf8');
  return {
    titulo: txt(first(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html)),
    menu: (() => {
      const out = [];
      const re = /<a([^>]*)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi;
      let mm;
      while ((mm = re.exec(html)) !== null) {
        if (/menu-clase/.test(mm[1] + mm[3])) out.push({ href: mm[2], texto: txt(mm[4]) });
      }
      return out;
    })()
  };
}

function main() {
  const inventario = ARCHIVOS.map(f => {
    const p = path.join(MAT, f);
    const buf = fs.readFileSync(p);
    return { archivo: f, bytes: buf.length, sha256: sha256(buf) };
  });
  const units = [];
  for (let n = 1; n <= 10; n++) units.push(parseUnidad(n));
  const snapshot = {
    codigo: 'TIC', tipo: 'plantilla_maestra', version: 'TIC_BASE_V1',
    origen: 'contenido_existente', estado: 'inmutable', publicada: true, editable: false,
    generada_en: new Date().toISOString(),
    programa: parsePrograma(), menu: parseIndex(), units
  };

  // ── VALIDACIÓN (autocorrección: exit 1 + reporte) ──
  const fallos = [];
  const ok = (cond, msg) => { if (!cond) fallos.push(msg); };
  ok(units.length === 10, 'debe haber 10 unidades');
  units.forEach((u, i) => {
    ok(u.titulo.length > 5, `U${i + 1} sin título`);
    ok(u.cards.length >= 5, `U${i + 1} con ${u.cards.length} cards (<5)`);
    ok(u.bibliografia_html.length > 20, `U${i + 1} sin bibliografía`);
    u.cards.forEach((c, j) => {
      ok(c.body_html.length > 20, `U${i + 1} card ${j} (${c.id}) vacía`);
    });
  });
  ok(units[0].nav_prev === 'INICIO', 'U01 debe empezar en INICIO, hay: ' + units[0].nav_prev);
  ok(units[9].nav_next === 'FIN', 'U10 debe terminar en FIN, hay: ' + units[9].nav_next);
  for (let i = 1; i < 9; i++) {
    ok(units[i].nav_prev === `Unidad_${String(i).padStart(2, '0')}.html`,
      `U${i + 1} prev roto: ${units[i].nav_prev}`);
    ok(units[i].nav_next === `Unidad_${String(i + 2).padStart(2, '0')}.html`,
      `U${i + 1} next roto: ${units[i].nav_next}`);
  }
  ok(snapshot.menu.menu.length >= 10, 'menú lateral con <10 enlaces: ' + snapshot.menu.menu.length);
  ok(snapshot.programa.unidades_acordeon.length === 10,
    'acordeón programa con ' + snapshot.programa.unidades_acordeon.length + ' items');
  const conFlash = units.filter(u => u.flashcards).length;
  ok(conFlash >= 8, `flashcards solo en ${conFlash}/10 (esperado 9, U01 no tiene)`);

  if (fallos.length) {
    console.error('ESPEJO NO VÁLIDO — ' + fallos.length + ' diferencias:');
    fallos.forEach(f => console.error('  X ' + f));
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'INVENTARIO.json'), JSON.stringify(inventario, null, 1));
  fs.writeFileSync(path.join(OUT, 'TIC_BASE_V1.json'),
    JSON.stringify(snapshot, (k, v) => (k === 'body_html' || k === 'bibliografia_html') ? v : v, 1));
  const nBlocks = units.reduce((s, u) => s + u.cards.length, 0);
  console.log(`ESPEJO OK: 10 unidades, ${nBlocks} bloques, menú ${snapshot.menu.menu.length}, flashcards ${conFlash}/10.`);
  console.log('Archivos: app/data/courses/TIC/{INVENTARIO.json,TIC_BASE_V1.json}');
}

main();
