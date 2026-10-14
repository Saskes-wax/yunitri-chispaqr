import { traducirErrorBD } from '../db/traducirErrorBD.js';
import { ErrorApp, NoEncontrado, ValidacionFallida } from '../shared/errores.js';

const ERRORES_DE_CUERPO = Object.freeze({
  'entity.parse.failed': () => new ValidacionFallida(undefined, 'El cuerpo de la petición no es JSON válido'),
  'entity.too.large': () => new ValidacionFallida(undefined, 'El cuerpo de la petición es demasiado grande'),
});

function normalizarError(err) {
  return ERRORES_DE_CUERPO[err?.type]?.() ?? traducirErrorBD(err) ?? err;
}

export function rutaNoEncontrada(req, _res, next) {
  next(new NoEncontrado(`Ruta ${req.method} ${req.path}`));
}

export function manejadorErrores(err, req, res, _next) {
  const error = normalizarError(err);
  const esEsperado = error instanceof ErrorApp;
  const status = esEsperado ? error.status : 500;

  if (status >= 500) {
    req.log.error({ err }, 'petición fallida');
  } else {
    req.log.warn({ status, codigo: error.codigo }, error.message);
  }

  if (res.headersSent) return;

  res.status(status).json({
    error: {
      codigo: esEsperado ? error.codigo : 'ERROR_INTERNO',
      mensaje: esEsperado ? error.message : 'Ocurrió un error inesperado. Intenta de nuevo.',
      ...(esEsperado && error.detalles ? { detalles: error.detalles } : {}),
    },
    idPeticion: req.id,
  });
}
