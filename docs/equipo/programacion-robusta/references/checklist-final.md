# Checklist antes de decir "terminado"

Responde cada punto. Un "no" se corrige o se informa al usuario como pendiente.

## Funciona
- [ ] Cumple **todo** lo pedido (releer la petición frase por frase).
- [ ] Lo ejecuté/probé de verdad (pruebas, `curl` o pantalla), incluido al menos un caso que debe fallar.
- [ ] `npm test` y `npm run lint` pasan (si existen). Docker levanta sin errores si tocaste infraestructura.

## Es correcto
- [ ] Toda entrada externa está validada con esquema y límites.
- [ ] Precios, totales, roles e identidades se calculan/verifican en el servidor.
- [ ] Operaciones de varios pasos dentro de una transacción.
- [ ] Pensé en doble clic, dos usuarios a la vez y reintentos.
- [ ] Dinero sin `float`.

## Es seguro
- [ ] SQL parametrizado; nada de `innerHTML` con datos.
- [ ] Cada ruta protegida tiene `autenticar` + `autorizar` según RBAC, y verifica pertenencia.
- [ ] Sin secretos en código, logs ni repo; `.env.example` actualizado.
- [ ] Errores al cliente sin stack ni detalles internos.

## Es mantenible
- [ ] Respeta capas y carpetas del módulo; nada de lógica en rutas ni SQL en servicios.
- [ ] Nombres claros y del contrato; sin valores mágicos; sin código muerto ni comentado.
- [ ] Sin duplicación evitable; sin dependencias nuevas injustificadas.
- [ ] Se parece al código vecino.

## Coherencia con el proyecto (ChispaQR)
- [ ] Tablas, columnas, estados, roles, rutas y métodos de pago idénticos al contrato.
- [ ] Transiciones de estado iguales a `TRANSICIONES_PEDIDO` y al trigger.
- [ ] Endpoint nuevo/cambiado documentado en `docs/api/endpoints.md`.
- [ ] Ninguna tecnología fuera del stack; cualquier desvío propuesto como ADR.

## Informe al usuario
- [ ] Qué cambié (con enlaces), cómo lo verifiqué, qué no pude verificar, riesgos y pendientes.
