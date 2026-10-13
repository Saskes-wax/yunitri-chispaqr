---
name: programacion-robusta
description: Reglamento obligatorio para escribir, modificar, revisar o depurar código de forma sólida, segura, escalable y fácil de mantener. Úsala SIEMPRE que se vaya a programar (backend, frontend, SQL, Docker, scripts, pruebas), aunque el usuario no lo pida, y en especial en el proyecto ChispaQR (pedidos por QR, Node/Express + PostgreSQL + Docker Compose) del vault "Sistemas de Informacion - Pedidos QR".
---

# Programación robusta — reglamento obligatorio

Este reglamento **no es opcional**. Se aplica a todo código que escribas o toques, aunque el usuario no lo pida y aunque la tarea parezca pequeña. Su objetivo: que el código funcione hoy, se pueda **cambiar mañana sin miedo** y no genere problemas innecesarios.

Si una regla choca con lo que el usuario pide explícitamente, **díselo** (qué regla, qué riesgo) y deja que decida; no la rompas en silencio.

## Paso 0 — Contexto antes que código (nunca te lo saltes)

1. **Lee las fuentes de verdad del proyecto** antes de escribir una línea:
   - En ChispaQR: lee [references/chispaqr.md](references/chispaqr.md) y, si hay dudas, el contrato: en el repo `docs/equipo/CONTRATO.md` (y en el vault de Obsidian `01-Reglas/Contrato del equipo (fuente única de verdad).md`; si difieren, avisa). **El contrato manda** sobre nombres de tablas, estados, roles, rutas y tecnologías.
   - En cualquier repo: `README`, `CLAUDE.md`, `package.json`, estructura de carpetas, código vecino y pruebas existentes.
2. **Imita el código vecino** (nombres, estilo, idioma, patrones). La consistencia vale más que tu preferencia.
3. **Entiende el requerimiento**: ¿qué RF/regla de negocio cubre? ¿qué entra y qué sale? ¿qué casos borde hay? Si algo es ambiguo y cambia el diseño, pregunta; si no, elige lo convencional y dilo.
4. **Busca antes de crear**: si ya existe una función, helper, error o validador que sirve, reutilízalo.

## Paso 1 — Diseña en pequeño antes de escribir

Antes de implementar algo no trivial, decide (mentalmente o en 3–6 líneas para el usuario):
- **Dónde va** cada pieza según la arquitectura por capas → [references/arquitectura.md](references/arquitectura.md).
- **Qué datos entran** y cómo se validan → [references/errores-validacion-logs.md](references/errores-validacion-logs.md).
- **Qué puede fallar** y qué error/código HTTP devuelve cada fallo.
- **Qué se prueba** para demostrar que funciona → [references/pruebas.md](references/pruebas.md).
- **Qué riesgos de seguridad** toca (auth, permisos, datos del usuario) → [references/seguridad.md](references/seguridad.md).

## Paso 2 — Las 20 reglas no negociables

**Estructura**
1. **Capas con una sola dirección**: `rutas → controlador → servicio → repositorio → BD`. La lógica de negocio vive solo en servicios; el SQL solo en repositorios; HTTP solo en rutas/controladores.
2. **Un módulo = una carpeta** con todo lo suyo (rutas, controlador, servicio, repositorio, validaciones, pruebas). Un módulo no importa el repositorio de otro: usa su servicio.
3. **Funciones pequeñas con una sola responsabilidad** (orientativo: ≤ 40 líneas, ≤ 3 niveles de anidación, ≤ 4 parámetros; si hay más, un objeto con nombre).
4. **Nada de valores mágicos**: estados, roles, límites, tiempos y mensajes van en constantes con nombre en un único lugar (`src/shared/constantes.js` o el módulo dueño).
5. **Configuración por variables de entorno**, validadas al arrancar; si falta una, la app **no arranca** y dice cuál falta.

**Corrección**
6. **Valida toda entrada externa** (body, params, query, headers, archivos, variables de entorno) con un esquema en el borde. Rechaza lo desconocido.
7. **Nunca confíes en el cliente** para precios, totales, roles, estados ni IDs ajenos: se recalculan o verifican en el servidor.
8. **Las reglas críticas se protegen en dos capas**: el servicio valida (mensaje claro) y la BD lo garantiza (constraint/trigger). Ver [references/base-de-datos.md](references/base-de-datos.md).
9. **Operaciones de varios pasos = una transacción**. Si un paso falla, no queda nada a medias.
10. **Piensa en concurrencia**: dos cajeros, dos clics, dos pestañas. Usa `UPDATE ... WHERE estado = $esperado`, `UNIQUE`, `SELECT ... FOR UPDATE` o reintentos acotados.
11. **Dinero sin `float`**: `NUMERIC(10,2)` en BD y céntimos enteros (o cálculo en SQL) en JS. Redondeo explícito.

**Errores y observabilidad**
12. **Ningún error se traga**: no hay `catch` vacío ni `catch` que solo hace `console.log`. O se maneja con intención, o se propaga.
13. **Errores tipados** (`ErrorDeNegocio`, `NoEncontrado`, `NoAutorizado`, `Prohibido`, `Conflicto`, `ValidacionFallida`) mapeados a HTTP en **un único** middleware de errores. El cliente recibe un formato uniforme y nunca el stack ni el SQL.
14. **Logs estructurados** (JSON) con nivel, contexto e ID de petición; jamás contraseñas, tokens ni datos personales.

**Seguridad**
15. **Consultas SQL siempre parametrizadas** (`$1, $2`). Nunca concatenar texto del usuario.
16. **Autorización en cada endpoint** según la matriz RBAC, y además verificación de pertenencia (un comensal solo ve *sus* pedidos).
17. **Secretos fuera del repo**: `.env` en `.gitignore`, solo `.env.example` con valores falsos. Contraseñas con bcrypt.

**Mantenibilidad**
18. **Nombres que explican**: variables y funciones dicen *qué* son/hacen (`calcularTotalPedido`, no `calc`); booleanos con `es/tiene/puede`. El vocabulario del dominio se copia del contrato tal cual.
19. **Sin código muerto, sin duplicación accidental, sin dependencias innecesarias**. Antes de instalar un paquete: ¿lo hace ya Node/la librería actual? ¿está mantenido? ¿cuántas dependencias arrastra?
20. **Cambios pequeños y reversibles**: un objetivo por cambio, sin "aprovechar" para refactorizar otra cosa. Si ves un problema fuera de alcance, anótalo y avisa.

Detalle y ejemplos de estilo: [references/codigo-limpio.md](references/codigo-limpio.md).

## Paso 3 — Implementa en este orden

1. Constantes y tipos/esquemas de validación.
2. Repositorio (SQL) → servicio (reglas) → controlador → ruta.
3. Errores esperados de cada paso.
4. Pruebas: camino feliz + al menos un caso de error + caso borde relevante.
5. Documentación mínima que cambió (endpoint en `docs/api/endpoints.md`, variable nueva en `.env.example`, paso nuevo en `README`).

Frontend: [references/frontend.md](references/frontend.md). Git, Docker y entrega: [references/git-docker-entrega.md](references/git-docker-entrega.md).

## Paso 4 — Verifica de verdad (no supongas)

- Ejecuta las pruebas y el linter si existen; si el proyecto corre en Docker, levántalo y prueba el flujo real (`curl` o la pantalla).
- Prueba al menos un caso que **debe fallar** (permiso denegado, transición inválida, dato inválido) y confirma el código HTTP correcto.
- Si no pudiste verificar algo, **dilo explícitamente**. Nunca digas "funciona" sin haberlo visto funcionar.
- Pasa la lista de [references/checklist-final.md](references/checklist-final.md) antes de dar la tarea por terminada.

## Paso 5 — Informa con honestidad

Al terminar, en pocas líneas: qué cambiaste (con enlaces a archivos), cómo lo verificaste, qué quedó pendiente o con riesgo, y cualquier contradicción con el contrato que haya que pasar por un ADR.

## Prohibiciones explícitas

- Inventar nombres de tablas, columnas, estados, roles, rutas o tecnologías que no estén en el contrato del proyecto. Si hace falta uno nuevo, se propone como ADR.
- Introducir tecnologías fuera del stack acordado (en ChispaQR: nada de MongoDB, microservicios, Firebase, Kubernetes, ORMs pesados sin ADR).
- Silenciar errores, desactivar validaciones, `eslint-disable` o `--force` para "que pase".
- Subir secretos, `.env`, `node_modules` o datos personales reales.
- Escribir código "por si acaso" (YAGNI) o abstracciones con un solo uso.
- Hacer `git push`, `commit` a `main`, borrar datos o tocar producción sin que el usuario lo pida.
