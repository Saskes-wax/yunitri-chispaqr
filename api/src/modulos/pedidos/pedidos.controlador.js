import * as pedidosServicio from './pedidos.servicio.js';

export async function crear(req, res) {
  const { pedido, esNuevo } = await pedidosServicio.crearPedido({
    idComensal: req.comensal.idComensal,
    lineas: req.validado.body.lineas,
    claveEnvio: req.validado.body.claveEnvio,
  });
  if (esNuevo) req.log.info({ idPedido: pedido.idPedido, codigoPedido: pedido.codigoPedido }, 'pedido creado');
  res.status(esNuevo ? 201 : 200).json(pedido);
}

export async function obtenerTicket(req, res) {
  res.json(await pedidosServicio.obtenerTicket(req.validado.params.idPedido));
}

export async function obtenerPorCodigo(req, res) {
  const pedido = await pedidosServicio.obtenerPorCodigo({
    codigoPedido: req.validado.params.codigoPedido,
    comensal: req.comensal,
    usuario: req.usuario,
  });
  res.json(pedido);
}

export async function listar(req, res) {
  const pedidos = await pedidosServicio.listarPorEstados({
    estados: req.validado.query.estado,
    rol: req.usuario.rol,
  });
  res.json({ datos: pedidos, total: pedidos.length });
}

export async function cambiarEstado(req, res) {
  const pedido = await pedidosServicio.cambiarEstado({
    idPedido: req.validado.params.idPedido,
    estadoNuevo: req.validado.body.estado,
    rol: req.usuario.rol,
    idUsuario: req.usuario.idUsuario,
  });
  req.log.info(
    { idPedido: pedido.idPedido, estado: pedido.estado, idUsuario: req.usuario.idUsuario },
    'estado de pedido cambiado',
  );
  res.json(pedido);
}
