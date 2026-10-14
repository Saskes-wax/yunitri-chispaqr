const CLAVE_PERSONAL = 'chispaqr.personal';
const PREFIJO_COMENSAL = 'chispaqr.comensal.';

function leerJson(almacen, clave) {
  try {
    const texto = almacen.getItem(clave);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function escribirJson(almacen, clave, valor) {
  try {
    almacen.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento (modo privado): la sesión dura solo mientras la página siga abierta.
  }
}

function borrar(almacen, clave) {
  try {
    almacen.removeItem(clave);
  } catch {
    // Nada que borrar si el almacenamiento no está disponible.
  }
}

function tokenVencido(token) {
  try {
    const carga = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !carga.exp || carga.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Personal: sessionStorage, se borra al cerrar la pestaña.
export function guardarSesionPersonal(sesion) {
  escribirJson(sessionStorage, CLAVE_PERSONAL, sesion);
}

export function leerSesionPersonal() {
  const sesion = leerJson(sessionStorage, CLAVE_PERSONAL);
  if (!sesion?.token || tokenVencido(sesion.token)) {
    borrar(sessionStorage, CLAVE_PERSONAL);
    return null;
  }
  return sesion;
}

export function cerrarSesionPersonal() {
  borrar(sessionStorage, CLAVE_PERSONAL);
}

// Comensal: localStorage por mesa, porque el navegador del celular suele descartar pestañas.
// El carrito y los pedidos se conservan aunque el token venza; solo se vuelve a pedir el nombre.
const DATOS_COMENSAL_VACIOS = Object.freeze({ token: null, nombre: '', codigos: [], carrito: {}, claveEnvio: null });

export function leerDatosComensal(codigoQr) {
  const guardado = leerJson(localStorage, PREFIJO_COMENSAL + codigoQr) ?? {};
  const datos = { ...structuredClone(DATOS_COMENSAL_VACIOS), ...guardado };
  if (datos.token && tokenVencido(datos.token)) datos.token = null;
  return datos;
}

export function guardarDatosComensal(codigoQr, datos) {
  escribirJson(localStorage, PREFIJO_COMENSAL + codigoQr, datos);
}
