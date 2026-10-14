if (!process.env.TEST_DATABASE_URL) {
  console.error('Define TEST_DATABASE_URL con una base de datos de prueba (se vacía en cada prueba).');
  process.exit(1);
}

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'secreto-solo-para-pruebas-automaticas-0123456789';
