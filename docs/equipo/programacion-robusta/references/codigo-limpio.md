# Código limpio — estilo y principios

## Principios (en orden de prioridad)
1. **Correcto** → 2. **Claro** → 3. **Fácil de cambiar** → 4. **Eficiente**. No se sacrifica uno superior por uno inferior sin medirlo.
2. **KISS**: la solución más simple que cumple todo lo pedido.
3. **YAGNI**: no construyas lo que nadie pidió. Deja el código *preparado para cambiar* (bien separado), no *preparado para todo*.
4. **DRY con criterio**: duplicar dos veces está bien; a la tercera, extrae. Nunca unifiques cosas que se parecen por casualidad pero cambian por razones distintas.
5. **SOLID pragmático**: una razón para cambiar por función/módulo (S); extender agregando, no editando un `switch` gigante (O); depender de interfaces simples inyectadas (D).
6. **Fallar rápido y ruidosamente**: validar al inicio, cláusulas de guarda, `return` temprano en vez de `if` anidados.

## Nombres
- Idioma: el del proyecto. En ChispaQR, **español sin tildes** para el dominio (`pedido`, `comensal`, `registrarPago`), igual que el contrato.
- Funciones = verbo + objeto (`obtenerPedidoPorCodigo`, `cambiarEstadoPedido`). Booleanos = `es/tiene/puede` (`estaDisponible`, `puedeCancelar`).
- Constantes de módulo en `MAYUSCULAS_CON_GUION` (`MINUTOS_PARA_CANCELAR = 20`).
- Archivos `kebab-case` o `modulo.capa.js`; uno por responsabilidad.
- Sin abreviaturas crípticas (`ped`, `tmp2`, `data`), salvo convenciones universales (`id`, `req`, `res`).

## Funciones
- Hacen una sola cosa; si necesitas "y" para describirla, divídela.
- Entradas explícitas, salidas explícitas; evita mutar argumentos (devuelve objetos nuevos).
- Efectos secundarios (BD, red, tiempo, aleatorio) en los bordes; la lógica pura en el centro → fácil de probar.
- Inyecta el reloj cuando la regla dependa del tiempo (`ahora = () => new Date()`) para poder probar "pasaron 20 minutos".

```js
// ✅ guardas tempranas, sin anidación
export function validarTransicion(estadoActual, estadoNuevo) {
  const permitidos = TRANSICIONES_PEDIDO[estadoActual] ?? [];
  if (!permitidos.includes(estadoNuevo)) {
    throw new Conflicto('TRANSICION_NO_PERMITIDA', `No se puede pasar de ${estadoActual} a ${estadoNuevo}`);
  }
}
```

## Datos e inmutabilidad
- `const` por defecto; `let` solo si se reasigna; nunca `var`.
- Constantes de dominio congeladas: `Object.freeze({ ... })`.
- Comparación estricta `===`; nada de coerciones implícitas.
- `null`/`undefined`: decide uno por contrato de función y documenta; usa `??` y `?.` en vez de `||` cuando 0 o `''` son válidos.

## Comentarios
- El código dice *qué*; el comentario dice **por qué** (decisión, regla de negocio, referencia a RF/ADR): `// RF-07: cocina solo ve pagados`.
- Nada de comentarios que repiten el código, código comentado ni `TODO` sin dueño. Un TODO lleva motivo y referencia.

## Asincronía
- `async/await` siempre; nunca mezclar con `.then()` en la misma función.
- No dejar promesas sueltas (todo `await`ado o devuelto). Paralelo con `Promise.all` solo si son independientes.
- Tiempos de espera (timeouts) en toda llamada de red externa.

## Módulos JS
- ESM (`"type": "module"`), imports explícitos con extensión `.js`.
- Exportaciones con nombre (no `default`) para que los renombres sean rastreables.

## Herramientas de calidad (configurar desde el inicio)
- **ESLint** (config recomendada + `no-unused-vars`, `eqeqeq`, `no-floating-promises` si hay TS) y **Prettier**; ambos en `npm run lint` / `npm run format`.
- `.editorconfig` con LF y UTF-8 (equipo en Windows: añadir `.gitattributes` con `* text=auto eol=lf`).
- Scripts estándar en `package.json`: `dev`, `start`, `test`, `lint`, `format`.
- Fijar versión de Node en `package.json` (`"engines"`) y en `.nvmrc`; usar `npm ci` con `package-lock.json` versionado.

## Refactorizar con seguridad
1. Pruebas que cubren el comportamiento actual (si no hay, escríbelas primero).
2. Cambios pequeños, uno a la vez, pruebas en verde después de cada uno.
3. Refactor y cambio de comportamiento **nunca** en el mismo commit.
