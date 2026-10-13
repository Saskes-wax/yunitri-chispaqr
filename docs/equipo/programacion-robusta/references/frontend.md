# Frontend (`web/`)

Vale para HTML/CSS/JS sin framework o React + Vite (lo que haya elegido el equipo; no mezclar).

## Estructura
```
web/
├── comensal/   caja/   cocina/   mozo/   admin/   ← una carpeta por pantalla/rol
├── compartido/
│   ├── api.js          ← ÚNICO lugar que hace fetch
│   ├── sesion.js       ← guardar/leer token
│   ├── formato.js      ← dinero (S/ 12.50), fechas dd/mm/aaaa
│   └── estilos.css     ← variables de diseño (colores, tamaños)
└── nginx.conf
```

## Cliente de API único
```js
// compartido/api.js
export async function llamarApi(ruta, { metodo = 'GET', cuerpo, token, senal } = {}) {
  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 10_000);
  try {
    const resp = await fetch(`/api/v1${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: senal ?? controlador.signal,
    });
    const datos = resp.status === 204 ? null : await resp.json().catch(() => null);
    if (!resp.ok) throw new ErrorApi(resp.status, datos?.error);
    return datos;
  } finally {
    clearTimeout(limite);
  }
}
```
- 401 → borrar sesión y volver al login. 403 → "No tienes permiso". 409 → mostrar el mensaje del servidor. Error de red/timeout → "Sin conexión, reintentando…".
- Ninguna pantalla llama a `fetch` directamente.

## Seguridad en el navegador
- **Nunca** `innerHTML`/`insertAdjacentHTML` con datos (alias del comensal, notas, nombres de productos) → `textContent` o crear nodos. En React, prohibido `dangerouslySetInnerHTML`.
- Token del personal en `sessionStorage` (se borra al cerrar la pestaña) o en memoria; nunca en la URL.
- Token del comensal en `sessionStorage` por mesa; el `token_qr` solo en la URL de entrada `/m/{token_qr}`.
- Nada de secretos ni lógica de autorización "real" en el frontend: ocultar un botón no es seguridad, el servidor decide.

## Estados de cada pantalla (todos obligatorios)
Cargando · Vacío ("No hay pedidos pendientes") · Error con acción ("Reintentar") · Éxito. Botones de acción se **deshabilitan mientras se envía** (evita doble pedido/doble pago).

## Polling (estado del pedido, caja, cocina)
- Cada 5 s; se pausa con `document.hidden` y se reanuda con `visibilitychange`.
- Ante error, espera creciente (5 → 10 → 20 → máx 60 s) y vuelve a 5 s al recuperar.
- Nunca dos peticiones de polling en paralelo (esperar a que termine la anterior).

## Celular primero y accesible
- Diseño desde 360 px de ancho; botones ≥ 44×44 px; texto base ≥ 16 px; contraste AA.
- Páginas livianas (4G débil): sin librerías pesadas, imágenes comprimidas con `loading="lazy"` y tamaño fijo.
- HTML semántico (`button`, `label`, `main`, `h1`), `lang="es"`, mensajes en español sencillo.
- Cocina: letra grande, legible a distancia, orden por llegada.

## Dinero y formato
Mostrar con `new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })`. El total que se muestra es **el que devuelve el servidor**, no uno recalculado en el navegador.
