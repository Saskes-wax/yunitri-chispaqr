# Triztan — Repositorio y aplicación

**Rol:** Responsable de desarrollo (backend/frontend) y del repositorio
**Secciones:** VII (Arquitectura de software y API), XI (Prototipo implementado), XXI (enlace y capturas)
**Expone:** arquitectura de software, API y **demo en vivo**

Antes de empezar: Contrato del equipo (fuente única de verdad) · Reglas de trabajo y del repositorio

---

## ✅ Qué debes hacer

### A. Repositorio (Hito 0, ya)
- [ ] Crear `yunitri-chispaqr` en GitHub, agregar a Nicolás, Yuri, Iván y Yandel como colaboradores.
- [ ] Proteger `main` (solo entra por pull request).
- [ ] Crear la estructura de carpetas fija (Reglas de trabajo y del repositorio).
- [ ] Subir `docs/equipo/CONTRATO.md` (copia del contrato) y el archivo de tareas de cada uno.
- [ ] README inicial: qué es ChispaQR, integrantes, cómo levantarlo (`docker compose up`).
- [ ] Opcional pero suma: GitHub Projects con un tablero simple (Por hacer / Haciendo / Hecho) — en la Unidad 2 la sección XVI lo pide.

### B. Aplicación — alcance del 50 % (40–50 % funcional)
Lo mínimo que debe **funcionar de verdad** en la demo:

| Pantalla | Qué hace | Módulo | RF |
|---|---|---|---|
| Comensal: entrada por QR | Abre `/m/{token_qr}`, reconoce la mesa, pide nombre | M1, M3 | RF-01, RF-02 |
| Comensal: carta + carrito | Carta por categoría, agregar/quitar, nota | M2, M3 | RF-03, RF-04 |
| Comensal: confirmación | Muestra código `M05-017`, total y "paga en caja"; luego el estado en vivo | M3 | RF-05, RF-09 |
| Login del personal | Usuario/contraseña → JWT con el rol | M6 | RF-12 |
| Caja | Lista de `PENDIENTE_PAGO`, buscar por código, confirmar pago (método), cancelar | M4 | RF-06, RF-11 |
| Cocina | Lista de `PAGADO`/`EN_PREPARACION`, botones de estado, marcar agotado | M5 | RF-07, RF-08 |

Queda para después (no te distraigas con esto antes de la Semana 08): panel de administrador completo, pantalla del mozo pulida, reportes, pago en línea.

- [ ] Web **pensada para celular primero** (el comensal usa el celular).
- [ ] La pantalla del comensal se actualiza sola cada pocos segundos (*polling*); WebSocket no hace falta en el 50 %.
- [ ] Contraseñas con **bcrypt**; nada de contraseñas reales en el repo (`.env`, y en el repo solo `.env.example`).
- [ ] Generar las imágenes QR de las mesas de prueba (librería `qrcode` de npm) a partir de `mesa.token_qr`.

### C. Endpoints base

Prefijo `/api/v1`. Esta tabla es la que va en la sección VII y en `docs/api/endpoints.md`. Puedes agregar endpoints, pero **no renombrar** los recursos del contrato.

| Verbo | Ruta | Quién | Respuesta OK | Errores esperados |
|---|---|---|---|---|
| GET | `/health` | Todos | 200 | 500 si no hay BD |
| POST | `/auth/login` | Personal | 200 + JWT | 400, 401 |
| GET | `/mesas/{token_qr}` | Comensal | 200 (número de mesa) | 404 QR no válido |
| POST | `/mesas/{token_qr}/comensales` | Comensal | 201 + token de comensal | 400 sin nombre, 404 |
| GET | `/categorias` | Comensal | 200 | — |
| GET | `/productos?disponible=true` | Comensal | 200 | — |
| PATCH | `/productos/{id}/disponibilidad` | Cocina, Administrador | 200 | 401, 403, 404 |
| POST | `/productos` | Administrador | 201 | 400, 401, 403 |
| POST | `/pedidos` | Comensal (token de comensal) | 201 + `codigo_pedido`, total, `PENDIENTE_PAGO` | 400, 401, 409 producto agotado |
| GET | `/pedidos/codigo/{codigo_pedido}` | Comensal dueño, Cajero | 200 | 404 |
| GET | `/pedidos?estado=PENDIENTE_PAGO` | Cajero | 200 | 401, 403 |
| GET | `/pedidos?estado=PAGADO,EN_PREPARACION` | Cocina | 200 | 401, 403 |
| POST | `/pedidos/{id}/pago` | Cajero | 201 (pedido pasa a `PAGADO`) | 401, 403, 409 si no estaba `PENDIENTE_PAGO` |
| PATCH | `/pedidos/{id}/estado` | Cocina (`EN_PREPARACION`, `LISTO`), Mozo (`ENTREGADO`), Cajero (`CANCELADO`) | 200 | 401, 403, 409 transición no permitida |
| POST | `/mesas/{id}/regenerar-qr` | Administrador | 200 | 401, 403 |

**409** = lo rechazó la regla de negocio (incluido el trigger de Iván). Así la API y la BD dicen lo mismo.

### D. Sección VII (lo que escribes)
- [ ] **Monolito modular vs. microservicios:** monolito modular. Argumento: un recreo con un servidor y un equipo de 5 no necesita la complejidad ni el costo de microservicios; los módulos M1–M6 quedan separados por carpeta, así que se podrían separar después.
- [ ] Tabla de endpoints (la de arriba, actualizada).
- [ ] **Autenticación:** JWT para el personal (sin sesiones en el servidor, expira en el turno, lleva el rol) + token aleatorio en el QR para el comensal (sin cuenta ni contraseña). Por qué **no** OAuth 2.0 (el recreo no necesita entrar con Google) ni API Key (sirve para sistemas, no para personas con roles).
- [ ] Diagrama de arquitectura de software (navegador → `web` → `api` → `db`) en `docs/diagramas/arquitectura-software.png`.
- [ ] **Justificación gerencial:** cambiar un precio o agregar un plato es rápido (monolito simple, un solo despliegue); los datos de los clientes son mínimos y el personal solo ve lo de su rol; mantenerlo es barato.

### E. Sección XI (lo que escribes)
- [ ] Capturas de cada pantalla de la tabla B (celular y PC).
- [ ] Captura de `docker compose ps` con los 3 contenedores arriba (la logra Yandel con el compose; tú la tomas en la demo final).
- [ ] Captura de la API respondiendo (Postman/Thunder Client o `curl`) **y** el mismo dato visto en la BD → prueba de que la API se conecta.
- [ ] Captura del trigger rechazando una transición (409) → prueba de que la regla vive en la BD.
- [ ] Enlace al commit o carpeta exacta del repo.
- [ ] **Justificación gerencial:** qué proceso ya **queda resuelto**: "tomar el pedido y cobrarlo sin mozo" funciona de punta a punta; el mozo solo entrega.

### F. Filas del ADR que entregas a Nicolás
Arquitectura (monolito modular), autenticación (JWT + token QR), stack (Node/Express + HTML/JS o React).

---

## 🧭 Relacionado con el caso (Recreo Chispa)

- **La app con la cara del recreo:** su nombre, su carta real (la que carga Iván) y, si se puede, **fotos de los platos**. En la demo debe verse como su sistema, no como una plantilla.
- **Pensada para su realidad:** páginas livianas (4G débil en zona campestre), letra grande, botones grandes, español sencillo; probarla en un celular de gama baja con datos móviles, no solo en la PC.
- **QR físicos:** diseña la plantilla para imprimir por mesa ("Mesa 5 — Escanea para pedir"), con el número real de las mesas. Lleva 2–3 impresos a la exposición.
- **Código de pedido con sus mesas reales** (`M05-017`) para que el cajero lo ubique rápido aunque haya cola.
- **Cocina:** pantalla que se lea a distancia (una tablet o celular que el recreo ya tenga), con los pedidos pagados en orden de llegada.
- **Lo que se ajusta según la entrevista:** métodos de pago que muestra la caja, zonas de mesas si las hay y porciones o combos si la carta los tiene.
- **Justificación gerencial de la XI con el caso:** "En un domingo lleno, el recreo ya puede tomar y cobrar pedidos sin que el mozo vaya a cada mesa."

---

## ❌ Qué NO hacer

- No cambiar nombres de tablas, estados o roles para que "te queden más cómodos" en el código. Si algo no cuadra, se cambia en el contrato con un ADR y avisas a Iván.
- No crear tablas por tu cuenta: el esquema es de Iván. Si te falta un campo, se lo pides.
- No meter el pago en línea, reservas, delivery ni login de clientes en el 50 %.
- No escribir sobre Docker en la nube, VPN o red en tu sección: eso es de Yandel (tú solo citas "ver sección VI/IX").
- No escribir el ER ni el trigger en tu sección: solo dices que la API responde 409 cuando el trigger rechaza, y citas la VIII.
- No subir contraseñas, `.env` real ni `node_modules` (pon un `.gitignore` desde el día 1).
- No hacer un solo commit gigante al final.

## Depende de / entrega a
- **Necesitas de Iván:** `01_esquema.sql` (Hito 1), trigger y datos de prueba (Hito 2).
- **Necesitas de Yandel:** `docker-compose.yml` final y matriz RBAC (Hito 2).
- **Entregas a Yandel:** `Dockerfile` de `api` y `web` (Hito 1).
- **Entregas a todos:** lista de endpoints (Hito 1); capturas y enlace a Nicolás (Hito 3).

## En la exposición (≈ 4–5 min)
1. Arquitectura en un diagrama (30 s).
2. **Demo en vivo:** escanear el QR con un celular → pedir → caja confirma → aparece en cocina → listo. Ten un **video de respaldo** por si falla el internet.
3. Mostrar un 409 del trigger.
4. Mostrar el repo: carpetas, commits de todos, README.

Preguntas probables: ¿por qué no microservicios?, ¿qué tiene el JWT por dentro?, ¿qué pasa si alguien copia el QR?, ¿cómo sabe la API qué mesa es?
