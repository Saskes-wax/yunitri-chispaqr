import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esMontoValido } from '../../src/shared/dinero.js';

test('acepta precios en soles con hasta dos decimales', () => {
  assert.equal(esMontoValido('25.00'), true);
  assert.equal(esMontoValido('4.5'), true);
  assert.equal(esMontoValido(12), true);
});

test('rechaza montos con más de dos decimales, negativos o que no son números', () => {
  assert.equal(esMontoValido('12.505'), false);
  assert.equal(esMontoValido('-3'), false);
  assert.equal(esMontoValido('abc'), false);
});
