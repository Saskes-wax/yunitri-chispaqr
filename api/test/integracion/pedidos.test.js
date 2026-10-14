import '../entorno.js';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import {
  api,
  cerrarConexiones,
  crearPedido,
  iniciarSesion,
  PRODUCTO,
  registrarComensal,
  reiniciarBaseDeDatos,
  TOKEN_MESA_7,
} from '../ayudantes.js';

beforeEach(reiniciarBaseDeDatos);
after(cerrarConexiones);

const conToken = (token) => ({ Authorization: `Bearer ${token}` });

function pagar(token, idPedido, metodo = 'YAPE') {
  return api().post(`/api/v1/pedidos/${idPedido}/pago`).set(conToken(token)).send({ metodo });
}

function cambiarEstado(token, idPedido, estado) {
  return api().patch(`/api/v1/pedidos/${idPedido}/estado`).set(conToken(token)).send({ estado });
}

describe('POST /pedidos (comensal)', () => {
  test('crea el pedido con código de mesa, total del servidor y estado PENDIENTE_PAGO', async () => {
    const token = await registrarComensal();
    const pedido = await crearPedido(token, [
      { idProducto: PRODUCTO.TRUCHA, cantidad: 2, nota: 'sin ají' },
      { idProducto: PRODUCTO.GASEOSA, cantidad: 1 },
    ]);
    assert.equal(pedido.codigoPedido, 'M05-001');
    assert.equal(pedido.estado, 'PENDIENTE_PAGO');
    assert.equal(pedido.total, '54.50');
    assert.equal(pedido.numeroMesa, 5);
    assert.equal(pedido.lineas[0].nota, 'sin ají');
    assert.equal(pedido.idComensal, undefined);
  });

  test('la secuencia del código es del día y no se repite entre mesas', async () => {
    const tokenMesa5 = await registrarComensal();
    const tokenMesa7 = await registrarComensal(TOKEN_MESA_7, 'Juan');
    const primero = await crearPedido(tokenMesa5);
    const segundo = await crearPedido(tokenMesa7);
    assert.equal(primero.codigoPedido, 'M05-001');
    assert.equal(segundo.codigoPedido, 'M07-002');
  });

  test('pedidos simultáneos reciben códigos distintos', async () => {
    const token = await registrarComensal();
    const pedidos = await Promise.all([crearPedido(token), crearPedido(token), crearPedido(token)]);
    assert.equal(new Set(pedidos.map((pedido) => pedido.codigoPedido)).size, 3);
  });

  test('responde 409 si un producto está agotado y no guarda nada', async () => {
    const token = await registrarComensal();
    const respuesta = await api()
      .post('/api/v1/pedidos')
      .set(conToken(token))
      .send({ lineas: [{ idProducto: PRODUCTO.TRUCHA, cantidad: 1 }, { idProducto: PRODUCTO.MAZAMORRA_AGOTADA, cantidad: 1 }] })
      .expect(409);
    assert.equal(respuesta.body.error.codigo, 'PRODUCTO_AGOTADO');
    const { rows } = await pool.query('SELECT count(*)::integer AS pedidos FROM pedido');
    assert.equal(rows[0].pedidos, 0);
  });

  test('rechaza un precio enviado por el cliente (400)', async () => {
    const token = await registrarComensal();
    await api()
      .post('/api/v1/pedidos')
      .set(conToken(token))
      .send({ lineas: [{ idProducto: PRODUCTO.TRUCHA, cantidad: 1, precio: 1 }] })
      .expect(400);
  });

  test('responde 400 con un pedido vacío o una cantidad inválida', async () => {
    const token = await registrarComensal();
    await api().post('/api/v1/pedidos').set(conToken(token)).send({ lineas: [] }).expect(400);
    await api()
      .post('/api/v1/pedidos')
      .set(conToken(token))
      .send({ lineas: [{ idProducto: PRODUCTO.TRUCHA, cantidad: 0 }] })
      .expect(400);
  });

  test('responde 401 sin token y 401 con un token del personal', async () => {
    await api().post('/api/v1/pedidos').send({ lineas: [{ idProducto: 1, cantidad: 1 }] }).expect(401);
    const tokenCaja = await iniciarSesion('caja');
    await api()
      .post('/api/v1/pedidos')
      .set(conToken(tokenCaja))
      .send({ lineas: [{ idProducto: 1, cantidad: 1 }] })
      .expect(401);
  });
});

describe('GET /pedidos/codigo/{codigo}', () => {
  test('el comensal ve el estado de su pedido', async () => {
    const token = await registrarComensal();
    const pedido = await crearPedido(token);
    const respuesta = await api().get(`/api/v1/pedidos/codigo/${pedido.codigoPedido}`).set(conToken(token)).expect(200);
    assert.equal(respuesta.body.estado, 'PENDIENTE_PAGO');
  });

  test('un comensal no puede ver el pedido de otro (404)', async () => {
    const tokenRosa = await registrarComensal();
    const tokenJuan = await registrarComensal(TOKEN_MESA_7, 'Juan');
    const pedido = await crearPedido(tokenRosa);
    await api().get(`/api/v1/pedidos/codigo/${pedido.codigoPedido}`).set(conToken(tokenJuan)).expect(404);
  });

  test('el cajero busca por código y cocina no puede (403)', async () => {
    const pedido = await crearPedido(await registrarComensal());
    await api().get(`/api/v1/pedidos/codigo/${pedido.codigoPedido}`).set(conToken(await iniciarSesion('caja'))).expect(200);
    await api().get(`/api/v1/pedidos/codigo/${pedido.codigoPedido}`).set(conToken(await iniciarSesion('cocina'))).expect(403);
  });

  test('responde 400 con un código mal escrito', async () => {
    await api().get('/api/v1/pedidos/codigo/abc').set(conToken(await iniciarSesion('caja'))).expect(400);
  });
});

describe('GET /pedidos?estado=', () => {
  test('caja ve los pendientes de pago y cocina no los ve (403)', async () => {
    await crearPedido(await registrarComensal());
    const caja = await api().get('/api/v1/pedidos?estado=PENDIENTE_PAGO').set(conToken(await iniciarSesion('caja'))).expect(200);
    assert.equal(caja.body.total, 1);
    await api().get('/api/v1/pedidos?estado=PENDIENTE_PAGO').set(conToken(await iniciarSesion('cocina'))).expect(403);
  });

  test('cocina solo recibe pedidos pagados o en preparación', async () => {
    const tokenComensal = await registrarComensal();
    const pagado = await crearPedido(tokenComensal);
    await crearPedido(tokenComensal);
    await pagar(await iniciarSesion('caja'), pagado.idPedido).expect(201);

    const respuesta = await api()
      .get('/api/v1/pedidos?estado=PAGADO,EN_PREPARACION')
      .set(conToken(await iniciarSesion('cocina')))
      .expect(200);
    assert.deepEqual(respuesta.body.datos.map((pedido) => pedido.idPedido), [pagado.idPedido]);
    assert.equal(respuesta.body.datos[0].lineas.length, 1);
  });

  test('responde 400 con un estado que no existe', async () => {
    await api().get('/api/v1/pedidos?estado=FRITO').set(conToken(await iniciarSesion('caja'))).expect(400);
  });
});

describe('POST /pedidos/{id}/pago (caja)', () => {
  test('registra el pago con el total del pedido y lo pasa a PAGADO', async () => {
    const pedido = await crearPedido(await registrarComensal());
    const respuesta = await pagar(await iniciarSesion('caja'), pedido.idPedido, 'EFECTIVO').expect(201);
    assert.equal(respuesta.body.estado, 'PAGADO');
    assert.equal(respuesta.body.monto, pedido.total);
    assert.equal(respuesta.body.metodo, 'EFECTIVO');
  });

  test('dos cobros simultáneos del mismo pedido: uno pasa y el otro recibe 409', async () => {
    const pedido = await crearPedido(await registrarComensal());
    const token = await iniciarSesion('caja');
    const respuestas = await Promise.all([pagar(token, pedido.idPedido), pagar(token, pedido.idPedido)]);
    assert.deepEqual(respuestas.map((respuesta) => respuesta.status).sort(), [201, 409]);
    const { rows } = await pool.query('SELECT count(*)::integer AS pagos FROM pago');
    assert.equal(rows[0].pagos, 1);
  });

  test('responde 409 si el pedido fue cancelado', async () => {
    const pedido = await crearPedido(await registrarComensal());
    const token = await iniciarSesion('caja');
    await cambiarEstado(token, pedido.idPedido, 'CANCELADO').expect(200);
    await pagar(token, pedido.idPedido).expect(409);
  });

  test('el mozo no puede cobrar (403) y un método desconocido da 400', async () => {
    const pedido = await crearPedido(await registrarComensal());
    await pagar(await iniciarSesion('mozo'), pedido.idPedido).expect(403);
    await pagar(await iniciarSesion('caja'), pedido.idPedido, 'BITCOIN').expect(400);
  });

  test('responde 404 si el pedido no existe', async () => {
    await pagar(await iniciarSesion('caja'), 999).expect(404);
  });
});

describe('PATCH /pedidos/{id}/estado', () => {
  test('flujo completo: caja cobra, cocina prepara, mozo entrega y el trigger guarda el historial', async () => {
    const pedido = await crearPedido(await registrarComensal());
    await pagar(await iniciarSesion('caja'), pedido.idPedido).expect(201);
    const tokenCocina = await iniciarSesion('cocina');
    await cambiarEstado(tokenCocina, pedido.idPedido, 'EN_PREPARACION').expect(200);
    await cambiarEstado(tokenCocina, pedido.idPedido, 'LISTO').expect(200);
    const entregado = await cambiarEstado(await iniciarSesion('mozo'), pedido.idPedido, 'ENTREGADO').expect(200);
    assert.equal(entregado.body.estado, 'ENTREGADO');

    const { rows } = await pool.query(
      'SELECT estado_nuevo FROM historial_estado_pedido WHERE id_pedido = $1 ORDER BY id_historial_estado_pedido',
      [pedido.idPedido],
    );
    assert.deepEqual(rows.map((fila) => fila.estado_nuevo), ['PAGADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO']);
  });

  test('cocina no puede preparar un pedido sin pagar (409)', async () => {
    const pedido = await crearPedido(await registrarComensal());
    const respuesta = await cambiarEstado(await iniciarSesion('cocina'), pedido.idPedido, 'EN_PREPARACION').expect(409);
    assert.equal(respuesta.body.error.codigo, 'TRANSICION_NO_PERMITIDA');
  });

  test('cada rol solo fija sus estados (403)', async () => {
    const pedido = await crearPedido(await registrarComensal());
    await cambiarEstado(await iniciarSesion('cocina'), pedido.idPedido, 'CANCELADO').expect(403);
    await cambiarEstado(await iniciarSesion('mozo'), pedido.idPedido, 'LISTO').expect(403);
    await cambiarEstado(await iniciarSesion('caja'), pedido.idPedido, 'PAGADO').expect(403);
  });

  test('caja no puede cancelar un pedido ya pagado (409)', async () => {
    const pedido = await crearPedido(await registrarComensal());
    const token = await iniciarSesion('caja');
    await pagar(token, pedido.idPedido).expect(201);
    await cambiarEstado(token, pedido.idPedido, 'CANCELADO').expect(409);
  });
});

describe('trigger trg_pedido_cambio_estado', () => {
  test('la base de datos rechaza cocinar un pedido sin pagar aunque se salte la API', async () => {
    const pedido = await crearPedido(await registrarComensal());
    await assert.rejects(
      pool.query(`UPDATE pedido SET estado = 'EN_PREPARACION' WHERE id_pedido = $1`, [pedido.idPedido]),
      (err) => err.code === 'P0001',
    );
  });
});
