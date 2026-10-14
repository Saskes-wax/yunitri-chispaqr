import { z } from 'zod';
import { LONGITUD_MAXIMA_NOMBRE_COMENSAL } from '../../shared/constantes.js';

// Sin formato estricto: cualquier QR desconocido responde 404, como indica el contrato.
const codigoQr = z.string().max(64);

export const obtenerMesaEsquema = {
  params: z.object({ codigoQr }),
};

export const registrarComensalEsquema = {
  params: z.object({ codigoQr }),
  body: z
    .object({
      nombre: z.string().trim().min(1, 'Escribe tu nombre o alias').max(LONGITUD_MAXIMA_NOMBRE_COMENSAL),
    })
    .strict(),
};

export const crearMesaEsquema = {
  body: z
    .object({
      numero: z.number().int().positive(),
      zona: z.string().trim().min(1).max(30).optional(),
    })
    .strict(),
};

export const regenerarQrEsquema = {
  params: z.object({ idMesa: z.coerce.number().int().positive() }),
};
