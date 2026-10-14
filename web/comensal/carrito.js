const CANTIDAD_MAXIMA = 20;

// El carrito es un objeto plano { idProducto: { cantidad, nota } } para guardarlo tal cual en localStorage.
export function cantidadDe(carrito, idProducto) {
  return carrito[idProducto]?.cantidad ?? 0;
}

export function cambiarCantidad(carrito, idProducto, diferencia) {
  const nueva = Math.min(CANTIDAD_MAXIMA, cantidadDe(carrito, idProducto) + diferencia);
  if (nueva <= 0) {
    delete carrito[idProducto];
  } else {
    carrito[idProducto] = { nota: '', ...carrito[idProducto], cantidad: nueva };
  }
}

export function cambiarNota(carrito, idProducto, nota) {
  if (carrito[idProducto]) carrito[idProducto].nota = nota;
}

export function vaciar(carrito) {
  for (const idProducto of Object.keys(carrito)) delete carrito[idProducto];
}

export function quitarNoDisponibles(carrito, productosPorId) {
  for (const idProducto of Object.keys(carrito)) {
    if (!productosPorId.has(Number(idProducto))) delete carrito[idProducto];
  }
}

export function lineasDelCarrito(carrito, productosPorId) {
  return Object.entries(carrito)
    .map(([id, { cantidad, nota }]) => ({ producto: productosPorId.get(Number(id)), cantidad, nota }))
    .filter((linea) => linea.producto);
}

export function contarUnidades(carrito) {
  return Object.values(carrito).reduce((suma, linea) => suma + linea.cantidad, 0);
}

// Solo es referencia para el cliente: el total que vale es el que devuelve la API al confirmar.
export function totalEstimadoCentimos(lineas) {
  return lineas.reduce((suma, { producto, cantidad }) => suma + Math.round(Number(producto.precio) * 100) * cantidad, 0);
}

export function aCuerpoDePedido(lineas) {
  return {
    lineas: lineas.map(({ producto, cantidad, nota }) => ({
      idProducto: producto.idProducto,
      cantidad,
      ...(nota.trim() ? { nota: nota.trim() } : {}),
    })),
  };
}
