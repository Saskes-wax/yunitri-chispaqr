export async function insertarPago(cliente, { idPedido, idUsuario, metodo, monto }) {
  const { rows } = await cliente.query(
    `INSERT INTO pago (id_pedido, id_usuario, metodo, monto)
     VALUES ($1, $2, $3, $4)
     RETURNING id_pago, metodo, monto, fecha_pago`,
    [idPedido, idUsuario, metodo, monto],
  );
  const fila = rows[0];
  return { idPago: fila.id_pago, metodo: fila.metodo, monto: fila.monto, fechaPago: fila.fecha_pago };
}
