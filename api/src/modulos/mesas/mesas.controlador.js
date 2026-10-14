import * as mesasServicio from './mesas.servicio.js';

export async function obtenerPorToken(req, res) {
  res.json(await mesasServicio.obtenerMesaPorToken(req.validado.params.tokenQr));
}

export async function registrarComensal(req, res) {
  const registro = await mesasServicio.registrarComensal({
    tokenQr: req.validado.params.tokenQr,
    nombreAlias: req.validado.body.nombreAlias,
  });
  req.log.info({ idComensal: registro.comensal.idComensal, mesa: registro.mesa.numero }, 'comensal registrado');
  res.status(201).json(registro);
}

export async function regenerarQr(req, res) {
  const mesa = await mesasServicio.regenerarQr(req.validado.params.idMesa);
  req.log.info({ idMesa: mesa.idMesa, idUsuario: req.usuario.idUsuario }, 'QR de mesa regenerado');
  res.json(mesa);
}
