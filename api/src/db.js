const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
  statement_timeout: 5000,
});

// Sin este listener, un cliente inactivo que pierde la conexión tumba el proceso.
pool.on('error', (err) => {
  console.error('Error en un cliente inactivo de PostgreSQL:', err.message);
});

function query(texto, parametros) {
  return pool.query(texto, parametros);
}

module.exports = { pool, query };
