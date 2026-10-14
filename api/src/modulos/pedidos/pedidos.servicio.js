import { conTransaccion } from '../../db/transaccion.js';
import { Conflicto, NoEncontrado, Prohibido } from '../../shared/errores.js';
import {
  ESTADOS_CON_TICKET,
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
const RESTRICCION_CLAVE_ENVIO = 'pedido_clave_envio_key';

function aVistaPublica({ idComensal: _idComensal, ...pedido }) {
  return pedido;
}

async function pedidoYaEnviado(idComensal, claveEnvio) {
  if (!claveEnvio) return null;
  const existente = await pedidosRepo.buscarPorClaveEnvio(claveEnvio);
  if (!existente) return null;
  if (existente.idComensal !== idComensal) {
    throw new Conflicto('CLAVE_ENVIO_USADA', 'Esa clave de envío pertenece a otro pedido');
  }
  return aVistaPublica(await pedidosRepo.obtenerDetalladoPorId(existente.idPedido));
}

async function insertarPedidoNuevo({ idComensal, lineas: lineasSolicitadas, claveEnvio }) {
  return conTransaccion(async (cliente) => {
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
      claveEnvio,
    });
    await pedidosRepo.insertarDetalles(cliente, id, lineas);
    return id;
  });
}

// RNF-02: un reintento con la misma clave_envio devuelve el pedido ya creado, nunca uno nuevo.
export async function crearPedido({ idComensal, lineas, claveEnvio }) {
  const yaEnviado = await pedidoYaEnviado(idComensal, claveEnvio);
  if (yaEnviado) return { pedido: yaEnviado, esNuevo: false };

  try {
    const idPedido = await insertarPedidoNuevo({ idComensal, lineas, claveEnvio });
    return { pedido: aVistaPublica(await pedidosRepo.obtenerDetalladoPorId(idPedido)), esNuevo: true };
  } catch (error) {
    // Dos reintentos simultáneos: el segundo choca con el UNIQUE y recibe el pedido del primero.
    if (error.code === '23505' && error.constraint === RESTRICCION_CLAVE_ENVIO) {
      return { pedido: await pedidoYaEnviado(idComensal, claveEnvio), esNuevo: false };
    }
    throw error;
  }
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

// RF-09 y RNF-05: ticket interno, no tributario; del comensal solo lleva su nombre.
export async function obtenerTicket(idPedido) {
  const pedido = await pedidosRepo.obtenerDetalladoPorId(idPedido);
  if (!pedido) {
    throw new NoEncontrado('Pedido');
  }
  if (!ESTADOS_CON_TICKET.includes(pedido.estado)) {
    throw new Conflicto('PEDIDO_NO_PAGADO', `El pedido ${pedido.codigoPedido} todavía no está pagado`);
  }
  return {
    codigoPedido: pedido.codigoPedido,
    numeroMesa: pedido.numeroMesa,
    zona: pedido.zona,
    nombreComensal: pedido.nombreComensal,
    lineas: pedido.lineas.map(({ nombre, cantidad, precioUnitario, subtotal }) => ({ nombre, cantidad, precioUnitario, subtotal })),
    total: pedido.total,
    metodoPago: pedido.metodoPago,
    fechaPago: pedido.fechaPago,
  };
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

// Regla 7 (v1.1): si algo se agotó después de pedir, no se cobra hasta que el cajero lo resuelva.
export async function bloquearPedidoParaCobrar(cliente, idPedido) {
  const pedido = await pedidosRepo.bloquearPorId(cliente, idPedido);
  if (!pedido) {
    throw new NoEncontrado('Pedido');
  }
  if (pedido.estado !== ESTADOS_PEDIDO.PENDIENTE_PAGO) {
    throw new Conflicto('PEDIDO_NO_PENDIENTE', `El pedido ${pedido.codigoPedido} ya está ${pedido.estado}`);
  }
  const agotados = await pedidosRepo.productosAgotadosDelPedido(cliente, idPedido);
  if (agotados.length > 0) {
    throw new Conflicto(
      'PRODUCTO_AGOTADO',
      `No se puede cobrar: ${agotados.join(', ')} se agotó. Avisa al cliente o cancela el pedido.`,
    );
  }
  return pedido;
}

export async function marcarComoPagado(cliente, pedido) {
  return pedidosRepo.actualizarEstadoSiSigueEn(
    { idPedido: pedido.idPedido, estadoEsperado: ESTADOS_PEDIDO.PENDIENTE_PAGO, estadoNuevo: ESTADOS_PEDIDO.PAGADO },
    cliente,
  );
}
