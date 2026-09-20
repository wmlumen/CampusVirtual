// Prueba de 02_Examenes_Factura_v08.4.gs con Sheets/Mail simulados (no toca la planilla real).
// Ejecutar: node examenes.test.cjs
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

// ── Simulación mínima de Google Apps Script ──
const OFFSET_H = -3; // America/Asuncion (UTC-3 fijo desde 2024)
const pad = (n, l = 2) => String(n).padStart(l, '0');
function fmt(date, f) {
  const d = new Date(date.getTime() + OFFSET_H * 3600e3);
  const m = { yyyy: pad(d.getUTCFullYear(), 4), MM: pad(d.getUTCMonth() + 1), dd: pad(d.getUTCDate()), HH: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()) };
  return f.replace(/yyyy|MM|dd|HH|mm/g, k => m[k]);
}
function parse(str, tz, f) {
  const [dt, tm] = str.split(' ');
  const [y, mo, d] = dt.split('-').map(Number); const [h, mi] = tm.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - OFFSET_H, mi));
}
function makeSheet(name) {
  const rows = [];
  const sh = {
    name, rows,
    getLastRow: () => rows.length,
    appendRow: r => { rows.push([...r]); },
    getDataRange: () => ({ getValues: () => rows.map(r => [...r]) }),
    getRange: (r, c, nr = 1, nc = 1) => ({
      setValue: v => { rows[r - 1][c - 1] = v; },
      setValues: vs => { vs.forEach((row, i) => row.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = v; })); },
      setNumberFormat() {}, setFontWeight() {}, setBackground() {}, setFontColor() {}
    }),
    setFrozenRows() {}
  };
  return sh;
}
const sheets = {};
const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) };
const mails = [];
const cacheStore = {};
let ahora = Date.parse('2026-09-19T12:00:00Z'); // 09:00 en Asunción

const users = {
  '111': { cedula: '111', nombre: 'Ana', apellido: 'Paz', email: 'ana@mail.com', rol: 'alumno', estado: 'activo' },
  '222': { cedula: '222', nombre: 'Beto', apellido: 'Gómez', email: 'beto@mail.com', rol: 'alumno', estado: 'activo' },
  'D1': { cedula: 'D1', nombre: 'Doc', apellido: 'Ente', email: 'doc@mail.com', rol: 'docente', estado: 'activo' }
};

const context = {
  Date: class extends Date { constructor(...a) { super(...(a.length ? a : [ahora])); } static now() { return ahora; } },
  Utilities: {
    formatDate: (d, tz, f) => fmt(d, f), parseDate: parse,
    getUuid: () => crypto.randomUUID(),
    computeDigest: (alg, v) => [...crypto.createHash('sha256').update(String(v)).digest()].map(b => (b > 127 ? b - 256 : b)),
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }
  },
  SpreadsheetApp: { flush() {} },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: k => cacheStore[k] ?? null, put: (k, v) => { cacheStore[k] = v; }, remove: k => { delete cacheStore[k]; } }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  MailApp: { sendEmail: o => mails.push(o) },
  // Auxiliares del backend principal (01_Script_Cloud_Completo_v08.4.1.gs), versión mínima equivalente
  cvAuthNormalizeCedula: v => String(v == null ? '' : v).replace(/[^0-9A-Za-z]/g, ''),
  cvAuthFindUser: (s, c) => users[String(c)] || null,
  cvAuthSanitizeText: (v, n) => String(v == null ? '' : v).trim().slice(0, n || 100).replace(/<[^>]*>/g, ''),
  cvDocenteHash: v => crypto.createHash('sha256').update(String(v)).digest('hex'),
  cvAuthHash: (p, salt) => crypto.createHash('sha256').update(String(salt || '') + ':' + String(p || '')).digest('hex'),
  cvDocenteEqual: (a, b) => String(a) === String(b)
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '02_Examenes_Factura_v08.4.gs'), 'utf8'), context);
const J = x => JSON.parse(JSON.stringify(x));
const T = (fecha, hora) => context.cvExamMs(fecha, hora);

// Hoja Pagos: [Cédula, Nombre, Módulo, Monto, Fecha, Estado, Comprobante, RegistradoPor, Factura, Tipo]
sheets.Pagos = makeSheet('Pagos');
sheets.Pagos.rows.push(['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor', 'Factura', 'Tipo']);
[
  ['111', 'Ana', 'Cuota 1', 300000, '2026-05-10', 'pagado', '', 'admin', '001-001-0000101', 'cuota'],
  ['111', 'Ana', 'Cuota 2', 300000, '10/6/2026, 09:00:00', 'pagado', '', 'admin', '001-001-0000102', 'cuota'],
  ['111', 'Ana', 'Cuota 3', 300000, new Date('2026-07-10T12:00:00Z'), 'pagado', '', 'admin', '001-001-0000103', 'cuota'],
  ['111', 'Ana', 'Cuota 4', 300000, '2026-08-10', 'anulado', '', 'admin', '001-001-0000104', 'cuota'],
  ['111', 'Ana', 'Cuota 5', 300000, '2026-08-11', 'pagado', '', 'admin', '001-001-0000105', 'cuota'],
  ['111', 'Ana', 'Cuota 6', 300000, '2026-09-10', 'pagado', '', 'admin', '001-001-0000106', 'cuota'],
  ['111', 'Ana', 'Cuota 7', 300000, '2026-09-15', 'pagado', '', 'admin', '001-001-0000107', 'cuota'],
  ['222', 'Beto', 'Cuota 1', 300000, '2026-09-01', 'pendiente', '', 'admin', '001-001-0000201', 'cuota']
].forEach(r => sheets.Pagos.rows.push(r));

// 1) Últimos 4 pagos: más recientes primero, sin anulados, fechas en 3 formatos
let r = J(context.cvPagosUltimos(ss, { cedula: '111' }));
assert.deepEqual(r.resultados['111'].pagos.map(p => p.concepto), ['Cuota 7', 'Cuota 6', 'Cuota 5', 'Cuota 3']);
assert.equal(r.resultados['111'].al_dia, true);
r = J(context.cvPagosUltimos(ss, { cedulas: '111,222' }));
assert.equal(r.resultados['222'].al_dia, false);
assert.equal(r.resultados['222'].pendientes, 1);
assert.throws(() => context.cvPagosUltimos(ss, {}), /cédula/);

// 2) Configuración: permisos y validaciones
const cfgBase = { docente_cedula: 'D1', examen_id: 'examen_parcial_1', asignatura: 'TIC', fecha_inicio: '2026-09-20', hora_inicio: '08:00', fecha_cierre: '2026-09-20', hora_cierre: '10:00', intentos: 2 };
assert.throws(() => context.cvExamenConfigGuardar(ss, { ...cfgBase, docente_cedula: '111' }), /permiso/);
assert.throws(() => context.cvExamenConfigGuardar(ss, { ...cfgBase, hora_cierre: '07:00' }), /posterior/);
assert.throws(() => context.cvExamenConfigGuardar(ss, { ...cfgBase, intentos: 0 }), /intentos/);
assert.throws(() => context.cvExamenConfigGuardar(ss, { ...cfgBase, examen_id: 'otro' }), /desconocido/);
assert.throws(() => context.cvExamenConfigGuardar(ss, { ...cfgBase, fecha_inicio: '2026-02-31x' }), /fecha y hora/);
// antes de configurar, el alumno no puede pedir
assert.throws(() => context.cvExamenSolicitar(ss, { cedula: '111', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000107' }), /no fue habilitado/);
context.cvExamenConfigGuardar(ss, cfgBase);
assert.equal(J(context.cvExamenConfigListar(ss, { asignatura: 'TIC' })).configs[0].intentos, 2);
assert.equal(J(context.cvExamenConfigPublica(ss, { examen_id: 'examen_parcial_1' })).configs.length, 1);
// Actualizar reemplaza (no duplica)
context.cvExamenConfigGuardar(ss, { ...cfgBase, intentos: 3 });
assert.equal(sheets.ConfigExamen.rows.length, 2);

// 3) Alumno con factura pagada → mail automático con enlace + clave
r = J(context.cvExamenSolicitar(ss, { cedula: '111', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000107' }));
assert.equal(r.estado, 'habilitado');
assert.equal(mails.length, 1);
assert.equal(mails[0].to, 'ana@mail.com');
const clave = mails[0].body.match(/Clave: ([A-Z2-9]{8})/)[1];
assert.match(mails[0].body, /em=ana%40mail\.com&k=/);
assert.match(mails[0].htmlBody, /Ingresar directamente/);
assert.match(mails[0].body, /20\/09\/2026 08:00 hasta 20\/09\/2026 10:00/);
assert.ok(!JSON.stringify(sheets.AccesoExamen.rows).includes(clave), 'la clave no debe guardarse en texto plano');
// Reenvío inmediato bloqueado
assert.throws(() => context.cvExamenSolicitar(ss, { cedula: '111', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000107' }), /hace instantes/);

// 4) Alumno con pago pendiente / factura inexistente → queda solicitado, sin mail
r = J(context.cvExamenSolicitar(ss, { cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000201' }));
assert.equal(r.estado, 'solicitado'); assert.match(r.mensaje, /pendiente/);
assert.equal(mails.length, 1);
assert.throws(() => context.cvExamenSolicitar(ss, { cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: 'x' }), /N° de factura/);
r = J(context.cvExamenSolicitar(ss, { cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '999-999-9999999' }));
assert.equal(r.estado, 'solicitado'); assert.match(r.mensaje, /verificar/);

// 5) Docente ve la solicitud con los 4 últimos pagos y decide
r = J(context.cvExamenSolicitudes(ss, { asignatura: 'TIC', examen_id: 'examen_parcial_1' }));
assert.equal(r.solicitudes.length, 2);
assert.equal(r.pagos['222'].pagos.length, 1);
assert.throws(() => context.cvExamenResolver(ss, { docente_cedula: '222', cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', decision: 'habilitar' }), /permiso/);
r = J(context.cvExamenResolver(ss, { docente_cedula: 'D1', cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', decision: 'habilitar', observacion: 'Plan de pago acordado' }));
assert.equal(r.estado, 'habilitado'); assert.equal(mails.length, 2); assert.equal(mails[1].to, 'beto@mail.com');
const claveBeto = mails[1].body.match(/Clave: ([A-Z2-9]{8})/)[1];

// 6) Acceso: clave incorrecta, antes de hora, dentro de ventana, intentos, después del cierre
const acc = (extra) => J(context.cvExamenAccesoValidar(ss, { examen_id: 'examen_parcial_1', email: 'ana@mail.com', clave, ...extra }));
assert.equal(acc({ clave: 'ZZZZZZZZ' }).motivo, 'clave');
assert.equal(J(context.cvExamenAccesoValidar(ss, { examen_id: 'examen_parcial_1', email: 'beto@mail.com', clave })).motivo, 'clave', 'la clave de otro alumno no sirve');
r = acc({}); assert.equal(r.motivo, 'no_iniciado'); assert.match(r.mensaje, /20\/09\/2026 08:00/);
ahora = Date.parse('2026-09-20T12:30:00Z'); // 09:30 del 20/09
r = acc({}); assert.equal(r.ok, true); assert.equal(r.intento, 1); assert.equal(r.intentos_max, 3);
const sesion = r.sesion_id;
assert.equal(acc({ email: 'ANA@mail.com ', clave: clave.toLowerCase() }).ok, true, 'mail y clave no distinguen mayúsculas/espacios');
assert.equal(sheets.IntentosExamen.rows.length - 1, 2, 'el segundo ingreso sin sesión consume otro intento');
r = acc({ sesion_id: sesion }); assert.equal(r.ok, true); assert.equal(r.intento, 1);
assert.equal(sheets.IntentosExamen.rows.length - 1, 2, 'recargar con sesión abierta no consume intento');
r = acc({}); assert.equal(r.intento, 3);
r = acc({}); assert.equal(r.motivo, 'sin_intentos');
// Con la sesión abierta puede seguir aunque ya no le queden intentos nuevos
assert.equal(acc({ sesion_id: sesion }).ok, true);
// Docente cambia a 1 intento → Ana ya gastó
context.cvExamenConfigGuardar(ss, { ...cfgBase, intentos: 1 });
assert.equal(acc({}).motivo, 'sin_intentos');
// Después del cierre
ahora = Date.parse('2026-09-20T13:01:00Z'); // 10:01
assert.equal(acc({ sesion_id: sesion }).motivo, 'cerrado');
// Docente deshabilita
ahora = Date.parse('2026-09-20T12:30:00Z');
context.cvExamenConfigGuardar(ss, { docente_cedula: 'D1', examen_id: 'examen_parcial_1', asignatura: 'TIC', habilitado: false });
assert.equal(acc({ sesion_id: sesion }).motivo, 'deshabilitado');
assert.equal(J(context.cvExamenConfigPublica(ss, { examen_id: 'examen_parcial_1' })).configs.length, 0);

// 7) Rechazar invalida la clave ya enviada
context.cvExamenConfigGuardar(ss, cfgBase);
context.cvExamenResolver(ss, { docente_cedula: 'D1', cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', decision: 'rechazar' });
assert.equal(J(context.cvExamenAccesoValidar(ss, { examen_id: 'examen_parcial_1', email: 'beto@mail.com', clave: claveBeto })).motivo, 'clave');
assert.throws(() => context.cvExamenSolicitar(ss, { cedula: '222', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000201' }), /rechazada/);

// 8) Fuerza bruta: 10 fallos bloquean incluso la clave correcta
for (let i = 0; i < 10; i++) acc({ clave: 'AAAAAAA' + i });
assert.equal(acc({}).motivo, 'bloqueado');

// 9) Si el mail falla, no queda habilitado
users['333'] = { cedula: '333', nombre: 'Sin', apellido: 'Mail', email: '', rol: 'alumno', estado: 'activo' };
sheets.Pagos.rows.push(['333', 'Sin', 'Cuota', 1, '2026-09-01', 'pagado', '', 'admin', '001-001-0000333', 'cuota']);
assert.throws(() => context.cvExamenSolicitar(ss, { cedula: '333', examen_id: 'examen_parcial_1', asignatura: 'TIC', factura: '001-001-0000333' }), /correo válido/);
const fila333 = sheets.AccesoExamen.rows.find(x => x[0] === '333');
assert.equal(fila333[7], 'solicitado');

console.log('OK: 4 últimos pagos, ventana horaria, intentos N, clave por mail (hash), enlace directo, rechazo, fuerza bruta y fallo de mail.');
