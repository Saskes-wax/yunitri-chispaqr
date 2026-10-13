function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

const config = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  databaseUrl: requerida('DATABASE_URL'),
});

module.exports = config;
