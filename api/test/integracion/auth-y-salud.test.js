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
      .send({ nombreUsuario: 'caja', contrasena: CONTRASENA_PRUEBA })
      .expect(200);
    assert.ok(respuesta.body.token);
    assert.equal(respuesta.body.usuario.rol, 'CAJERO');
    assert.equal(respuesta.body.usuario.contrasenaHash, undefined);
  });

  test('responde 401 con el mismo mensaje si la contraseña es incorrecta o el usuario no existe', async () => {
    const malaClave = await api().post('/api/v1/auth/login').send({ nombreUsuario: 'caja', contrasena: 'otra' }).expect(401);
    const sinUsuario = await api().post('/api/v1/auth/login').send({ nombreUsuario: 'nadie', contrasena: 'otra' }).expect(401);
    assert.equal(malaClave.body.error.mensaje, sinUsuario.body.error.mensaje);
  });

  test('responde 401 a un usuario desactivado', async () => {
    await api()
      .post('/api/v1/auth/login')
      .send({ nombreUsuario: 'caja_inactiva', contrasena: CONTRASENA_PRUEBA })
      .expect(401);
  });

  test('responde 400 si faltan datos', async () => {
    const respuesta = await api().post('/api/v1/auth/login').send({ nombreUsuario: 'caja' }).expect(400);
    assert.equal(respuesta.body.error.codigo, 'VALIDACION_FALLIDA');
  });

  test('responde 400 si el cuerpo no es JSON válido', async () => {
    await api().post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{malo').expect(400);
  });
});

describe('token del personal', () => {
  test('un usuario desactivado después del login pierde el acceso aunque su token siga vigente', async () => {
    const token = await iniciarSesion('caja');
    await pool.query(`UPDATE usuario SET activo = false WHERE nombre_usuario = 'caja'`);
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
