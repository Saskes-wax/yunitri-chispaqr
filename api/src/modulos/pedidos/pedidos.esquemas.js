import { z } from 'zod';
import {
  CANTIDAD_MAXIMA_POR_LINEA,
  ESTADOS_PEDIDO,
  LINEAS_MAXIMAS_POR_PEDIDO,
  LONGITUD_MAXIMA_NOTA,
} from '../../shared/constantes.js';

const estadoPedido = z.enum(Object.values(ESTADOS_PEDIDO));
const idPedido = z.coerce.number().int().positive();

export const crearPedidoEsquema = {
  body: z
    .object({
      lineas: z
        .array(
          z
            .object({
              idProducto: z.number().int().positive(),
              cantidad: z.number().int().min(1).max(CANTIDAD_MAXIMA_POR_LINEA),
              nota: z.string().trim().max(LONGITUD_MAXIMA_NOTA).optional(),
            })
            .strict(),
        )
        .min(1, 'El pedido debe tener al menos un producto')
        .max(LINEAS_MAXIMAS_POR_PEDIDO),
    })
    .strict(),
};

export const listarPedidosEsquema = {
  query: z
    .object({
      estado: z
        .string()
        .transform((texto) => [...new Set(texto.split(',').map((estado) => estado.trim()))])
        .pipe(z.array(estadoPedido).min(1)),
    })
    .strict(),
};

export const obtenerPorCodigoEsquema = {
  params: z.object({
    codigoPedido: z.string().regex(/^M\d{2,}-\d{3,}$/, 'Código con formato M05-017'),
  }),
};

export const cambiarEstadoEsquema = {
  params: z.object({ idPedido }),
  body: z.object({ estado: estadoPedido }).strict(),
};
