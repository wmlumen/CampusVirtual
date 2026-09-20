// Chequeo estático del repo (sin dependencias). Uso: node tests/check_repo.cjs
// Falla (exit 1) si encuentra: URLs GAS muertas, rutas absolutas, globales
// inexistentes, secretos o versiones de api.js desparejas.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'app');
let errors = [];
let warnings = [];

const SKIP_DIRS = new Set(['node_modules', 'vendor', 'images', 'favicon_io', '.git']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out);
      continue;
    }
    if (!/\.(html|js|gs|md)$/.test(e.name)) continue;
    const p = path.join(dir, e.name);
    try {
      if (fs.statSync(p).size > 400000) continue; // salta binarios/minificados grandes
    } catch (_) { continue; }
    out.push(p);
  }
  return out;
}

const DEAD_IDS = [
  'AKfycbxek9YPO_GaFBMwqrBnmzqt9Ooh1w7VP9kbfTN64y-af9PrhWyZ_xWkdT5IFpwAIcR1', // v08.4 previo: código anterior a v08.4.1 (reemplazado)
  'AKfycbw-f6I2uM2U4oaU-CJihO14Lpq8P919dd3-2lkOfyt5QsDsAXf35EhCrt5yVL9v6neI',
  'AKfycbya0gCfBO2OGqGh3ijC7h_v-QHQXRlNvCCzREWF-lSltwIWocg_pEEGuX_vMT6C-5M7',
  'AKfycbwRHS9q7fDrXio1o4BxtQVtXqJwkyT7wq0shvIaVksL8Rp-0J2NguBe2cDu6iO0fBm4EQ',
  'AKfycbyQECf-Z-ZdfD5GZnZFkTjV977jTS9Je3Ph31dpgb0i_KpK7sCcFWxDHCxMeSTSAvjs', // anterior a 04–10 (sin consultas, mensajes, facturas ni mis_cursos): reemplazado
  'AKfycbyFCzToy9qAVnsTwqD6PQaKxbk0ftfEngMr4AchB5LE__71cFok48Ht60tyra-1UCUD', // implementación intermedia (reemplazada por la última)
];
// El despliegue vivo cambia con cada «Nueva implementación»: api.js manda; solo se exige que apunte a un despliegue que no esté en DEAD_IDS.

const files = walk(APP);
const apiVersions = new Set();

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const src = fs.readFileSync(f, 'utf8');
  const isDoc = /\.md$/.test(f);

  if (!isDoc) {
    for (const id of DEAD_IDS) {
      const at = src.indexOf(id);
      if (at >= 0 && !/obsolet/i.test(src.slice(Math.max(0, at - 300), at))) {
        errors.push(`${rel}: referencia a deployment GAS muerto ${id.slice(0, 12)}…`);
      }
    }
  }
  if (/\bfetch\(\s*['"]\/api\//.test(src)) errors.push(`${rel}: fetch absoluto a /api/`);
  if (/location\.replace\(\s*['"]\/index\.html['"]/.test(src)) errors.push(`${rel}: redirect absoluto a /index.html`);
  if (!isDoc && /\bAPI_GAS_URL\b/.test(src)) errors.push(`${rel}: usa API_GAS_URL (no existe; es GAS_URL)`);
  if (!isDoc && /\basignaturaForm\b/.test(src)) errors.push(`${rel}: usa asignaturaForm (no existe; es formAsignatura)`);
  if (/data\.asignatura\s*\|\|\s*['"]TIC['"]/.test(src)) warnings.push(`${rel}: asignatura TIC forzada`);
  
  // Regla GitHub Pages: frontend 100% estático sin backend PHP local
  const isClientCode = /\.(html|js)$/.test(f) && !f.includes('Materiales_Clases') && !f.includes('Backend_Scripts');
  if (isClientCode) {
    if (/\bfetch\s*\([^)]*\.php/i.test(src) || /['"`][^'"`]*\.php(\?[^'"`]*)?['"`]/i.test(src)) {
      errors.push(`${rel}: llamada o referencia a PHP detectada en frontend estático`);
    }
    if (/\bfetch\s*\([^)]*\/api\//i.test(src)) {
      errors.push(`${rel}: llamada a /api/ detectada en frontend estático`);
    }
  }

  const m = src.match(/api\.js\?v=(\d+)/g);
  if (m) m.forEach(x => apiVersions.add(x));
  if (/-----BEGIN (RSA )?PRIVATE KEY-----/.test(src)) errors.push(`${rel}: clave privada en el repo`);
  if (!rel.includes('firebase-config.js') && /AIza[0-9A-Za-z\-_]{35}/.test(src)) errors.push(`${rel}: posible API key externa no permitida`);
}

// api.js debe tener una sola versión en todo el frontend
if (apiVersions.size > 1) {
  errors.push('versiones api.js desparejas: ' + [...apiVersions].join(', '));
}

// Cero archivos .php en el proyecto
function findPhpFiles(dir) {
  let list = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) list.push(...findPhpFiles(path.join(dir, e.name)));
    } else if (/\.php$/i.test(e.name)) {
      list.push(path.join(dir, e.name));
    }
  }
  return list;
}
const phpFiles = findPhpFiles(ROOT);
if (phpFiles.length > 0) {
  errors.push(`Archivos PHP remanentes detectados: ${phpFiles.map(p => path.relative(ROOT, p)).join(', ')}`);
}

// Cero archivos o carpetas con nombre moodle en el proyecto
function findMoodleFiles(dir) {
  let list = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name.toLowerCase().includes('moodle')) list.push(path.join(dir, e.name));
      if (!SKIP_DIRS.has(e.name)) list.push(...findMoodleFiles(path.join(dir, e.name)));
    } else if (e.name.toLowerCase().includes('moodle')) {
      list.push(path.join(dir, e.name));
    }
  }
  return list;
}
const moodleItems = findMoodleFiles(ROOT);
if (moodleItems.length > 0) {
  errors.push(`Archivos/carpetas moodle detectados: ${moodleItems.map(p => path.relative(ROOT, p)).join(', ')}`);
}

// GAS_URL viva presente en api.js
const apiJs = fs.readFileSync(path.join(APP, 'js', 'api.js'), 'utf8');
const mUrl = apiJs.match(/const GAS_URL = 'https:\/\/script\.google\.com\/macros\/s\/([A-Za-z0-9_-]+)\/exec'/);
if (!mUrl) errors.push('app/js/api.js no define GAS_URL con un despliegue /exec');
else if (DEAD_IDS.includes(mUrl[1])) errors.push('app/js/api.js apunta a un deployment GAS muerto');

// .gs sin errores obvios de sintaxis ya se valida con node --check en CI local
console.log('Archivos revisados: ' + files.length);
console.log('Versiones api.js: ' + ([...apiVersions].join(', ') || 'ninguna'));
if (warnings.length) { console.log('AVISOS:'); warnings.forEach(w => console.log('  ~ ' + w)); }
if (errors.length) {
  console.log('ERRORES:');
  errors.forEach(e => console.log('  X ' + e));
  process.exit(1);
}
console.log('OK: sin errores.');
