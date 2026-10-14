import { pool } from '../../db/pool.js';

function aUsuario(fila) {
  return {
    idUsuario: fila.id_usuario,
    nombreUsuario: fila.nombre_usuario,
    nombreCompleto: fila.nombre_completo,
    contrasenaHash: fila.contrasena_hash,
    activo: fila.activo,
    rol: fila.rol,
  };
}

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nombre_usuario, u.nombre_completo, u.contrasena_hash, u.activo, r.nombre AS rol
    FROM usuario u
    JOIN rol r ON r.id_rol = u.id_rol`;

export async function buscarPorNombreUsuario(nombreUsuario) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.nombre_usuario = $1`, [nombreUsuario]);
  return rows[0] ? aUsuario(rows[0]) : null;
}

export async function buscarPorId(idUsuario) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [idUsuario]);
  return rows[0] ? aUsuario(rows[0]) : null;
}
