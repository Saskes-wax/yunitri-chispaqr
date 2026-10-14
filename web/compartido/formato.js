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

const MINUTOS_POR_HORA = 60;
const MINUTOS_POR_DIA = 1440;

export function textoEspera(minutos) {
  if (minutos < 1) return 'recién';
  if (minutos < MINUTOS_POR_HORA) return `hace ${minutos} min`;
  if (minutos < MINUTOS_POR_DIA) return `hace ${Math.floor(minutos / MINUTOS_POR_HORA)} h`;
  const dias = Math.floor(minutos / MINUTOS_POR_DIA);
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}
