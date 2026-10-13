# Seguridad — OWASP Top 10:2025 aplicado

| OWASP 2025 | Qué hacer en el código |
|---|---|
| **A01 Control de acceso roto** | `autorizar(...roles)` en **cada** ruta protegida, derivado de la matriz RBAC. Verificar pertenencia (comensal solo sus pedidos; filtrar por `id_comensal` del token, nunca por un ID que mande el cliente). Denegar por defecto. |
| **A02 Mala configuración** | `helmet()`, CORS con lista blanca (nunca `*` con credenciales), `app.disable('x-powered-by')`, sin stack en respuestas, `NODE_ENV=production` en producción, puertos de BD no expuestos. |
| **A03 Cadena de suministro** | `package-lock.json` versionado, `npm ci`, `npm audit` antes de entregar, pocas dependencias y mantenidas, imágenes Docker oficiales con versión fija (`node:24-alpine`, `postgres:16-alpine`). |
| **A04 Fallas criptográficas** | HTTPS en todo; bcrypt (coste ≥ 12) para contraseñas; secretos JWT aleatorios ≥ 32 bytes; tokens de QR con `crypto.randomBytes(24).toString('base64url')`. Nunca `Math.random()` para nada de seguridad. |
| **A05 Inyección** | SQL parametrizado siempre; en frontend `textContent`, nunca `innerHTML` con datos; nada de `eval`/`new Function`. |
| **A06 Diseño inseguro** | Reglas críticas en servidor y BD (pagar antes de cocinar), límites de cantidad y tamaño, totales calculados en el servidor. |
| **A07 Fallas de autenticación** | Mensaje genérico en login ("usuario o contraseña incorrectos"), rate limit en `/auth/login`, expiración del JWT, usuarios inactivos (`usuario.activo = false`) rechazados también con token vigente. |
| **A08 Integridad de datos/software** | Verificar firma del JWT con algoritmo fijado; no deserializar objetos arbitrarios; validar todo body. |
| **A09 Logs y alertas** | Registrar logins fallidos, 403 y cambios de estado con usuario e ID de petición; nunca secretos en logs. |
| **A10 Manejo de condiciones excepcionales** | Manejador de errores único, transacciones con ROLLBACK, `unhandledRejection` → log + salida, timeouts; "fallar cerrado" (si no se puede verificar permiso, se niega). |

## JWT del personal
```js
import jwt from 'jsonwebtoken';
const OPCIONES = { algorithm: 'HS256', expiresIn: config.jwtExpiracion, issuer: 'chispaqr-api', audience: 'personal' };

export const firmarTokenPersonal = (usuario) =>
  jwt.sign({ sub: String(usuario.idUsuario), rol: usuario.rol }, config.jwtSecretoPersonal, OPCIONES);

export const verificarTokenPersonal = (token) =>
  jwt.verify(token, config.jwtSecretoPersonal, { algorithms: ['HS256'], issuer: 'chispaqr-api', audience: 'personal' });
```
- Fijar `algorithms` al verificar (evita `alg: none` y confusión de algoritmos).
- Contenido mínimo: `sub`, `rol`. Nada sensible (el JWT se puede leer).
- Duración ≈ un turno (ej. 8 h). En cada petición sensible, comprobar que el usuario sigue `activo`.
- Leer de `Authorization: Bearer <token>`; si falta o falla → 401.

## Token del comensal
- **Otro secreto u otra `audience`** (`'comensal'`) para que un token de comensal jamás sirva como token de personal y viceversa.
- Contenido: `sub` = `id_comensal`, `idSesionMesa`, `idMesa`. Expira en pocas horas.
- Al crear pedido o consultar estado, el `id_comensal` sale **del token**, no del body.

## Contraseñas
- `bcrypt.hash(contrasena, 12)` / `bcrypt.compare`. Longitud mínima 8 (recomendado 12), máximo 72 bytes (límite de bcrypt).
- Usuarios semilla de prueba: contraseñas de prueba documentadas en `03_datos_prueba.sql`/`.env.example`, **nunca** las reales del recreo.

## Rate limiting
`express-rate-limit`: login ≈ 5 intentos/min por IP+usuario; creación de pedidos y registro de comensal con un límite razonable por IP. Detrás de Nginx: `app.set('trust proxy', 1)` para leer la IP real.

## Cabeceras y CORS
- `helmet()` con CSP estricta en `web` (Nginx) o en la API si sirve HTML: `default-src 'self'`, sin `unsafe-inline` para scripts.
- CORS: si `web` y `api` salen por el mismo dominio vía Nginx (`/api` → `api:3000`), **no hace falta CORS**; es la opción preferida.

## Secretos y configuración
- `.env` nunca al repo; `.env.example` con todas las claves y valores falsos y comentarios.
- `config/env.js` valida al arrancar: secreto JWT ≥ 32 caracteres, URL de BD presente, `NODE_ENV` válido. Si falla, no arranca.
- Generar secretos: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

## Datos personales (Ley 29733 en Perú)
Del comensal solo `nombre_alias`. No pedir DNI ni teléfono. No registrar el alias en logs más de lo necesario.
