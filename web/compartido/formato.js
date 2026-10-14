const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const HORA = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

export const ETIQUETAS_ESTADO = Object.freeze({
  PENDIENTE_PAGO: 'Por pagar',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
});

export function soles(monto) {
  return SOLES.format(Number(monto));
}

export function hora(fecha) {
  return HORA.format(new Date(fecha));
}

export function minutosDesde(fecha, ahora = Date.now()) {
  return Math.max(0, Math.floor((ahora - new Date(fecha).getTime()) / 60_000));
}

export function textoEspera(minutos) {
  if (minutos < 1) return 'recién';
  return minutos === 1 ? 'hace 1 min' : `hace ${minutos} min`;
}
