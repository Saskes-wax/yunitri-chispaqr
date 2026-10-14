# Endpoints de la API — ChispaQR

Responsable: Triztan · Sección VII. Recursos fijos según el [contrato](../equipo/CONTRATO.md) (punto 9).

Prefijo `/api/v1`. El personal envía `Authorization: Bearer <JWT>`; el comensal envía el token que recibe al registrarse con el QR de su mesa.

| Verbo | Ruta | Quién | Respuesta OK | Errores esperados |
|---|---|---|---|---|
| GET | `/health` | Todos | 200 | 503 si no hay BD |
| POST | `/auth/login` | Personal | 200 + JWT | 400, 401, 429 |
| GET | `/mesas/{token_qr}` | Comensal | 200 (número de mesa) | 404 QR no válido |
| POST | `/mesas/{token_qr}/comensales` | Comensal | 201 + token de comensal | 400 sin nombre, 404, 409 mesa inactiva |
| GET | `/categorias` | Todos | 200 | — |
| GET | `/productos?disponible=true` | Todos | 200 | 400 |
| PATCH | `/productos/{id}/disponibilidad` | Cocina, Administrador | 200 | 400, 401, 403, 404 |
| POST | `/productos` | Administrador | 201 | 400, 401, 403, 409 |
| POST | `/pedidos` | Comensal (token de comensal) | 201 + `codigoPedido`, total, `PENDIENTE_PAGO` | 400, 401, 409 producto agotado |
| GET | `/pedidos/codigo/{codigo_pedido}` | Comensal dueño, Cajero, Administrador | 200 | 400, 401, 403, 404 |
| GET | `/pedidos?estado=PENDIENTE_PAGO` | Cajero, Administrador | 200 | 400, 401, 403 |
| GET | `/pedidos?estado=PAGADO,EN_PREPARACION` | Cocina, Administrador | 200 | 400, 401, 403 |
| GET | `/pedidos?estado=LISTO` | Mozo, Administrador | 200 | 400, 401, 403 |
| POST | `/pedidos/{id}/pago` | Cajero, Administrador | 201 (pedido pasa a `PAGADO`) | 400, 401, 403, 404, 409 si no estaba `PENDIENTE_PAGO` |
| PATCH | `/pedidos/{id}/estado` | Cocina (`EN_PREPARACION`, `LISTO`), Mozo (`ENTREGADO`), Cajero (`CANCELADO`), Administrador | 200 | 400, 401, 403, 404, 409 transición no permitida |
| POST | `/mesas/{id}/regenerar-qr` | Administrador | 200 | 401, 403, 404 |

**409** = lo rechazó la regla de negocio (incluido el trigger de Iván). Así la API y la BD dicen lo mismo.

El Administrador aparece en pagos y estados porque así lo indica la matriz RBAC de la sección IX.

## Cuerpos de las peticiones

| Ruta | Cuerpo |
|---|---|
| `POST /auth/login` | `{ "nombreUsuario": "caja", "contrasena": "..." }` |
| `POST /mesas/{token_qr}/comensales` | `{ "nombreAlias": "Rosa" }` |
| `POST /productos` | `{ "idCategoria": 1, "nombre": "Trucha frita", "precio": "25.00", "descripcion": "...", "disponible": true }` |
| `PATCH /productos/{id}/disponibilidad` | `{ "disponible": false }` |
| `POST /pedidos` | `{ "lineas": [ { "idProducto": 1, "cantidad": 2, "nota": "sin ají" } ] }` |
| `POST /pedidos/{id}/pago` | `{ "metodo": "YAPE" }` (EFECTIVO, YAPE, PLIN o TARJETA) |
| `PATCH /pedidos/{id}/estado` | `{ "estado": "EN_PREPARACION" }` |

El precio y el total de un pedido los calcula la API con el precio vigente del producto. Si el cuerpo trae campos que no están en la tabla, se responde 400.

## Formato de error

```json
{
  "error": { "codigo": "TRANSICION_NO_PERMITIDA", "mensaje": "No se puede pasar de PENDIENTE_PAGO a EN_PREPARACION" },
  "idPeticion": "3dd7644b-c23e-4a14-81cc-03fa86e979ad"
}
```

Códigos usados: `VALIDACION_FALLIDA` (400), `NO_AUTENTICADO` (401), `PROHIBIDO` (403), `NO_ENCONTRADO` (404), `TRANSICION_NO_PERMITIDA`, `PRODUCTO_AGOTADO`, `PEDIDO_NO_PENDIENTE`, `PEDIDO_MODIFICADO`, `MESA_INACTIVA`, `REGLA_DE_NEGOCIO`, `DUPLICADO` (409), `DEMASIADAS_PETICIONES` (429) y `ERROR_INTERNO` (500).
