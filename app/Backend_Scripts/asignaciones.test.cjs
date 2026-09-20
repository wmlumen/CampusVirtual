// Prueba de 03_Asignaciones_Academico_v08.4.gs (asignación de docentes y aprobación de exámenes) con Sheets simulados.
// Ejecutar: node asignaciones.test.cjs   (junto a 02_Examenes_Factura_v08.4.gs y 03_Asignaciones_Academico_v08.4.gs)
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const pad = (n, l = 2) => String(n).padStart(l, '0');
function fmt(date, f) {
  const d = new Date(date.getTime() - 3 * 3600e3);
  const m = { yyyy: pad(d.getUTCFullYear(), 4), MM: pad(d.getUTCMonth() + 1), dd: pad(d.getUTCDate()), HH: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()) };
  return f.replace(/yyyy|MM|dd|HH|mm/g, k => m[k]);
}
function makeSheet(name) {
  const rows = [];
  return {
    name, rows,
    getLastRow: () => rows.length,
    appendRow: r => { rows.push([...r]); },
    getDataRange: () => ({ getValues: () => rows.map(r => [...r]) }),
    getRange: (r, c, nr = 1, nc = 1) => ({
      setValue: v => { while (rows.length < r) rows.push([]); rows[r - 1][c - 1] = v; },
      setValues: vs => { vs.forEach((row, i) => { while (rows.length < r + i) rows.push([]); row.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = v; }); }); },
      getValue: () => (rows[r - 1] || [])[c - 1],
      setNumberFormat() {}, setFontWeight() {}, setBackground() {}, setFontColor() {}
    }),
    setFrozenRows() {}
  };
}
const sheets = {};
const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) };
const norm = v => String(v == null ? '' : v).replace(/[^0-9A-Za-z]/g, '');

// Usuarios: cabecera como en 01 (cvAuthGetAllUsers normaliza a minúsculas)
sheets.Usuarios = makeSheet('Usuarios');
sheets.Usuarios.rows.push(['cedula', 'nombre', 'apellido', 'email', 'rol', 'estado', 'grado', 'carrera', 'seccion', 'updated_at']);
[
  ['A1', 'Ana', 'Académica', 'a@x.com', 'academico', 'activo', '', '', '', ''],
  ['AD', 'Admin', 'Uno', 'ad@x.com', 'admin', 'activo', '', '', '', ''],
  ['D1', 'Diego', 'Docente', 'd1@x.com', 'docente', 'pendiente', 'GRADO', 'ADMINISTRACION DE EMPRESAS', 'S026', ''],
  ['D2', 'Dora', 'Docente', 'd2@x.com', 'docente', 'activo', 'GRADO', 'ADMINISTRACION ADUANERA', 'LV026', ''],
  ['D3', 'Dario', 'Baja', 'd3@x.com', 'docente', 'inactivo', '', '', '', ''],
  ['S1', 'Sara', 'Alumna', 's1@x.com', 'alumno', 'activo', 'GRADO', 'X', 'S026', ''],
  ['S2', 'Sofía', 'Rol', 's2@x.com', 'alumno', 'activo', '', '', '', '']
].forEach(r => sheets.Usuarios.rows.push(r));
// S2 es alumna pero tiene rol docente agregado en Roles
sheets.Roles = makeSheet('Roles');
sheets.Roles.rows.push(['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']);
sheets.Roles.rows.push(['D2', 'Dora Docente', 'docente', 'ADMINISTRACION ADUANERA', 'LV026', 'TIC', 'activo', '01/09/2026', 'AD']);
sheets.Roles.rows.push(['S2', 'Sofía Rol', 'docente', 'X', 'S026', 'TIC', 'activo', '01/09/2026', 'AD']);
sheets.Roles.rows.push(['S1', 'Sara Alumna', 'alumno', 'X', 'S026', '', 'activo', '01/09/2026', 'AD']);

const context = {
  Date, Utilities: { formatDate: (d, tz, f) => fmt(d, f) },
  SpreadsheetApp: { flush() {} },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  cvAuthNormalizeCedula: norm,
  cvAuthSanitizeText: (v, n) => String(v == null ? '' : v).trim().slice(0, n || 100).replace(/<[^>]*>/g, ''),
  cvAuthGetAllUsers: () => {
    const d = sheets.Usuarios.rows, h = d[0];
    return d.slice(1).map((r, i) => { const o = { _row: i + 2 }; h.forEach((k, j) => { o[k] = r[j]; }); return o; });
  },
  cvAuthFindUser: (s, c) => context.cvAuthGetAllUsers().filter(u => norm(u.cedula) === norm(c))[0] || null
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '02_Examenes_Factura_v08.4.gs'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '03_Asignaciones_Academico_v08.4.gs'), 'utf8'), context);
const J = x => JSON.parse(JSON.stringify(x));
const F = context;

// 1) Permisos: docente, alumno y desconocido no pueden; académico y admin sí
for (const c of ['D2', 'S1', 'ZZ', '']) assert.throws(() => F.cvAsigDocentesListar(ss, { academico_cedula: c }), /Acceso Académico/);
assert.throws(() => F.cvExamenAprobDecidir(ss, { academico_cedula: 'D2', examen_id: 'examen_virtual' }, 'aprobado'), /Acceso Académico/);

// 2) Cola: pendientes primero, luego sin grupos, luego con grupos; el rol agregado en Roles aparece
let r = J(F.cvAsigDocentesListar(ss, { academico_cedula: 'A1' }));
assert.deepEqual(r.docentes.map(d => d.cedula), ['D1', 'D3', 'D2', 'S2']);
assert.equal(r.pendientes, 1);
assert.equal(r.sin_asignar, 1); // D3 (inactivo, sin grupos)
assert.equal(r.docentes[0].declarado.carrera, 'ADMINISTRACION DE EMPRESAS');
assert.equal(r.docentes.find(d => d.cedula === 'D2').asignaciones.length, 1);
assert.equal(J(F.cvAsigDocentesListar(ss, { academico_cedula: 'AD' })).ok, true);

// 3) Asignar: validaciones
const base = { academico_cedula: 'A1', docente_cedula: 'D2', asignatura: 'INF', grupos: [{ grado: 'GRADO', carrera: 'ADMINISTRACION DE EMPRESAS', seccion: 's026' }, { grado: 'GRADO', carrera: 'ADMINISTRACION ADUANERA', seccion: 'S026' }] };
assert.throws(() => F.cvAsigGuardar(ss, { ...base, academico_cedula: 'D2' }), /Acceso Académico/);
assert.throws(() => F.cvAsigGuardar(ss, { ...base, asignatura: '' }), /asignatura/);
assert.throws(() => F.cvAsigGuardar(ss, { ...base, grupos: [{ carrera: 'X' }] }), /al menos un grupo/);
assert.throws(() => F.cvAsigGuardar(ss, { ...base, docente_cedula: 'S1' }), /docente registrado/);
assert.throws(() => F.cvAsigGuardar(ss, { ...base, docente_cedula: 'D3' }), /inactivo/);
assert.throws(() => F.cvAsigGuardar(ss, { ...base, docente_cedula: 'D1' }), /pendiente/);

// 4) Asignar: S026 con varias carreras a la vez (una fila de Roles por grupo, con Grado en la columna J)
r = J(F.cvAsigGuardar(ss, base));
assert.equal(r.agregados, 2);
const filasD2 = sheets.Roles.rows.filter(x => x[0] === 'D2' && x[5] === 'INF');
assert.equal(filasD2.length, 2);
assert.deepEqual(filasD2.map(x => x[4]), ['S026', 'S026']);          // sección normalizada a mayúsculas
assert.equal(filasD2[0][2], 'docente'); assert.equal(filasD2[0][6], 'activo'); assert.equal(filasD2[0][8], 'A1'); assert.equal(filasD2[0][9], 'GRADO');
assert.equal(sheets.Roles.rows[0][9], 'Grado'); // cabecera nueva al final
// repetir no duplica
r = J(F.cvAsigGuardar(ss, base));
assert.equal(r.agregados, 0); assert.equal(r.repetidos, 2);
assert.equal(sheets.Roles.rows.filter(x => x[0] === 'D2' && x[5] === 'INF').length, 2);

// 5) Cuenta pendiente: aprobar junto con la asignación
r = J(F.cvAsigGuardar(ss, { academico_cedula: 'A1', docente_cedula: 'D1', asignatura: 'TIC', aprobar: true, grupos: [{ grado: 'GRADO', carrera: 'ADMINISTRACION DE EMPRESAS', seccion: 'S026' }] }));
assert.equal(r.cuenta_aprobada, true);
assert.equal(F.cvAuthFindUser(ss, 'D1').estado, 'activo');
assert.equal(J(F.cvAsigDocentesListar(ss, { academico_cedula: 'A1' })).pendientes, 0);

// 6) Revocar y reactivar
const filaRev = sheets.Roles.rows.findIndex(x => x[0] === 'D2' && x[5] === 'INF') + 1;
assert.throws(() => F.cvAsigRevocar(ss, { academico_cedula: 'A1', docente_cedula: 'D1', fila: filaRev }), /No se encontró/);
assert.throws(() => F.cvAsigRevocar(ss, { academico_cedula: 'A1', docente_cedula: 'S1', fila: 4 }), /No se encontró/); // fila de rol alumno
F.cvAsigRevocar(ss, { academico_cedula: 'A1', docente_cedula: 'D2', fila: filaRev });
assert.equal(sheets.Roles.rows[filaRev - 1][6], 'inactivo');
r = J(F.cvAsigGuardar(ss, { ...base, grupos: [base.grupos[0]] }));
assert.equal(r.reactivados, 1); assert.equal(sheets.Roles.rows[filaRev - 1][6], 'activo');

// 7) Decidir cuenta pendiente (rechazo)
sheets.Usuarios.rows.push(['D9', 'Nuevo', 'Docente', 'd9@x.com', 'docente', 'pendiente', '', '', '', '']);
assert.throws(() => F.cvAsigDocenteDecidir(ss, { academico_cedula: 'A1', docente_cedula: 'D2', decision: 'rechazar' }), /ya no está pendiente/);
assert.throws(() => F.cvAsigDocenteDecidir(ss, { academico_cedula: 'A1', docente_cedula: 'D9', decision: 'x' }), /Decisión/);
F.cvAsigDocenteDecidir(ss, { academico_cedula: 'A1', docente_cedula: 'D9', decision: 'rechazar' });
assert.equal(F.cvAuthFindUser(ss, 'D9').estado, 'inactivo');

// 8) Aprobación de exámenes: por defecto todo pendiente, incluso lo que el docente aún no configuró
r = J(F.cvExamenAprobLista(ss, { academico_cedula: 'A1' }));
assert.equal(r.examenes.length, 6);
assert.equal(r.pendientes_count, 6);
assert.equal(J(F.cvExamenAprobEstado(ss, { examen_id: 'examen_virtual' })).aprobado, false);
assert.throws(() => F.cvExamenAprobEstado(ss, { examen_id: 'otro' }), /desconocido/);

// El docente configura (ConfigExamen) y el académico lo ve con docente/asignatura/intentos
sheets.ConfigExamen = makeSheet('ConfigExamen');
sheets.ConfigExamen.rows.push(F.CV_CONFIG_EXAMEN_HEADERS);
sheets.ConfigExamen.rows.push(['examen_virtual', 'TIC', 'Sí', '2026-09-20', '08:00', '2026-09-20', '10:00', 2, 'D2', 'x']);
sheets.ConfigExamen.rows.push(['examen_virtual', 'INF', 'Sí', '2026-09-21', '08:00', '2026-09-21', '10:00', 3, 'D1', 'x']);
r = J(F.cvExamenAprobLista(ss, { academico_cedula: 'A1' }));
const ev = r.examenes.find(e => e.examen_id === 'examen_virtual');
assert.equal(ev.docente_nombre, 'Dora Docente, Diego Docente'); assert.deepEqual(ev.asignaturas, ['TIC', 'INF']); assert.equal(ev.num_intentos, 3); assert.equal(ev.configurado, true);
assert.equal(r.examenes.find(e => e.examen_id === 'examen_parcial_1').configurado, false);

// Aprobar → exam-lock lo ve aprobado; revocar → vuelve a pendiente; rechazar deja motivo
assert.throws(() => F.cvExamenAprobDecidir(ss, { academico_cedula: 'A1', examen_id: 'nada' }, 'aprobado'), /desconocido/);
assert.throws(() => F.cvExamenAprobDecidir(ss, { academico_cedula: 'A1', examen_id: 'examen_virtual' }, 'raro'), /Estado/);
F.cvExamenAprobDecidir(ss, { academico_cedula: 'A1', examen_id: 'examen_virtual' }, 'aprobado');
let est = J(F.cvExamenAprobEstado(ss, { examen_id: 'examen_virtual' }));
assert.equal(est.aprobado, true); assert.equal(est.academico_cedula, null);
assert.equal(J(F.cvExamenAprobLista(ss, { academico_cedula: 'A1' })).pendientes_count, 5);
F.cvExamenAprobDecidir(ss, { academico_cedula: 'AD', examen_id: 'examen_virtual', motivo: 'Faltan preguntas' }, 'rechazado');
assert.equal(J(F.cvExamenAprobEstado(ss, { examen_id: 'examen_virtual' })).aprobado, false);
assert.equal(sheets.AprobacionExamen.rows.length, 2);   // una sola fila por examen (se actualiza, no se duplica)
assert.equal(J(F.cvExamenAprobLista(ss, { academico_cedula: 'A1' })).examenes.find(e => e.examen_id === 'examen_virtual').motivo, 'Faltan preguntas');
F.cvExamenAprobDecidir(ss, { academico_cedula: 'A1', examen_id: 'examen_virtual' }, 'aprobado');
F.cvExamenAprobDecidir(ss, { academico_cedula: 'A1', examen_id: 'examen_virtual' }, 'pendiente');
assert.equal(J(F.cvExamenAprobEstado(ss, { examen_id: 'examen_virtual' })).estado, 'pendiente');

console.log('OK: permisos, cola de docentes, asignación por grupos (S026 multi-carrera), reactivar/revocar, aprobar/rechazar cuenta, aprobación de exámenes.');
