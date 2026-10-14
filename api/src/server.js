import { config } from './config/env.js';
import { crearApp } from './app.js';
import { pool } from './db/pool.js';
import { logger } from './shared/logger.js';

const TIEMPO_MAXIMO_APAGADO_MS = 10_000;

async function verificarBaseDeDatos() {
  try {
    await pool.query('SELECT 1');
    logger.info('conexión con PostgreSQL verificada');
  } catch (err) {
    logger.error({ err }, 'PostgreSQL no responde; /health devolverá 503 hasta que vuelva');
  }
}

function registrarApagado(servidor) {
  const apagar = (senal) => {
    logger.info({ senal }, 'cerrando la API');
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), TIEMPO_MAXIMO_APAGADO_MS).unref();
  };
  process.on('SIGTERM', () => apagar('SIGTERM'));
  process.on('SIGINT', () => apagar('SIGINT'));
}

function registrarFallosFatales() {
  const salirConError = (tipo) => (err) => {
    logger.fatal({ err }, tipo);
    process.exit(1);
  };
  process.on('unhandledRejection', salirConError('promesa rechazada sin manejar'));
  process.on('uncaughtException', salirConError('excepción no capturada'));
}

registrarFallosFatales();
await verificarBaseDeDatos();

const servidor = crearApp().listen(config.puerto, () => {
  logger.info({ puerto: config.puerto, entorno: config.entorno }, 'API de ChispaQR escuchando');
});
registrarApagado(servidor);
