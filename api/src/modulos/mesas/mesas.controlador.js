import * as mesasServicio from './mesas.servicio.js';

export async function obtenerPorCodigoQr(req, res) {
  res.json(await mesasServicio.obtenerMesaPorCodigoQr(req.validado.params.codigoQr));
}

export async function registrarComensal(req, res) {
  const registro = await mesasServicio.registrarComensal({
    codigoQr: req.validado.params.codigoQr,
    nombre: req.validado.body.nombre,
  });
  req.log.info({ idComensal: registro.comensal.idComensal, mesa: registro.mesa.numero }, 'comensal registrado');
  res.status(201).json(registro);
}

export async function crear(req, res) {
  const mesa = await mesasServicio.crearMesa(req.validado.body);
  req.log.info({ idMesa: mesa.idMesa, idUsuario: req.usuario.idUsuario }, 'mesa creada');
  res.status(201).json(mesa);
}

export async function regenerarQr(req, res) {
  const mesa = await mesasServicio.regenerarQr(req.validado.params.idMesa);
  req.log.info({ idMesa: mesa.idMesa, idUsuario: req.usuario.idUsuario }, 'QR de mesa regenerado');
  res.json(mesa);
}
