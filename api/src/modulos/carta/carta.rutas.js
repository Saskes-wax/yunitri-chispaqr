import { Router } from 'express';
import { autenticarPersonal } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/constantes.js';
import { cambiarDisponibilidadEsquema, crearProductoEsquema, listarProductosEsquema } from './carta.esquemas.js';
import * as controlador from './carta.controlador.js';

export const rutasCategorias = Router();

rutasCategorias.get('/', controlador.listarCategorias);

export const rutasProductos = Router();

rutasProductos.get('/', validar(listarProductosEsquema), controlador.listarProductos);

rutasProductos.post(
  '/',
  autenticarPersonal,
  autorizar(ROLES.ADMINISTRADOR),
  validar(crearProductoEsquema),
  controlador.crearProducto,
);

rutasProductos.patch(
  '/:idProducto/disponibilidad',
  autenticarPersonal,
  autorizar(ROLES.COCINA, ROLES.ADMINISTRADOR),
  validar(cambiarDisponibilidadEsquema),
  controlador.cambiarDisponibilidad,
);
