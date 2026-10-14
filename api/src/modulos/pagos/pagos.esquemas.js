import { z } from 'zod';
import { METODOS_PAGO } from '../../shared/constantes.js';

export const registrarPagoEsquema = {
  params: z.object({ idPedido: z.coerce.number().int().positive() }),
  body: z.object({ metodo: z.enum(Object.values(METODOS_PAGO)) }).strict(),
};
