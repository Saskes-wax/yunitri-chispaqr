-- ChispaQR - consultas de prueba (Hito 2). Se corren a mano; algunas fallan a propósito:
--   docker compose exec -T db psql -U chispaqr_app -d chispaqr < database/pruebas/consultas_prueba.sql
-- Las pruebas que modifican datos van en BEGIN ... ROLLBACK, la base queda igual.

\echo '=== 1. Carta por categoría ==='
SELECT c.nombre AS categoria, p.nombre AS producto, p.precio AS "precio_S/", p.disponible, p.stock
FROM producto p
JOIN categoria c ON c.id_categoria = p.id_categoria
ORDER BY c.orden, p.nombre;

\echo '=== 2. Pedidos por hora (hora punta) ==='
SELECT date_trunc('hour', p.creado_en AT TIME ZONE 'America/Lima') AS hora,
       COUNT(*)                                                    AS pedidos,
       SUM(t.total)                                                AS "ventas_S/"
FROM pedido p
JOIN v_pedido_total t ON t.id_pedido = p.id_pedido
GROUP BY 1
ORDER BY pedidos DESC, hora;

\echo '=== 3. Pedidos por estado ==='
SELECT estado, COUNT(*) AS pedidos
FROM pedido
GROUP BY estado
ORDER BY estado;

\echo '=== 4. Lo que ve cocina: solo pagados (PAGADO y EN_PREPARACION) ==='
SELECT m.numero AS mesa, co.nombre AS comensal, p.id_pedido, p.estado
FROM pedido p
JOIN comensal co   ON co.id_comensal = p.id_comensal
JOIN sesion_mesa s ON s.id_sesion    = co.id_sesion
JOIN mesa m        ON m.id_mesa      = s.id_mesa
WHERE p.estado IN ('PAGADO','EN_PREPARACION')
ORDER BY p.creado_en;

\echo '=== 5. Lo que ve caja: pendientes de pago ==='
SELECT m.numero AS mesa, co.nombre AS comensal, p.id_pedido, t.total AS "total_S/"
FROM pedido p
JOIN v_pedido_total t ON t.id_pedido = p.id_pedido
JOIN comensal co      ON co.id_comensal = p.id_comensal
JOIN sesion_mesa s    ON s.id_sesion    = co.id_sesion
JOIN mesa m           ON m.id_mesa      = s.id_mesa
WHERE p.estado = 'PENDIENTE_PAGO'
ORDER BY p.creado_en;

\echo '=== 6. Historial de un pedido entregado (sirve para reclamos) ==='
SELECT h.id_pedido, h.estado_anterior, h.estado_nuevo, u.username AS usuario, h.cambiado_en
FROM historial_estado_pedido h
LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
WHERE h.id_pedido = (SELECT MIN(id_pedido) FROM pedido)
ORDER BY h.id_historial;

-- DEMO DEL TRIGGER (en vivo en la exposición)

\echo '=== 7. DEMO: mandar a cocina un pedido NO pagado  -> DEBE FALLAR ==='
BEGIN;
INSERT INTO pedido (id_comensal) SELECT MIN(id_comensal) FROM comensal;
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
SELECT (SELECT MAX(id_pedido) FROM pedido), id_producto, 1, precio
FROM producto WHERE nombre = 'Trucha frita';
-- Esta sentencia debe dar ERROR: "Pedido N no pagado: no puede pasar a EN_PREPARACION..."
UPDATE pedido SET estado = 'EN_PREPARACION' WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
ROLLBACK;

\echo '=== 8. Pago con monto incorrecto -> DEBE FALLAR ==='
BEGIN;
INSERT INTO pedido (id_comensal) SELECT MIN(id_comensal) FROM comensal;
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
SELECT (SELECT MAX(id_pedido) FROM pedido), id_producto, 1, precio
FROM producto WHERE nombre = 'Trucha frita';
INSERT INTO pago (id_pedido, id_usuario, metodo, monto)
VALUES ((SELECT MAX(id_pedido) FROM pedido),
        (SELECT id_usuario FROM usuario WHERE username = 'cajero'), 'EFECTIVO', 1.00);
-- Debe dar ERROR: "el pago (S/ 1.00) no coincide con el total (S/ 28.00)"
UPDATE pedido SET estado = 'PAGADO' WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
ROLLBACK;

\echo '=== 9. Salto de estado no permitido (PAGADO -> LISTO) -> DEBE FALLAR ==='
BEGIN;
INSERT INTO pedido (id_comensal) SELECT MIN(id_comensal) FROM comensal;
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
SELECT (SELECT MAX(id_pedido) FROM pedido), id_producto, 1, precio
FROM producto WHERE nombre = 'Adobo';
INSERT INTO pago (id_pedido, id_usuario, metodo, monto)
VALUES ((SELECT MAX(id_pedido) FROM pedido),
        (SELECT id_usuario FROM usuario WHERE username = 'cajero'), 'EFECTIVO', 22.00);
UPDATE pedido SET estado = 'PAGADO' WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
-- Debe dar ERROR: "Transicion no permitida ... PAGADO -> LISTO"
UPDATE pedido SET estado = 'LISTO' WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
ROLLBACK;

\echo '=== 10. Flujo correcto completo (se ve el historial y luego se deshace) ==='
BEGIN;
INSERT INTO pedido (id_comensal) SELECT MIN(id_comensal) FROM comensal;
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
SELECT (SELECT MAX(id_pedido) FROM pedido), id_producto, 1, precio
FROM producto WHERE nombre = 'Lomo saltado';
INSERT INTO pago (id_pedido, id_usuario, metodo, monto)
VALUES ((SELECT MAX(id_pedido) FROM pedido),
        (SELECT id_usuario FROM usuario WHERE username = 'cajero'), 'YAPE', 26.00);
UPDATE pedido SET estado = 'PAGADO'         WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
UPDATE pedido SET estado = 'EN_PREPARACION' WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
UPDATE pedido SET estado = 'LISTO'          WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
UPDATE pedido SET estado = 'ENTREGADO'      WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido);
SELECT estado_anterior, estado_nuevo, cambiado_en
FROM historial_estado_pedido
WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedido)
ORDER BY id_historial;
ROLLBACK;
