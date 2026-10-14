const FORMATO_SOLES = /^\d+(\.\d{1,2})?$/;

export function esMontoValido(monto) {
  return FORMATO_SOLES.test(String(monto));
}
