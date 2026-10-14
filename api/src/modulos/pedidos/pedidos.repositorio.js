import { pool } from '../../db/pool.js';
import { ZONA_HORARIA_NEGOCIO } from '../../shared/constantes.js';

const CLAVE_BLOQUEO_CODIGO_PEDIDO = 717001;

const SELECT_PEDIDO_DETALLADO = `
  SELECT p.id_pedido, p.id_comensal, p.codigo_pedido, p.estado, p.total, p.fecha_creacion,
         c.nombre_alias, m.numero AS numero_mesa, pg.fecha_pago,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'nombre', pr.nombre,
                    'cantidad', d.cantidad,
                    'precioUnitario', d.precio_unitario::text,
                    'subtotal', d.subtotal::text,
                    'nota', d.nota
                  ) ORDER BY d.id_detalle_pedido)
             FROM detalle_pedido d
             JOIN producto pr ON pr.id_producto = d.id_producto
            WHERE d.id_pedido = p.id_pedido
         ), '[]'::json) AS lineas
    FROM pedido p
    JOIN comensal c ON c.id_comensal = p.id_comensal
    JOIN sesion_mesa s ON s.id_sesion_mesa = c.id_sesion_mesa
    JOIN mesa m ON m.id_mesa = s.id_mesa
    LEFT JOIN pago pg ON pg.id_pedido = p.id_pedido`;

function aPedidoDetallado(fila) {
  return {
    idPedido: fila.id_pedido,
    idComensal: fila.id_comensal,
    codigoPedido: fila.codigo_pedido,
    estado: fila.estado,
    total: fila.total,
    fechaCreacion: fila.fecha_creacion,
    fechaPago: fila.fecha_pago,
    numeroMesa: fila.numero_mesa,
    nombreAlias: fila.nombre_alias,
    lineas: fila.lineas,
  };
}

function aPedidoResumen(fila) {
  return { idPedido: fila.id_pedido, codigoPedido: fila.codigo_pedido, estado: fila.estado, total: fila.total };
}

export async function obtenerNumeroMesaDeComensal(cliente, idComensal) {
  const { rows } = await cliente.query(
    `SELECT m.numero
       FROM comensal c
       JOIN sesion_mesa s ON s.id_sesion_mesa = c.id_sesion_mesa
       JOIN mesa m ON m.id_mesa = s.id_mesa
      WHERE c.id_comensal = $1`,
    [idComensal],
  );
  return rows[0]?.numero ?? null;
}

// El bloqueo serializa la numeración: dos pedidos simultáneos nunca reciben el mismo número del día.
export async function siguienteSecuenciaDelDia(cliente) {
  await cliente.query('SELECT pg_advisory_xact_lock($1)', [CLAVE_BLOQUEO_CODIGO_PEDIDO]);
  const { rows } = await cliente.query(
    `SELECT count(*)::integer + 1 AS secuencia
       FROM pedido
      WHERE (fecha_creacion AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date`,
    [ZONA_HORARIA_NEGOCIO],
  );
  return rows[0].secuencia;
}

export async function insertarPedido(cliente, { idComensal, codigoPedido, total, estado }) {
  const { rows } = await cliente.query(
    `INSERT INTO pedido (id_comensal, codigo_pedido, estado, total)
     VALUES ($1, $2, $3, $4)
     RETURNING id_pedido`,
    [idComensal, codigoPedido, estado, total],
  );
  return rows[0].id_pedido;
}

export async function insertarDetalles(cliente, idPedido, lineas) {
  await cliente.query(
    `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal, nota)
     SELECT $1, * FROM unnest($2::integer[], $3::integer[], $4::numeric[], $5::numeric[], $6::varchar[])`,
    [
      idPedido,
      lineas.map((linea) => linea.idProducto),
      lineas.map((linea) => linea.cantidad),
      lineas.map((linea) => linea.precioUnitario),
      lineas.map((linea) => linea.subtotal),
      lineas.map((linea) => linea.nota),
    ],
  );
}

export async function obtenerDetalladoPorId(idPedido, cliente = pool) {
  const { rows } = await cliente.query(`${SELECT_PEDIDO_DETALLADO} WHERE p.id_pedido = $1`, [idPedido]);
  return rows[0] ? aPedidoDetallado(rows[0]) : null;
}

// El código se repite entre días; se toma el más reciente.
export async function obtenerDetalladoPorCodigo(codigoPedido) {
  const { rows } = await pool.query(
    `${SELECT_PEDIDO_DETALLADO} WHERE p.codigo_pedido = $1 ORDER BY p.fecha_creacion DESC LIMIT 1`,
    [codigoPedido],
  );
  return rows[0] ? aPedidoDetallado(rows[0]) : null;
}

export async function listarPorEstados(estados, limite) {
  const { rows } = await pool.query(
    `${SELECT_PEDIDO_DETALLADO}
      WHERE p.estado = ANY($1::varchar[])
      ORDER BY COALESCE(pg.fecha_pago, p.fecha_creacion), p.id_pedido
      LIMIT $2`,
    [estados, limite],
  );
  return rows.map(aPedidoDetallado);
}

export async function obtenerResumenPorId(idPedido) {
  const { rows } = await pool.query(
    'SELECT id_pedido, codigo_pedido, estado, total FROM pedido WHERE id_pedido = $1',
    [idPedido],
  );
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}

export async function bloquearPorId(cliente, idPedido) {
  const { rows } = await cliente.query(
    'SELECT id_pedido, codigo_pedido, estado, total FROM pedido WHERE id_pedido = $1 FOR UPDATE',
    [idPedido],
  );
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}

// Si otro usuario ya cambió el estado, no afecta filas y el servicio responde 409.
export async function actualizarEstadoSiSigueEn({ idPedido, estadoEsperado, estadoNuevo }, cliente = pool) {
  const { rows } = await cliente.query(
    `UPDATE pedido SET estado = $3
      WHERE id_pedido = $1 AND estado = $2
      RETURNING id_pedido, codigo_pedido, estado, total`,
    [idPedido, estadoEsperado, estadoNuevo],
  );
  return rows[0] ? aPedidoResumen(rows[0]) : null;
}
