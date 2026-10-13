# Arquitectura — monolito modular por capas

## Por qué así
Un monolito modular da un solo despliegue (barato y simple) pero con módulos separados por carpeta, de modo que cada módulo se puede cambiar, probar o incluso extraer después sin tocar los demás. Es lo que pide ChispaQR (ADR-02).

## Estructura de `api/`

```
api/
├── package.json
├── Dockerfile
├── .env.example
├── src/
│   ├── server.js              ← solo arranca: lee config, crea app, escucha, apagado ordenado
│   ├── app.js                 ← crea Express: middlewares globales, monta rutas, error handler (sin listen → testeable)
│   ├── config/
│   │   └── env.js             ← valida process.env con un esquema y exporta un objeto congelado
│   ├── db/
│   │   ├── pool.js            ← un único Pool de pg
│   │   └── transaccion.js     ← helper conTransaccion(fn)
│   ├── shared/
│   │   ├── errores.js         ← clases de error tipadas
│   │   ├── constantes.js      ← ESTADOS_PEDIDO, ROLES, METODOS_PAGO, límites…
│   │   ├── dinero.js          ← céntimos ↔ soles, formateo
│   │   └── logger.js          ← logger estructurado (pino)
│   ├── middlewares/
│   │   ├── idPeticion.js
│   │   ├── autenticar.js      ← verifica JWT del personal
│   │   ├── autenticarComensal.js
│   │   ├── autorizar.js       ← autorizar(...roles)
│   │   ├── validar.js         ← validar({ body, params, query })
│   │   └── manejadorErrores.js
│   └── modulos/
│       ├── salud/
│       ├── auth/              ← M6
│       ├── mesas/             ← M1
│       ├── carta/             ← M2 (categorias + productos)
│       ├── pedidos/           ← M3, M5
│       └── pagos/             ← M4
│           ├── pagos.rutas.js
│           ├── pagos.controlador.js
│           ├── pagos.servicio.js
│           ├── pagos.repositorio.js
│           ├── pagos.esquemas.js
│           └── pagos.test.js
└── test/                      ← pruebas de integración / helpers de prueba
```

## Responsabilidad de cada capa

| Capa | Hace | NO hace |
|---|---|---|
| **rutas** | Declara verbo + ruta + middlewares (`autenticar`, `autorizar`, `validar`) + controlador | Lógica, SQL |
| **controlador** | Extrae datos ya validados de `req`, llama al servicio, elige status HTTP y forma la respuesta | Reglas de negocio, SQL, `try/catch` genérico |
| **servicio** | Reglas de negocio, orquesta repositorios, abre transacciones, lanza errores tipados | Conoce `req`/`res`, escribe SQL |
| **repositorio** | SQL parametrizado, mapea filas a objetos del dominio | Decide reglas, conoce HTTP |

Regla de dependencias: cada capa solo conoce a la de abajo. `shared/` puede usarse desde todas; `shared/` no importa de `modulos/`.

## Patrones concretos

**Inyección simple de dependencias** (facilita pruebas sin frameworks):
```js
// pagos.servicio.js
export function crearServicioPagos({ pagosRepo, pedidosRepo, conTransaccion }) {
  return {
    async registrarPago({ idPedido, metodo, idCajero }) { /* … */ },
  };
}
```
Se arma una vez en el módulo (`index.js` del módulo o en `app.js`) y en pruebas se pasan dobles.

**Transacciones**: el servicio decide el límite; el repositorio recibe el `cliente` de la transacción.
```js
// db/transaccion.js
export async function conTransaccion(pool, trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
```

**Respuestas uniformes**
- Éxito: el recurso directamente (`{ idPedido, codigoPedido, estado, total }`) o `{ datos: [...], total }` para listas.
- Error: `{ error: { codigo: 'TRANSICION_NO_PERMITIDA', mensaje: 'texto para humanos', detalles?: [...] }, idPeticion }`.
- Nombres de campos JSON en `camelCase`; la conversión desde `snake_case` de la BD se hace **solo** en el repositorio.

**Arranque y apagado** (`server.js`): validar config → probar conexión a BD → escuchar. Ante `SIGTERM`/`SIGINT`: dejar de aceptar conexiones, terminar peticiones en curso, `pool.end()`, salir. Ante `unhandledRejection`/`uncaughtException`: log fatal y salir con código ≠ 0 (Docker reinicia).

## Escalabilidad sin sobreingeniería
- La API es **sin estado** (JWT, nada en memoria entre peticiones) → se pueden correr varias réplicas si algún día hace falta.
- Paginación en todo listado que pueda crecer (`?limite=50&desde=…`), con límite máximo en el servidor.
- Índices para cada consulta frecuente (ej. `pedido(estado, fecha_creacion)`).
- No agregar cachés, colas ni microservicios hasta que un problema medido lo pida (y con ADR).

## Express 5 (versión por defecto en npm desde 2025)
- Las promesas rechazadas en handlers `async` llegan solas al middleware de errores: **no** envolver cada handler en `try/catch` ni en `asyncHandler`.
- El manejador de errores tiene exactamente 4 parámetros `(err, req, res, next)` y se registra **después** de todas las rutas.
- Rutas comodín necesitan nombre (`/*resto`), y `req.query` es de solo lectura: guarda los datos validados en `req.validado`.
- Si hay código con callbacks (no promesas), ahí sí hay que llamar `next(err)` a mano.
