import { el, icono, reemplazarContenido } from '/compartido/dom.js';
import { soles } from '/compartido/formato.js';
import { cambiarCantidad, cambiarNota, cantidadDe, lineasDelCarrito, totalEstimadoCentimos } from './carrito.js';

const LONGITUD_MAXIMA_NOTA = 140;
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');

function botonCantidad(accion, producto, alPulsar) {
  const esSumar = accion === 'sumar';
  return el(
    'button',
    {
      type: 'button',
      class: esSumar ? 'boton-redondo boton-redondo--lleno' : 'boton-redondo',
      'data-accion': accion,
      'aria-label': `${esSumar ? 'Agregar' : 'Quitar'} ${producto.nombre}`,
      onclick: () => alPulsar(esSumar ? 1 : -1, accion),
    },
    icono(esSumar ? 'mas' : 'menos'),
  );
}

// Solo se repinta el control tocado, para no perder el foco ni el desplazamiento.
function montarControlCantidad(contenedor, producto, carrito, alCambiar) {
  function pintar(accionEnfocada) {
    const cantidad = cantidadDe(carrito, producto.idProducto);
    const alPulsar = (diferencia, accion) => {
      cambiarCantidad(carrito, producto.idProducto, diferencia);
      pintar(accion);
      alCambiar(cantidadDe(carrito, producto.idProducto));
    };

    if (cantidad === 0) {
      reemplazarContenido(contenedor, botonCantidad('sumar', producto, alPulsar));
    } else {
      reemplazarContenido(
        contenedor,
        el(
          'div',
          { class: 'cantidad', role: 'group', 'aria-label': `Cantidad de ${producto.nombre}` },
          botonCantidad('restar', producto, alPulsar),
          el('span', { class: 'cantidad__valor', 'aria-live': 'polite' }, cantidad),
          botonCantidad('sumar', producto, alPulsar),
        ),
      );
    }

    if (accionEnfocada) {
      const destino = contenedor.querySelector(`[data-accion="${accionEnfocada}"]`) ?? contenedor.querySelector('button');
      destino.focus();
    }
  }

  pintar();
  return contenedor;
}

function tarjetaProducto(producto, carrito, alCambiar) {
  return el(
    'article',
    { class: 'producto' },
    el(
      'div',
      {},
      el('h3', {}, producto.nombre),
      producto.descripcion && el('p', { class: 'producto__descripcion' }, producto.descripcion),
      el('p', { class: 'producto__precio' }, soles(producto.precio)),
    ),
    montarControlCantidad(el('div'), producto, carrito, alCambiar),
  );
}

function agruparPorCategoria(productos) {
  const grupos = new Map();
  for (const producto of productos) {
    if (!grupos.has(producto.idCategoria)) grupos.set(producto.idCategoria, { nombre: producto.categoria, productos: [] });
    grupos.get(producto.idCategoria).productos.push(producto);
  }
  return grupos;
}

function irACategoria(evento) {
  evento.preventDefault();
  const seccion = document.getElementById(evento.currentTarget.dataset.destino);
  seccion.scrollIntoView({ behavior: movimientoReducido.matches ? 'auto' : 'smooth' });
  seccion.querySelector('h2').focus({ preventScroll: true });
}

export function pintarCarta({ contenedorCategorias, contenedorProductos, productos, carrito, alCambiar }) {
  if (productos.length === 0) {
    reemplazarContenido(contenedorCategorias);
    reemplazarContenido(contenedorProductos, el('p', { class: 'vacio' }, 'Por ahora no hay platos disponibles. Consulta al mozo.'));
    return;
  }

  const grupos = [...agruparPorCategoria(productos)];
  reemplazarContenido(
    contenedorCategorias,
    grupos.map(([id, grupo]) =>
      el('a', { href: `#categoria-${id}`, 'data-destino': `categoria-${id}`, onclick: irACategoria }, grupo.nombre),
    ),
  );
  reemplazarContenido(
    contenedorProductos,
    grupos.map(([id, grupo]) =>
      el(
        'section',
        { class: 'categoria', id: `categoria-${id}`, 'aria-labelledby': `nombre-categoria-${id}` },
        el('h2', { id: `nombre-categoria-${id}`, tabindex: '-1' }, grupo.nombre),
        el('div', { class: 'tarjeta categoria__platos' }, grupo.productos.map((producto) => tarjetaProducto(producto, carrito, alCambiar))),
      ),
    ),
  );
}

function campoNota(producto, nota, carrito, alCambiarNota) {
  const idNota = `nota-${producto.idProducto}`;
  return el(
    'div',
    { class: 'campo' },
    el('label', { for: idNota }, 'Nota para cocina (opcional)'),
    el('input', {
      id: idNota,
      name: idNota,
      autocomplete: 'off',
      value: nota,
      maxlength: LONGITUD_MAXIMA_NOTA,
      placeholder: 'Ej.: sin ají, bien cocido…',
      oninput: (evento) => {
        cambiarNota(carrito, producto.idProducto, evento.target.value);
        alCambiarNota();
      },
    }),
  );
}

function lineaCarrito({ producto, cantidad, nota }, carrito, alCambiar, alCambiarNota) {
  const subtotal = el('p', { class: 'carrito__subtotal' });
  const pintarSubtotal = (unidades) => {
    subtotal.textContent = `${soles(producto.precio)} c/u · ${soles(Number(producto.precio) * unidades)}`;
  };
  pintarSubtotal(cantidad);

  return el(
    'li',
    { class: 'tarjeta carrito__linea' },
    el(
      'div',
      { class: 'carrito__fila' },
      el('div', {}, el('h2', { class: 'producto__nombre' }, producto.nombre), subtotal),
      montarControlCantidad(el('div'), producto, carrito, (unidades) => {
        pintarSubtotal(unidades);
        alCambiar(unidades);
      }),
    ),
    campoNota(producto, nota, carrito, alCambiarNota),
  );
}

export function pintarCarrito({ contenedorLineas, contenedorTotal, botonConfirmar, carrito, productosPorId, alCambiar, alCambiarNota }) {
  const lineas = lineasDelCarrito(carrito, productosPorId);
  botonConfirmar.disabled = lineas.length === 0;
  contenedorTotal.textContent = soles(totalEstimadoCentimos(lineas) / 100);

  if (lineas.length === 0) {
    reemplazarContenido(contenedorLineas, el('li', { class: 'vacio' }, 'Todavía no agregaste nada. Vuelve a la carta y elige tus platos.'));
    return;
  }
  reemplazarContenido(contenedorLineas, lineas.map((linea) => lineaCarrito(linea, carrito, alCambiar, alCambiarNota)));
}
