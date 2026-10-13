const express = require('express');
const health = require('./health');
const { rutaNoEncontrada, manejadorDeErrores } = require('./errors');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

const v1 = express.Router();
v1.use('/health', health);

app.use('/api/v1', v1);
app.use(rutaNoEncontrada);
app.use(manejadorDeErrores);

module.exports = app;
