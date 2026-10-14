import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aCentimos, aSoles, esMontoValido } from '../../src/shared/dinero.js';

test('convierte soles en texto a céntimos enteros', () => {
  assert.equal(aCentimos('25.00'), 2500);
  assert.equal(aCentimos('4.5'), 450);
  assert.equal(aCentimos('12'), 1200);
  assert.equal(aCentimos('0.10'), 10);
});

test('convierte céntimos a soles con dos decimales', () => {
  assert.equal(aSoles(2500), '25.00');
  assert.equal(aSoles(450), '4.50');
  assert.equal(aSoles(5), '0.05');
});

test('evita el error de float al sumar 0.10 + 0.20', () => {
  assert.equal(aSoles(aCentimos('0.10') + aCentimos('0.20')), '0.30');
});

test('rechaza montos con más de dos decimales o negativos', () => {
  assert.equal(esMontoValido('12.505'), false);
  assert.equal(esMontoValido('-3'), false);
  assert.throws(() => aCentimos('abc'), TypeError);
  assert.throws(() => aSoles(-1), TypeError);
});
