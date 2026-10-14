// Servidor de desarrollo sin dependencias: sirve web/ y reenvía /api a la API, igual que Nginx en Docker.
// Uso: node web/servidor-local.mjs   (variables opcionales: PUERTO_WEB=8080, API_URL=http://localhost:3000)
import { createServer, request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUERTO = Number(process.env.PUERTO_WEB) || 8080;
const API = new URL(process.env.API_URL || 'http://localhost:3000');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function reenviarAApi(req, res) {
  const proxy = request(
    { hostname: API.hostname, port: API.port, path: req.url, method: req.method, headers: req.headers },
    (respuestaApi) => {
      res.writeHead(respuestaApi.statusCode, respuestaApi.headers);
      respuestaApi.pipe(res);
    },
  );
  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { codigo: 'API_NO_DISPONIBLE', mensaje: 'La API no responde' } }));
  });
  req.pipe(proxy);
}

function resolverArchivo(rutaUrl) {
  if (rutaUrl.startsWith('/m/')) return join(RAIZ, 'comensal', 'index.html');
  const ruta = normalize(join(RAIZ, decodeURIComponent(rutaUrl)));
  if (!ruta.startsWith(RAIZ)) return null;
  return ruta.endsWith(sep) ? join(ruta, 'index.html') : ruta;
}

async function servirArchivo(req, res) {
  const ruta = resolverArchivo(new URL(req.url, 'http://local').pathname);
  try {
    if (!ruta || ruta.endsWith('servidor-local.mjs')) throw new Error('fuera de la carpeta web');
    const contenido = await readFile(ruta);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(contenido);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}

createServer((req, res) => (req.url.startsWith('/api/') ? reenviarAApi(req, res) : servirArchivo(req, res))).listen(
  PUERTO,
  () => console.log(`Web de ChispaQR en http://localhost:${PUERTO} (API: ${API.origin})`),
);
