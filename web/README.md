# web/ — frontend (Triztan)

HTML, CSS y JavaScript sin framework ni paso de compilación. Pensada primero para el celular, con letra y botones grandes y páginas livianas para el 4G del recreo. En Docker la sirve Nginx, que también reenvía `/api/` a la API.

| Pantalla | Ruta | Quién | Módulo |
|---|---|---|---|
| Carta sin registro, carrito, nombre al confirmar y estado del pedido | `/m/{codigo_qr}` | Comensal | M1, M2, M3 |
| Ingreso del personal | `/personal/` | Personal | M6 |
| Caja: pendientes agrupados por mesa, buscar por código, cobrar, ticket interno y cancelar | `/caja/` | Cajero, Administrador | M4 |
| Cocina: pagados y en preparación, marcar agotados | `/cocina/` | Cocina, Administrador | M5 |
| Mozo: pedidos listos para servir, con mesa y zona | `/mozo/` | Mozo, Administrador | M5 |

El estado del pedido y las listas se actualizan solos cada 5 segundos. Si se pierde la conexión, esperan más entre intentos y se recuperan solos.

## Estructura

```
compartido/   api.js (único lugar con fetch), sesion.js, sondeo.js, formato.js, dom.js, estilos
comensal/     pantalla del comensal
personal/     login
caja/  cocina/  mozo/
nginx.conf    proxy /api → api:3000 y ruta /m/{codigo_qr}
```

## Probar sin Docker

Con la API corriendo en el puerto 3000:

```bash
node web/servidor-local.mjs
```

Abre http://localhost:8080/personal/ para el personal. Para el comensal, usa la dirección de un QR generado con `npm run qr` en `api/`.
