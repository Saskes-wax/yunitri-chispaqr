# Contrato del equipo — fuente única de verdad

> **Regla de oro:** si algo está escrito aquí, **todos lo escriben igual**: en su sección del expediente, en el código, en los diagramas y en la exposición. Nadie inventa otro nombre, otro actor, otra tabla, otro estado ni otra tecnología.
>
> **¿Hay que cambiar algo?** Se avisa en el grupo → se agrega una fila al ADR (Plantilla ADR) → Nicolás y Triztan lo aprueban → se actualiza esta nota y su copia en el repo (`docs/equipo/CONTRATO.md`). Hasta que eso pase, **vale lo que dice aquí**.

Estado: **PROPUESTA** — se confirma en la reunión 1. Lo confirmado se marca con ✅.

---

## 1. Datos generales

| Dato | Valor |
|---|---|
| Curso | Sistemas de Información — Ciclo V — 2026-II |
| Docente | Mtro. Rojas Silva Jhamer Anderson |
| Equipo | Yunitri |
| Organización | **Recreo "Chispa"** (Andahuaylas) — nombre exacto, dirección y datos se confirman con la entrevista |
| Nombre del sistema | **ChispaQR** *(provisional — se decide en la reunión 1 y ya no se cambia)* |
| Entrega actual | **Avance 50 % — Semana 08** (cierre de la Unidad 1) |
| Repositorio | https://github.com/Saskes-wax/yunitri-chispaqr |

> ⚠️ Ningún dato del recreo (número de mesas, trabajadores, horas punta, ventas, cuántos clientes se van sin ser atendidos) se inventa. Todo sale de **una sola entrevista** que coordina Nicolás (Nicolas - Caso empresarial y coordinación). Si un dato no se tiene, se escribe "por confirmar".

## 2. Integrantes y roles (así van en la carátula)

| Nombre en el equipo | Apellidos y nombres | Rol |
|---|---|---|
| Nicolás | Meza Rodas, Nicolás Yuliño | Líder del equipo y analista de negocio |
| Yuri | Huamán Pultay, Yury Kevin | Analista de requerimientos y procesos |
| Iván | Lara Flores, Iván | Responsable de base de datos |
| Yandel | Allccahuamán Rupailla, Lenin Yandel | Responsable de infraestructura y seguridad |
| Triztan | Miranda Ochoa, Triztan Yandel | Responsable de desarrollo (backend/frontend) y del repositorio |

## 3. El problema y la propuesta (la frase que todos repiten)

> **Problema:** en horas punta el recreo tiene más clientes de los que sus mozos pueden atender; los clientes esperan para pedir, se equivocan pedidos y algunos se van.
>
> **Propuesta:** "ChispaQR es un sistema web en el que el cliente escanea el código QR de su mesa, ve la carta, registra su pedido con su nombre y lo paga en caja; solo los pedidos pagados pasan a cocina."

Nicolás puede pulir la redacción después de la entrevista, pero **la idea no cambia**: QR por mesa → carta → pedido con nombre → pago en caja → cocina.

## 4. Flujo único del pedido

1. El cliente escanea el **QR de la mesa** → el sistema reconoce la mesa.
2. Escribe su **nombre o alias** (no se pide DNI ni celular) → queda registrado como **comensal** de esa mesa.
3. Ve la **carta** y arma su pedido (cantidad y nota por producto).
4. Confirma → se genera el pedido con un **código corto** (ej. `M05-017`) en estado `PENDIENTE_PAGO`, y la pantalla le dice: "Acércate a caja con este código: S/ XX.XX".
5. El **cajero** busca el código, cobra (efectivo, Yape/Plin o tarjeta con el POS que ya tienen) y marca **pagado** → estado `PAGADO`.
6. **Cocina** ve en su pantalla solo pedidos `PAGADO`, los pasa a `EN_PREPARACION` y luego a `LISTO`.
7. El **mozo** lleva el pedido a la mesa → `ENTREGADO`.
8. Si nadie paga en **20 minutos**, el cajero (o el sistema, en la Unidad 2) lo pasa a `CANCELADO`.

El diagrama está en Idea del sistema y mejoras propuestas.

## 5. Módulos (nombres fijos)

| Código | Módulo | ¿Entra al prototipo 50 %? |
|---|---|---|
| M1 | Mesas y QR (reconocer mesa, generar QR) | ✅ Sí |
| M2 | Carta (categorías, productos, precios, disponible/agotado) | ✅ Sí |
| M3 | Pedidos del comensal (registro con nombre, carrito, código) | ✅ Sí |
| M4 | Caja (pedidos pendientes, confirmar pago, cancelar) | ✅ Sí |
| M5 | Cocina (pedidos pagados, cambio de estado) | ✅ Sí (versión básica) |
| M6 | Usuarios y acceso (login del personal, roles) | ✅ Sí |
| M7 | Pago en línea y comprobante digital | ❌ Unidad 2 (Semana 09) |
| M8 | Reportes / BI | ❌ Unidad 2 (Semana 11) |

## 6. Actores y roles (iguales en requerimientos, BD, RBAC, JWT y app)

| Código | Actor | Qué hace | ¿Inicia sesión? |
|---|---|---|---|
| ACT-01 | Comensal | Escanea el QR, se registra con su nombre, pide y ve el estado de su pedido | No (usa el token del QR) |
| ACT-02 | Cajero | Ve pedidos pendientes, cobra, confirma pago, cancela | Sí |
| ACT-03 | Cocina | Ve pedidos pagados, cambia a en preparación / listo, marca productos agotados | Sí |
| ACT-04 | Mozo | Ve pedidos listos y los marca como entregados | Sí |
| ACT-05 | Administrador | Gestiona carta, mesas (genera QR) y usuarios | Sí |

Valores exactos en la tabla `rol` y dentro del JWT: `ADMINISTRADOR`, `CAJERO`, `COCINA`, `MOZO`.
"Comensal" **no es** un usuario del sistema: no tiene contraseña ni fila en `usuario`.

## 7. Entidades / tablas (nombres fijos)

Convención: `snake_case`, singular, clave primaria `id_<tabla>`, fechas `fecha_<algo>`.

| Tabla | Para qué |
|---|---|
| `rol` | Los 4 roles del personal |
| `usuario` | Personal del recreo (contraseña con hash) |
| `mesa` | Mesas físicas; cada una con su `token_qr` único |
| `sesion_mesa` | Una "visita" a la mesa: se abre con el primer comensal y se cierra cuando se va el grupo |
| `comensal` | Quién pide: solo `nombre_alias`, ligado a una `sesion_mesa` |
| `categoria` | Platos, bebidas, postres… |
| `producto` | Carta: nombre, precio, `disponible`, `stock` (opcional) |
| `pedido` | Cabecera: `codigo_pedido`, comensal, estado, total |
| `detalle_pedido` | Líneas: producto, cantidad, precio unitario, subtotal, nota |
| `pago` | Registro del cobro en caja: método, monto, cajero, fecha |
| `historial_estado_pedido` | Auditoría de cada cambio de estado (lo llena el trigger) |

Estados fijos (en MAYÚSCULAS, tal cual):
- `pedido.estado`: `PENDIENTE_PAGO`, `PAGADO`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO`
- `mesa.estado`: `LIBRE`, `OCUPADA`, `INACTIVA`
- `sesion_mesa.estado`: `ABIERTA`, `CERRADA`
- `pago.metodo`: `EFECTIVO`, `YAPE`, `PLIN`, `TARJETA`

> Iván puede **agregar** campos o tablas de apoyo al normalizar, pero **no renombrar ni quitar** las de arriba sin pasar por el ADR.

**Trigger principal (Iván lo implementa y justifica):** `trg_pedido_cambio_estado` — antes de actualizar `pedido.estado`, **rechaza** transiciones no permitidas (por ejemplo, pasar a `EN_PREPARACION` sin estar `PAGADO`) y **registra** el cambio en `historial_estado_pedido`. Así la regla "no se cocina lo que no se pagó" la protege la base de datos, no solo la app.

## 8. Decisiones técnicas base

| Tema | Decisión | Quién la justifica en el expediente |
|---|---|---|
| Infraestructura | **Contenedores: Docker + Docker Compose** (3 servicios: `db`, `api`, `web`) | Yandel (VI) |
| Modelo de servicio en la nube | **IaaS** — un servidor virtual (VPS) donde corre el Docker Compose *(propuesta)* | Yandel (VI) |
| Modelo de despliegue | **Nube pública** *(propuesta)* | Yandel (VI) |
| Arquitectura de software | **Monolito modular** con API REST | Triztan (VII) |
| Autenticación | **JWT** para el personal + **token de mesa** (en el QR) para el comensal | Triztan (VII) |
| Base de datos | **PostgreSQL 16** (relacional, OLTP) | Iván (VIII) |
| Acceso remoto | **VPN WireGuard** solo para administrar el servidor; los usuarios entran por **HTTPS** | Yandel (IX) |
| Control de acceso | **RBAC** con los 4 roles del punto 6 + principios Zero Trust | Yandel (IX) |
| Stack | Node.js 20 + Express · PostgreSQL 16 · HTML/CSS/JS (o React con Vite, lo decide Triztan) · Docker Compose | Triztan |

## 9. API (prefijo y recursos fijos)

Prefijo: `/api/v1`. La lista completa (verbo, ruta, quién puede, códigos de respuesta) la mantiene Triztan en `docs/api/endpoints.md` del repo y en Triztan - Repositorio y aplicación.

| Recurso | Ruta base | Quién la usa |
|---|---|---|
| Salud | `/api/v1/health` | Todos (prueba de que la API vive) |
| Autenticación | `/api/v1/auth` | Personal |
| Mesas | `/api/v1/mesas` | Comensal (leer por QR), Administrador |
| Comensales | `/api/v1/mesas/{token_qr}/comensales` | Comensal |
| Carta | `/api/v1/categorias`, `/api/v1/productos` | Comensal (leer), Administrador/Cocina (editar) |
| Pedidos | `/api/v1/pedidos` | Comensal (crear/ver el suyo), Cajero, Cocina, Mozo |
| Pagos | `/api/v1/pedidos/{id}/pago` | Cajero |

## 10. Identificadores para citarse entre secciones

- Objetivos específicos: `OE-1`, `OE-2`… (los pone Nicolás)
- Requerimientos funcionales: `RF-01`… / no funcionales: `RNF-01`… (los pone Yuri; base en Yuri - Alcance y requerimientos)
- Decisiones: `ADR-01`… (los numera Nicolás)
- Actores: `ACT-01`… / Módulos: `M1`…

Cuando una sección habla de algo de otra, **lo nombra por su código**. Ej.: "El endpoint `POST /api/v1/pedidos` cubre el RF-05 y aporta al OE-2."

## 11. Formato común

- Formato del docente: Formato del expediente - 21 secciones.
- Citas **APA 7**. Cada uno entrega sus referencias a Nicolás en la lista común.
- Tablas y figuras con título arriba y "Fuente: elaboración propia" abajo. El número ("Figura 3") lo pone Nicolás al integrar; mientras tanto se escribe "Figura X".
- Redacción en tercera persona o "el equipo"; nada de "yo".
- Diagramas en **draw.io**, exportados en PNG a `docs/diagramas/` del repo (y el `.drawio` también, para poder editarlo).
- Moneda: **S/** con dos decimales. Fechas: dd/mm/aaaa.
