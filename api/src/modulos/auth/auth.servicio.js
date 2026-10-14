import bcrypt from 'bcryptjs';
import { NoAutenticado } from '../../shared/errores.js';
import { COSTO_BCRYPT } from '../../shared/constantes.js';
import { firmarTokenPersonal } from '../../shared/tokens.js';
import * as authRepo from './auth.repositorio.js';

const CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

// Hash de relleno: si el usuario no existe, bcrypt igual gasta tiempo y no delata qué usuarios existen.
const HASH_DE_RELLENO = bcrypt.hashSync('relleno-para-tiempo-constante', COSTO_BCRYPT);

export async function iniciarSesion({ nombreUsuario, contrasena }) {
  const usuario = await authRepo.buscarPorNombreUsuario(nombreUsuario);
  const contrasenaCoincide = await bcrypt.compare(contrasena, usuario?.contrasenaHash ?? HASH_DE_RELLENO);

  if (!usuario || !contrasenaCoincide || !usuario.activo) {
    throw new NoAutenticado(CREDENCIALES_INVALIDAS);
  }

  return {
    token: firmarTokenPersonal(usuario),
    usuario: { idUsuario: usuario.idUsuario, nombreCompleto: usuario.nombreCompleto, rol: usuario.rol },
  };
}

export async function asegurarUsuarioActivo(idUsuario) {
  const usuario = await authRepo.buscarPorId(idUsuario);
  if (!usuario?.activo) {
    throw new NoAutenticado('Tu usuario está desactivado');
  }
}
