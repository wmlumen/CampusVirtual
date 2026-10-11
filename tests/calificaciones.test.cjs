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

test('validarPlan avisa ponderación incompleta y falta de final', () => {
  const e = N.validarPlan({ evaluaciones: [{ nombre: 'P1', tipo: 'parcial', ponderacion: 30 }, { nombre: 'TP', tipo: 'trabajo_practico', ponderacion: 10 },
    { nombre: 'Rec', tipo: 'recuperatorio', ponderacion: 5 }] });
  assert.ok(e.some(x => /suma 40%/.test(x)));
  assert.ok(e.some(x => /Falta el examen final/.test(x)));
  assert.ok(e.some(x => /Rec: el recuperatorio no lleva ponderación/.test(x)));
});
