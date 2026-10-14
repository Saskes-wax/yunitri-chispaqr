import { NoAutenticado } from '../shared/errores.js';
import { verificarTokenComensal, verificarTokenPersonal } from '../shared/tokens.js';
import { asegurarUsuarioActivo } from '../modulos/auth/auth.servicio.js';

const PREFIJO_BEARER = 'Bearer ';

function extraerToken(req) {
  const cabecera = req.get('authorization') ?? '';
  if (!cabecera.startsWith(PREFIJO_BEARER)) {
    throw new NoAutenticado();
  }
  return cabecera.slice(PREFIJO_BEARER.length).trim();
}

function intentarVerificar(verificador, token) {
  try {
    return verificador(token);
  } catch {
    return null;
  }
}

export async function autenticarPersonal(req, _res, next) {
  const usuario = intentarVerificar(verificarTokenPersonal, extraerToken(req));
  if (!usuario) {
    throw new NoAutenticado('Sesión no válida o vencida');
  }
  await asegurarUsuarioActivo(usuario.idUsuario);
  req.usuario = usuario;
  next();
}

export function autenticarComensal(req, _res, next) {
  const comensal = intentarVerificar(verificarTokenComensal, extraerToken(req));
  if (!comensal) {
    throw new NoAutenticado('Vuelve a escanear el QR de tu mesa');
  }
  req.comensal = comensal;
  next();
}

export async function autenticarPersonalOComensal(req, res, next) {
  const token = extraerToken(req);
  if (intentarVerificar(verificarTokenComensal, token)) {
    return autenticarComensal(req, res, next);
  }
  return autenticarPersonal(req, res, next);
}
