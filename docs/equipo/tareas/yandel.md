# Yandel — Infraestructura y seguridad

**Rol:** Responsable de infraestructura y seguridad
**Secciones:** VI (Arquitectura de infraestructura), IX (Seguridad y conectividad) + filas de infraestructura y red del ADR
**Expone:** Docker, nube, red, VPN, Zero Trust y RBAC

Antes de empezar: Contrato del equipo (fuente única de verdad)

---

## ✅ Qué debes hacer

### Sección VI — Arquitectura de infraestructura
- [ ] **Virtualización vs. contenedores** → **contenedores**. Explica la diferencia (VM = sistema operativo completo; contenedor = solo la app y sus dependencias) y por qué conviene al recreo: liviano, se levanta con un comando, mismo entorno en la laptop y en el servidor.
- [ ] **Modelo de servicio:** propuesta **IaaS** (un VPS donde corre Docker Compose). Compara con PaaS y SaaS en una tabla y justifica. Si después de investigar te convence más PaaS, **se cambia primero en el contrato** con un ADR.
- [ ] **Modelo de despliegue:** **nube pública**. Compara con privada (servidor propio en el recreo: corte de luz/internet = sin sistema, costo de equipo) e híbrida.
- [ ] **`docker-compose.yml` documentado** con 3 servicios — nombres fijos:
  - `db` → `postgres:16`, volumen persistente, carga `database/*.sql` de Iván al iniciar.
  - `api` → Node.js (Dockerfile de Triztan), depende de `db`.
  - `web` → Nginx sirviendo el frontend; recibe HTTPS.
  - Variables en `.env` (en el repo solo `.env.example`).
- [ ] **Diagrama de despliegue** → `docs/diagramas/infra-despliegue.png` (celular/PC → internet → VPS → contenedores).
- [ ] **Evidencia:** captura de `docker compose up` y `docker compose ps` con los 3 servicios *healthy*.
- [ ] **Justificación gerencial:** qué riesgo de continuidad mitiga (si el servidor cae, se levanta en otro en minutos; respaldo del volumen de la BD) y el costo mensual aproximado de un VPS básico frente a comprar un servidor (cita el precio que consultes, con la fuente).

### Sección IX — Seguridad y conectividad
- [ ] **Topología de red del recreo** (con los datos de la entrevista) → `docs/diagramas/red-recreo.png`:
  - Red de **clientes** (Wi-Fi de invitados o datos móviles) separada de la red del **personal** (PC de caja, pantalla de cocina).
  - Los clientes solo llegan al sistema por **HTTPS** desde internet; nunca a la red interna.
- [ ] **Acceso remoto:** **VPN WireGuard** solo para administrar el servidor (SSH y base de datos **cerrados** a internet; abiertos solo por la VPN). Explica por qué no hace falta VPN para el personal (usan la web con HTTPS + JWT).
- [ ] **Zero Trust aplicado:** "nunca confiar, siempre verificar" → cada petición lleva JWT o token de mesa y se valida; mínimo privilegio por rol; nada es confiable por estar "dentro del Wi-Fi".
- [ ] **Matriz RBAC** (roles exactos del contrato). Base:

| Acción | ADMINISTRADOR | CAJERO | COCINA | MOZO | Comensal (token QR) |
|---|:-:|:-:|:-:|:-:|:-:|
| Ver carta | ✔ | ✔ | ✔ | ✔ | ✔ |
| Crear pedido | — | — | — | — | ✔ |
| Ver pedidos pendientes de pago | ✔ | ✔ | — | — | solo el suyo |
| Registrar pago / cancelar | ✔ | ✔ | — | — | — |
| Pasar a `EN_PREPARACION` / `LISTO` | ✔ | — | ✔ | — | — |
| Marcar producto agotado | ✔ | — | ✔ | — | — |
| Marcar `ENTREGADO` | ✔ | — | — | ✔ | — |
| Gestionar productos, mesas y QR | ✔ | — | — | — | — |
| Gestionar usuarios | ✔ | — | — | — | — |

  Cruza esta matriz con los endpoints de Triztan para que digan **exactamente lo mismo**.
- [ ] **Justificación gerencial:** costo de una caída de red en hora punta (pedidos que no entran, clientes que se van — usa los datos de la entrevista) y por qué esta topología es **proporcional** (un recreo no necesita un firewall empresarial; sí HTTPS, VPN para administración y roles).

### Filas del ADR que entregas a Nicolás
Contenedores vs. VM; IaaS vs. PaaS vs. SaaS; nube pública vs. privada; VPN WireGuard vs. OpenVPN vs. ninguna; RBAC.

---

## 🧭 Relacionado con el caso (Recreo Chispa)

- **Conexión real del recreo:** pregunta (vía la entrevista) cómo les llega internet (fibra, antena, 4G), si el Wi-Fi cubre todo el local (jardín, terraza) y qué equipos tienen (PC de caja, tablet o celular para cocina). Tu topología se dibuja con **eso**, no con un esquema genérico.
- **Por qué la nube y no un servidor en el recreo:** en una zona campestre puede cortarse la luz o el internet; si el servidor estuviera en el local, se cae todo. En la nube, el cliente sigue pidiendo con sus datos móviles aunque el Wi-Fi del recreo falle.
- **Plan de continuidad del caso:** si se cae el internet del recreo, la caja y la cocina pueden seguir conectadas con el **hotspot de un celular**; y si todo falla, se vuelve a la comanda en papel. Escríbelo en la justificación gerencial.
- **Costo de una caída:** calcúlalo con datos de la entrevista: pedidos por hora en hora punta × ticket promedio = lo que el recreo deja de vender por cada hora sin sistema.
- **Roles con el personal real:** el dueño suele ser `ADMINISTRADOR` (y a veces también hace de cajero); en temporada alta entran **mozos eventuales** → cuentas `MOZO` que se crean para ese día y se desactivan después (`usuario.activo`). Eso es Zero Trust aplicado (mínimo privilegio, nada permanente si no hace falta).
- **Red de clientes separada:** el Wi-Fi para clientes no debe dar acceso a la PC de caja.
- **Proporcional al recreo:** no le recomiendes equipos caros; si falta cobertura, como mucho un router o repetidor para clientes (con precio consultado y fuente).

---

## ❌ Qué NO hacer

- No proponer Kubernetes, microservicios ni varios servidores: no lo necesita el recreo y contradice la sección VII (monolito modular).
- No cambiar los nombres de los servicios (`db`, `api`, `web`) ni de los roles.
- No decir en tu sección que la base es MySQL o SQL Server: es **PostgreSQL 16**.
- No inventar el equipamiento del recreo (router, PCs): sale de la entrevista; si falta, "por confirmar".
- No poner la VPN para los clientes ni para el personal que solo usa la web.
- No subir contraseñas ni claves de WireGuard al repo.
- No explicar endpoints ni JWT por dentro (eso es de Triztan); tú dices qué rol accede a qué.

## Depende de / entrega a
- **Necesitas de Triztan:** Dockerfile de `api` y `web` (Hito 1), lista de endpoints (Hito 1).
- **Necesitas de Iván:** scripts SQL para montarlos en `db` (Hito 1–2).
- **Necesitas de Nicolás:** equipos y conexión del recreo (entrevista, Hito 1).
- **Entregas a Triztan:** `docker-compose.yml` y matriz RBAC (Hito 2).

## En la exposición (≈ 4–5 min)
1. Diagrama de despliegue y por qué contenedores + IaaS + nube pública.
2. `docker compose ps` en vivo (o captura).
3. Topología de red, VPN y Zero Trust.
4. Matriz RBAC.

Preguntas probables: ¿diferencia entre VM y contenedor?, ¿por qué IaaS y no PaaS?, ¿qué es Zero Trust en este caso concreto?, ¿qué pasa si se cae el internet del recreo?
