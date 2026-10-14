import * as cartaServicio from './carta.servicio.js';

export async function listarCategorias(_req, res) {
  res.json({ datos: await cartaServicio.listarCategorias() });
}

export async function listarProductos(req, res) {
  res.json({ datos: await cartaServicio.listarProductos(req.validado.query) });
}

export async function crearProducto(req, res) {
  const producto = await cartaServicio.crearProducto(req.validado.body);
  req.log.info({ idProducto: producto.idProducto, idUsuario: req.usuario.idUsuario }, 'producto creado');
  res.status(201).json(producto);
}

export async function actualizarProducto(req, res) {
  const { idProducto } = req.validado.params;
  const producto = await cartaServicio.actualizarProducto(idProducto, req.validado.body);
  req.log.info({ idProducto, campos: Object.keys(req.validado.body), idUsuario: req.usuario.idUsuario }, 'producto actualizado');
  res.json(producto);
}

export async function cambiarDisponibilidad(req, res) {
  const { idProducto } = req.validado.params;
  const producto = await cartaServicio.cambiarDisponibilidad(idProducto, req.validado.body.disponible);
  req.log.info({ idProducto, disponible: producto.disponible, idUsuario: req.usuario.idUsuario }, 'disponibilidad cambiada');
  res.json(producto);
}
