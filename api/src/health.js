const { Router } = require('express');
const db = require('./db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ estado: 'ok', bd: 'conectada' });
  } catch (err) {
    console.error('Health check sin base de datos:', err.code || err.message);
    res.status(500).json({ estado: 'error', bd: 'sin conexión' });
  }
});

module.exports = router;
