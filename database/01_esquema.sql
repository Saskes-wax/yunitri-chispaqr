-- ChispaQR - esquema PostgreSQL 16 (v2, contrato v1.2)
-- Campos marcados "por confirmar" dependen de la entrevista.

CREATE TABLE rol (
    id_rol  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  VARCHAR(20) NOT NULL UNIQUE,
    CONSTRAINT ck_rol_nombre CHECK (nombre IN ('ADMINISTRADOR','CAJERO','COCINA','MOZO'))
);

-- 2. usuario: personal del recreo (mozos eventuales se desactivan con activo = false)
CREATE TABLE usuario (
    id_usuario     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol         INT NOT NULL REFERENCES rol(id_rol),
    nombre         VARCHAR(80) NOT NULL,
    username       VARCHAR(40) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,                       -- nunca contraseña en texto plano
    activo         BOOLEAN NOT NULL DEFAULT true,
    intentos_fallidos INT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),  -- RNF-04: bloqueo tras 5 intentos
    bloqueado_hasta   TIMESTAMPTZ,                                           -- NULL = no bloqueado
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. mesa
CREATE TABLE mesa (
    id_mesa    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero     INT NOT NULL UNIQUE CHECK (numero > 0),   -- numeración real: POR CONFIRMAR
    zona       VARCHAR(30),                              -- salón/jardín/terraza: POR CONFIRMAR
    codigo_qr  VARCHAR(64) NOT NULL UNIQUE
               DEFAULT replace(gen_random_uuid()::text, '-', ''),  -- aleatorio: no se puede adivinar el de otra mesa
    activa     BOOLEAN NOT NULL DEFAULT true
);

-- 4. sesion_mesa: una "visita" a una mesa, de que se sientan hasta que se van
CREATE TABLE sesion_mesa (
    id_sesion   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mesa     INT NOT NULL REFERENCES mesa(id_mesa),
    abierta_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    cerrada_en  TIMESTAMPTZ,
    CONSTRAINT ck_sesion_fechas CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en)
);
-- Una mesa solo puede tener una sesión abierta a la vez
CREATE UNIQUE INDEX ux_sesion_mesa_abierta ON sesion_mesa(id_mesa) WHERE cerrada_en IS NULL;

-- 5. comensal: solo nombre o alias (NO guardar DNI ni celular)
CREATE TABLE comensal (
    id_comensal  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sesion    INT NOT NULL REFERENCES sesion_mesa(id_sesion),
    nombre       VARCHAR(60) NOT NULL,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. categoria
CREATE TABLE categoria (
    id_categoria  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre        VARCHAR(40) NOT NULL UNIQUE,
    orden         INT NOT NULL DEFAULT 0
);

-- 7. producto (precios en soles)
CREATE TABLE producto (
    id_producto   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria  INT NOT NULL REFERENCES categoria(id_categoria),
    nombre        VARCHAR(80) NOT NULL,
    descripcion   TEXT,
    precio        NUMERIC(8,2) NOT NULL CHECK (precio >= 0),
    disponible    BOOLEAN NOT NULL DEFAULT true,
    stock         INT CHECK (stock >= 0),                -- NULL = sin límite diario (RF-12)
    UNIQUE (id_categoria, nombre)
);

-- 8. pedido (el total NO se guarda: es dato derivado, ver vista v_pedido_total)
CREATE TABLE pedido (
    id_pedido      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_comensal    INT NOT NULL REFERENCES comensal(id_comensal),
    codigo_pedido  VARCHAR(12) NOT NULL UNIQUE,          -- código que el cliente lleva a caja (lo genera la API)
    clave_envio    UUID UNIQUE,                          -- RNF-02: un reintento con mala señal no duplica el pedido
    estado         VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_PAGO',
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_pedido_estado CHECK (estado IN
        ('PENDIENTE_PAGO','PAGADO','EN_PREPARACION','LISTO','ENTREGADO','CANCELADO'))
);

-- 9. detalle_pedido (precio_unitario = precio al momento de pedir, aunque la carta cambie después)
CREATE TABLE detalle_pedido (
    id_detalle       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    id_producto      INT NOT NULL REFERENCES producto(id_producto),
    cantidad         INT NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMERIC(8,2) NOT NULL CHECK (precio_unitario >= 0),
    nota             TEXT
);

-- 10. pago (un pedido tiene un solo pago; lo registra el cajero)
CREATE TABLE pago (
    id_pago     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido   INT NOT NULL UNIQUE REFERENCES pedido(id_pedido),
    id_usuario  INT NOT NULL REFERENCES usuario(id_usuario),   -- cajero que cobró
    metodo      VARCHAR(20) NOT NULL,
    monto       NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    pagado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Métodos reales del recreo: POR CONFIRMAR en la entrevista (quitar los que no usen)
    CONSTRAINT ck_pago_metodo CHECK (metodo IN ('EFECTIVO','YAPE','PLIN','TARJETA'))
);

-- 11. historial_estado_pedido (lo llena el trigger en 02_triggers.sql)
CREATE TABLE historial_estado_pedido (
    id_historial     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    estado_anterior  VARCHAR(20),
    estado_nuevo     VARCHAR(20) NOT NULL,
    id_usuario       INT REFERENCES usuario(id_usuario),       -- NULL si lo hizo el comensal/sistema
    cambiado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vista: total de cada pedido (calculado, no almacenado)
CREATE VIEW v_pedido_total AS
SELECT p.id_pedido,
       COALESCE(SUM(d.cantidad * d.precio_unitario), 0)::NUMERIC(10,2) AS total
FROM pedido p
LEFT JOIN detalle_pedido d ON d.id_pedido = p.id_pedido
GROUP BY p.id_pedido;

-- Índices para consultas frecuentes (cocina, caja, hora punta)
CREATE INDEX ix_pedido_estado    ON pedido(estado);
CREATE INDEX ix_pedido_creado_en ON pedido(creado_en);
CREATE INDEX ix_detalle_pedido   ON detalle_pedido(id_pedido);
CREATE INDEX ix_historial_pedido ON historial_estado_pedido(id_pedido);
