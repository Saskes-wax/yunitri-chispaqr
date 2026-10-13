# Pruebas

## Qué probar (pirámide práctica)
1. **Unitarias** (muchas, rápidas): lógica pura de servicios y `shared/` — transiciones de estado, cálculo de totales en céntimos, generación del código de pedido, validadores.
2. **Integración de API** (las más valiosas): `supertest` contra `app.js` + BD de prueba real (PostgreSQL en Docker). Prueban rutas + permisos + SQL + trigger juntos.
3. **Extremo a extremo** (pocas): el flujo comensal → caja → cocina → mozo, manual o con un script `curl`, antes de cada entrega.

## Herramientas
- `node:test` + `node:assert/strict` (incluidos en Node, sin dependencias) o `vitest` si el proyecto ya lo usa.
- `supertest` para HTTP.
- BD de prueba: servicio `db` de Docker con una base `chispaqr_test`; antes de cada archivo de prueba, limpiar con `TRUNCATE ... RESTART IDENTITY CASCADE` y cargar datos mínimos.

## Reglas
- Cada error de producción corregido lleva una prueba que lo reproduce.
- Cada endpoint: camino feliz + 401 sin token + 403 con rol incorrecto + 400 con datos inválidos + 409 si tiene reglas de estado.
- Pruebas **independientes** entre sí (ninguna depende del orden), deterministas (reloj y aleatorio inyectados) y con nombres que describen el comportamiento:
  `test('cocina no puede pasar a EN_PREPARACION un pedido PENDIENTE_PAGO (409)', …)`.
- Patrón *Preparar → Actuar → Verificar*. Un comportamiento por prueba.
- No probar detalles internos (qué SQL se ejecutó), sino resultados observables (respuesta, estado en BD).
- Nunca se modifica una prueba para que pase si el código está mal; se corrige el código.

## Casos obligatorios en ChispaQR
- [ ] QR inválido → 404; QR regenerado → el token viejo deja de funcionar.
- [ ] Crear pedido con producto agotado → 409; con precio enviado por el cliente → se ignora o 400 (`.strict()`).
- [ ] Total calculado en servidor = suma de `cantidad × precio_unitario` vigente.
- [ ] Registrar pago dos veces (dos peticiones simultáneas) → una 201, otra 409.
- [ ] Cocina no ve `PENDIENTE_PAGO`; intentar pasarlo a `EN_PREPARACION` → 409 (trigger).
- [ ] Mozo no puede registrar pagos → 403. Comensal A no ve pedidos de comensal B → 403/404.
- [ ] Usuario desactivado con token vigente → 401/403.
- [ ] `GET /health` con BD caída → 503.

## Comandos
`npm test` corre todo; `npm run test:unit` solo unitarias. Las pruebas deben pasar en limpio antes de abrir un PR.
