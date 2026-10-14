import { el, firmaDeLista, repintarLista } from '/compartido/dom.js';
import { ETIQUETAS_ESTADO, soles } from '/compartido/formato.js';

const PASOS = ['PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
const ESTADOS_FINALES = ['ENTREGADO', 'CANCELADO'];

const INDICACIONES = Object.freeze({
  PENDIENTE_PAGO: (pedido) => `Acércate a caja con este código y paga ${soles(pedido.total)}.`,
  PAGADO: () => 'Pago recibido. Tu pedido está en la cola de cocina.',
  EN_PREPARACION: () => 'Cocina está preparando tu pedido.',
  LISTO: () => '¡Listo! El mozo lo lleva a tu mesa.',
  ENTREGADO: () => 'Entregado. ¡Buen provecho!',
  CANCELADO: () => 'Este pedido se canceló. Si crees que es un error, consulta en caja.',
});

export function estaTerminado(pedido) {
  return ESTADOS_FINALES.includes(pedido.estado);
}

function pasosDelPedido(estado) {
  const actual = PASOS.indexOf(estado);
  return el(
    'ol',
    { class: 'pasos', 'aria-label': 'Avance del pedido' },
    PASOS.map((paso, indice) =>
      el(
        'li',
        { 'data-hecho': indice <= actual, 'aria-current': indice === actual && 'step' },
        ETIQUETAS_ESTADO[paso],
      ),
    ),
  );
}

function ticket(pedido) {
  return el(
    'article',
    { class: 'tarjeta ticket', 'aria-labelledby': `codigo-${pedido.codigoPedido}` },
    el(
      'div',
      { class: 'ticket__cabecera' },
      el('h2', { id: `codigo-${pedido.codigoPedido}`, class: 'codigo ticket__codigo', translate: 'no' }, pedido.codigoPedido),
      el('span', { class: `estado estado--${pedido.estado}` }, ETIQUETAS_ESTADO[pedido.estado]),
    ),
    el('p', { class: 'ticket__indicacion', 'aria-live': 'polite' }, INDICACIONES[pedido.estado](pedido)),
    pedido.estado !== 'CANCELADO' && pasosDelPedido(pedido.estado),
    el(
      'ul',
      { class: 'lineas' },
      pedido.lineas.map((linea) =>
        el('li', {}, `${linea.cantidad} × ${linea.nombre}`, linea.nota && el('span', { class: 'nota' }, linea.nota)),
      ),
    ),
    el('p', { class: 'ticket__total' }, 'Total ', el('strong', {}, soles(pedido.total))),
  );
}

export function pintarPedidos(contenedor, pedidos) {
  const masRecientePrimero = [...pedidos].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  repintarLista(contenedor, firmaDeLista(masRecientePrimero), () =>
    masRecientePrimero.length === 0
      ? [el('p', { class: 'vacio' }, 'Aún no hiciste pedidos desde esta mesa.')]
      : masRecientePrimero.map(ticket),
  );
}
