# ChispaQR — contrato técnico para programar

Fuente: vault `D:\obsidian\la boveda\Sistemas de Informacion - Pedidos QR` (`01-Reglas/Contrato del equipo (fuente única de verdad).md` y `03-Reparto/*`). **Si el vault y este archivo difieren, manda el vault**: léelo y avisa de la diferencia.

## Qué es
Sistema web de un recreo campestre (Andahuaylas): el comensal escanea el QR de su mesa, escribe su alias, arma su pedido, paga en caja; **solo lo pagado pasa a cocina**. Equipo Yunitri; Triztan es dueño del repo `yunitri-chispaqr` y del código de `api/` y `web/`; Iván del esquema `database/`; Yandel del `docker-compose.yml` y la matriz RBAC.

## Stack fijo
Node.js + Express (API REST, monolito modular) · PostgreSQL 16 · HTML/CSS/JS o React+Vite · Docker Compose (`db`, `api`, `web`) · JWT para personal + token en el QR para comensal · bcrypt · HTTPS.
Prohibido sin ADR: MongoDB, MySQL, SQL Server, Firebase, microservicios, Kubernetes, WebSockets en el 50 %, pago en línea, login de clientes.

## Constantes (copiar letra por letra)
```js
export const ESTADOS_PEDIDO = Object.freeze({
  PENDIENTE_PAGO: 'PENDIENTE_PAGO', PAGADO: 'PAGADO', EN_PREPARACION: 'EN_PREPARACION',
  LISTO: 'LISTO', ENTREGADO: 'ENTREGADO', CANCELADO: 'CANCELADO',
});
export const TRANSICIONES_PEDIDO = Object.freeze({
  PENDIENTE_PAGO: ['PAGADO', 'CANCELADO'],
  PAGADO: ['EN_PREPARACION'],
  EN_PREPARACION: ['LISTO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
});
export const ROLES = Object.freeze({ ADMINISTRADOR: 'ADMINISTRADOR', CAJERO: 'CAJERO', COCINA: 'COCINA', MOZO: 'MOZO' });
export const ESTADOS_MESA = Object.freeze({ LIBRE: 'LIBRE', OCUPADA: 'OCUPADA', INACTIVA: 'INACTIVA' });
export const ESTADOS_SESION_MESA = Object.freeze({ ABIERTA: 'ABIERTA', CERRADA: 'CERRADA' });
export const METODOS_PAGO = Object.freeze({ EFECTIVO: 'EFECTIVO', YAPE: 'YAPE', PLIN: 'PLIN', TARJETA: 'TARJETA' }); // ajustar a los que use el recreo (entrevista)
export const MINUTOS_PARA_CANCELAR = 20;
```
La tabla de transiciones debe coincidir con el trigger `trg_pedido_cambio_estado` (función `fn_pedido_cambio_estado`).

## Tablas (no renombrar ni quitar; agregar solo con Iván)
`rol`, `usuario`, `mesa` (`token_qr` UNIQUE), `sesion_mesa`, `comensal` (solo `nombre_alias`), `categoria`, `producto` (`precio`, `disponible`, `stock` opcional), `pedido` (`codigo_pedido`, `estado`, `total`), `detalle_pedido` (`precio_unitario` = precio del momento, `subtotal`, `nota`), `pago` (`metodo`, `monto`, cajero, fecha), `historial_estado_pedido` (lo llena el trigger).
El código **no crea tablas**: si falta un campo, se pide a Iván.

## Módulos → carpetas de `api/src/modulos/`
M1 Mesas y QR → `mesas/` · M2 Carta → `carta/` · M3 Pedidos del comensal y M5 Cocina → `pedidos/` · M4 Caja → `pagos/` · M6 Usuarios y acceso → `auth/` (y `usuarios/`). M7 pago en línea y M8 reportes: **no** en el 50 %.

## Endpoints (prefijo `/api/v1`)
| Verbo | Ruta | Quién | OK | Errores |
|---|---|---|---|---|
| GET | `/health` | Todos | 200 | 503 sin BD |
| POST | `/auth/login` | Personal | 200 + JWT | 400, 401, 429 |
| GET | `/mesas/{token_qr}` | Comensal | 200 | 404 |
| POST | `/mesas/{token_qr}/comensales` | Comensal | 201 + token comensal | 400, 404 |
| GET | `/categorias` | Todos | 200 | — |
| GET | `/productos?disponible=true` | Todos | 200 | 400 |
| PATCH | `/productos/{id}/disponibilidad` | COCINA, ADMINISTRADOR | 200 | 400, 401, 403, 404 |
| POST | `/productos` | ADMINISTRADOR | 201 | 400, 401, 403 |
| POST | `/pedidos` | Comensal | 201 + `codigoPedido`, `total`, `PENDIENTE_PAGO` | 400, 401, 409 agotado |
| GET | `/pedidos/codigo/{codigo_pedido}` | Comensal dueño, CAJERO | 200 | 401, 403, 404 |
| GET | `/pedidos?estado=…` | CAJERO (`PENDIENTE_PAGO`), COCINA (`PAGADO,EN_PREPARACION`), MOZO (`LISTO`) | 200 | 400, 401, 403 |
| POST | `/pedidos/{id}/pago` | CAJERO | 201 → `PAGADO` | 400, 401, 403, 404, 409 |
| PATCH | `/pedidos/{id}/estado` | COCINA (`EN_PREPARACION`, `LISTO`), MOZO (`ENTREGADO`), CAJERO (`CANCELADO`) | 200 | 400, 401, 403, 404, 409 |
| POST | `/mesas/{id}/regenerar-qr` | ADMINISTRADOR | 200 | 401, 403, 404 |
409 = regla de negocio o trigger. Cada endpoint nuevo va también a `docs/api/endpoints.md`.

## RBAC (debe coincidir con `autorizar(...)` de cada ruta)
| Acción | ADMIN | CAJERO | COCINA | MOZO | Comensal |
|---|:-:|:-:|:-:|:-:|:-:|
| Ver carta | ✔ | ✔ | ✔ | ✔ | ✔ |
| Crear pedido | — | — | — | — | ✔ |
| Ver pendientes de pago | ✔ | ✔ | — | — | solo el suyo |
| Registrar pago / cancelar | ✔ | ✔ | — | — | — |
| `EN_PREPARACION` / `LISTO` | ✔ | — | ✔ | — | — |
| Marcar agotado | ✔ | — | ✔ | — | — |
| `ENTREGADO` | ✔ | — | — | ✔ | — |
| Productos, mesas, QR, usuarios | ✔ | — | — | — | — |
Cuidado: la tabla de endpoints no lista a ADMINISTRADOR en pagos/estados pero la matriz sí. Antes de codificar, confirmar con Yandel/Triztan cuál vale y unificar ambos documentos.

## Reglas de negocio que el código debe garantizar
1. Precio y total **los calcula el servidor** con el precio vigente de `producto`; se guarda en `detalle_pedido.precio_unitario`.
2. No se puede pedir un producto `disponible = false` (409) — verificar dentro de la transacción de creación.
3. Pago: en una transacción, `INSERT pago` (monto = `pedido.total`) y `UPDATE pedido SET estado='PAGADO' WHERE estado='PENDIENTE_PAGO'`. Si no actualiza fila → 409.
4. Cocina solo lista `PAGADO` y `EN_PREPARACION`, ordenados por fecha de pago/creación ascendente.
5. Cancelación a los 20 min: en el 50 % la hace el cajero; el servicio debe permitir cancelar solo `PENDIENTE_PAGO`.
6. El comensal no tiene fila en `usuario`; su identidad viene solo del token de comensal.

## Riesgos detectados en el contrato (avisar al usuario; se resuelven con ADR)
1. **Node.js 20 llegó a fin de vida el 30/04/2026** y ya no recibe parches de seguridad. Recomendación: Node.js 24 LTS (soporte hasta 30/04/2028). Cambiarlo en el contrato con un ADR antes de crear el Dockerfile.
2. **`codigo_pedido` con `UNIQUE` vs. "pedido 17 del día"**: `M05-017` se repetirá cada día y chocará con el `UNIQUE`. Opciones: `UNIQUE (codigo_pedido, fecha_pedido)` con columna `DATE`, o incluir la fecha en el código. Además definir si el contador es por día global o por mesa. Decidirlo con Iván.
3. **Discrepancia ADMINISTRADOR** entre tabla de endpoints y matriz RBAC (ver arriba).
4. **Scripts en `docker-entrypoint-initdb.d`** solo corren con volumen vacío: cambios de esquema requieren migración numerada o recrear el volumen en desarrollo.
5. **Express 5** es la versión por defecto en npm: usarla y seguir sus reglas (ver arquitectura.md).
6. **`database/consultas_prueba.sql` dentro de `/docker-entrypoint-initdb.d`**: el contenedor ejecuta todos los `.sql` de esa carpeta y se detiene ante el primer error; como ese archivo incluye a propósito una transición inválida, **la inicialización de `db` fallará**. Moverlo a `database/pruebas/` (o montar solo los `0N_*.sql`) y ejecutarlo a mano con `psql`.
7. **`ports: "5432:5432"` en `db`**: aceptable en desarrollo local, pero en el VPS la BD no debe publicarse (solo por VPN, sección IX). Separarlo con un `docker-compose.override.yml` para desarrollo.
8. **`depends_on: [db]` sin `condition: service_healthy`** (servicios aún comentados): la API puede arrancar antes que PostgreSQL. Añadir `healthcheck` con `pg_isready`.
9. `README.md` y `api/README.md` dicen **Node.js 20** (ver riesgo 1).

## Repositorio
`https://github.com/Saskes-wax/yunitri-chispaqr` (revisor por defecto: `@Saskes-wax`, ver `.github/CODEOWNERS`). Copia local: `C:\Users\elrey\Documents\yunitri-chispaqr`. En el repo: contrato en `docs/equipo/CONTRATO.md`, reglas en `CONTRIBUTING.md` y `docs/equipo/REGLAS.md`, plantilla de PR en `.github/pull_request_template.md`, ADR en `docs/equipo/ADR.md`.

## Variables de entorno (las del `.env.example` del repo — no renombrarlas)
```
POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
API_PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN
WEB_PORT, PUBLIC_BASE_URL
```
`config/env.js` lee **estos** nombres. Propuesta pendiente de aprobar: `JWT_SECRET_COMENSAL` (secreto distinto para el token del comensal) y `LOG_LEVEL`; si se agregan, van también al `.env.example`.
