const FORMATO_SOLES = /^\d+(\.\d{1,2})?$/;

export function aCentimos(monto) {
  const texto = String(monto);
  if (!FORMATO_SOLES.test(texto)) {
    throw new TypeError(`Monto inválido: ${texto}`);
  }
  const [enteros, decimales = ''] = texto.split('.');
  return Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
}

export function aSoles(centimos) {
  if (!Number.isSafeInteger(centimos) || centimos < 0) {
    throw new TypeError(`Céntimos inválidos: ${centimos}`);
  }
  const enteros = Math.floor(centimos / 100);
  const decimales = String(centimos % 100).padStart(2, '0');
  return `${enteros}.${decimales}`;
}

export function esMontoValido(monto) {
  return FORMATO_SOLES.test(String(monto));
}
