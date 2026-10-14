import { conTransaccion } from '../../db/transaccion.js';
import { bloquearPedidoParaCobrar, marcarComoPagado } from '../pedidos/pedidos.servicio.js';
import * as pagosRepo from './pagos.repositorio.js';

// RN-3: el pago se inserta antes del cambio de estado; el trigger exige que el monto sea el total exacto.
export async function registrarPago({ idPedido, metodo, idUsuario }) {
  return conTransaccion(async (cliente) => {
    const pedido = await bloquearPedidoParaCobrar(cliente, idPedido);
    const pago = await pagosRepo.insertarPago(cliente, { idPedido, idUsuario, metodo, monto: pedido.total });
    const pagado = await marcarComoPagado(cliente, pedido);
    return { ...pago, idPedido, codigoPedido: pagado.codigoPedido, estado: pagado.estado };
  }, { idUsuario });
}
