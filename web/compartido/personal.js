import { llamarApi } from './api.js';
import { el } from './dom.js';
import { cerrarSesionPersonal, leerSesionPersonal } from './sesion.js';

const RUTA_LOGIN = '/personal/';

const PANTALLAS = Object.freeze([
  { ruta: '/caja/', titulo: 'Caja', roles: ['CAJERO', 'ADMINISTRADOR'] },
  { ruta: '/cocina/', titulo: 'Cocina', roles: ['COCINA', 'ADMINISTRADOR'] },
  { ruta: '/mozo/', titulo: 'Mozo', roles: ['MOZO', 'ADMINISTRADOR'] },
]);

export function rutaInicialPorRol(rol) {
  return PANTALLAS.find((pantalla) => pantalla.roles.includes(rol))?.ruta ?? RUTA_LOGIN;
}

function salir() {
  cerrarSesionPersonal();
  location.replace(RUTA_LOGIN);
}

function crearBarra(pantallaActual, usuario) {
  const accesibles = PANTALLAS.filter((pantalla) => pantalla.roles.includes(usuario.rol));
  const indicador = el('span', { class: 'conexion', role: 'status' }, 'Conectado');

  const barra = el(
    'header',
    { class: 'barra-personal' },
    el('h1', { class: 'barra-personal__titulo' }, el('span', { class: 'marca', translate: 'no' }, 'Chispa'), ` · ${pantallaActual.titulo}`),
    accesibles.length > 1 &&
      el(
        'nav',
        { 'aria-label': 'Pantallas' },
        accesibles.map((pantalla) =>
          el('a', { href: pantalla.ruta, 'aria-current': pantalla.ruta === pantallaActual.ruta && 'page' }, pantalla.titulo),
        ),
      ),
    indicador,
    el('span', { class: 'barra-personal__usuario' }, usuario.nombre),
    el('button', { type: 'button', class: 'boton boton--secundario', onclick: salir }, 'Salir'),
  );

  function marcarConexion(conectado) {
    indicador.textContent = conectado ? 'Conectado' : 'Sin conexión, reintentando…';
    indicador.classList.toggle('conexion--caida', !conectado);
  }

  return { barra, marcarConexion };
}

// Si falta sesión o el rol no corresponde, redirige y devuelve null.
export function iniciarPantallaPersonal(rutaPantalla) {
  const sesion = leerSesionPersonal();
  if (!sesion) {
    location.replace(RUTA_LOGIN);
    return null;
  }

  const pantalla = PANTALLAS.find((item) => item.ruta === rutaPantalla);
  if (!pantalla.roles.includes(sesion.usuario.rol)) {
    location.replace(rutaInicialPorRol(sesion.usuario.rol));
    return null;
  }

  const { barra, marcarConexion } = crearBarra(pantalla, sesion.usuario);
  document.querySelector('main').before(barra);

  async function llamar(ruta, opciones = {}) {
    try {
      return await llamarApi(ruta, { ...opciones, token: sesion.token });
    } catch (error) {
      if (error.status === 401) salir();
      throw error;
    }
  }

  return { usuario: sesion.usuario, llamar, marcarConexion };
}
