import { Router } from 'express';
import { pool } from '../../db/pool.js';

const TIEMPO_MAXIMO_MS = 1_000;

async function baseDeDatosResponde() {
  const espera = new Promise((_, rechazar) => {
    setTimeout(() => rechazar(new Error('tiempo de espera agotado')), TIEMPO_MAXIMO_MS).unref();
  });
  try {
    await Promise.race([pool.query('SELECT 1'), espera]);
    return true;
  } catch {
    return false;
  }
}

export const rutasSalud = Router();

rutasSalud.get('/', async (req, res) => {
  if (await baseDeDatosResponde()) {
    return res.json({ estado: 'ok', bd: 'ok' });
  }
  req.log.error('health check: la base de datos no responde');
  return res.status(503).json({ estado: 'error', bd: 'sin conexión' });
});
