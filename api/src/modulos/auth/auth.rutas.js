import { Router } from 'express';
import { limiteLogin } from '../../middlewares/limites.js';
import { validar } from '../../middlewares/validar.js';
import { loginEsquema } from './auth.esquemas.js';
import * as controlador from './auth.controlador.js';

export const rutasAuth = Router();

rutasAuth.post('/login', limiteLogin, validar(loginEsquema), controlador.login);
