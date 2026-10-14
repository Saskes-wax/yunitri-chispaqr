import { el, firmaDeLista, mostrarAviso, ocultarAviso, repintarLista } from '/compartido/dom.js';
import { iniciarPantallaPersonal } from '/compartido/personal.js';
import { crearSondeo } from '/compartido/sondeo.js';
import { tarjetaPedido } from '/compartido/tarjeta-pedido.js';

const pantalla = iniciarPantallaPersonal('/mozo/');
const $ = (id) => document.getElementById(id);

async function marcarEntregado(pedido, boton) {
  boton.disabled = true;
  ocultarAviso($('aviso-mozo'));
  try {
    await pantalla.llamar(`/pedidos/${pedido.idPedido}/estado`, { metodo: 'PATCH', cuerpo: { estado: 'ENTREGADO' } });
    sondeo.ahora();
  } catch (error) {
    mostrarAviso($('aviso-mozo'), `${pedido.codigoPedido}: ${error.message}`);
    boton.disabled = false;
  }
}

function botonEntregado(pedido) {
  const boton = el(
    'button',
    { type: 'button', class: 'boton boton--exito', 'data-clave': `entregar-${pedido.idPedido}` },
    'Entregado',
  );
  boton.addEventListener('click', () => marcarEntregado(pedido, boton));
  return boton;
}

async function cargarListos() {
  const { datos } = await pantalla.llamar('/pedidos?estado=LISTO');
  $('contador-listos').textContent = datos.length;
  repintarLista($('lista-listos'), firmaDeLista(datos), () =>
    datos.length === 0
      ? [el('p', { class: 'vacio' }, 'No hay pedidos listos por ahora.')]
      : datos.map((pedido) => tarjetaPedido(pedido, { mostrarTotal: false, acciones: [botonEntregado(pedido)] })),
  );
}

const sondeo = crearSondeo(cargarListos, { alCambiarConexion: (conectado) => pantalla?.marcarConexion(conectado) });

if (pantalla) sondeo.iniciar();
