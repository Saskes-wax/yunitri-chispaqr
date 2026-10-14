import { pool } from '../../db/pool.js';

function aProducto(fila) {
  return {
    idProducto: fila.id_producto,
    idCategoria: fila.id_categoria,
    categoria: fila.categoria,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precio: fila.precio,
    disponible: fila.disponible,
  };
}

const SELECT_PRODUCTO = `
  SELECT p.id_producto, p.id_categoria, c.nombre AS categoria, p.nombre, p.descripcion, p.precio, p.disponible
    FROM producto p
    JOIN categoria c ON c.id_categoria = p.id_categoria`;

export async function listarCategorias() {
  const { rows } = await pool.query('SELECT id_categoria, nombre FROM categoria ORDER BY orden, nombre');
  return rows.map((fila) => ({ idCategoria: fila.id_categoria, nombre: fila.nombre }));
}

export async function listarProductos({ disponible, idCategoria }) {
  const { rows } = await pool.query(
    `${SELECT_PRODUCTO}
      WHERE ($1::boolean IS NULL OR p.disponible = $1)
        AND ($2::integer IS NULL OR p.id_categoria = $2)
      ORDER BY c.orden, c.nombre, p.nombre`,
    [disponible ?? null, idCategoria ?? null],
  );
  return rows.map(aProducto);
}

export async function insertarProducto({ idCategoria, nombre, descripcion, precio, disponible }) {
  const { rows } = await pool.query(
    `WITH nuevo AS (
       INSERT INTO producto (id_categoria, nombre, descripcion, precio, disponible)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *
     )
     SELECT n.id_producto, n.id_categoria, c.nombre AS categoria, n.nombre, n.descripcion, n.precio, n.disponible
       FROM nuevo n
       JOIN categoria c ON c.id_categoria = n.id_categoria`,
    [idCategoria, nombre, descripcion ?? null, precio, disponible],
  );
  return aProducto(rows[0]);
}

// Lista blanca: solo estas columnas se pueden actualizar desde la API.
const COLUMNAS_EDITABLES = Object.freeze({
  idCategoria: 'id_categoria',
  nombre: 'nombre',
  descripcion: 'descripcion',
  precio: 'precio',
  disponible: 'disponible',
});

export async function actualizarProducto(idProducto, cambios) {
  const campos = Object.keys(cambios).filter((campo) => campo in COLUMNAS_EDITABLES);
  const asignaciones = campos.map((campo, indice) => `${COLUMNAS_EDITABLES[campo]} = $${indice + 2}`);
  const { rowCount } = await pool.query(
    `UPDATE producto SET ${asignaciones.join(', ')} WHERE id_producto = $1`,
    [idProducto, ...campos.map((campo) => cambios[campo])],
  );
  return rowCount > 0;
}

export async function actualizarDisponibilidad(idProducto, disponible) {
  const { rowCount } = await pool.query(
    'UPDATE producto SET disponible = $2 WHERE id_producto = $1',
    [idProducto, disponible],
  );
  return rowCount > 0;
}

export async function buscarProductoPorId(idProducto) {
  const { rows } = await pool.query(`${SELECT_PRODUCTO} WHERE p.id_producto = $1`, [idProducto]);
  return rows[0] ? aProducto(rows[0]) : null;
}

// FOR SHARE: nadie puede marcar agotado o cambiar el precio mientras se arma el pedido.
export async function bloquearProductosPorIds(cliente, idsProducto) {
  const { rows } = await cliente.query(
    `SELECT id_producto, nombre, precio, disponible
       FROM producto
      WHERE id_producto = ANY($1::integer[])
      FOR SHARE`,
    [idsProducto],
  );
  return rows.map((fila) => ({
    idProducto: fila.id_producto,
    nombre: fila.nombre,
    precio: fila.precio,
    disponible: fila.disponible,
  }));
}
