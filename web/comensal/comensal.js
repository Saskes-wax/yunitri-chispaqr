import { llamarApi } from '/compartido/api.js';
import { mostrarAviso, ocultarAviso } from '/compartido/dom.js';
import { soles } from '/compartido/formato.js';
import { borrarSesionComensal, guardarSesionComensal, leerSesionComensal } from '/compartido/sesion.js';
import { crearSondeo } from '/compartido/sondeo.js';
import {
  aCuerpoDePedido,
  contarUnidades,
  lineasDelCarrito,
  quitarNoDisponibles,
  totalEstimadoCentimos,
  vaciar,
} from './carrito.js';
import { pintarCarrito, pintarCarta } from './vista-carta.js';
import { estaTerminado, pintarPedidos } from './vista-pedidos.js';

const $ = (id) => document.getElementById(id);
const VISTAS = ['cargando', 'error', 'registro', 'carta', 'carrito', 'pedidos'];

const tokenQr = decodeURIComponent(location.pathname.split('/')[2] ?? '');
const estado = { vista: 'cargando', mesa: null, sesion: null, productos: [], productosPorId: new Map(), pedidos: new Map() };

function mostrarVista(nombre) {
  estado.vista = nombre;
  for (const vista of VISTAS) $(`vista-${vista}`).hidden = vista !== nombre;
  actualizarBarraInferior();
  $(`titulo-${nombre}`)?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function mostrarError(mensaje) {
  $('mensaje-error').textContent = mensaje;
  mostrarVista('error');
}

function guardar() {
  guardarSesionComensal(tokenQr, estado.sesion);
}

function llamarComoComensal(ruta, opciones = {}) {
  return llamarApi(ruta, { ...opciones, token: estado.sesion.token }).catch((error) => {
    if (error.status === 401) {
      borrarSesionComensal(tokenQr);
      estado.sesion = null;
      pedirNombre('Tu sesión venció. Escribe tu nombre otra vez para seguir pidiendo.');
    }
    throw error;
  });
}

function actualizarBarraInferior() {
  if (!estado.sesion) {
    $('barra-inferior').hidden = true;
    return;
  }
  const carrito = estado.sesion.carrito;
  const unidades = contarUnidades(carrito);
  const verCarrito = unidades > 0 && estado.vista !== 'carrito' && estado.vista !== 'registro';
  const verPedidos = estado.sesion.codigos.length > 0 && estado.vista === 'carta';

  $('enlace-carrito').hidden = !verCarrito;
  $('enlace-pedidos').hidden = !verPedidos;
  $('barra-inferior').hidden = !verCarrito && !verPedidos;
  const total = totalEstimadoCentimos(lineasDelCarrito(carrito, estado.productosPorId)) / 100;
  $('resumen-carrito').textContent = `${unidades} · ${soles(total)}`;
}

function alCambiarCarrito(unidadesDelProducto) {
  guardar();
  actualizarBarraInferior();
  if ($('vista-carrito').hidden) return;

  if (unidadesDelProducto === 0) {
    pintarVistaCarrito();
    $('titulo-carrito').focus();
  } else {
    $('total-carrito').textContent = soles(totalEstimadoCentimos(lineasDelCarrito(estado.sesion.carrito, estado.productosPorId)) / 100);
  }
}

function pintarVistaCarta() {
  pintarCarta({
    contenedorCategorias: $('categorias'),
    contenedorProductos: $('lista-productos'),
    productos: estado.productos,
    carrito: estado.sesion.carrito,
    alCambiar: alCambiarCarrito,
  });
}

function pintarVistaCarrito() {
  pintarCarrito({
    contenedorLineas: $('lineas-carrito'),
    contenedorTotal: $('total-carrito'),
    botonConfirmar: $('confirmar'),
    carrito: estado.sesion.carrito,
    productosPorId: estado.productosPorId,
    alCambiar: alCambiarCarrito,
    alCambiarNota: guardar,
  });
}

async function cargarProductos() {
  const { datos } = await llamarApi('/productos?disponible=true');
  estado.productos = datos;
  estado.productosPorId = new Map(datos.map((producto) => [producto.idProducto, producto]));
  quitarNoDisponibles(estado.sesion.carrito, estado.productosPorId);
  guardar();
}

async function consultarPedidosActivos() {
  const pendientes = estado.sesion.codigos.filter((codigo) => !estado.pedidos.has(codigo) || !estaTerminado(estado.pedidos.get(codigo)));
  const resultados = await Promise.all(pendientes.map((codigo) => llamarComoComensal(`/pedidos/codigo/${codigo}`)));
  for (const pedido of resultados) estado.pedidos.set(pedido.codigoPedido, pedido);
  pintarPedidos($('lista-pedidos'), [...estado.pedidos.values()]);
}

const sondeoPedidos = crearSondeo(consultarPedidosActivos, {
  alCambiarConexion(conectado) {
    $('conexion-pedidos').textContent = conectado ? '' : 'Sin conexión, reintentando…';
  },
});

function enrutar() {
  if (!estado.sesion) return;
  const destino = location.hash.slice(1);
  sondeoPedidos.detener();

  if (destino === 'carrito') {
    pintarVistaCarrito();
    mostrarVista('carrito');
  } else if (destino === 'pedidos') {
    pintarPedidos($('lista-pedidos'), [...estado.pedidos.values()]);
    mostrarVista('pedidos');
    sondeoPedidos.iniciar();
  } else {
    pintarVistaCarta();
    mostrarVista('carta');
  }
}

async function confirmarPedido() {
  const boton = $('confirmar');
  const lineas = lineasDelCarrito(estado.sesion.carrito, estado.productosPorId);
  if (lineas.length === 0) return;

  ocultarAviso($('aviso-carrito'));
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    const pedido = await llamarComoComensal('/pedidos', { metodo: 'POST', cuerpo: aCuerpoDePedido(lineas) });
    estado.pedidos.set(pedido.codigoPedido, pedido);
    estado.sesion.codigos.push(pedido.codigoPedido);
    vaciar(estado.sesion.carrito);
    guardar();
    actualizarBarraInferior();
    location.hash = '#pedidos';
  } catch (error) {
    if (error.codigo === 'PRODUCTO_AGOTADO') {
      await cargarProductos().catch(() => {});
      pintarVistaCarrito();
      actualizarBarraInferior();
    }
    if (error.status !== 401) mostrarAviso($('aviso-carrito'), error.message);
  } finally {
    boton.textContent = 'Confirmar pedido';
    boton.disabled = lineasDelCarrito(estado.sesion?.carrito ?? {}, estado.productosPorId).length === 0;
  }
}

async function entrarALaCarta() {
  $('alias-comensal').textContent = estado.sesion.nombreAlias;
  await cargarProductos();
  actualizarBarraInferior();
  enrutar();
}

function pedirNombre(mensaje) {
  $('alias-comensal').textContent = '';
  mostrarVista('registro');
  if (mensaje) mostrarAviso($('aviso-registro'), mensaje, 'info');
}

async function registrar(evento) {
  evento.preventDefault();
  const formulario = evento.target;
  const nombreAlias = formulario.nombreAlias.value.trim();
  if (!nombreAlias) {
    mostrarAviso($('aviso-registro'), 'Escribe tu nombre o un apodo para continuar.');
    formulario.nombreAlias.focus();
    return;
  }

  const boton = $('boton-registro');
  boton.disabled = true;
  try {
    const registro = await llamarApi(`/mesas/${encodeURIComponent(tokenQr)}/comensales`, {
      metodo: 'POST',
      cuerpo: { nombreAlias },
    });
    estado.sesion = { token: registro.token, nombreAlias: registro.comensal.nombreAlias, codigos: [], carrito: {} };
    guardar();
    ocultarAviso($('aviso-registro'));
    history.replaceState(null, '', '#carta');
    await entrarALaCarta();
  } catch (error) {
    mostrarAviso($('aviso-registro'), error.message);
  } finally {
    boton.disabled = false;
  }
}

async function iniciar() {
  mostrarVista('cargando');
  if (!tokenQr) {
    mostrarError('Este enlace no tiene el código de una mesa. Escanea el QR que está en tu mesa.');
    return;
  }

  try {
    estado.mesa = await llamarApi(`/mesas/${encodeURIComponent(tokenQr)}`);
    $('numero-mesa').textContent = `Mesa ${estado.mesa.numero}`;
    document.title = `Mesa ${estado.mesa.numero} · Recreo Chispa`;

    estado.sesion = leerSesionComensal(tokenQr);
    if (estado.sesion) {
      await entrarALaCarta();
    } else {
      pedirNombre();
    }
  } catch (error) {
    if (error.status === 404) {
      mostrarError('Este QR ya no es válido. Pide ayuda al mozo para que te dé el de tu mesa.');
    } else {
      mostrarError(error.message);
    }
  }
}

$('form-registro').addEventListener('submit', registrar);
$('confirmar').addEventListener('click', confirmarPedido);
$('reintentar').addEventListener('click', iniciar);
window.addEventListener('hashchange', enrutar);

iniciar();
