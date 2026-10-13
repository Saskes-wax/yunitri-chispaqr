const config = require('./config');
const app = require('./app');
const { pool } = require('./db');

const server = app.listen(config.port, () => {
  console.log(`API de ChispaQR escuchando en el puerto ${config.port}`);
});

function apagar(senal) {
  console.log(`${senal} recibido, cerrando la API...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));
