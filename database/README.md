# database/ — base de datos (Iván)

PostgreSQL 16. Tablas, estados y nombres **exactos** del [contrato](../docs/equipo/CONTRATO.md) (punto 7).

| Archivo | Contenido | Hito |
|---|---|---|
| `01_esquema.sql` | Tablas: rol, usuario, mesa, sesion_mesa, comensal, categoria, producto, pedido, detalle_pedido, pago, historial_estado_pedido | 1 |
| `02_triggers.sql` | `trg_pedido_cambio_estado` (rechaza transiciones no permitidas y registra en historial) | 2 |
| `03_datos_prueba.sql` | Carta real del recreo, mesas, usuarios de prueba (contraseñas con hash) | 2 |
| `consultas_prueba.sql` | Consultas que demuestran que funciona (incluye una transición rechazada) | 2 |

Los archivos con prefijo numérico se ejecutan en ese orden al crear el contenedor `db`.
