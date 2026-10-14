import { Router } from 'express';
import { autenticarPersonal } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/constantes.js';
import { registrarPagoEsquema } from './pagos.esquemas.js';
import * as controlador from './pagos.controlador.js';

export const rutasPagos = Router();

rutasPagos.post(
  '/:idPedido/pago',
  autenticarPersonal,
  autorizar(ROLES.CAJERO, ROLES.ADMINISTRADOR),
  validar(registrarPagoEsquema),
  controlador.registrar,
);
