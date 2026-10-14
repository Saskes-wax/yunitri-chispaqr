import '../entorno.js';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../../src/db/pool.js';
import { api, cerrarConexiones, CONTRASENA_PRUEBA, iniciarSesion, reiniciarBaseDeDatos } from '../ayudantes.js';

beforeEach(reiniciarBaseDeDatos);
after(cerrarConexiones);

describe('GET /health', () => {
  test('responde 200 cuando la base de datos está disponible', async () => {
    const respuesta = await api().get('/api/v1/health').expect(200);
    assert.deepEqual(respuesta.body, { estado: 'ok', bd: 'ok' });
  });
});

describe('POST /auth/login', () => {
  test('devuelve un JWT con el rol del usuario', async () => {
    const respuesta = await api()
      .post('/api/v1/auth/login')
      .send({ username: 'caja', contrasena: CONTRASENA_PRUEBA })
      .expect(200);
    assert.ok(respuesta.body.token);
    assert.equal(respuesta.body.usuario.rol, 'CAJERO');
    assert.equal(respuesta.body.usuario.contrasenaHash, undefined);
  });

  test('responde 401 con el mismo mensaje si la contraseña es incorrecta o el usuario no existe', async () => {
    const malaClave = await api().post('/api/v1/auth/login').send({ username: 'caja', contrasena: 'otra' }).expect(401);
    const sinUsuario = await api().post('/api/v1/auth/login').send({ username: 'nadie', contrasena: 'otra' }).expect(401);
    assert.equal(malaClave.body.error.mensaje, sinUsuario.body.error.mensaje);
  });

  test('responde 401 a un usuario desactivado', async () => {
    await api()
      .post('/api/v1/auth/login')
      .send({ username: 'caja_inactiva', contrasena: CONTRASENA_PRUEBA })
      .expect(401);
  });

  test('bloquea al usuario tras 5 intentos fallidos aunque luego ponga bien la contraseña (429)', async () => {
    for (let intento = 1; intento <= 4; intento++) {
      await api().post('/api/v1/auth/login').send({ username: 'caja', contrasena: 'mala' }).expect(401);
    }
    const quinto = await api().post('/api/v1/auth/login').send({ username: 'caja', contrasena: 'mala' }).expect(429);
    assert.equal(quinto.body.error.codigo, 'USUARIO_BLOQUEADO');
    await api().post('/api/v1/auth/login').send({ username: 'caja', contrasena: CONTRASENA_PRUEBA }).expect(429);
  });

  test('un login correcto reinicia el contador de intentos', async () => {
    for (let intento = 1; intento <= 4; intento++) {
      await api().post('/api/v1/auth/login').send({ username: 'caja', contrasena: 'mala' }).expect(401);
    }
    await iniciarSesion('caja');
    const { rows } = await pool.query(`SELECT intentos_fallidos FROM usuario WHERE username = 'caja'`);
    assert.equal(rows[0].intentos_fallidos, 0);
  });

  test('responde 400 si faltan datos', async () => {
    const respuesta = await api().post('/api/v1/auth/login').send({ username: 'caja' }).expect(400);
    assert.equal(respuesta.body.error.codigo, 'VALIDACION_FALLIDA');
  });

  test('responde 400 si el cuerpo no es JSON válido', async () => {
    await api().post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{malo').expect(400);
  });
});

describe('token del personal', () => {
  test('un usuario desactivado después del login pierde el acceso aunque su token siga vigente', async () => {
    const token = await iniciarSesion('caja');
    await pool.query(`UPDATE usuario SET activo = false WHERE username = 'caja'`);
    await api().get('/api/v1/pedidos?estado=PENDIENTE_PAGO').set('Authorization', `Bearer ${token}`).expect(401);
  });

  test('un token manipulado responde 401', async () => {
    const token = await iniciarSesion('caja');
    await api().get('/api/v1/pedidos?estado=PENDIENTE_PAGO').set('Authorization', `Bearer ${token}x`).expect(401);
  });

  test('una ruta inexistente responde 404 con formato uniforme', async () => {
    const respuesta = await api().get('/api/v1/no-existe').expect(404);
    assert.equal(respuesta.body.error.codigo, 'NO_ENCONTRADO');
    assert.ok(respuesta.body.idPeticion);
  });
});
