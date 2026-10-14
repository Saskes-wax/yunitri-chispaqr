import '../entorno.js';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import {
  api,
  cerrarConexiones,
  iniciarSesion,
  reiniciarBaseDeDatos,
  TOKEN_MESA_5,
  TOKEN_MESA_INACTIVA,
} from '../ayudantes.js';

beforeEach(reiniciarBaseDeDatos);
after(cerrarConexiones);

describe('GET /mesas/{token_qr}', () => {
  test('reconoce la mesa por su QR', async () => {
    const respuesta = await api().get(`/api/v1/mesas/${TOKEN_MESA_5}`).expect(200);
    assert.deepEqual(respuesta.body, { numero: 5, estado: 'LIBRE' });
  });

  test('responde 404 si el QR no existe', async () => {
    await api().get('/api/v1/mesas/qr-que-no-existe').expect(404);
  });
});

describe('POST /mesas/{token_qr}/comensales', () => {
  test('registra al comensal, abre la sesión y ocupa la mesa', async () => {
    const respuesta = await api()
      .post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`)
      .send({ nombreAlias: '  Rosa  ' })
      .expect(201);
    assert.ok(respuesta.body.token);
    assert.equal(respuesta.body.comensal.nombreAlias, 'Rosa');
    assert.equal(respuesta.body.mesa.numero, 5);

    const { rows } = await pool.query('SELECT estado FROM mesa WHERE numero = 5');
    assert.equal(rows[0].estado, 'OCUPADA');
  });

  test('los comensales de la misma mesa comparten la sesión abierta', async () => {
    await api().post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`).send({ nombreAlias: 'Rosa' }).expect(201);
    await api().post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`).send({ nombreAlias: 'Juan' }).expect(201);
    const { rows } = await pool.query('SELECT count(*)::integer AS sesiones FROM sesion_mesa');
    assert.equal(rows[0].sesiones, 1);
  });

  test('dos comensales que escanean a la vez no abren dos sesiones', async () => {
    await Promise.all([
      api().post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`).send({ nombreAlias: 'Ana' }).expect(201),
      api().post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`).send({ nombreAlias: 'Luis' }).expect(201),
    ]);
    const { rows } = await pool.query('SELECT count(*)::integer AS sesiones FROM sesion_mesa');
    assert.equal(rows[0].sesiones, 1);
  });

  test('responde 400 sin nombre', async () => {
    await api().post(`/api/v1/mesas/${TOKEN_MESA_5}/comensales`).send({ nombreAlias: '   ' }).expect(400);
  });

  test('responde 404 con un QR desconocido', async () => {
    await api().post('/api/v1/mesas/qr-falso-1234567890/comensales').send({ nombreAlias: 'Rosa' }).expect(404);
  });

  test('responde 409 si la mesa está inactiva', async () => {
    const respuesta = await api()
      .post(`/api/v1/mesas/${TOKEN_MESA_INACTIVA}/comensales`)
      .send({ nombreAlias: 'Rosa' })
      .expect(409);
    assert.equal(respuesta.body.error.codigo, 'MESA_INACTIVA');
  });
});

describe('POST /mesas/{id}/regenerar-qr', () => {
  test('el administrador genera un QR nuevo y el anterior deja de funcionar', async () => {
    const token = await iniciarSesion('admin');
    const respuesta = await api().post('/api/v1/mesas/1/regenerar-qr').set('Authorization', `Bearer ${token}`).expect(200);
    assert.notEqual(respuesta.body.tokenQr, TOKEN_MESA_5);
    await api().get(`/api/v1/mesas/${TOKEN_MESA_5}`).expect(404);
    await api().get(`/api/v1/mesas/${respuesta.body.tokenQr}`).expect(200);
  });

  test('responde 401 sin token y 403 si no es administrador', async () => {
    await api().post('/api/v1/mesas/1/regenerar-qr').expect(401);
    const token = await iniciarSesion('caja');
    await api().post('/api/v1/mesas/1/regenerar-qr').set('Authorization', `Bearer ${token}`).expect(403);
  });

  test('responde 404 si la mesa no existe', async () => {
    const token = await iniciarSesion('admin');
    await api().post('/api/v1/mesas/999/regenerar-qr').set('Authorization', `Bearer ${token}`).expect(404);
  });
});
