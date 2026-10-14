# Endpoints de la API — ChispaQR

Responsable: Triztan · Sección VII. Recursos fijos según el [contrato](../equipo/CONTRATO.md) v1.2 (punto 9). Códigos RF/RNF de la lista oficial de Yuri.

Prefijo `/api/v1`. El personal envía `Authorization: Bearer <JWT>`; el comensal envía el token que recibe al confirmar su primer pedido con el QR de su mesa.

| Verbo | Ruta | Quién | Respuesta OK | Errores esperados | RF/RNF |
|---|---|---|---|---|---|
| GET | `/health` | Todos | 200 | 503 si no hay BD | RNF-03 |
| POST | `/auth/login` | Personal | 200 + JWT | 400, 401, 429 bloqueado tras 5 intentos | RF-13, RNF-04 |
| GET | `/mesas/{codigo_qr}` | Comensal | 200 (mesa, zona y si está activa) | 404 QR no válido | RF-02, RF-05 |
| POST | `/mesas/{codigo_qr}/comensales` | Comensal | 201 + token de comensal | 400 sin nombre, 404, 409 mesa inactiva | RF-06 |
| POST | `/mesas` | Administrador | 201 (la BD genera el `codigo_qr` aleatorio) | 400, 401, 403, 409 número repetido | RF-01, RF-02 |
| POST | `/mesas/{id}/regenerar-qr` | Administrador | 200 | 401, 403, 404 | RF-02 |
| GET | `/categorias` | Todos | 200 | — | RF-05 |
| GET | `/productos?disponible=true` | Todos | 200 | 400 | RF-05 |
| POST | `/productos` | Administrador | 201 | 400, 401, 403, 409 | RF-03 |
| PATCH | `/productos/{id}` | Administrador | 200 | 400, 401, 403, 404, 409 | RF-04 |
| PATCH | `/productos/{id}/disponibilidad` | Cocina, Administrador | 200 | 400, 401, 403, 404 | RF-12 |
| POST | `/pedidos` (con `claveEnvio`) | Comensal | 201 + `codigoPedido`, total, `PENDIENTE_PAGO` · 200 con el mismo pedido si se reenvía la misma `claveEnvio` | 400, 401, 409 producto agotado | RF-06, RNF-02 |
| GET | `/pedidos/codigo/{codigo_pedido}` | Comensal dueño, Cajero, Administrador | 200 | 400, 401, 403, 404 | RF-16 |
| GET | `/pedidos?estado=PENDIENTE_PAGO` | Cajero, Administrador | 200 (la caja los agrupa por mesa) | 400, 401, 403 | RF-07 |
| GET | `/pedidos?estado=PAGADO,EN_PREPARACION` | Cocina, Administrador | 200 (por orden de llegada) | 400, 401, 403 | RF-10 |
| GET | `/pedidos?estado=LISTO` | Mozo, Administrador | 200 (con mesa y zona) | 400, 401, 403 | RF-17 |
| POST | `/pedidos/{id}/pago` | Cajero, Administrador | 201 (pedido pasa a `PAGADO`) | 400, 401, 403, 404, 409 si no estaba `PENDIENTE_PAGO` o tiene un producto agotado | RF-08 |
| GET | `/pedidos/{id}/ticket` | Cajero, Administrador | 200 (ticket interno, solo nombre del comensal) | 401, 403, 404, 409 si no está pagado | RF-09, RNF-05 |
| PATCH | `/pedidos/{id}/estado` | Cocina (`EN_PREPARACION`, `LISTO`), Mozo (`ENTREGADO`), Cajero (`CANCELADO`), Administrador | 200 | 400, 401, 403, 404, 409 transición no permitida | RF-11, RF-15, RF-17 |

**409** = lo rechazó la regla de negocio (incluidos los triggers de Iván). Así la API y la BD dicen lo mismo. Un pedido pagado no se cancela y su detalle ya no se modifica.

## Cuerpos de las peticiones

| Ruta | Cuerpo |
|---|---|
| `POST /auth/login` | `{ "username": "cajero", "contrasena": "..." }` |
| `POST /mesas/{codigo_qr}/comensales` | `{ "nombre": "Rosa" }` |
| `POST /mesas` | `{ "numero": 9, "zona": "Jardín" }` |
| `POST /productos` | `{ "idCategoria": 1, "nombre": "Trucha frita", "precio": "28.00", "descripcion": "...", "disponible": true }` |
| `PATCH /productos/{id}` | Cualquiera de: `idCategoria`, `nombre`, `descripcion`, `precio`, `disponible` |
| `PATCH /productos/{id}/disponibilidad` | `{ "disponible": false }` |
| `POST /pedidos` | `{ "lineas": [ { "idProducto": 3, "cantidad": 2, "nota": "sin ají" } ], "claveEnvio": "<UUID>" }` |
| `POST /pedidos/{id}/pago` | `{ "metodo": "YAPE" }` (EFECTIVO, YAPE, PLIN o TARJETA) |
| `PATCH /pedidos/{id}/estado` | `{ "estado": "EN_PREPARACION" }` |

El precio de cada línea sale de la carta vigente y el total lo calcula la base de datos (vista `v_pedido_total`). Si el cuerpo trae campos que no están en la tabla, se responde 400.

Cada cambio de estado hecho por el personal se registra con su usuario en `historial_estado_pedido`.

## Formato de error

```json
{
  "error": { "codigo": "TRANSICION_NO_PERMITIDA", "mensaje": "No se puede pasar de PENDIENTE_PAGO a EN_PREPARACION" },
  "idPeticion": "3dd7644b-c23e-4a14-81cc-03fa86e979ad"
}
```

Códigos usados: `VALIDACION_FALLIDA` (400), `NO_AUTENTICADO` (401), `PROHIBIDO` (403), `NO_ENCONTRADO` (404), `TRANSICION_NO_PERMITIDA`, `PRODUCTO_AGOTADO`, `PEDIDO_NO_PENDIENTE`, `PEDIDO_NO_PAGADO`, `PEDIDO_MODIFICADO`, `MESA_INACTIVA`, `CLAVE_ENVIO_USADA`, `REGLA_DE_NEGOCIO`, `DUPLICADO` (409), `USUARIO_BLOQUEADO`, `DEMASIADAS_PETICIONES` (429) y `ERROR_INTERNO` (500).
