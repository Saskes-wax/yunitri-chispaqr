import '../entorno.js';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { api, cerrarConexiones, iniciarSesion, PRODUCTO, reiniciarBaseDeDatos } from '../ayudantes.js';

beforeEach(reiniciarBaseDeDatos);
after(cerrarConexiones);

describe('lectura de la carta', () => {
  test('lista las categorías en orden', async () => {
    const respuesta = await api().get('/api/v1/categorias').expect(200);
    assert.deepEqual(respuesta.body.datos.map((categoria) => categoria.nombre), ['Platos', 'Bebidas']);
  });

  test('con disponible=true no muestra los productos agotados', async () => {
    const respuesta = await api().get('/api/v1/productos?disponible=true').expect(200);
    const nombres = respuesta.body.datos.map((producto) => producto.nombre);
    assert.ok(nombres.includes('Trucha frita'));
    assert.ok(!nombres.includes('Mazamorra morada'));
  });

  test('el precio llega como texto con dos decimales', async () => {
    const respuesta = await api().get('/api/v1/productos').expect(200);
    const trucha = respuesta.body.datos.find((producto) => producto.idProducto === PRODUCTO.TRUCHA);
    assert.equal(trucha.precio, '25.00');
  });

  test('responde 400 con un filtro desconocido', async () => {
    await api().get('/api/v1/productos?disponible=talvez').expect(400);
  });
});

describe('PATCH /productos/{id}/disponibilidad', () => {
  test('cocina marca un producto como agotado', async () => {
    const token = await iniciarSesion('cocina');
    const respuesta = await api()
      .patch(`/api/v1/productos/${PRODUCTO.TRUCHA}/disponibilidad`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disponible: false })
      .expect(200);
    assert.equal(respuesta.body.disponible, false);
  });

  test('el mozo no puede cambiar la disponibilidad (403)', async () => {
    const token = await iniciarSesion('mozo');
    await api()
      .patch(`/api/v1/productos/${PRODUCTO.TRUCHA}/disponibilidad`)
      .set('Authorization', `Bearer ${token}`)
      .send({ disponible: false })
      .expect(403);
  });

  test('responde 404 si el producto no existe', async () => {
    const token = await iniciarSesion('cocina');
    await api()
      .patch('/api/v1/productos/999/disponibilidad')
      .set('Authorization', `Bearer ${token}`)
      .send({ disponible: false })
      .expect(404);
  });
});

describe('POST /productos', () => {
  test('el administrador agrega un plato a la carta', async () => {
    const token = await iniciarSesion('admin');
    const respuesta = await api()
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ idCategoria: 1, nombre: 'Pachamanca', precio: '30.50' })
      .expect(201);
    assert.equal(respuesta.body.precio, '30.50');
    assert.equal(respuesta.body.categoria, 'Platos');
  });

  test('rechaza un precio con más de dos decimales (400)', async () => {
    const token = await iniciarSesion('admin');
    await api()
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ idCategoria: 1, nombre: 'Pachamanca', precio: 30.555 })
      .expect(400);
  });

  test('cocina no puede crear productos (403)', async () => {
    const token = await iniciarSesion('cocina');
    await api()
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ idCategoria: 1, nombre: 'Pachamanca', precio: '30.50' })
      .expect(403);
  });

  test('responde 409 si la categoría no existe', async () => {
    const token = await iniciarSesion('admin');
    await api()
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ idCategoria: 99, nombre: 'Pachamanca', precio: '30.50' })
      .expect(409);
  });
});
