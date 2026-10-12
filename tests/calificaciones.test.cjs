// Pruebas del cálculo único de notas (app/js/calificaciones.js). Uso: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const N = require('../app/js/calificaciones.js');

// Plan de Sociología (programa oficial): 2 parciales 40%, participación 10%, final 50%; TP requisito sin peso.
const SOC = {
  evaluaciones: [
    { id: 'p1', nombre: 'Primer parcial', tipo: 'parcial', ponderacion: 20, puntaje_max: 20, requisito: true },
    { id: 'p2', nombre: 'Segundo parcial', tipo: 'parcial', ponderacion: 20, puntaje_max: 20, requisito: true },
    { id: 'tp', nombre: 'Trabajo práctico', tipo: 'trabajo_practico', unidad: 4, ponderacion: 0, puntaje_max: 10, requisito: true },
    { id: 'as', nombre: 'Participación', tipo: 'asistencia', ponderacion: 10 },
    { id: 'fi', nombre: 'Examen final', tipo: 'final', ponderacion: 50, puntaje_max: 40 }
  ],
  reglas: { aprobacion_pct: 70, asistencia_min_pct: 80 }
};

test('el plan de Sociología es válido', () => {
  assert.deepStrictEqual(N.validarPlan(SOC), []);
});

test('pondera según el plan, no promedio simple', () => {
  const r = N.calcular(SOC, { p1: { obtenido: 20 }, p2: { obtenido: 10 }, tp: { obtenido: 8 }, fi: { obtenido: 32 } }, 90);
  // p1 100%*20 + p2 50%*20 + asistencia 90%*10 + final 80%*50 = 20 + 10 + 9 + 40 = 79
  assert.strictEqual(r.acumulado_pct, 79);
  assert.strictEqual(r.nota, 3);
  assert.strictEqual(r.texto, 'Bueno');
  assert.strictEqual(r.completo, true);
  assert.strictEqual(r.aprobado, true);
});

test('sin derecho a final: parcial reprobado, TP pendiente y asistencia baja', () => {
  const r = N.calcular(SOC, { p1: { obtenido: 18 }, p2: { obtenido: 10 } }, 75);
  assert.strictEqual(r.derecho_final, false);
  assert.strictEqual(r.faltan.length, 3);
  assert.match(r.faltan.join(' | '), /Asistencia 75% \(mínimo 80%\)/);
  assert.match(r.faltan.join(' | '), /Segundo parcial: no aprobado \(50%\)/);
  assert.match(r.faltan.join(' | '), /Trabajo práctico: pendiente/);
  assert.strictEqual(r.completo, false);
  assert.strictEqual(r.aprobado, false);
});

test('el recuperatorio reemplaza al parcial más bajo', () => {
  const plan = { evaluaciones: SOC.evaluaciones.concat([{ id: 'rec', nombre: 'Recuperatorio', tipo: 'recuperatorio', ponderacion: 0, puntaje_max: 20 }]) };
  const r = N.calcular(plan, { p1: { obtenido: 18 }, p2: { obtenido: 8 }, rec: { obtenido: 16 }, tp: { obtenido: 7 } }, 85);
  const p2 = r.evaluaciones.find(e => e.id === 'p2');
  assert.strictEqual(p2.reemplazado_por, 'rec');
  assert.strictEqual(p2.pct, 80);
  assert.strictEqual(r.derecho_final, true);
});

test('escala oficial 1 a 5', () => {
  assert.deepStrictEqual([0, 69.9, 70, 77.9, 78, 86, 94, 100].map(p => N.escalaDe(p).nota), [1, 1, 2, 2, 3, 4, 5, 5]);
});

test('tipos viejos del Constructor se reconocen', () => {
  assert.strictEqual(N.normalizarTipo('trabajo'), 'trabajo_practico');
  assert.strictEqual(N.normalizarTipo('proyecto'), 'monografia');
});

const ASIG = { codigo: 'SOC', nombre: 'Sociología', unidades: [1, 2, 3, 4, 5, 6].map(n => ({ numero: n })) };
const PLAN = { evaluaciones: [
  { id: 'p1', nombre: 'P1', tipo: 'parcial', origen: 'examen_online', examen_id: 'soc_p1', puntaje_max: 20, ponderacion: 20 },
  { id: 'tp', nombre: 'TP', tipo: 'trabajo_practico', origen: 'entrega_pdf', unidad: 4, ponderacion: 0, requisito: true },
  { id: 'as', nombre: 'Asist', tipo: 'asistencia', origen: 'asistencia', ponderacion: 10 },
  { id: 'fi', nombre: 'Final', tipo: 'final', origen: 'manual', puntaje_max: 40, ponderacion: 70 }
] };

test('asistencia: sesiones del alumno sobre sesiones dictadas, por código o nombre de la asignatura', () => {
  const regs = [
    { asignatura: 'SOC', fecha: '2026-05-01', estado: 'presente' },
    { asignatura: 'Sociologia', fecha: '2026-05-08', estado: 'presente' },
    { asignatura: 'SOC', fecha: '2026-05-08', estado: 'presente' },          // misma sesión: no cuenta doble
    { asignatura: 'TIC', fecha: '2026-05-15', estado: 'presente' },          // otra materia
    { asignatura: '', fecha: '2026-05-22', estado: 'presente' }              // importado sin materia
  ];
  assert.strictEqual(N.asistenciaPct(regs, ASIG, 4), 50);
  assert.strictEqual(N.asistenciaPct(regs, ASIG, null), 33);              // sin dato del docente: 6 unidades
  assert.strictEqual(N.sesionesDictadas(regs, ASIG), 0);   // cada sesión tiene un solo presente
  const dos = regs.concat([{ asignatura: 'SOC', fecha: '2026-05-01', estado: 'presente', cedula: 'B' }, { asignatura: 'SOC', fecha: '2026-05-29', estado: 'ausente', cedula: 'C' }]);
  assert.strictEqual(N.sesionesDictadas(dos.map((r, i) => Object.assign({ cedula: r.cedula || 'A' }, r)), ASIG), 1);
});

test('notas desde fuentes: mejor intento, trabajo calificado, asistencia y prioridad de la guardada', () => {
  const f = {
    intentos: [{ examen_id: 'soc_p1', intentos: [{ puntaje: 6, total: 10 }, { pct: 85 }] }],
    trabajos: [{ asignatura: 'SOC', unidad: 4, estado: 'calificado', calificacion: 8, puntaje_max: 10 }],
    asistencia_pct: 90
  };
  const r = N.notasDesdeFuentes(PLAN, f, 'SOC');
  assert.deepStrictEqual(r.notas.p1, { obtenido: 17, maximo: 20 });
  assert.deepStrictEqual(r.notas.tp, { obtenido: 8, maximo: 10 });
  assert.deepStrictEqual(r.notas.as, { obtenido: 90, maximo: 100 });
  assert.strictEqual(r.notas.fi, undefined);
  assert.deepStrictEqual(r.fuente, { p1: 'examen', tp: 'trabajo', as: 'asistencia' });
  const g = N.notasDesdeFuentes(PLAN, Object.assign({ guardadas: [{ evaluacion_id: 'p1', obtenido: 12, maximo: 20 }, { evaluacion_id: 'fi', obtenido: 30, maximo: 40 }] }, f), 'SOC');
  assert.deepStrictEqual(g.notas.p1, { obtenido: 12, maximo: 20 });
  assert.strictEqual(g.fuente.fi, 'guardada');
});

test('trabajo sin calificar no cuenta', () => {
  const r = N.notasDesdeFuentes(PLAN, { trabajos: [{ asignatura: 'SOC', unidad: 4, estado: 'entregado', calificacion: null }] }, 'SOC');
  assert.strictEqual(r.notas.tp, undefined);
});

test('asistencia contra clases declaradas: presencial, virtual, examen, otra sección y suspendida', () => {
  const clases = [
    { fecha: '2026-09-05', secciones: ['S026'], modalidad: 'presencial', tipo: 'clase' },
    { fecha: '2026-09-15', secciones: ['S026', 'LV026'], modalidad: 'virtual', tipo: 'clase' },        // conjunta
    { fecha: '2026-09-22', secciones: ['S026', 'LV026'], modalidad: 'virtual', tipo: 'examen', examen_id: 'TIC026-P1' },
    { fecha: '2026-09-26', secciones: ['S026'], modalidad: 'presencial', tipo: 'clase', estado: 'suspendida' },
    { fecha: '2026-09-14', secciones: ['LV026'], modalidad: 'presencial', tipo: 'clase' }             // no es de su sección
  ];
  const regs = [
    { asignatura: 'TIC', fecha: '2026-09-05', estado: 'presente' },
    { asignatura: 'TIC', fecha: '2026-09-15', estado: 'observado' },      // palabra incorrecta: no cuenta
    { asignatura: 'TIC', fecha: '2026-09-14', estado: 'presente' }        // clase de otra sección: no suma
  ];
  const r = N.asistenciaPorClases(regs, [{ examen_id: 'TIC026-P1', intentos: [{ puntaje: 9 }] }], clases, 'S026', { codigo: 'TIC', nombre: 'Tecnología' });
  assert.strictEqual(r.total, 3);
  assert.strictEqual(r.presentes, 2);
  assert.strictEqual(r.pct, 67);
  assert.deepStrictEqual(r.detalle.map(d => d.por), ['asistencia', '', 'examen']);
  assert.strictEqual(N.asistenciaPorClases(regs, [], [], 'S026', { codigo: 'TIC' }), null);
});

test('carreraClave unifica las formas de escribir una carrera', () => {
  const k = N.carreraClave;
  assert.strictEqual(k('Administración de Empresa'), k('Licenciatura en Administración de Empresas'));
  assert.strictEqual(k('ADMINISTRACION DE EMPRESAS'), 'ADMINISTRACION DE EMPRESAS');
  assert.strictEqual(k('Gestión Pública'), k('Licenciatura en Administración y Gestión Pública'));
  assert.strictEqual(k('Administración Aduanera'), k('Licenciatura en Administración Aduanera'));
  assert.strictEqual(k('Licenciatura en Ciencias Contables'), 'CONTABILIDAD');
  assert.notStrictEqual(k('Licenciatura en Comercio Internacional'), k('Ingeniería Comercial'));
  assert.strictEqual(k(''), '');
});

test('validarPlan avisa ponderación incompleta y falta de final', () => {
  const e = N.validarPlan({ evaluaciones: [{ nombre: 'P1', tipo: 'parcial', ponderacion: 30 }, { nombre: 'TP', tipo: 'trabajo_practico', ponderacion: 10 },
    { nombre: 'Rec', tipo: 'recuperatorio', ponderacion: 5 }] });
  assert.ok(e.some(x => /suma 40%/.test(x)));
  assert.ok(e.some(x => /Falta el examen final/.test(x)));
  assert.ok(e.some(x => /Rec: el recuperatorio no lleva ponderación/.test(x)));
});
