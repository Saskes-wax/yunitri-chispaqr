import { conTransaccion } from '../../db/transaccion.js';
import { Conflicto, NoEncontrado, Prohibido } from '../../shared/errores.js';
import {
  ESTADOS_PEDIDO,
  ESTADOS_QUE_PUEDE_FIJAR,
  ESTADOS_VISIBLES_POR_ROL,
  LIMITE_LISTADO_PEDIDOS,
  ROLES,
} from '../../shared/constantes.js';
import { obtenerProductosParaPedido } from '../carta/carta.servicio.js';
import { armarLineas, generarCodigoPedido, validarTransicion } from './pedidos.reglas.js';
import * as pedidosRepo from './pedidos.repositorio.js';

const ROLES_QUE_BUSCAN_POR_CODIGO = [ROLES.CAJERO, ROLES.ADMINISTRADOR];

function aVistaPublica({ idComensal: _idComensal, ...pedido }) {
  return pedido;
}

export async function crearPedido({ idComensal, lineas: lineasSolicitadas }) {
  const idPedido = await conTransaccion(async (cliente) => {
    const idsProducto = [...new Set(lineasSolicitadas.map((linea) => linea.idProducto))];
    const productosPorId = await obtenerProductosParaPedido(cliente, idsProducto);
    const lineas = armarLineas(lineasSolicitadas, productosPorId);

    const numeroMesa = await pedidosRepo.obtenerNumeroMesaDeComensal(cliente, idComensal);
    if (numeroMesa === null) {
      throw new NoEncontrado('Comensal');
    }
    const secuencia = await pedidosRepo.siguienteSecuencia(cliente);

    const id = await pedidosRepo.insertarPedido(cliente, {
      idComensal,
      codigoPedido: generarCodigoPedido(numeroMesa, secuencia),
      estado: ESTADOS_PEDIDO.PENDIENTE_PAGO,
    });
    await pedidosRepo.insertarDetalles(cliente, id, lineas);
    return id;
  });

  return aVistaPublica(await pedidosRepo.obtenerDetalladoPorId(idPedido));
}

export async function obtenerPorCodigo({ codigoPedido, comensal, usuario }) {
  if (usuario && !ROLES_QUE_BUSCAN_POR_CODIGO.includes(usuario.rol)) {
    throw new Prohibido();
  }

  const pedido = await pedidosRepo.obtenerDetalladoPorCodigo(codigoPedido);
  // Un comensal solo ve sus pedidos; responder 404 evita revelar que el código existe.
  if (!pedido || (comensal && pedido.idComensal !== comensal.idComensal)) {
    throw new NoEncontrado('Pedido');
  }
  return aVistaPublica(pedido);
}

export async function listarPorEstados({ estados, rol }) {
  const visibles = ESTADOS_VISIBLES_POR_ROL[rol] ?? [];
  if (!estados.every((estado) => visibles.includes(estado))) {
    throw new Prohibido('Tu rol no puede ver pedidos en ese estado');
  }
  const pedidos = await pedidosRepo.listarPorEstados(estados, LIMITE_LISTADO_PEDIDOS);
  return pedidos.map(aVistaPublica);
}

export async function cambiarEstado({ idPedido, estadoNuevo, rol, idUsuario }) {
  if (!(ESTADOS_QUE_PUEDE_FIJAR[rol] ?? []).includes(estadoNuevo)) {
    throw new Prohibido(`Tu rol no puede marcar un pedido como ${estadoNuevo}`);
  }

  const pedido = await pedidosRepo.obtenerResumenPorId(idPedido);
  if (!pedido) {
    throw new NoEncontrado('Pedido');
  }
  validarTransicion(pedido.estado, estadoNuevo);

  const actualizado = await conTransaccion(
    (cliente) => pedidosRepo.actualizarEstadoSiSigueEn({ idPedido, estadoEsperado: pedido.estado, estadoNuevo }, cliente),
    { idUsuario },
  );
  if (!actualizado) {
    throw new Conflicto('PEDIDO_MODIFICADO', 'El pedido cambió de estado. Actualiza la pantalla.');
  }
  return actualizado;
}

export async function bloquearPedidoPendienteDePago(cliente, idPedido) {
  const pedido = await pedidosRepo.bloquearPorId(cliente, idPedido);
  if (!pedido) {
    throw new NoEncontrado('Pedido');
  }
  if (pedido.estado !== ESTADOS_PEDIDO.PENDIENTE_PAGO) {
    throw new Conflicto('PEDIDO_NO_PENDIENTE', `El pedido ${pedido.codigoPedido} ya está ${pedido.estado}`);
  }
  return pedido;
}

export async function marcarComoPagado(cliente, pedido) {
  return pedidosRepo.actualizarEstadoSiSigueEn(
    { idPedido: pedido.idPedido, estadoEsperado: ESTADOS_PEDIDO.PENDIENTE_PAGO, estadoNuevo: ESTADOS_PEDIDO.PAGADO },
    cliente,
  );
}
