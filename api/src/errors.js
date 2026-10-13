class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function rutaNoEncontrada(req, res, next) {
  next(new HttpError(404, `No existe la ruta ${req.method} ${req.originalUrl}`));
}

function manejadorDeErrores(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { HttpError, rutaNoEncontrada, manejadorDeErrores };
