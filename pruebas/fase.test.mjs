import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarFase, nivelGrasa, senalCambio } from '../js/fase.js';

const base = { sexo: 'hombre', edad: 34, peso: 82, altura: 178, pasos: 6500, dias: 4, anos: 'mas3',
  silueta: 'C', tendencia: 'igual', ultima: 'nada', fuerza: 'estancada', comida: 'finde', dudando: '6a12' };

test('cintura alta: definir primero', () => {
  const r = evaluarFase({ ...base, cintura: 96, silueta: 'E' }); // 0,54
  assert.equal(r.fase, 'definir');
  assert.ok(r.kcal[0] < r.mantenimiento && r.kcal[1] < r.mantenimiento);
  assert.deepEqual(r.proteina, [1.8, 2]);
  assert.equal(r.salida.objetivo, Math.round(0.47 * 178)); // 84
  assert.equal(r.salida.diferencia, 12); // parte de 96
  assert.match(r.salida.texto, /Partes de 96 cm/);
});

test('cintura media y viene de volumen: minicut', () => {
  const r = evaluarFase({ ...base, cintura: 88, ultima: 'volumen', tendencia: 'sube' }); // 0,49
  assert.equal(r.fase, 'minicut');
  assert.ok(r.mantenimiento - r.kcal[1] >= 750 && r.mantenimiento - r.kcal[0] <= 1050);
  assert.equal(r.pasos, 12000);
  assert.deepEqual(r.duracion.kg, [6.6, 8.2]); // 8-10 % de 82 kg, como la herramienta del minicut
});

test('magro: volumen ya', () => {
  const r = evaluarFase({ ...base, cintura: 79, silueta: 'B' }); // 0,44
  assert.equal(r.fase, 'volumen');
  assert.ok(r.kcal[0] > r.mantenimiento);
  assert.deepEqual(r.proteina, [1.6, 1.8]);
});

test('medio sin venir de volumen: mantenimiento con progresión', () => {
  const r = evaluarFase({ ...base, cintura: 88, ultima: 'definicion', tendencia: 'baja' });
  assert.equal(r.fase, 'mantener');
});

test('con ansiedad nunca minicut', () => {
  const r = evaluarFase({ ...base, cintura: 88, ultima: 'volumen', comida: 'ansiedad' });
  assert.equal(r.fase, 'definir');
});

test('menos de un año entrenando: no minicut', () => {
  const r = evaluarFase({ ...base, cintura: 88, ultima: 'volumen', anos: 'menos1' });
  assert.equal(r.fase, 'mantener');
});

test('silueta y cintura: manda la silueta si casi coinciden; si se contradicen, nivel medio', () => {
  assert.equal(nivelGrasa({ sexo: 'hombre', cintura: 88, altura: 178, silueta: 'B' }).nivel, 0); // cintura media, silueta baja
  assert.equal(nivelGrasa({ sexo: 'hombre', cintura: 96, altura: 178, silueta: 'A' }).nivel, 1); // contradicción total
  assert.equal(nivelGrasa({ sexo: 'mujer', cintura: 70, altura: 165, silueta: 'G' }).nivel, 1);
  assert.equal(nivelGrasa({ sexo: 'mujer', cintura: 70, altura: 165, silueta: 'B' }).rango, '16-20 %');
});

test('sin silueta avisa', () => {
  assert.throws(() => evaluarFase({ ...base, cintura: 88, silueta: undefined }), /silueta/);
});

test('nunca baja del mínimo de calorías', () => {
  const r = evaluarFase({ ...base, sexo: 'mujer', peso: 55, altura: 158, edad: 45, pasos: 3500, dias: 2, cintura: 90, silueta: 'F' });
  assert.ok(r.kcal[0] >= 1400);
});

test('la señal de cambio parte de la cintura real, no solo de la altura', () => {
  const a = senalCambio('definir', 'mujer', 90, 165); // objetivo 81: 9 cm menos
  const b = senalCambio('definir', 'mujer', 84.5, 165); // objetivo 81: 3,5 cm menos
  assert.equal(a.objetivo, 81); assert.equal(a.diferencia, 9);
  assert.equal(b.diferencia, 3.5);
  assert.match(b.texto, /Partes de 84,5 cm/);
  assert.notEqual(a.texto, b.texto);
});

test('si ya está por debajo del objetivo, no da una cifra absurda: manda la silueta', () => {
  const r = senalCambio('definir', 'hombre', 80, 178); // objetivo 84 y ya tiene 80
  assert.equal(r.objetivo, null);
  assert.match(r.texto, /silueta B/);
  assert.doesNotMatch(r.texto, /84 cm/);
});

test('volumen: tope desde la cintura real; si ya está en el tope, no dejarla subir', () => {
  const v = senalCambio('volumen', 'hombre', 79, 178); // tope 89: 10 cm más
  assert.equal(v.objetivo, 89); assert.equal(v.diferencia, 10);
  const w = senalCambio('volumen', 'hombre', 90, 178);
  assert.equal(w.objetivo, null); assert.match(w.texto, /No dejes que pase de 90 cm/);
});
