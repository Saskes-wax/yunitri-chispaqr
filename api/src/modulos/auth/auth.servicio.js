import bcrypt from 'bcryptjs';
import { Bloqueado, NoAutenticado } from '../../shared/errores.js';
import { COSTO_BCRYPT, INTENTOS_MAXIMOS_LOGIN, MINUTOS_BLOQUEO_LOGIN } from '../../shared/constantes.js';
import { firmarTokenPersonal } from '../../shared/tokens.js';
import * as authRepo from './auth.repositorio.js';

const CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

// Hash de relleno: si el usuario no existe, bcrypt igual gasta tiempo y no delata qué usuarios existen.
const HASH_DE_RELLENO = bcrypt.hashSync('relleno-para-tiempo-constante', COSTO_BCRYPT);

function minutosRestantes(hasta) {
  return Math.max(1, Math.ceil((new Date(hasta).getTime() - Date.now()) / 60_000));
}

function errorDeBloqueo(hasta) {
  return new Bloqueado(`Usuario bloqueado por intentos fallidos. Intenta de nuevo en ${minutosRestantes(hasta)} min.`);
}

// RNF-04: tras 5 intentos fallidos el usuario queda bloqueado unos minutos.
export async function iniciarSesion({ username, contrasena }) {
  const usuario = await authRepo.buscarPorUsername(username);
  if (usuario?.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) {
    throw errorDeBloqueo(usuario.bloqueadoHasta);
  }

  const contrasenaCoincide = await bcrypt.compare(contrasena, usuario?.passwordHash ?? HASH_DE_RELLENO);
  if (!usuario || !usuario.activo) {
    throw new NoAutenticado(CREDENCIALES_INVALIDAS);
  }
  if (!contrasenaCoincide) {
    const bloqueadoHasta = await authRepo.registrarIntentoFallido(usuario.idUsuario, {
      intentosMaximos: INTENTOS_MAXIMOS_LOGIN,
      minutosBloqueo: MINUTOS_BLOQUEO_LOGIN,
    });
    if (bloqueadoHasta && new Date(bloqueadoHasta) > new Date()) throw errorDeBloqueo(bloqueadoHasta);
    throw new NoAutenticado(CREDENCIALES_INVALIDAS);
  }

  await authRepo.reiniciarIntentos(usuario.idUsuario);
  return {
    token: firmarTokenPersonal(usuario),
    usuario: { idUsuario: usuario.idUsuario, nombre: usuario.nombre, rol: usuario.rol },
  };
}

export async function asegurarUsuarioActivo(idUsuario) {
  const usuario = await authRepo.buscarPorId(idUsuario);
  if (!usuario?.activo) {
    throw new NoAutenticado('Tu usuario está desactivado');
  }
}
