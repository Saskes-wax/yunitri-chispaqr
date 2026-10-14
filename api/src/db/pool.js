import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../shared/logger.js';

const OID_NUMERIC = 1700;

// NUMERIC llega como texto; se deja así para no perder precisión con float.
pg.types.setTypeParser(OID_NUMERIC, (valor) => valor);

export const pool = new pg.Pool({
  connectionString: config.urlBaseDatos,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
});

// Sin este listener, un cliente inactivo que pierde la conexión tumba el proceso.
pool.on('error', (err) => {
  logger.error({ err }, 'error en un cliente inactivo de PostgreSQL');
});
