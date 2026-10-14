import { Router } from 'express';
import { autenticarPersonal } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { limiteComensal } from '../../middlewares/limites.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/constantes.js';
import {
  crearMesaEsquema,
  obtenerMesaEsquema,
  regenerarQrEsquema,
  registrarComensalEsquema,
} from './mesas.esquemas.js';
import * as controlador from './mesas.controlador.js';

export const rutasMesas = Router();

rutasMesas.post('/', autenticarPersonal, autorizar(ROLES.ADMINISTRADOR), validar(crearMesaEsquema), controlador.crear);

rutasMesas.get('/:codigoQr', validar(obtenerMesaEsquema), controlador.obtenerPorCodigoQr);

rutasMesas.post(
  '/:codigoQr/comensales',
  limiteComensal,
  validar(registrarComensalEsquema),
  controlador.registrarComensal,
);

rutasMesas.post(
  '/:idMesa/regenerar-qr',
  autenticarPersonal,
  autorizar(ROLES.ADMINISTRADOR),
  validar(regenerarQrEsquema),
  controlador.regenerarQr,
);
