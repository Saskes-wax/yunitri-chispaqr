import * as pagosServicio from './pagos.servicio.js';

export async function registrar(req, res) {
  const pago = await pagosServicio.registrarPago({
    idPedido: req.validado.params.idPedido,
    metodo: req.validado.body.metodo,
    idUsuario: req.usuario.idUsuario,
  });
  req.log.info(
    { idPedido: pago.idPedido, metodo: pago.metodo, monto: pago.monto, idUsuario: req.usuario.idUsuario },
    'pago registrado',
  );
  res.status(201).json(pago);
}
