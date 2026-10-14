import { Router } from 'express';
import { autenticarPersonal } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { limiteComensal } from '../../middlewares/limites.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/constantes.js';
import { obtenerMesaEsquema, regenerarQrEsquema, registrarComensalEsquema } from './mesas.esquemas.js';
import * as controlador from './mesas.controlador.js';

export const rutasMesas = Router();

rutasMesas.get('/:tokenQr', validar(obtenerMesaEsquema), controlador.obtenerPorToken);

rutasMesas.post(
  '/:tokenQr/comensales',
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
