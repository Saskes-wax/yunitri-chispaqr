import { Router } from 'express';
import {
  autenticarComensal,
  autenticarPersonal,
  autenticarPersonalOComensal,
} from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { limiteComensal } from '../../middlewares/limites.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/constantes.js';
import {
  cambiarEstadoEsquema,
  crearPedidoEsquema,
  idPedidoEsquema,
  listarPedidosEsquema,
  obtenerPorCodigoEsquema,
} from './pedidos.esquemas.js';
import * as controlador from './pedidos.controlador.js';

const TODO_EL_PERSONAL = Object.values(ROLES);

export const rutasPedidos = Router();

rutasPedidos.post('/', limiteComensal, autenticarComensal, validar(crearPedidoEsquema), controlador.crear);

rutasPedidos.get(
  '/codigo/:codigoPedido',
  autenticarPersonalOComensal,
  validar(obtenerPorCodigoEsquema),
  controlador.obtenerPorCodigo,
);

// El permiso fino por estado lo decide el servicio con ESTADOS_VISIBLES_POR_ROL.
rutasPedidos.get(
  '/',
  autenticarPersonal,
  autorizar(...TODO_EL_PERSONAL),
  validar(listarPedidosEsquema),
  controlador.listar,
);

rutasPedidos.get(
  '/:idPedido/ticket',
  autenticarPersonal,
  autorizar(ROLES.CAJERO, ROLES.ADMINISTRADOR),
  validar(idPedidoEsquema),
  controlador.obtenerTicket,
);

rutasPedidos.patch(
  '/:idPedido/estado',
  autenticarPersonal,
  autorizar(...TODO_EL_PERSONAL),
  validar(cambiarEstadoEsquema),
  controlador.cambiarEstado,
);
