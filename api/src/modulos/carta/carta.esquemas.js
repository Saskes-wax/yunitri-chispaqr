import { z } from 'zod';
import { esMontoValido } from '../../shared/dinero.js';

const id = z.coerce.number().int().positive();
const booleanoEnTexto = z.enum(['true', 'false']).transform((valor) => valor === 'true');

const precio = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(esMontoValido, 'Precio con máximo dos decimales, por ejemplo 12.50');

export const listarProductosEsquema = {
  query: z
    .object({
      disponible: booleanoEnTexto.optional(),
      idCategoria: id.optional(),
    })
    .strict(),
};

export const crearProductoEsquema = {
  body: z
    .object({
      idCategoria: z.number().int().positive(),
      nombre: z.string().trim().min(1).max(80),
      descripcion: z.string().trim().max(200).optional(),
      precio,
      disponible: z.boolean().default(true),
    })
    .strict(),
};

export const cambiarDisponibilidadEsquema = {
  params: z.object({ idProducto: id }),
  body: z.object({ disponible: z.boolean() }).strict(),
};
