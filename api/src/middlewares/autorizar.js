import { Prohibido } from '../shared/errores.js';

export function autorizar(...rolesPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      throw new Prohibido();
    }
    next();
  };
}
