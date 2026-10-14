import { llamarApi } from '/compartido/api.js';
import { mostrarAviso, ocultarAviso } from '/compartido/dom.js';
import { soles } from '/compartido/formato.js';
import { guardarDatosComensal, leerDatosComensal } from '/compartido/sesion.js';
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
const VISTAS = ['cargando', 'error', 'carta', 'carrito', 'pedidos'];

const codigoQr = decodeURIComponent(location.pathname.split('/')[2] ?? '');
const estado = {
  vista: 'cargando',
  mesa: null,
  datos: leerDatosComensal(codigoQr),
  productos: [],
  productosPorId: new Map(),
  pedidos: new Map(),
};

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
  guardarDatosComensal(codigoQr, estado.datos);
}

function totalDelCarrito() {
  return totalEstimadoCentimos(lineasDelCarrito(estado.datos.carrito, estado.productosPorId)) / 100;
}

function llamarComoComensal(ruta, opciones = {}) {
  return llamarApi(ruta, { ...opciones, token: estado.datos.token }).catch((error) => {
    if (error.status === 401) {
      estado.datos.token = null;
      guardar();
    }
    throw error;
  });
}

function actualizarBarraInferior() {
  const unidades = contarUnidades(estado.datos.carrito);
  const verCarrito = unidades > 0 && ['carta', 'pedidos'].includes(estado.vista);
  const verPedidos = estado.datos.codigos.length > 0 && estado.vista === 'carta';

  $('enlace-carrito').hidden = !verCarrito;
  $('enlace-pedidos').hidden = !verPedidos;
  $('barra-inferior').hidden = !verCarrito && !verPedidos;
  $('resumen-carrito').textContent = `${unidades} · ${soles(totalDelCarrito())}`;
}

function alCambiarCarrito(unidadesDelProducto) {
  guardar();
  actualizarBarraInferior();
  if ($('vista-carrito').hidden) return;

  if (unidadesDelProducto === 0) {
    pintarVistaCarrito();
    $('titulo-carrito').focus();
  } else {
    $('total-carrito').textContent = soles(totalDelCarrito());
  }
}

function pintarVistaCarta() {
  pintarCarta({
    contenedorCategorias: $('categorias'),
    contenedorProductos: $('lista-productos'),
    productos: estado.productos,
    carrito: estado.datos.carrito,
    alCambiar: alCambiarCarrito,
  });
}

function pintarVistaCarrito() {
  pintarCarrito({
    contenedorLineas: $('lineas-carrito'),
    contenedorTotal: $('total-carrito'),
    botonConfirmar: $('confirmar'),
    carrito: estado.datos.carrito,
    productosPorId: estado.productosPorId,
    alCambiar: alCambiarCarrito,
    alCambiarNota: guardar,
  });
  $('campo-nombre').hidden = Boolean(estado.datos.token);
  $('nombre').value = estado.datos.nombre;
}

async function cargarProductos() {
  const { datos } = await llamarApi('/productos?disponible=true');
  estado.productos = datos;
  estado.productosPorId = new Map(datos.map((producto) => [producto.idProducto, producto]));
  quitarNoDisponibles(estado.datos.carrito, estado.productosPorId);
  guardar();
}

async function consultarPedidosActivos() {
  if (!estado.datos.token) return;
  const pendientes = estado.datos.codigos.filter((codigo) => !estado.pedidos.has(codigo) || !estaTerminado(estado.pedidos.get(codigo)));
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

// RF-06: el nombre se pide solo al confirmar el primer pedido.
async function asegurarRegistro() {
  if (estado.datos.token) return;
  const nombre = $('nombre').value.trim();
  if (!nombre) {
    $('nombre').focus();
    throw new Error('Escribe tu nombre o un apodo para confirmar el pedido.');
  }
  const registro = await llamarApi(`/mesas/${encodeURIComponent(codigoQr)}/comensales`, {
    metodo: 'POST',
    cuerpo: { nombre },
  });
  Object.assign(estado.datos, { token: registro.token, nombre: registro.comensal.nombre });
  guardar();
  $('alias-comensal').textContent = estado.datos.nombre;
}

// RNF-02: la misma clave se reutiliza en cada reintento hasta que el pedido se confirma.
async function enviarPedido(lineas) {
  estado.datos.claveEnvio ??= crypto.randomUUID();
  guardar();
  return llamarComoComensal('/pedidos', {
    metodo: 'POST',
    cuerpo: { ...aCuerpoDePedido(lineas), claveEnvio: estado.datos.claveEnvio },
  });
}

async function confirmarPedido() {
  const boton = $('confirmar');
  const lineas = lineasDelCarrito(estado.datos.carrito, estado.productosPorId);
  if (lineas.length === 0) return;

  ocultarAviso($('aviso-carrito'));
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    await asegurarRegistro();
    const pedido = await enviarPedido(lineas);
    estado.pedidos.set(pedido.codigoPedido, pedido);
    if (!estado.datos.codigos.includes(pedido.codigoPedido)) estado.datos.codigos.push(pedido.codigoPedido);
    vaciar(estado.datos.carrito);
    estado.datos.claveEnvio = null;
    guardar();
    location.hash = '#pedidos';
  } catch (error) {
    if (error.codigo === 'PRODUCTO_AGOTADO') {
      await cargarProductos().catch(() => {});
      pintarVistaCarrito();
    }
    const mensaje = error.status === 401 ? 'Tu sesión venció. Escribe tu nombre y vuelve a confirmar.' : error.message;
    mostrarAviso($('aviso-carrito'), mensaje);
    pintarVistaCarrito();
  } finally {
    boton.textContent = 'Confirmar pedido';
    boton.disabled = lineasDelCarrito(estado.datos.carrito, estado.productosPorId).length === 0;
    actualizarBarraInferior();
  }
}

function describirMesa(mesa) {
  return mesa.zona ? `Mesa ${mesa.numero} · ${mesa.zona}` : `Mesa ${mesa.numero}`;
}

async function iniciar() {
  mostrarVista('cargando');
  if (!codigoQr) {
    mostrarError('Este enlace no tiene el código de una mesa. Escanea el QR que está en tu mesa.');
    return;
  }

  try {
    estado.mesa = await llamarApi(`/mesas/${encodeURIComponent(codigoQr)}`);
    if (!estado.mesa.activa) {
      mostrarError('Esta mesa no está atendiendo en este momento. Pide ayuda al mozo.');
      return;
    }
    $('numero-mesa').textContent = describirMesa(estado.mesa);
    $('alias-comensal').textContent = estado.datos.token ? estado.datos.nombre : '';
    document.title = `Mesa ${estado.mesa.numero} · Recreo Chispa`;

    await cargarProductos();
    enrutar();
  } catch (error) {
    mostrarError(error.status === 404 ? 'Este QR ya no es válido. Pide ayuda al mozo para que te dé el de tu mesa.' : error.message);
  }
}

$('confirmar').addEventListener('click', confirmarPedido);
$('nombre').addEventListener('input', (evento) => {
  estado.datos.nombre = evento.target.value;
  guardar();
});
$('reintentar').addEventListener('click', iniciar);
window.addEventListener('hashchange', enrutar);

iniciar();
