-- ChispaQR - datos de prueba (Hito 2)
-- Datos de EJEMPLO, por confirmar con la entrevista (carta, precios, mesas, zonas, métodos de pago).
-- Contraseña de todos los usuarios de prueba: chispa123 (con hash).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles y usuarios (uno por rol + un mozo eventual desactivado)
INSERT INTO rol (nombre) VALUES ('ADMINISTRADOR'), ('CAJERO'), ('COCINA'), ('MOZO');

INSERT INTO usuario (id_rol, nombre, username, password_hash, activo)
SELECT r.id_rol, u.nombre, u.username, crypt('chispa123', gen_salt('bf')), u.activo
FROM (VALUES
    ('ADMINISTRADOR', 'Dueño del recreo (ejemplo)', 'admin',          true),
    ('CAJERO',        'Cajero (ejemplo)',           'cajero',         true),
    ('COCINA',        'Cocina (ejemplo)',           'cocina',         true),
    ('MOZO',          'Mozo (ejemplo)',             'mozo',           true),
    ('MOZO',          'Mozo eventual (ejemplo)',    'mozo_eventual',  false)  -- temporada alta, ya desactivado
) AS u(rol, nombre, username, activo)
JOIN rol r ON r.nombre = u.rol;

-- Mesas (EJEMPLO: 8 mesas en 3 zonas)
INSERT INTO mesa (numero, zona, codigo_qr) VALUES
    (1, 'Salón',   'chispa-mesa-01'),
    (2, 'Salón',   'chispa-mesa-02'),
    (3, 'Salón',   'chispa-mesa-03'),
    (4, 'Jardín',  'chispa-mesa-04'),
    (5, 'Jardín',  'chispa-mesa-05'),
    (6, 'Jardín',  'chispa-mesa-06'),
    (7, 'Terraza', 'chispa-mesa-07'),
    (8, 'Terraza', 'chispa-mesa-08');

-- Carta (EJEMPLO) - precios en soles
INSERT INTO categoria (nombre, orden) VALUES
    ('Entradas', 1), ('Platos de fondo', 2), ('Bebidas', 3), ('Postres', 4);

INSERT INTO producto (id_categoria, nombre, descripcion, precio, disponible, stock)
SELECT c.id_categoria, p.nombre, p.descripcion, p.precio, true, p.stock
FROM (VALUES
    ('Entradas',        'Papa a la huancaína',            'Con salsa de ají amarillo',      10.00, NULL::INT),
    ('Entradas',        'Choclo con queso',               NULL,                             12.00, NULL),
    ('Platos de fondo', 'Trucha frita',                   'Con arroz y ensalada',           28.00, 20),
    ('Platos de fondo', 'Cuy chactado (media porción)',   'Porción limitada por día',       45.00, 6),
    ('Platos de fondo', 'Adobo',                          NULL,                             22.00, NULL),
    ('Platos de fondo', 'Lomo saltado',                   NULL,                             26.00, NULL),
    ('Bebidas',         'Chicha morada',                  'Jarra',                          15.00, NULL),
    ('Bebidas',         'Gaseosa 1.5 L',                  NULL,                             10.00, NULL),
    ('Bebidas',         'Cerveza',                        NULL,                             12.00, NULL),
    ('Postres',         'Mazamorra morada',               NULL,                              8.00, NULL),
    ('Postres',         'Gelatina',                       NULL,                              5.00, NULL)
) AS p(categoria, nombre, descripcion, precio, stock)
JOIN categoria c ON c.nombre = p.categoria;

-- "Un domingo lleno" (ejemplo): 11/10/2026, 11:40 a 15:10, hora punta 13:00-14:00.
-- Los pedidos pasan por el trigger estado por estado, así se llena el historial.
DO $$
DECLARE
    r          RECORD;
    v_mesa     INT;
    v_sesion   INT;
    v_comensal INT;
    v_pedido   INT;
    v_total    NUMERIC(10,2);
    v_cajero   INT;
    v_item     TEXT;
    v_estado   TEXT;
    v_hora     TIMESTAMPTZ;
BEGIN
    SELECT id_usuario INTO v_cajero FROM usuario WHERE username = 'cajero';
    PERFORM set_config('app.id_usuario', v_cajero::TEXT, true);

    FOR r IN
        SELECT * FROM (VALUES
            (1, 'Carlos', '2026-10-11 11:40', ARRAY['Trucha frita','Chicha morada'],                                   'ENTREGADO',      'EFECTIVO'),
            (2, 'Rosa',   '2026-10-11 11:55', ARRAY['Adobo','Gaseosa 1.5 L'],                                          'ENTREGADO',      'YAPE'),
            (3, 'Miguel', '2026-10-11 12:20', ARRAY['Lomo saltado','Cerveza'],                                         'ENTREGADO',      'EFECTIVO'),
            (1, 'Lucía',  '2026-10-11 12:50', ARRAY['Papa a la huancaína','Choclo con queso'],                         'ENTREGADO',      'PLIN'),
            (4, 'Jorge',  '2026-10-11 13:00', ARRAY['Cuy chactado (media porción)','Chicha morada','Cerveza'],          'ENTREGADO',      'EFECTIVO'),
            (5, 'Ana',    '2026-10-11 13:05', ARRAY['Trucha frita','Trucha frita','Gaseosa 1.5 L'],                    'ENTREGADO',      'YAPE'),
            (6, 'Pedro',  '2026-10-11 13:10', ARRAY['Adobo','Lomo saltado','Cerveza'],                                 'ENTREGADO',      'POS'),
            (2, 'Elena',  '2026-10-11 13:15', ARRAY['Trucha frita','Mazamorra morada'],                                'ENTREGADO',      'EFECTIVO'),
            (7, 'Raúl',   '2026-10-11 13:25', ARRAY['Lomo saltado','Chicha morada'],                                   'ENTREGADO',      'YAPE'),
            (8, 'Sofía',  '2026-10-11 13:30', ARRAY['Adobo','Gelatina'],                                               'ENTREGADO',      'EFECTIVO'),
            (3, 'Diego',  '2026-10-11 13:40', ARRAY['Trucha frita','Cerveza','Cerveza'],                               'LISTO',          'EFECTIVO'),
            (4, 'Mar',    '2026-10-11 13:45', ARRAY['Papa a la huancaína','Adobo'],                                    'EN_PREPARACION', 'PLIN'),
            (5, 'Luis',   '2026-10-11 13:50', ARRAY['Cuy chactado (media porción)','Gaseosa 1.5 L'],                   'PAGADO',         'YAPE'),
            (6, 'Karen',  '2026-10-11 13:55', ARRAY['Lomo saltado','Chicha morada'],                                   'PENDIENTE_PAGO', NULL),
            (1, 'Tito',   '2026-10-11 14:05', ARRAY['Trucha frita','Choclo con queso'],                                'PENDIENTE_PAGO', NULL),
            (7, 'Inés',   '2026-10-11 14:20', ARRAY['Adobo','Cerveza'],                                                'CANCELADO',      NULL),
            (8, 'Beto',   '2026-10-11 15:10', ARRAY['Mazamorra morada','Gelatina'],                                    'ENTREGADO',      'EFECTIVO')
        ) AS t(mesa, comensal, hora, items, estado_final, metodo)
    LOOP
        v_hora := r.hora::TIMESTAMP AT TIME ZONE 'America/Lima';

        -- sesión de la mesa: se reutiliza la abierta o se abre una nueva
        SELECT id_mesa INTO v_mesa FROM mesa WHERE numero = r.mesa;
        SELECT id_sesion INTO v_sesion FROM sesion_mesa
         WHERE id_mesa = v_mesa AND cerrada_en IS NULL;
        IF v_sesion IS NULL THEN
            INSERT INTO sesion_mesa (id_mesa, abierta_en) VALUES (v_mesa, v_hora)
            RETURNING id_sesion INTO v_sesion;
        END IF;

        INSERT INTO comensal (id_sesion, nombre, creado_en)
        VALUES (v_sesion, r.comensal, v_hora)
        RETURNING id_comensal INTO v_comensal;

        INSERT INTO pedido (id_comensal, creado_en)
        VALUES (v_comensal, v_hora)
        RETURNING id_pedido INTO v_pedido;

        FOREACH v_item IN ARRAY r.items LOOP
            INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
            SELECT v_pedido, id_producto, 1, precio FROM producto WHERE nombre = v_item;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Producto de prueba no existe: %', v_item;
            END IF;
        END LOOP;

        IF r.estado_final = 'CANCELADO' THEN
            UPDATE pedido SET estado = 'CANCELADO' WHERE id_pedido = v_pedido;

        ELSIF r.estado_final <> 'PENDIENTE_PAGO' THEN
            SELECT total INTO v_total FROM v_pedido_total WHERE id_pedido = v_pedido;

            INSERT INTO pago (id_pedido, id_usuario, metodo, monto, pagado_en)
            VALUES (v_pedido, v_cajero, r.metodo, v_total, v_hora + INTERVAL '3 minutes');

            FOREACH v_estado IN ARRAY ARRAY['PAGADO','EN_PREPARACION','LISTO','ENTREGADO'] LOOP
                UPDATE pedido SET estado = v_estado WHERE id_pedido = v_pedido;
                EXIT WHEN v_estado = r.estado_final;
            END LOOP;
        END IF;
    END LOOP;

    -- Mesas 7 y 8 ya terminaron: se cierran sus sesiones
    UPDATE sesion_mesa
       SET cerrada_en = abierta_en + INTERVAL '2 hours'
     WHERE id_mesa IN (SELECT id_mesa FROM mesa WHERE numero IN (7, 8));
END $$;
