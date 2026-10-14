import { pool } from '../../db/pool.js';

const CLAVE_BLOQUEO_CODIGO_PEDIDO = 717001;

const SELECT_PEDIDO_DETALLADO = `
  SELECT p.id_pedido, p.id_comensal, p.codigo_pedido, p.estado, t.total, p.creado_en,
         c.nombre AS nombre_comensal, m.numero AS numero_mesa, m.zona, pg.pagado_en, pg.metodo,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'nombre', pr.nombre,
                    'cantidad', d.cantidad,
                    'precioUnitario', d.precio_unitario::text,
                    'subtotal', (d.cantidad * d.precio_unitario)::numeric(10,2)::text,
                    'nota', d.nota,
                    'disponible', pr.disponible
                  ) ORDER BY d.id_detalle)
             FROM detalle_pedido d
             JOIN producto pr ON pr.id_producto = d.id_producto
            WHERE d.id_pedido = p.id_pedido
         ), '[]'::json) AS lineas
    FROM pedido p
    JOIN v_pedido_total t ON t.id_pedido = p.id_pedido
    JOIN comensal c ON c.id_comensal = p.id_comensal
    JOIN sesion_mesa s ON s.id_sesion = c.id_sesion
    JOIN mesa m ON m.id_mesa = s.id_mesa
    LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido`;

function aPedidoDetallado(fila) {
  return {
    idPedido: fila.id_pedido,
    idComensal: fila.id_comensal,
    codigoPedido: fila.codigo_pedido,
    estado: fila.estado,
    total: fila.total,
    fechaCreacion: fila.creado_en,
    fechaPago: fila.pagado_en,
    metodoPago: fila.metodo,
    numeroMesa: fila.numero_mesa,
    zona: fila.zona,
    nombreComensal: fila.nombre_comensal,
    lineas: fila.lineas,
  };
}

// El total vive en la vista v_pedido_total (Iván, sección VIII); FOR UPDATE OF p bloquea solo el pedido.
const COLUMNAS_RESUMEN = `p.id_pedido, p.codigo_pedido, p.estado,
  (SELECT total FROM v_pedido_total WHERE id_pedido = p.id_pedido) AS total`;

function aPedidoResumen(fila) {
  return { idPedido: fila.id_pedido, codigoPedido: fila.codigo_pedido, estado: fila.estado, total: fila.total };
}

export async function obtenerNumeroMesaDeComensal(cliente, idComensal) {
  const { rows } = await cliente.query(
    `SELECT m.numero
       FROM comensal c
       JOIN sesion_mesa s ON s.id_sesion = c.id_sesion
       JOIN mesa m ON m.id_mesa = s.id_mesa
      WHERE c.id_comensal = $1`,
    [idComensal],
  );
  return rows[0]?.numero ?? null;
}

// La numeración no se reinicia, así el código nunca se repite y respeta el UNIQUE de codigo_pedido.
// El bloqueo evita que dos pedidos simultáneos reciban el mismo número.
export async function siguienteSecuencia(cliente) {
  await cliente.query('SELECT pg_advisory_xact_lock($1)', [CLAVE_BLOQUEO_CODIGO_PEDIDO]);
  const { rows } = await cliente.query('SELECT count(*)::integer + 1 AS secuencia FROM pedido');
  return rows[0].secuencia;
}

// El estado no se envía: nace en PENDIENTE_PAGO por defecto y el trigger deja el primer registro del historial.
export async function insertarPedido(cliente, { idComensal, codigoPedido, claveEnvio }) {
  const { rows } = await cliente.query(
    `INSERT INTO pedido (id_comensal, codigo_pedido, clave_envio)
     VALUES ($1, $2, $3)
     RETURNING id_pedido`,
    [idComensal, codigoPedido, claveEnvio ?? null],
  );
  return rows[0].id_pedido;
}

export async function insertarDetalles(cliente, idPedido, lineas) {
  await cliente.query(
    `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, nota)
     SELECT $1, * FROM unnest($2::integer[], $3::integer[], $4::numeric[], $5::text[])`,
    [
      idPedido,
      lineas.map((linea) => linea.idProducto),
      lineas.map((linea) => linea.cantidad),
      lineas.map((linea) => linea.precioUnitario),
      lineas.map((linea) => linea.nota),
    ],
  );
}

export async function buscarPorClaveEnvio(claveEnvio) {
  const { rows } = await pool.query(
    'SELECT id_pedido, id_comensal FROM pedido WHERE clave_envio = $1',
    [claveEnvio],
  );
  return rows[0] ? { idPedido: rows[0].id_pedido, idComensal: rows[0].id_comensal } : null;
}

export async function obtenerDetalladoPorId(idPedido, cliente = pool) {
  const { rows } = await cliente.query(`${SELECT_PEDIDO_DETALLADO} WHERE p.id_pedido = $1`, [idPedido]);
  return rows[0] ? aPedidoDetallado(rows[0]) : null;
}

export async function obtenerDetalladoPorCodigo(codigoPedido) {
  const { rows } = await pool.query(`${SELECT_PEDIDO_DETALLADO} WHERE p.codigo_pedido = $1`, [codigoPedido]);
  return rows[0] ? aPedidoDetallado(rows[0]) : null;
}

export async function listarPorEstados(estados, limite) {
  const { rows } = await pool.query(
    `${SELECT_PEDIDO_DETALLADO}
      WHERE p.estado = ANY($1::varchar[])
      ORDER BY COALESCE(pg.pagado_en, p.creado_en), p.id_pedido
      LIMIT $2`,
    [estados, limite],
  );
  return rows.map(aPedidoDetallado);
}

export async function obtenerResumenPorId(idPedido) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_RESUMEN} FROM pedido p WHERE p.id_pedido = $1`, [idPedido]);
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}

export async function bloquearPorId(cliente, idPedido) {
  const { rows } = await cliente.query(
    `SELECT ${COLUMNAS_RESUMEN} FROM pedido p WHERE p.id_pedido = $1 FOR UPDATE OF p`,
    [idPedido],
  );
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}

export async function productosAgotadosDelPedido(cliente, idPedido) {
  const { rows } = await cliente.query(
    `SELECT DISTINCT pr.nombre
       FROM detalle_pedido d
       JOIN producto pr ON pr.id_producto = d.id_producto
      WHERE d.id_pedido = $1 AND NOT pr.disponible
      ORDER BY pr.nombre`,
    [idPedido],
  );
  return rows.map((fila) => fila.nombre);
}

// Si otro usuario ya cambió el estado, no afecta filas y el servicio responde 409.
export async function actualizarEstadoSiSigueEn({ idPedido, estadoEsperado, estadoNuevo }, cliente = pool) {
  const { rows } = await cliente.query(
    `UPDATE pedido p SET estado = $3
      WHERE p.id_pedido = $1 AND p.estado = $2
      RETURNING ${COLUMNAS_RESUMEN}`,
    [idPedido, estadoEsperado, estadoNuevo],
  );
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}
