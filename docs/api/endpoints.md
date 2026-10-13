# Endpoints de la API — ChispaQR

Responsable: Triztan · Sección VII. Recursos fijos según el [contrato](../equipo/CONTRATO.md) (punto 9).

Prefijo `/api/v1`. Esta tabla es la que va en la sección VII y en `docs/api/endpoints.md`. Puedes agregar endpoints, pero **no renombrar** los recursos del contrato.

| Verbo | Ruta | Quién | Respuesta OK | Errores esperados |
|---|---|---|---|---|
| GET | `/health` | Todos | 200 | 500 si no hay BD |
| POST | `/auth/login` | Personal | 200 + JWT | 400, 401 |
| GET | `/mesas/{token_qr}` | Comensal | 200 (número de mesa) | 404 QR no válido |
| POST | `/mesas/{token_qr}/comensales` | Comensal | 201 + token de comensal | 400 sin nombre, 404 |
| GET | `/categorias` | Comensal | 200 | — |
| GET | `/productos?disponible=true` | Comensal | 200 | — |
| PATCH | `/productos/{id}/disponibilidad` | Cocina, Administrador | 200 | 401, 403, 404 |
| POST | `/productos` | Administrador | 201 | 400, 401, 403 |
| POST | `/pedidos` | Comensal (token de comensal) | 201 + `codigo_pedido`, total, `PENDIENTE_PAGO` | 400, 401, 409 producto agotado |
| GET | `/pedidos/codigo/{codigo_pedido}` | Comensal dueño, Cajero | 200 | 404 |
| GET | `/pedidos?estado=PENDIENTE_PAGO` | Cajero | 200 | 401, 403 |
| GET | `/pedidos?estado=PAGADO,EN_PREPARACION` | Cocina | 200 | 401, 403 |
| POST | `/pedidos/{id}/pago` | Cajero | 201 (pedido pasa a `PAGADO`) | 401, 403, 409 si no estaba `PENDIENTE_PAGO` |
| PATCH | `/pedidos/{id}/estado` | Cocina (`EN_PREPARACION`, `LISTO`), Mozo (`ENTREGADO`), Cajero (`CANCELADO`) | 200 | 401, 403, 409 transición no permitida |
| POST | `/mesas/{id}/regenerar-qr` | Administrador | 200 | 401, 403 |

**409** = lo rechazó la regla de negocio (incluido el trigger de Iván). Así la API y la BD dicen lo mismo.
