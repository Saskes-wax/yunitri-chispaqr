import { z } from 'zod';
import { LONGITUD_MAXIMA_ALIAS } from '../../shared/constantes.js';

// Sin formato estricto: cualquier QR desconocido responde 404, como indica el contrato.
const tokenQr = z.string().max(64);

export const obtenerMesaEsquema = {
  params: z.object({ tokenQr }),
};

export const registrarComensalEsquema = {
  params: z.object({ tokenQr }),
  body: z
    .object({
      nombreAlias: z.string().trim().min(1, 'Escribe tu nombre o alias').max(LONGITUD_MAXIMA_ALIAS),
    })
    .strict(),
};

export const regenerarQrEsquema = {
  params: z.object({ idMesa: z.coerce.number().int().positive() }),
};
