import { pool } from '../../db/pool.js';

function aUsuario(fila) {
  return {
    idUsuario: fila.id_usuario,
    username: fila.username,
    nombre: fila.nombre,
    passwordHash: fila.password_hash,
    activo: fila.activo,
    bloqueadoHasta: fila.bloqueado_hasta,
    rol: fila.rol,
  };
}

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.username, u.nombre, u.password_hash, u.activo, u.bloqueado_hasta, r.nombre AS rol
    FROM usuario u
    JOIN rol r ON r.id_rol = u.id_rol`;

export async function buscarPorUsername(username) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.username = $1`, [username]);
  return rows[0] ? aUsuario(rows[0]) : null;
}

export async function buscarPorId(idUsuario) {
  const { rows } = await pool.query(`${SELECT_USUARIO} WHERE u.id_usuario = $1`, [idUsuario]);
  return rows[0] ? aUsuario(rows[0]) : null;
}

// Un solo UPDATE: dos intentos simultáneos no pueden saltarse el conteo.
export async function registrarIntentoFallido(idUsuario, { intentosMaximos, minutosBloqueo }) {
  const { rows } = await pool.query(
    `UPDATE usuario
        SET intentos_fallidos = CASE WHEN intentos_fallidos + 1 >= $2 THEN 0 ELSE intentos_fallidos + 1 END,
            bloqueado_hasta = CASE WHEN intentos_fallidos + 1 >= $2
                                   THEN now() + make_interval(mins => $3)
                                   ELSE bloqueado_hasta END
      WHERE id_usuario = $1
      RETURNING bloqueado_hasta`,
    [idUsuario, intentosMaximos, minutosBloqueo],
  );
  return rows[0]?.bloqueado_hasta ?? null;
}

export async function reiniciarIntentos(idUsuario) {
  await pool.query(
    'UPDATE usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = $1',
    [idUsuario],
  );
}
