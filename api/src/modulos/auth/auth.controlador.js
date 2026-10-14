import * as authServicio from './auth.servicio.js';

export async function login(req, res) {
  const sesion = await authServicio.iniciarSesion(req.validado.body);
  req.log.info({ idUsuario: sesion.usuario.idUsuario, rol: sesion.usuario.rol }, 'inicio de sesión');
  res.json(sesion);
}
