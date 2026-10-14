// Crea nodos con textContent: los datos del usuario nunca se interpretan como HTML.
export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nombre === 'class') nodo.className = valor;
    else if (nombre.startsWith('on')) nodo.addEventListener(nombre.slice(2), valor);
    else nodo.setAttribute(nombre, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : String(hijo));
  }
  return nodo;
}

const SVG = 'http://www.w3.org/2000/svg';
const TRAZOS_ICONO = Object.freeze({
  mas: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
});

export function icono(nombre) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icono');
  svg.setAttribute('aria-hidden', 'true');
  const trazo = document.createElementNS(SVG, 'path');
  trazo.setAttribute('d', TRAZOS_ICONO[nombre]);
  svg.append(trazo);
  return svg;
}

export function reemplazarContenido(contenedor, ...hijos) {
  contenedor.replaceChildren(...hijos.flat().filter(Boolean));
}

// Para listas que se refrescan solas: no repinta si nada cambió y devuelve el foco al mismo control.
export function repintarLista(contenedor, firma, crearHijos) {
  if (contenedor.dataset.firma === firma) return;
  const claveEnfocada = contenedor.contains(document.activeElement) ? document.activeElement.dataset.clave : null;
  reemplazarContenido(contenedor, crearHijos());
  contenedor.dataset.firma = firma;
  if (claveEnfocada) contenedor.querySelector(`[data-clave="${claveEnfocada}"]`)?.focus();
}

export function firmaDeLista(datos) {
  const minutoActual = Math.floor(Date.now() / 60_000);
  return `${minutoActual}|${JSON.stringify(datos)}`;
}

export function mostrarAviso(contenedor, mensaje, tipo = 'error') {
  reemplazarContenido(contenedor, el('p', { class: `aviso aviso--${tipo}`, role: tipo === 'error' ? 'alert' : 'status' }, mensaje));
  contenedor.hidden = false;
}

export function ocultarAviso(contenedor) {
  contenedor.hidden = true;
  contenedor.replaceChildren();
}
