import { pool } from './pool.js';

// idUsuario queda en app.id_usuario solo durante la transacción; el trigger lo guarda en el historial.
export async function conTransaccion(trabajo, { idUsuario } = {}) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    if (idUsuario) {
      await cliente.query("SELECT set_config('app.id_usuario', $1, true)", [String(idUsuario)]);
    }
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
