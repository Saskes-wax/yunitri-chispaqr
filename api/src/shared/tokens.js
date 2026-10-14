import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { EXPIRACION_TOKEN_COMENSAL } from './constantes.js';

const EMISOR = 'chispaqr-api';
const ALGORITMO = 'HS256';

// Audiencias distintas: un token de comensal nunca sirve como token del personal.
const AUDIENCIA_PERSONAL = 'personal';
const AUDIENCIA_COMENSAL = 'comensal';

function firmar(carga, audiencia, expiracion) {
  return jwt.sign(carga, config.jwtSecreto, {
    algorithm: ALGORITMO,
    issuer: EMISOR,
    audience: audiencia,
    expiresIn: expiracion,
  });
}

function verificar(token, audiencia) {
  return jwt.verify(token, config.jwtSecreto, {
    algorithms: [ALGORITMO],
    issuer: EMISOR,
    audience: audiencia,
  });
}

export function firmarTokenPersonal({ idUsuario, rol }) {
  return firmar({ sub: String(idUsuario), rol }, AUDIENCIA_PERSONAL, config.jwtExpiracion);
}

export function verificarTokenPersonal(token) {
  const carga = verificar(token, AUDIENCIA_PERSONAL);
  return { idUsuario: Number(carga.sub), rol: carga.rol };
}

export function firmarTokenComensal({ idComensal, idSesion, idMesa }) {
  return firmar({ sub: String(idComensal), idSesion, idMesa }, AUDIENCIA_COMENSAL, EXPIRACION_TOKEN_COMENSAL);
}

export function verificarTokenComensal(token) {
  const carga = verificar(token, AUDIENCIA_COMENSAL);
  return { idComensal: Number(carga.sub), idSesion: carga.idSesion, idMesa: carga.idMesa };
}
