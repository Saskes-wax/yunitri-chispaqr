-- ChispaQR - triggers del pedido (v2, contrato v1.2)
-- Regla: no se cocina lo que no se pagó.
-- Transiciones: PENDIENTE_PAGO -> PAGADO | CANCELADO; PAGADO -> EN_PREPARACION;
--               EN_PREPARACION -> LISTO -> ENTREGADO  (un pedido pagado ya no se cancela)
-- Opcional: SET LOCAL app.id_usuario = '<id>'; registra quién hizo el cambio.

CREATE OR REPLACE FUNCTION fn_pedido_cambio_estado()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_monto   NUMERIC(10,2);
    v_total   NUMERIC(10,2);
    v_usuario INT;
BEGIN
    -- Si el estado no cambió, no hay nada que validar ni registrar
    IF NEW.estado = OLD.estado THEN
        RETURN NEW;
    END IF;

    -- Regla principal: nada pasa a cocina (ni avanza) si no hay pago registrado
    IF NEW.estado IN ('EN_PREPARACION','LISTO','ENTREGADO')
       AND NOT EXISTS (SELECT 1 FROM pago WHERE id_pedido = NEW.id_pedido) THEN
        RAISE EXCEPTION 'Pedido % no pagado: no puede pasar a % (se cocina solo lo pagado)',
            NEW.id_pedido, NEW.estado;
    END IF;

    -- Solo se permiten las transiciones del flujo
    IF NOT (
           (OLD.estado = 'PENDIENTE_PAGO' AND NEW.estado IN ('PAGADO','CANCELADO'))
        OR (OLD.estado = 'PAGADO'         AND NEW.estado = 'EN_PREPARACION')
        OR (OLD.estado = 'EN_PREPARACION' AND NEW.estado = 'LISTO')
        OR (OLD.estado = 'LISTO'          AND NEW.estado = 'ENTREGADO')
    ) THEN
        RAISE EXCEPTION 'Transicion no permitida en pedido %: % -> %',
            NEW.id_pedido, OLD.estado, NEW.estado;
    END IF;

    -- Para marcar PAGADO: debe existir el pago y su monto debe igualar el total del pedido
    IF NEW.estado = 'PAGADO' THEN
        SELECT monto INTO v_monto FROM pago WHERE id_pedido = NEW.id_pedido;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Pedido %: falta registrar el pago antes de marcarlo PAGADO',
                NEW.id_pedido;
        END IF;

        SELECT total INTO v_total FROM v_pedido_total WHERE id_pedido = NEW.id_pedido;
        IF v_total IS NULL OR v_total = 0 THEN
            RAISE EXCEPTION 'Pedido %: no tiene productos, no se puede cobrar', NEW.id_pedido;
        END IF;
        IF v_monto <> v_total THEN
            RAISE EXCEPTION 'Pedido %: el pago (S/ %) no coincide con el total (S/ %)',
                NEW.id_pedido, v_monto, v_total;
        END IF;
    END IF;

    -- Quién lo hizo (opcional)
    v_usuario := NULLIF(current_setting('app.id_usuario', true), '')::INT;

    NEW.actualizado_en := now();

    INSERT INTO historial_estado_pedido (id_pedido, estado_anterior, estado_nuevo, id_usuario)
    VALUES (NEW.id_pedido, OLD.estado, NEW.estado, v_usuario);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_cambio_estado
BEFORE UPDATE ON pedido
FOR EACH ROW
EXECUTE FUNCTION fn_pedido_cambio_estado();

-- 2) Pedido nuevo: siempre nace PENDIENTE_PAGO y queda en el historial
CREATE OR REPLACE FUNCTION fn_pedido_estado_inicial()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.estado <> 'PENDIENTE_PAGO' THEN
        RAISE EXCEPTION 'Un pedido nuevo debe iniciar en PENDIENTE_PAGO (recibido: %)', NEW.estado;
    END IF;

    INSERT INTO historial_estado_pedido (id_pedido, estado_anterior, estado_nuevo, id_usuario)
    VALUES (NEW.id_pedido, NULL, NEW.estado,
            NULLIF(current_setting('app.id_usuario', true), '')::INT);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pedido_estado_inicial
AFTER INSERT ON pedido
FOR EACH ROW
EXECUTE FUNCTION fn_pedido_estado_inicial();

-- 3) El detalle de un pedido solo se modifica mientras está PENDIENTE_PAGO
--    (nadie agrega platos sin pagar a un pedido ya pagado)
CREATE OR REPLACE FUNCTION fn_detalle_solo_pendiente()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_id     INT := COALESCE(NEW.id_pedido, OLD.id_pedido);
    v_estado VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado FROM pedido WHERE id_pedido = v_id;
    IF v_estado IS DISTINCT FROM 'PENDIENTE_PAGO' THEN
        RAISE EXCEPTION 'Pedido % está en %: su detalle ya no se puede modificar', v_id, v_estado;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_detalle_solo_pendiente
BEFORE INSERT OR UPDATE OR DELETE ON detalle_pedido
FOR EACH ROW
EXECUTE FUNCTION fn_detalle_solo_pendiente();
