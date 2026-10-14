import { z } from 'zod';

export const loginEsquema = {
  body: z
    .object({
      nombreUsuario: z.string().trim().min(1).max(40),
      contrasena: z.string().min(1).max(72),
    })
    .strict(),
};
