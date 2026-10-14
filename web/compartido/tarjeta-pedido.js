import { el } from './dom.js';
import { minutosDesde, soles, textoEspera } from './formato.js';

export function describirMesa({ numeroMesa, zona }) {
  return zona ? `Mesa ${numeroMesa} · ${zona}` : `Mesa ${numeroMesa}`;
}

export function listaDeLineas(lineas) {
  return el(
    'ul',
    { class: 'lineas' },
    lineas.map((linea) =>
      el(
        'li',
        {},
        el('strong', {}, `${linea.cantidad} ×`),
        ` ${linea.nombre}`,
        linea.disponible === false && el('span', { class: 'agotado' }, ' · agotado'),
        linea.nota && el('span', { class: 'nota' }, linea.nota),
      ),
    ),
  );
}

export function tarjetaPedido(pedido, { desde = pedido.fechaCreacion, alertaMinutos, mostrarTotal = true, acciones = [] } = {}) {
  const minutos = minutosDesde(desde);
  const enAlerta = alertaMinutos !== undefined && minutos >= alertaMinutos;

  return el(
    'article',
    { class: `tarjeta pedido${enAlerta ? ' pedido--alerta' : ''}`, 'aria-labelledby': `pedido-${pedido.idPedido}` },
    el(
      'header',
      { class: 'pedido__cabecera' },
      el('h2', { id: `pedido-${pedido.idPedido}`, class: 'codigo pedido__codigo', translate: 'no' }, pedido.codigoPedido),
      el('span', { class: 'pedido__espera' }, textoEspera(minutos)),
    ),
    el('p', { class: 'pedido__mesa' }, describirMesa(pedido), ` · ${pedido.nombreComensal}`),
    listaDeLineas(pedido.lineas),
    mostrarTotal && el('p', { class: 'pedido__total' }, 'Total ', el('strong', {}, soles(pedido.total))),
    acciones.length > 0 && el('div', { class: 'pedido__acciones' }, acciones),
  );
}
