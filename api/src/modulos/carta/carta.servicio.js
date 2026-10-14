import { Conflicto, NoEncontrado } from '../../shared/errores.js';
import * as cartaRepo from './carta.repositorio.js';

export function listarCategorias() {
  return cartaRepo.listarCategorias();
}

export function listarProductos(filtros) {
  return cartaRepo.listarProductos(filtros);
}

export function crearProducto(datos) {
  return cartaRepo.insertarProducto(datos);
}

export async function cambiarDisponibilidad(idProducto, disponible) {
  const existe = await cartaRepo.actualizarDisponibilidad(idProducto, disponible);
  if (!existe) {
    throw new NoEncontrado('Producto');
  }
  return cartaRepo.buscarProductoPorId(idProducto);
}

export async function obtenerProductosParaPedido(cliente, idsProducto) {
  const productos = await cartaRepo.bloquearProductosPorIds(cliente, idsProducto);
  const porId = new Map(productos.map((producto) => [producto.idProducto, producto]));

  for (const idProducto of idsProducto) {
    const producto = porId.get(idProducto);
    if (!producto) {
      throw new NoEncontrado(`Producto ${idProducto}`);
    }
    if (!producto.disponible) {
      throw new Conflicto('PRODUCTO_AGOTADO', `${producto.nombre} está agotado`);
    }
  }
  return porId;
}
