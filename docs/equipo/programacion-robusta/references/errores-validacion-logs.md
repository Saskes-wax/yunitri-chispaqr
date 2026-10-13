# Errores, validación y logs

## 1. Validación en el borde (con esquemas)
Usa **zod** (o la librería que ya use el proyecto). Un esquema por endpoint en `modulo.esquemas.js`.

```js
// pedidos.esquemas.js
import { z } from 'zod';
import { CANTIDAD_MAXIMA_POR_LINEA, LONGITUD_MAXIMA_NOTA } from '../../shared/constantes.js';

export const crearPedidoEsquema = {
  body: z.object({
    lineas: z.array(z.object({
      idProducto: z.number().int().positive(),
      cantidad: z.number().int().min(1).max(CANTIDAD_MAXIMA_POR_LINEA),
      nota: z.string().trim().max(LONGITUD_MAXIMA_NOTA).optional(),
    }).strict()).min(1).max(30),
  }).strict(),                     // .strict(): rechaza campos que no esperamos (ej. "precio")
};
```

```js
// middlewares/validar.js
export const validar = (esquemas) => (req, _res, next) => {
  req.validado = {};
  for (const parte of ['params', 'query', 'body']) {
    if (!esquemas[parte]) continue;
    const r = esquemas[parte].safeParse(req[parte]);
    if (!r.success) throw new ValidacionFallida(r.error.issues);
    req.validado[parte] = r.data;
  }
  next();
};
```
Reglas: el controlador usa **solo** `req.validado`; límites de tamaño en todo (`express.json({ limit: '100kb' })`, longitud de textos, tamaño de arrays); `trim` a textos; IDs como enteros positivos.

## 2. Errores tipados

```js
// shared/errores.js
export class ErrorApp extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = this.constructor.name;
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
    this.esOperacional = true;   // error esperado, no bug
  }
}
export class ValidacionFallida extends ErrorApp { constructor(d) { super(400, 'VALIDACION_FALLIDA', 'Datos inválidos', d); } }
export class NoAutenticado  extends ErrorApp { constructor(m = 'Debes iniciar sesión') { super(401, 'NO_AUTENTICADO', m); } }
export class Prohibido      extends ErrorApp { constructor(m = 'No tienes permiso') { super(403, 'PROHIBIDO', m); } }
export class NoEncontrado   extends ErrorApp { constructor(recurso) { super(404, 'NO_ENCONTRADO', `${recurso} no encontrado`); } }
export class Conflicto      extends ErrorApp { constructor(codigo, m) { super(409, codigo, m); } }
```

| Situación | Status |
|---|---|
| Entrada inválida | 400 |
| Sin token / token inválido o vencido | 401 |
| Token válido pero rol sin permiso, o recurso ajeno | 403 (o 404 si revelar existencia es un riesgo) |
| No existe | 404 |
| Regla de negocio/estado lo impide (transición, agotado, ya pagado, duplicado) | 409 |
| Demasiadas peticiones | 429 |
| Bug o dependencia caída | 500 / 503 |

## 3. Un solo manejador de errores

```js
// middlewares/manejadorErrores.js
export function manejadorErrores(err, req, res, _next) {
  const traducido = traducirErrorBD(err) ?? err;          // ver base-de-datos.md
  const esEsperado = traducido instanceof ErrorApp;
  const status = esEsperado ? traducido.status : 500;

  req.log[status >= 500 ? 'error' : 'warn']({ err, status }, 'petición fallida');

  if (res.headersSent) return;                             // no responder dos veces
  res.status(status).json({
    error: {
      codigo: esEsperado ? traducido.codigo : 'ERROR_INTERNO',
      mensaje: esEsperado ? traducido.message : 'Ocurrió un error inesperado. Intenta de nuevo.',
      ...(esEsperado && traducido.detalles ? { detalles: traducido.detalles } : {}),
    },
    idPeticion: req.id,
  });
}
```
Nunca se envía al cliente: stack, SQL, nombre de tablas, mensajes internos de librerías. Añade también un handler 404 para rutas inexistentes antes del manejador de errores.

## 4. Errores que NO son operacionales
Un `TypeError`, `undefined is not a function` o promesa sin manejar es un **bug**: se registra como `error`/`fatal`, se responde 500 genérico y se corrige la causa (no se envuelve en un `try/catch` para esconderlo).

## 5. Logs estructurados (pino + pino-http)
- Un logger para toda la app (`shared/logger.js`), nivel por variable de entorno (`LOG_NIVEL`).
- `pino-http` asigna `req.id` (o respeta `X-Request-Id`) y `req.log` con ese ID → cada línea de una petición se puede seguir.
- **Redacción obligatoria**: `redact: ['req.headers.authorization', 'req.headers.cookie', '*.contrasena', '*.token', '*.tokenQr']`.
- Qué registrar: inicio/fin de petición con status y duración, cambios de estado de negocio (pedido X pasó a PAGADO por cajero Y), fallos de login (sin la contraseña), errores. Qué no: datos personales, cuerpos completos, secretos.
- Niveles: `fatal` (la app cae), `error` (bug o dependencia caída), `warn` (rechazo esperado relevante, ej. muchos 401), `info` (eventos de negocio), `debug` (solo desarrollo).

## 6. Salud
`GET /api/v1/health` → 200 `{ estado: 'ok', bd: 'ok' }` si `SELECT 1` responde en < 1 s; si no, 503. Docker usa este endpoint en su `healthcheck`.
