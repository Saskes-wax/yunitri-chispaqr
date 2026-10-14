import { Conflicto } from '../../shared/errores.js';
import { TRANSICIONES_PEDIDO } from '../../shared/constantes.js';
import { aCentimos, aSoles } from '../../shared/dinero.js';

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

// RN-1: precios y total salen del servidor, nunca del cliente.
export function calcularLineasYTotal(lineasSolicitadas, productosPorId) {
  let totalCentimos = 0;
  const lineas = lineasSolicitadas.map(({ idProducto, cantidad, nota }) => {
    const precioCentimos = aCentimos(productosPorId.get(idProducto).precio);
    const subtotalCentimos = precioCentimos * cantidad;
    totalCentimos += subtotalCentimos;
    return {
      idProducto,
      cantidad,
      nota: nota || null,
      precioUnitario: aSoles(precioCentimos),
      subtotal: aSoles(subtotalCentimos),
    };
  });
  return { lineas, total: aSoles(totalCentimos) };
}
