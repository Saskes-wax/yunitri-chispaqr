import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const UN_MINUTO = 60_000;

function crearLimite(maximoPorMinuto, mensaje) {
  return rateLimit({
    windowMs: UN_MINUTO,
    limit: maximoPorMinuto,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.esPrueba,
    message: { error: { codigo: 'DEMASIADAS_PETICIONES', mensaje } },
  });
}

export const limiteLogin = crearLimite(10, 'Demasiados intentos. Espera un minuto.');

// Los comensales comparten el wifi del recreo (misma IP), por eso el límite es amplio.
export const limiteComensal = crearLimite(120, 'Demasiadas peticiones. Espera un momento.');
