import '../entorno.js';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import {
  api,
  cerrarConexiones,
  iniciarSesion,
  reiniciarBaseDeDatos,
  QR_MESA_5,
  QR_MESA_INACTIVA,
} from '../ayudantes.js';

beforeEach(reiniciarBaseDeDatos);
after(cerrarConexiones);

describe('GET /mesas/{token_qr}', () => {
  test('reconoce la mesa y su zona por el QR', async () => {
    const respuesta = await api().get(`/api/v1/mesas/${QR_MESA_5}`).expect(200);
    assert.deepEqual(respuesta.body, { numero: 5, zona: 'Jardín', activa: true });
  });

  test('responde 404 si el QR no existe', async () => {
    await api().get('/api/v1/mesas/qr-que-no-existe').expect(404);
  });
});

describe('POST /mesas/{token_qr}/comensales', () => {
  test('registra al comensal y abre la sesión de la mesa', async () => {
    const respuesta = await api()
      .post(`/api/v1/mesas/${QR_MESA_5}/comensales`)
      .send({ nombre: '  Rosa  ' })
      .expect(201);
    assert.ok(respuesta.body.token);
    assert.equal(respuesta.body.comensal.nombre, 'Rosa');
    assert.equal(respuesta.body.mesa.numero, 5);

    assert.equal(respuesta.body.mesa.zona, 'Jardín');
    const { rows } = await pool.query('SELECT count(*)::integer AS abiertas FROM sesion_mesa WHERE cerrada_en IS NULL');
    assert.equal(rows[0].abiertas, 1);
  });

  test('los comensales de la misma mesa comparten la sesión abierta', async () => {
    await api().post(`/api/v1/mesas/${QR_MESA_5}/comensales`).send({ nombre: 'Rosa' }).expect(201);
    await api().post(`/api/v1/mesas/${QR_MESA_5}/comensales`).send({ nombre: 'Juan' }).expect(201);
    const { rows } = await pool.query('SELECT count(*)::integer AS sesiones FROM sesion_mesa');
    assert.equal(rows[0].sesiones, 1);
  });

  test('dos comensales que escanean a la vez no abren dos sesiones', async () => {
    await Promise.all([
      api().post(`/api/v1/mesas/${QR_MESA_5}/comensales`).send({ nombre: 'Ana' }).expect(201),
      api().post(`/api/v1/mesas/${QR_MESA_5}/comensales`).send({ nombre: 'Luis' }).expect(201),
    ]);
    const { rows } = await pool.query('SELECT count(*)::integer AS sesiones FROM sesion_mesa');
    assert.equal(rows[0].sesiones, 1);
  });

  test('responde 400 sin nombre', async () => {
    await api().post(`/api/v1/mesas/${QR_MESA_5}/comensales`).send({ nombre: '   ' }).expect(400);
  });

  test('responde 404 con un QR desconocido', async () => {
    await api().post('/api/v1/mesas/qr-falso-1234567890/comensales').send({ nombre: 'Rosa' }).expect(404);
  });

  test('responde 409 si la mesa está inactiva', async () => {
    const respuesta = await api()
      .post(`/api/v1/mesas/${QR_MESA_INACTIVA}/comensales`)
      .send({ nombre: 'Rosa' })
      .expect(409);
    assert.equal(respuesta.body.error.codigo, 'MESA_INACTIVA');
  });
});

describe('POST /mesas', () => {
  test('el administrador crea una mesa y la base le asigna un QR aleatorio', async () => {
    const token = await iniciarSesion('admin');
    const respuesta = await api()
      .post('/api/v1/mesas')
      .set('Authorization', `Bearer ${token}`)
      .send({ numero: 12, zona: 'Salón' })
      .expect(201);
    assert.equal(respuesta.body.numero, 12);
    assert.ok(respuesta.body.codigoQr.length >= 32);
    await api().get(`/api/v1/mesas/${respuesta.body.codigoQr}`).expect(200);
  });

  test('responde 409 si el número de mesa ya existe y 403 si no es administrador', async () => {
    const tokenAdmin = await iniciarSesion('admin');
    await api().post('/api/v1/mesas').set('Authorization', `Bearer ${tokenAdmin}`).send({ numero: 5 }).expect(409);
    const tokenCaja = await iniciarSesion('caja');
    await api().post('/api/v1/mesas').set('Authorization', `Bearer ${tokenCaja}`).send({ numero: 20 }).expect(403);
  });
});

describe('POST /mesas/{id}/regenerar-qr', () => {
  test('el administrador genera un QR nuevo y el anterior deja de funcionar', async () => {
    const token = await iniciarSesion('admin');
    const respuesta = await api().post('/api/v1/mesas/1/regenerar-qr').set('Authorization', `Bearer ${token}`).expect(200);
    assert.notEqual(respuesta.body.codigoQr, QR_MESA_5);
    await api().get(`/api/v1/mesas/${QR_MESA_5}`).expect(404);
    await api().get(`/api/v1/mesas/${respuesta.body.codigoQr}`).expect(200);
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
