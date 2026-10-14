import { el, firmaDeLista, mostrarAviso, ocultarAviso, reemplazarContenido, repintarLista } from '/compartido/dom.js';
import { iniciarPantallaPersonal } from '/compartido/personal.js';
import { crearSondeo } from '/compartido/sondeo.js';
import { tarjetaPedido } from '/compartido/tarjeta-pedido.js';

// Si un pedido pagado espera más que esto sin empezar, se resalta.
const MINUTOS_DE_ALERTA = 15;

const pantalla = iniciarPantallaPersonal('/cocina/');
const $ = (id) => document.getElementById(id);

async function cambiarEstado(pedido, estado, boton) {
  boton.disabled = true;
  ocultarAviso($('aviso-cocina'));
  try {
    await pantalla.llamar(`/pedidos/${pedido.idPedido}/estado`, { metodo: 'PATCH', cuerpo: { estado } });
    sondeo.ahora();
  } catch (error) {
    mostrarAviso($('aviso-cocina'), `${pedido.codigoPedido}: ${error.message}`);
    boton.disabled = false;
  }
}

function botonEstado(pedido, estado, texto, clase) {
  const boton = el('button', { type: 'button', class: `boton ${clase}`, 'data-clave': `${estado}-${pedido.idPedido}` }, texto);
  boton.addEventListener('click', () => cambiarEstado(pedido, estado, boton));
  return boton;
}

function pintarColumna(contenedor, contador, pedidos, crearAccion, textoVacio) {
  contador.textContent = pedidos.length;
  repintarLista(contenedor, firmaDeLista(pedidos), () =>
    pedidos.length === 0
      ? [el('p', { class: 'vacio' }, textoVacio)]
      : pedidos.map((pedido) =>
          tarjetaPedido(pedido, {
            desde: pedido.fechaPago ?? pedido.fechaCreacion,
            alertaMinutos: MINUTOS_DE_ALERTA,
            mostrarTotal: false,
            acciones: [crearAccion(pedido)],
          }),
        ),
  );
}

async function cargarPedidos() {
  const { datos } = await pantalla.llamar('/pedidos?estado=PAGADO,EN_PREPARACION');
  pintarColumna(
    $('lista-pagados'),
    $('contador-pagados'),
    datos.filter((pedido) => pedido.estado === 'PAGADO'),
    (pedido) => botonEstado(pedido, 'EN_PREPARACION', 'Empezar', ''),
    'Sin pedidos nuevos.',
  );
  pintarColumna(
    $('lista-preparando'),
    $('contador-preparando'),
    datos.filter((pedido) => pedido.estado === 'EN_PREPARACION'),
    (pedido) => botonEstado(pedido, 'LISTO', 'Listo para entregar', 'boton--exito'),
    'Nada en preparación.',
  );
}

async function alternarDisponibilidad(producto, boton) {
  boton.disabled = true;
  try {
    const actualizado = await pantalla.llamar(`/productos/${producto.idProducto}/disponibilidad`, {
      metodo: 'PATCH',
      cuerpo: { disponible: !producto.disponible },
    });
    producto.disponible = actualizado.disponible;
    boton.setAttribute('aria-pressed', String(!producto.disponible));
    boton.querySelector('.disponibilidad__estado').textContent = producto.disponible ? 'Disponible' : 'Agotado';
  } catch (error) {
    mostrarAviso($('aviso-cocina'), error.message);
  } finally {
    boton.disabled = false;
  }
}

function botonDisponibilidad(producto) {
  const boton = el(
    'button',
    { type: 'button', class: 'disponibilidad', 'aria-pressed': String(!producto.disponible) },
    el('span', {}, producto.nombre),
    el('span', { class: 'disponibilidad__estado' }, producto.disponible ? 'Disponible' : 'Agotado'),
  );
  boton.addEventListener('click', () => alternarDisponibilidad(producto, boton));
  return boton;
}

async function cargarProductos() {
  try {
    const { datos } = await pantalla.llamar('/productos');
    reemplazarContenido($('lista-productos'), datos.map(botonDisponibilidad));
  } catch (error) {
    reemplazarContenido($('lista-productos'), el('p', { class: 'aviso aviso--error' }, error.message));
  }
}

const sondeo = crearSondeo(cargarPedidos, { alCambiarConexion: (conectado) => pantalla?.marcarConexion(conectado) });

if (pantalla) {
  $('panel-agotados').addEventListener('toggle', (evento) => {
    if (evento.target.open) cargarProductos();
  });
  sondeo.iniciar();
}
