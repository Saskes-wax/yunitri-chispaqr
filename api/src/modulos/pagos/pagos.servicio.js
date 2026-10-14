import { conTransaccion } from '../../db/transaccion.js';
import { bloquearPedidoPendienteDePago, marcarComoPagado } from '../pedidos/pedidos.servicio.js';
import * as pagosRepo from './pagos.repositorio.js';

// RN-3: el pago se inserta antes del cambio de estado para que el trigger lo encuentre.
export async function registrarPago({ idPedido, metodo, idUsuario }) {
  return conTransaccion(async (cliente) => {
    const pedido = await bloquearPedidoPendienteDePago(cliente, idPedido);
    const pago = await pagosRepo.insertarPago(cliente, { idPedido, idUsuario, metodo, monto: pedido.total });
    const pagado = await marcarComoPagado(cliente, pedido);
    return { ...pago, idPedido, codigoPedido: pagado.codigoPedido, estado: pagado.estado };
  }, { idUsuario });
}
