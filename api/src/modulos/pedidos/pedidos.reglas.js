import { Conflicto } from '../../shared/errores.js';
import { TRANSICIONES_PEDIDO } from '../../shared/constantes.js';

export function validarTransicion(estadoActual, estadoNuevo) {
  const permitidos = TRANSICIONES_PEDIDO[estadoActual] ?? [];
  if (!permitidos.includes(estadoNuevo)) {
    throw new Conflicto('TRANSICION_NO_PERMITIDA', `No se puede pasar de ${estadoActual} a ${estadoNuevo}`);
  }
}

export function generarCodigoPedido(numeroMesa, numeroDePedido) {
  const mesa = String(numeroMesa).padStart(2, '0');
  const secuencia = String(numeroDePedido).padStart(3, '0');
  return `M${mesa}-${secuencia}`;
}

// RN-1: el precio sale de la carta vigente, nunca del cliente.
// El subtotal (columna generada) y el total (vista v_pedido_total) los calcula la base de datos.
export function armarLineas(lineasSolicitadas, productosPorId) {
  return lineasSolicitadas.map(({ idProducto, cantidad, nota }) => ({
    idProducto,
    cantidad,
    nota: nota || null,
    precioUnitario: productosPorId.get(idProducto).precio,
  }));
}
