import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.nivelLog,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.contrasena',
      '*.token',
      '*.codigoQr',
      '*.nombre',
    ],
    censor: '[oculto]',
  },
});
