import { el, firmaDeLista, mostrarAviso, ocultarAviso, reemplazarContenido, repintarLista } from '/compartido/dom.js';
import { ETIQUETAS_ESTADO, soles } from '/compartido/formato.js';
import { iniciarPantallaPersonal } from '/compartido/personal.js';
import { crearSondeo } from '/compartido/sondeo.js';
import { listaDeLineas, tarjetaPedido } from '/compartido/tarjeta-pedido.js';

const MINUTOS_PARA_CANCELAR = 20;
const METODOS_PAGO = Object.freeze([
  ['EFECTIVO', 'Efectivo'],
  ['YAPE', 'Yape'],
  ['PLIN', 'Plin'],
  ['TARJETA', 'Tarjeta'],
]);

const pantalla = iniciarPantallaPersonal('/caja/');
const $ = (id) => document.getElementById(id);

// Acepta "m5-17" o "5-17" y lo lleva al formato M05-017.
function normalizarCodigo(texto) {
  const coincide = texto.trim().toUpperCase().match(/^M?(\d{1,2})-(\d{1,4})$/);
  if (!coincide) return texto.trim().toUpperCase();
  return `M${coincide[1].padStart(2, '0')}-${coincide[2].padStart(3, '0')}`;
}

function cerrarPanel() {
  $('panel-cobro').hidden = true;
  $('panel-cobro').replaceChildren();
}

async function cobrar(pedido, formulario, boton) {
  const metodo = formulario.metodo.value;
  if (!metodo) {
    mostrarAviso($('aviso-cobro'), 'Elige cómo pagó el cliente.');
    formulario.querySelector('input[name="metodo"]').focus();
    return;
  }

  boton.disabled = true;
  try {
    const pago = await pantalla.llamar(`/pedidos/${pedido.idPedido}/pago`, { metodo: 'POST', cuerpo: { metodo } });
    cerrarPanel();
    const nombreMetodo = METODOS_PAGO.find(([valor]) => valor === pago.metodo)[1];
    mostrarAviso($('aviso-cobro'), `${pago.codigoPedido} pagado con ${nombreMetodo} (${soles(pago.monto)}). Ya pasó a cocina.`, 'exito');
    $('codigo').value = '';
    $('codigo').focus();
    sondeo.ahora();
  } catch (error) {
    mostrarAviso($('aviso-cobro'), error.message);
    boton.disabled = false;
  }
}

async function cancelar(pedido, boton) {
  if (!confirm(`¿Cancelar el pedido ${pedido.codigoPedido}? El cliente tendrá que volver a pedir.`)) return;
  boton.disabled = true;
  try {
    await pantalla.llamar(`/pedidos/${pedido.idPedido}/estado`, { metodo: 'PATCH', cuerpo: { estado: 'CANCELADO' } });
    cerrarPanel();
    mostrarAviso($('aviso-cobro'), `${pedido.codigoPedido} cancelado.`, 'info');
    sondeo.ahora();
  } catch (error) {
    mostrarAviso($('aviso-cobro'), error.message);
    boton.disabled = false;
  }
}

function selectorDeMetodo() {
  return el(
    'fieldset',
    { class: 'metodos' },
    el('legend', {}, '¿Cómo pagó?'),
    METODOS_PAGO.map(([valor, etiqueta]) =>
      el('label', { class: 'metodo' }, el('input', { type: 'radio', name: 'metodo', value: valor }), el('span', {}, etiqueta)),
    ),
  );
}

function abrirCobro(pedido) {
  ocultarAviso($('aviso-cobro'));
  const panel = $('panel-cobro');

  if (pedido.estado !== 'PENDIENTE_PAGO') {
    mostrarAviso($('aviso-cobro'), `${pedido.codigoPedido} ya está ${ETIQUETAS_ESTADO[pedido.estado].toLowerCase()}.`, 'info');
    cerrarPanel();
    return;
  }

  const botonCobrar = el('button', { type: 'submit', class: 'boton boton--exito boton--ancho' }, `Cobrar ${soles(pedido.total)}`);
  const botonCancelar = el('button', { type: 'button', class: 'boton boton--peligro boton--ancho' }, 'Cancelar pedido');
  const formulario = el(
    'form',
    { class: 'tarjeta cobro', 'aria-labelledby': 'cobro-codigo', novalidate: true },
    el('h3', { id: 'cobro-codigo', class: 'codigo pedido__codigo', translate: 'no' }, pedido.codigoPedido),
    el('p', { class: 'pedido__mesa' }, `Mesa ${pedido.numeroMesa} · ${pedido.nombreAlias}`),
    listaDeLineas(pedido.lineas),
    el('p', { class: 'cobro__total' }, soles(pedido.total)),
    selectorDeMetodo(),
    el(
      'div',
      { class: 'cobro__acciones' },
      botonCobrar,
      botonCancelar,
      el('button', { type: 'button', class: 'boton boton--secundario boton--ancho', onclick: cerrarPanel }, 'Cerrar'),
    ),
  );
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    cobrar(pedido, formulario, botonCobrar);
  });
  botonCancelar.addEventListener('click', () => cancelar(pedido, botonCancelar));

  reemplazarContenido(panel, formulario);
  panel.hidden = false;
  formulario.querySelector('input[name="metodo"]').focus();
}

async function buscar(evento) {
  evento.preventDefault();
  const codigo = normalizarCodigo($('codigo').value);
  $('codigo').value = codigo;
  if (!codigo) return;
  try {
    abrirCobro(await pantalla.llamar(`/pedidos/codigo/${encodeURIComponent(codigo)}`));
  } catch (error) {
    cerrarPanel();
    mostrarAviso($('aviso-cobro'), error.status === 404 ? `No encontramos el pedido ${codigo}.` : error.message);
  }
}

async function cargarPendientes() {
  const { datos } = await pantalla.llamar('/pedidos?estado=PENDIENTE_PAGO');
  $('contador-pendientes').textContent = datos.length;
  repintarLista($('lista-pendientes'), firmaDeLista(datos), () =>
    datos.length === 0
      ? [el('p', { class: 'vacio' }, 'No hay pedidos por pagar.')]
      : datos.map((pedido) =>
          tarjetaPedido(pedido, {
            alertaMinutos: MINUTOS_PARA_CANCELAR,
            acciones: [
              el(
                'button',
                { type: 'button', class: 'boton', 'data-clave': `cobrar-${pedido.idPedido}`, onclick: () => abrirCobro(pedido) },
                'Cobrar',
              ),
            ],
          }),
        ),
  );
}

const sondeo = crearSondeo(cargarPendientes, { alCambiarConexion: (conectado) => pantalla?.marcarConexion(conectado) });

if (pantalla) {
  $('form-buscar').addEventListener('submit', buscar);
  sondeo.iniciar();
}
