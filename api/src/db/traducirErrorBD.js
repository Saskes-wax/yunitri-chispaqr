import { Conflicto, ValidacionFallida } from '../shared/errores.js';

const MENSAJES_POR_RESTRICCION = Object.freeze({
  pago_id_pedido_key: 'Este pedido ya fue pagado',
  mesa_numero_key: 'Ya existe una mesa con ese número',
  usuario_username_key: 'Ese nombre de usuario ya existe',
  producto_id_categoria_nombre_key: 'Ya existe un producto con ese nombre en la categoría',
});

const TRADUCCION_POR_CODIGO = Object.freeze({
  23505: (err) => new Conflicto('DUPLICADO', MENSAJES_POR_RESTRICCION[err.constraint] ?? 'El registro ya existe'),
  23503: () => new Conflicto('REFERENCIA_INVALIDA', 'Se hace referencia a un dato que no existe o está en uso'),
  23514: () => new ValidacionFallida([{ mensaje: 'Un valor no cumple las reglas' }]),
  23502: () => new ValidacionFallida([{ mensaje: 'Falta un dato obligatorio' }]),
  // RAISE EXCEPTION del trigger trg_pedido_cambio_estado.
  P0001: (err) => new Conflicto('REGLA_DE_NEGOCIO', err.message),
});

export function traducirErrorBD(err) {
  return TRADUCCION_POR_CODIGO[err?.code]?.(err) ?? null;
}
