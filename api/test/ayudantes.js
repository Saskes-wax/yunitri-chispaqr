import './entorno.js';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { crearApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';

export const app = crearApp();
export const api = () => request(app);

export const CONTRASENA_PRUEBA = 'clave-de-prueba';
export const TOKEN_MESA_5 = 'token-mesa-5-de-prueba-abcdef';
export const TOKEN_MESA_7 = 'token-mesa-7-de-prueba-abcdef';
export const TOKEN_MESA_INACTIVA = 'token-mesa-9-inactiva-abcdef';

export const PRODUCTO = Object.freeze({ TRUCHA: 1, GASEOSA: 2, MAZAMORRA_AGOTADA: 3 });

const TABLAS = [
  'historial_estado_pedido', 'pago', 'detalle_pedido', 'pedido', 'producto', 'categoria',
  'comensal', 'sesion_mesa', 'mesa', 'usuario', 'rol',
];

// Las pruebas usan el esquema y los triggers reales de database/, así la API y la BD no se desalinean.
const SCRIPTS_DE_ESQUEMA = ['01_esquema.sql', '02_triggers.sql'];
let esquemaCargado = false;

async function cargarEsquema() {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  for (const script of SCRIPTS_DE_ESQUEMA) {
    await pool.query(readFileSync(new URL(`../../database/${script}`, import.meta.url), 'utf8'));
  }
  esquemaCargado = true;
}

export async function reiniciarBaseDeDatos() {
  if (!esquemaCargado) await cargarEsquema();
  await pool.query(`TRUNCATE ${TABLAS.join(', ')} RESTART IDENTITY CASCADE`);

  const hash = await bcrypt.hash(CONTRASENA_PRUEBA, 4);
  await pool.query(`INSERT INTO rol (nombre) VALUES ('ADMINISTRADOR'), ('CAJERO'), ('COCINA'), ('MOZO')`);
  await pool.query(
    `INSERT INTO usuario (id_rol, nombre_usuario, nombre, contrasena_hash, activo) VALUES
       (1, 'admin', 'Admin', $1, true),
       (2, 'caja', 'Caja', $1, true),
       (3, 'cocina', 'Cocina', $1, true),
       (4, 'mozo', 'Mozo', $1, true),
       (2, 'caja_inactiva', 'Caja inactiva', $1, false)`,
    [hash],
  );
  await pool.query(
    `INSERT INTO mesa (numero, token_qr, estado) VALUES ($1, $2, 'LIBRE'), ($3, $4, 'LIBRE'), ($5, $6, 'INACTIVA')`,
    [5, TOKEN_MESA_5, 7, TOKEN_MESA_7, 9, TOKEN_MESA_INACTIVA],
  );
  await pool.query(`INSERT INTO categoria (nombre, orden) VALUES ('Platos', 1), ('Bebidas', 2)`);
  await pool.query(
    `INSERT INTO producto (id_categoria, nombre, precio, disponible) VALUES
       (1, 'Trucha frita', 25.00, true),
       (2, 'Gaseosa 500 ml', 4.50, true),
       (1, 'Mazamorra morada', 5.00, false)`,
  );
}

export async function iniciarSesion(nombreUsuario) {
  const respuesta = await api()
    .post('/api/v1/auth/login')
    .send({ nombreUsuario, contrasena: CONTRASENA_PRUEBA })
    .expect(200);
  return respuesta.body.token;
}

export async function registrarComensal(tokenQr = TOKEN_MESA_5, nombreAlias = 'Rosa') {
  const respuesta = await api().post(`/api/v1/mesas/${tokenQr}/comensales`).send({ nombreAlias }).expect(201);
  return respuesta.body.token;
}

export async function crearPedido(tokenComensal, lineas = [{ idProducto: PRODUCTO.TRUCHA, cantidad: 2 }]) {
  const respuesta = await api()
    .post('/api/v1/pedidos')
    .set('Authorization', `Bearer ${tokenComensal}`)
    .send({ lineas })
    .expect(201);
  return respuesta.body;
}

export function cerrarConexiones() {
  return pool.end();
}
