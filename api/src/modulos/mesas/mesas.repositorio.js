import { pool } from '../../db/pool.js';
import { ESTADOS_SESION_MESA } from '../../shared/constantes.js';

function aMesa(fila) {
  return { idMesa: fila.id_mesa, numero: fila.numero, estado: fila.estado, tokenQr: fila.token_qr };
}

export async function buscarPorToken(tokenQr, cliente = pool) {
  const { rows } = await cliente.query(
    'SELECT id_mesa, numero, estado, token_qr FROM mesa WHERE token_qr = $1',
    [tokenQr],
  );
  return rows[0] ? aMesa(rows[0]) : null;
}

export async function bloquearPorToken(cliente, tokenQr) {
  const { rows } = await cliente.query(
    'SELECT id_mesa, numero, estado, token_qr FROM mesa WHERE token_qr = $1 FOR UPDATE',
    [tokenQr],
  );
  return rows[0] ? aMesa(rows[0]) : null;
}

export async function actualizarEstado(cliente, idMesa, estado) {
  await cliente.query('UPDATE mesa SET estado = $2 WHERE id_mesa = $1', [idMesa, estado]);
}

export async function actualizarToken(idMesa, tokenQr) {
  const { rows } = await pool.query(
    'UPDATE mesa SET token_qr = $2 WHERE id_mesa = $1 RETURNING id_mesa, numero, estado, token_qr',
    [idMesa, tokenQr],
  );
  return rows[0] ? aMesa(rows[0]) : null;
}

export async function listarTodas() {
  const { rows } = await pool.query('SELECT id_mesa, numero, estado, token_qr FROM mesa ORDER BY numero');
  return rows.map(aMesa);
}

export async function buscarSesionAbierta(cliente, idMesa) {
  const { rows } = await cliente.query(
    'SELECT id_sesion_mesa FROM sesion_mesa WHERE id_mesa = $1 AND estado = $2',
    [idMesa, ESTADOS_SESION_MESA.ABIERTA],
  );
  return rows[0]?.id_sesion_mesa ?? null;
}

export async function abrirSesion(cliente, idMesa) {
  const { rows } = await cliente.query(
    'INSERT INTO sesion_mesa (id_mesa, estado) VALUES ($1, $2) RETURNING id_sesion_mesa',
    [idMesa, ESTADOS_SESION_MESA.ABIERTA],
  );
  return rows[0].id_sesion_mesa;
}

export async function insertarComensal(cliente, { idSesionMesa, nombreAlias }) {
  const { rows } = await cliente.query(
    'INSERT INTO comensal (id_sesion_mesa, nombre_alias) VALUES ($1, $2) RETURNING id_comensal',
    [idSesionMesa, nombreAlias],
  );
  return rows[0].id_comensal;
}
