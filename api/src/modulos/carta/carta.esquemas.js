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

export const actualizarProductoEsquema = {
  params: z.object({ idProducto: id }),
  body: z
    .object({
      idCategoria: z.number().int().positive().optional(),
      nombre: z.string().trim().min(1).max(80).optional(),
      descripcion: z.string().trim().max(200).nullable().optional(),
      precio: precio.optional(),
      disponible: z.boolean().optional(),
    })
    .strict()
    .refine((cambios) => Object.keys(cambios).length > 0, 'Envía al menos un campo para cambiar'),
};

export const cambiarDisponibilidadEsquema = {
  params: z.object({ idProducto: id }),
  body: z.object({ disponible: z.boolean() }).strict(),
};
