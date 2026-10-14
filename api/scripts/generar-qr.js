// Genera un PNG por mesa y una hoja para imprimir en api/qr-generados/.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { pool } from '../src/db/pool.js';
import { listarMesas } from '../src/modulos/mesas/mesas.servicio.js';

const CARPETA_SALIDA = new URL('../qr-generados/', import.meta.url);
const URL_PUBLICA = process.env.PUBLIC_BASE_URL;

function urlDeMesa(codigoQr) {
  return `${URL_PUBLICA.replace(/\/$/, '')}/m/${codigoQr}`;
}

function tarjetaHtml(numero, archivo) {
  return `
    <article class="tarjeta">
      <h2>Recreo Chispa</h2>
      <p class="mesa">Mesa ${numero}</p>
      <img src="${archivo}" alt="QR de la mesa ${numero}">
      <p>Escanea para ver la carta y pedir</p>
    </article>`;
}

function hojaHtml(tarjetas) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>QR de mesas — Recreo Chispa</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; }
  .hoja { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12mm; padding: 12mm; }
  .tarjeta { border: 2px dashed #999; border-radius: 8px; padding: 8mm; text-align: center; break-inside: avoid; }
  .tarjeta h2 { margin: 0; color: #c2410c; }
  .mesa { font-size: 32px; font-weight: 700; margin: 4mm 0; }
  .tarjeta img { width: 60mm; height: 60mm; }
</style>
</head>
<body><main class="hoja">${tarjetas.join('')}</main></body>
</html>`;
}

async function generar() {
  if (!URL_PUBLICA) {
    throw new Error('Define PUBLIC_BASE_URL en el .env (la dirección que abrirá el celular)');
  }
  await mkdir(CARPETA_SALIDA, { recursive: true });

  const mesas = (await listarMesas()).filter((mesa) => mesa.activa);
  const tarjetas = [];
  for (const mesa of mesas) {
    const archivo = `mesa-${String(mesa.numero).padStart(2, '0')}.png`;
    await QRCode.toFile(fileURLToPath(new URL(archivo, CARPETA_SALIDA)), urlDeMesa(mesa.codigoQr), {
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    tarjetas.push(tarjetaHtml(mesa.numero, archivo));
  }
  await writeFile(new URL('imprimir.html', CARPETA_SALIDA), hojaHtml(tarjetas));
  console.log(`${mesas.length} QR generados en api/qr-generados/`);
}

try {
  await generar();
} finally {
  await pool.end();
}
