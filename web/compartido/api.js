const PREFIJO = '/api/v1';
const TIEMPO_MAXIMO_MS = 10_000;

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }

  get esSinConexion() {
    return this.status === 0;
  }
}

async function leerJson(respuesta) {
  if (respuesta.status === 204) return null;
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

export async function llamarApi(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  const cabeceras = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${PREFIJO}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', 'Sin conexión. Revisa tu internet e intenta de nuevo.');
  } finally {
    clearTimeout(limite);
  }

  const datos = await leerJson(respuesta);
  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      datos?.error?.codigo ?? 'ERROR',
      datos?.error?.mensaje ?? 'Ocurrió un problema. Intenta de nuevo.',
    );
  }
  return datos;
}
