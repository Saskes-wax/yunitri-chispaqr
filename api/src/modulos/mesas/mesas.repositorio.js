import { pool } from '../../db/pool.js';

function aMesa(fila) {
  return {
    idMesa: fila.id_mesa,
    numero: fila.numero,
    zona: fila.zona,
    codigoQr: fila.codigo_qr,
    activa: fila.activa,
  };
}

const COLUMNAS_MESA = 'id_mesa, numero, zona, codigo_qr, activa';

export async function buscarPorCodigoQr(codigoQr) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_MESA} FROM mesa WHERE codigo_qr = $1`, [codigoQr]);
  return rows[0] ? aMesa(rows[0]) : null;
}

export async function bloquearPorCodigoQr(cliente, codigoQr) {
  const { rows } = await cliente.query(
    `SELECT ${COLUMNAS_MESA} FROM mesa WHERE codigo_qr = $1 FOR UPDATE`,
    [codigoQr],
  );
  return rows[0] ? aMesa(rows[0]) : null;
}

// codigo_qr lo genera la base de datos (valor aleatorio por defecto en el esquema de Iván).
export async function insertarMesa({ numero, zona }) {
  const { rows } = await pool.query(
    `INSERT INTO mesa (numero, zona) VALUES ($1, $2) RETURNING ${COLUMNAS_MESA}`,
    [numero, zona ?? null],
  );
  return aMesa(rows[0]);
}

export async function actualizarCodigoQr(idMesa, codigoQr) {
  const { rows } = await pool.query(
    `UPDATE mesa SET codigo_qr = $2 WHERE id_mesa = $1 RETURNING ${COLUMNAS_MESA}`,
    [idMesa, codigoQr],
  );
  return rows[0] ? aMesa(rows[0]) : null;
}

export async function listarTodas() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_MESA} FROM mesa ORDER BY numero`);
  return rows.map(aMesa);
}

// Una mesa está ocupada cuando tiene una sesión con cerrada_en vacío (contrato v1.2).
export async function buscarSesionAbierta(cliente, idMesa) {
  const { rows } = await cliente.query(
    'SELECT id_sesion FROM sesion_mesa WHERE id_mesa = $1 AND cerrada_en IS NULL',
    [idMesa],
  );
  return rows[0]?.id_sesion ?? null;
}

export async function abrirSesion(cliente, idMesa) {
  const { rows } = await cliente.query(
    'INSERT INTO sesion_mesa (id_mesa) VALUES ($1) RETURNING id_sesion',
    [idMesa],
  );
  return rows[0].id_sesion;
}

export async function insertarComensal(cliente, { idSesion, nombre }) {
  const { rows } = await cliente.query(
    'INSERT INTO comensal (id_sesion, nombre) VALUES ($1, $2) RETURNING id_comensal',
    [idSesion, nombre],
  );
  return rows[0].id_comensal;
}
