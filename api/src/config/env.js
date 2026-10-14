import { z } from 'zod';

const esquemaEntorno = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'silent']).default('info'),
});

function leerEntorno() {
  const resultado = esquemaEntorno.safeParse(process.env);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`Configuración inválida en las variables de entorno:\n${problemas}`);
    process.exit(1);
  }
  return resultado.data;
}

const entorno = leerEntorno();

export const config = Object.freeze({
  entorno: entorno.NODE_ENV,
  esProduccion: entorno.NODE_ENV === 'production',
  esPrueba: entorno.NODE_ENV === 'test',
  puerto: entorno.PORT,
  urlBaseDatos: entorno.DATABASE_URL,
  jwtSecreto: entorno.JWT_SECRET,
  jwtExpiracion: entorno.JWT_EXPIRES_IN,
  nivelLog: entorno.LOG_LEVEL,
});
