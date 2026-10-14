import { llamarApi } from '/compartido/api.js';
import { mostrarAviso, ocultarAviso } from '/compartido/dom.js';
import { rutaInicialPorRol } from '/compartido/personal.js';
import { guardarSesionPersonal, leerSesionPersonal } from '/compartido/sesion.js';

const formulario = document.getElementById('formulario');
const aviso = document.getElementById('aviso');
const botonEntrar = document.getElementById('entrar');

const sesionActiva = leerSesionPersonal();
if (sesionActiva) {
  location.replace(rutaInicialPorRol(sesionActiva.usuario.rol));
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  ocultarAviso(aviso);

  const username = formulario.username.value.trim();
  const contrasena = formulario.contrasena.value;
  if (!username || !contrasena) {
    mostrarAviso(aviso, 'Escribe tu usuario y tu contraseña.');
    (username ? formulario.contrasena : formulario.username).focus();
    return;
  }

  botonEntrar.disabled = true;
  botonEntrar.textContent = 'Entrando…';
  try {
    const sesion = await llamarApi('/auth/login', { metodo: 'POST', cuerpo: { username, contrasena } });
    guardarSesionPersonal(sesion);
    location.replace(rutaInicialPorRol(sesion.usuario.rol));
  } catch (error) {
    mostrarAviso(aviso, error.message);
    formulario.contrasena.select();
    botonEntrar.disabled = false;
    botonEntrar.textContent = 'Entrar';
  }
});
