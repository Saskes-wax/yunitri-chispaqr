import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Conflicto } from '../../src/shared/errores.js';
import {
  armarLineas,
  generarCodigoPedido,
  validarTransicion,
} from '../../src/modulos/pedidos/pedidos.reglas.js';

test('permite las transiciones del contrato', () => {
  assert.doesNotThrow(() => validarTransicion('PENDIENTE_PAGO', 'PAGADO'));
  assert.doesNotThrow(() => validarTransicion('PENDIENTE_PAGO', 'CANCELADO'));
  assert.doesNotThrow(() => validarTransicion('PAGADO', 'EN_PREPARACION'));
  assert.doesNotThrow(() => validarTransicion('EN_PREPARACION', 'LISTO'));
  assert.doesNotThrow(() => validarTransicion('LISTO', 'ENTREGADO'));
});

test('rechaza cocinar un pedido que no está pagado', () => {
  assert.throws(() => validarTransicion('PENDIENTE_PAGO', 'EN_PREPARACION'), Conflicto);
});

test('rechaza cancelar un pedido ya pagado', () => {
  assert.throws(() => validarTransicion('PAGADO', 'CANCELADO'), Conflicto);
});

test('un pedido entregado o cancelado ya no cambia', () => {
  assert.throws(() => validarTransicion('ENTREGADO', 'LISTO'), Conflicto);
  assert.throws(() => validarTransicion('CANCELADO', 'PAGADO'), Conflicto);
});

test('genera el código con la mesa y el número de pedido', () => {
  assert.equal(generarCodigoPedido(5, 17), 'M05-017');
  assert.equal(generarCodigoPedido(12, 1), 'M12-001');
  assert.equal(generarCodigoPedido(3, 1234), 'M03-1234');
});

test('cada línea toma el precio vigente de la carta', () => {
  const productos = new Map([
    [1, { precio: '25.00' }],
    [2, { precio: '4.50' }],
  ]);
  const lineas = armarLineas(
    [
      { idProducto: 1, cantidad: 2, nota: 'sin ají' },
      { idProducto: 2, cantidad: 3 },
    ],
    productos,
  );
  assert.deepEqual(lineas[0], { idProducto: 1, cantidad: 2, nota: 'sin ají', precioUnitario: '25.00' });
  assert.equal(lineas[1].precioUnitario, '4.50');
  assert.equal(lineas[1].nota, null);
});
