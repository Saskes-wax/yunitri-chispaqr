# Base de datos — PostgreSQL 16

## Principios
- **La BD protege la integridad**; la app da buenos mensajes. Toda regla crítica tiene su `CHECK`, `UNIQUE`, `FOREIGN KEY`, `NOT NULL` o trigger.
- Convenciones del contrato: `snake_case`, singular, PK `id_<tabla>`, fechas `fecha_<algo>`, estados en MAYÚSCULAS.
- PK: `id_x INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY` (no `SERIAL`, no sintaxis de SQL Server).
- Fechas: `TIMESTAMPTZ NOT NULL DEFAULT now()`. Zona horaria del negocio: `America/Lima` (al agrupar por día: `fecha AT TIME ZONE 'America/Lima'`).
- Dinero: `NUMERIC(10,2)` con `CHECK (monto >= 0)`. Nunca `REAL`/`DOUBLE`/`MONEY`.
- Textos: `VARCHAR(n)` con límite real o `TEXT` + `CHECK (char_length(x) <= n)`.
- FK con índice en la columna hija (PostgreSQL no lo crea solo). `ON DELETE RESTRICT` por defecto; no borrar en cascada datos de ventas.
- Borrado lógico (`activo BOOLEAN NOT NULL DEFAULT true`) para usuarios, productos y mesas con historial.

## Driver `pg` desde Node
```js
// db/pool.js
import pg from 'pg';
pg.types.setTypeParser(1700, (v) => v);   // NUMERIC llega como string: no convertir a float sin querer
export const pool = new pg.Pool({
  connectionString: config.urlBaseDatos,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 10_000,
});
```
- **Siempre** `pool.query('... WHERE id_pedido = $1', [id])`. Prohibido interpolar `${}` con datos en SQL.
- Si hay que elegir columna u orden dinámicamente, usar una **lista blanca** en código, nunca el texto del usuario.
- Seleccionar columnas explícitas (no `SELECT *`) y mapear a `camelCase` en el repositorio.

## Actualizaciones seguras ante concurrencia
```sql
-- Cambio de estado condicional: si otro ya lo cambió, afecta 0 filas → 409
UPDATE pedido SET estado = $2
 WHERE id_pedido = $1 AND estado = $3
 RETURNING id_pedido, estado;
```
- Doble pago: `UNIQUE (id_pedido)` en `pago` + registrar pago y cambiar estado **en la misma transacción** (primero `INSERT pago`, luego `UPDATE pedido` para que el trigger encuentre el pago).
- Contadores (código de pedido del día): `UNIQUE` + reintento acotado (máx. 3) ante `23505`, o una tabla contador con `UPDATE ... RETURNING` dentro de la transacción.

## Traducir errores de PostgreSQL a errores de la app
```js
// db/traducirErrorBD.js
const POR_CODIGO = {
  '23505': () => new Conflicto('DUPLICADO', 'El registro ya existe'),
  '23503': () => new Conflicto('REFERENCIA_INVALIDA', 'Se hace referencia a un dato que no existe o está en uso'),
  '23514': () => new ValidacionFallida([{ mensaje: 'Un valor no cumple las reglas' }]),
  '23502': () => new ValidacionFallida([{ mensaje: 'Falta un dato obligatorio' }]),
  'P0001': (e) => new Conflicto('REGLA_DE_NEGOCIO', e.message),   // RAISE EXCEPTION del trigger
};
export const traducirErrorBD = (err) => POR_CODIGO[err?.code]?.(err) ?? null;
```
Usa `err.constraint` para mensajes más precisos (ej. `pago_id_pedido_key` → "Este pedido ya fue pagado"). Mejor aún: que el trigger use un `ERRCODE` propio o un prefijo reconocible en el mensaje para distinguir "transición no permitida" de otras reglas.

## Scripts y cambios de esquema
- Orden fijo: `01_esquema.sql`, `02_triggers.sql`, `03_datos_prueba.sql`. Cada script **idempotente** cuando sea posible (`CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`).
- ⚠️ `docker-entrypoint-initdb.d` **solo se ejecuta con el volumen vacío**. Tras cambiar el esquema en desarrollo hay que recrear el volumen (`docker compose down -v`, borra los datos) o aplicar el cambio con un script de migración numerado (`04_agrega_mesa_zona.sql`). Nunca editar a mano una BD con datos sin script.
- El `.sql`, el diagrama ER y el diccionario deben decir **exactamente** lo mismo.

## Índices mínimos esperados (según consultas)
- `pedido (estado, fecha_creacion)` → pantallas de caja y cocina.
- `pedido (id_comensal)`, `detalle_pedido (id_pedido)`, `comensal (id_sesion_mesa)`, `historial_estado_pedido (id_pedido)`.
- `UNIQUE` en `mesa.token_qr`, `usuario.nombre_usuario`, `pago.id_pedido`.
- Verificar con `EXPLAIN ANALYZE` las consultas de listados si crecen.

## Pruebas de la BD
`consultas_prueba.sql` debe incluir al menos: transición válida, **transición inválida que falla**, pago duplicado que falla, `CHECK` de estado inválido que falla, y una consulta de negocio (pedidos por hora).
