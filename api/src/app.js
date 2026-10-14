import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './shared/logger.js';
import { manejadorErrores, rutaNoEncontrada } from './middlewares/manejadorErrores.js';
import { rutasSalud } from './modulos/salud/salud.rutas.js';
import { rutasAuth } from './modulos/auth/auth.rutas.js';
import { rutasMesas } from './modulos/mesas/mesas.rutas.js';

const ID_PETICION_VALIDO = /^[\w-]{8,64}$/;

function obtenerIdPeticion(req) {
  const recibido = req.get('x-request-id');
  return recibido && ID_PETICION_VALIDO.test(recibido) ? recibido : randomUUID();
}

export function crearApp() {
  const app = express();

  // La API corre detrás del Nginx del servicio web; así se lee la IP real del cliente.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(pinoHttp({ logger, genReqId: obtenerIdPeticion }));
  app.use(express.json({ limit: '100kb' }));

  const v1 = express.Router();
  v1.use('/health', rutasSalud);
  v1.use('/auth', rutasAuth);
  v1.use('/mesas', rutasMesas);

  app.use('/api/v1', v1);
  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);

  return app;
}
