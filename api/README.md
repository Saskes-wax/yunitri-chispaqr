# api/ — backend (Triztan)

Node.js 20 + Express 5. Monolito modular con una carpeta por módulo del contrato y prefijo `/api/v1`. La lista de endpoints está en [`docs/api/endpoints.md`](../docs/api/endpoints.md).

No se crean tablas aquí: el esquema es de Iván (`database/`).

## Estructura

```
src/
├── server.js            arranque y apagado ordenado
├── app.js               Express, middlewares y rutas
├── config/env.js        variables de entorno validadas al iniciar
├── db/                  pool de PostgreSQL, transacciones y traducción de errores
├── shared/              constantes del contrato, errores, dinero, logger y tokens
├── middlewares/         autenticar, autorizar, validar, límites y manejador de errores
└── modulos/
    ├── salud/           GET /health
    ├── auth/            M6 Usuarios y acceso
    ├── mesas/           M1 Mesas y QR (incluye el registro del comensal)
    ├── carta/           M2 Carta
    ├── pedidos/         M3 Pedidos del comensal y M5 Cocina
    └── pagos/           M4 Caja
```

Cada módulo sigue el mismo orden: `rutas → controlador → servicio → repositorio`. Las reglas de negocio están en el servicio y el SQL solo en el repositorio.

## Correr en local

Con el `.env` creado en la raíz (`cp .env.example .env`):

```bash
cd api
npm install
npm run dev
```

## Pruebas

Las pruebas de integración usan una base PostgreSQL real **solo de pruebas** (por ejemplo `chispaqr_test`), indicada en `TEST_DATABASE_URL`. Al empezar cargan `database/01_esquema.sql` y `02_triggers.sql`, y vacían las tablas antes de cada prueba; así comprueban que la API y la base de datos siguen alineadas.

```bash
npm test          # unitarias + integración
npm run test:unit # solo unitarias, no necesitan base de datos
npm run lint
```

## QR de las mesas

```bash
npm run qr
```

Crea `api/qr-generados/` con un PNG por mesa y `imprimir.html` para imprimirlos. El QR apunta a `PUBLIC_BASE_URL/m/{token_qr}`, así que esa variable debe tener la dirección que abrirá el celular del cliente.
