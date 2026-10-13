# Yuri — Alcance y requerimientos

**Rol:** Analista de requerimientos y procesos
**Secciones:** III (Alcance, limitaciones y supuestos), V (Requerimientos del sistema), XXI (actas de reunión)
**Expone:** alcance, actores, proceso BPMN y requerimientos

Antes de empezar: Contrato del equipo (fuente única de verdad) · Idea del sistema y mejoras propuestas

---

## ✅ Qué debes hacer

### Sección III — Alcance, limitaciones y supuestos
- [ ] **Alcance:** los módulos M1–M6 del contrato, con una línea cada uno.
- [ ] **Limitaciones** (fuera del alcance actual): pago en línea y comprobante digital (Unidad 2), reportes/BI (Unidad 2), reservas, delivery, cuentas de cliente, app nativa, inventario de insumos de cocina.
- [ ] **Supuestos:** el recreo tiene conexión a internet estable en horario de atención; los clientes tienen celular con cámara y datos o Wi-Fi; quien no tenga celular sigue pidiendo en caja; el recreo tiene una PC en caja y una pantalla o tablet en cocina; el personal recibe una capacitación corta.

### Sección V — Requerimientos
- [ ] **Actores:** exactamente `ACT-01` a `ACT-05` del contrato (mismo nombre, misma descripción).
- [ ] **Proceso de negocio en BPMN** (draw.io o bizagi), con **carriles**: Comensal, Sistema, Caja, Cocina, Mozo. Dos diagramas:
  - **AS-IS (cómo es hoy):** el mozo toma el pedido, lo lleva a cocina, cobra al final.
  - **TO-BE (con ChispaQR):** igual al flujo del contrato, paso por paso.
  - Guardar en `docs/diagramas/bpmn-as-is.png` y `bpmn-to-be.png`.
- [ ] **Requerimientos funcionales** priorizados, redactados como "El sistema debe…". Parte de la lista base de abajo; puedes **pulir la redacción y agregar**, pero **no cambies los códigos** de los que ya existen (Triztan e Iván los están usando).
- [ ] **Requerimientos no funcionales**: seguridad, disponibilidad, usabilidad (lista base abajo).
- [ ] Una tabla de **trazabilidad** simple: RF → OE de Nicolás → módulo. Así se ve que todo cuadra.

### Lista base de requerimientos

| Código | Requerimiento | Prioridad | Módulo |
|---|---|---|---|
| RF-01 | El sistema debe identificar la mesa a partir del código QR escaneado. | Alta | M1 |
| RF-02 | El sistema debe registrar al comensal con un nombre o alias antes de permitirle pedir. | Alta | M3 |
| RF-03 | El sistema debe mostrar la carta por categorías, con precio y solo los productos disponibles. | Alta | M2 |
| RF-04 | El sistema debe permitir al comensal agregar, quitar y cambiar la cantidad de productos, con una nota opcional. | Alta | M3 |
| RF-05 | El sistema debe generar un pedido con código único en estado `PENDIENTE_PAGO` e indicar el monto a pagar en caja. | Alta | M3 |
| RF-06 | El sistema debe permitir al cajero buscar pedidos pendientes y registrar su pago indicando el método. | Alta | M4 |
| RF-07 | El sistema debe mostrar en cocina únicamente los pedidos pagados. | Alta | M5 |
| RF-08 | El sistema debe permitir a cocina cambiar el estado del pedido a `EN_PREPARACION` y `LISTO`. | Alta | M5 |
| RF-09 | El sistema debe mostrar al comensal el estado actualizado de su pedido. | Media | M3 |
| RF-10 | El sistema debe permitir marcar un producto como agotado y ocultarlo de la carta. | Media | M2 |
| RF-11 | El sistema debe permitir al cajero cancelar un pedido no pagado. | Media | M4 |
| RF-12 | El sistema debe autenticar al personal y limitar sus acciones según su rol. | Alta | M6 |
| RF-13 | El sistema debe permitir al administrador gestionar productos, mesas y regenerar el QR de una mesa. | Baja (50 %) | M1, M2 |
| RF-14 | El sistema debe permitir al mozo marcar un pedido como `ENTREGADO`. | Media | M5 |

| Código | Requerimiento no funcional | Tipo |
|---|---|---|
| RNF-01 | Toda comunicación debe ir por HTTPS y las contraseñas guardarse con hash (bcrypt). | Seguridad |
| RNF-02 | El comensal debe poder hacer un pedido en máximo 3 pantallas, desde el celular, sin instalar nada. | Usabilidad |
| RNF-03 | El sistema debe estar disponible en todo el horario de atención del recreo. | Disponibilidad |
| RNF-04 | Las pantallas deben responder en menos de 2 segundos con conexión móvil normal. | Rendimiento |
| RNF-05 | Del comensal solo se guarda nombre o alias (sin DNI ni teléfono). | Privacidad |
| RNF-06 | Cada usuario del personal solo accede a las funciones de su rol. | Seguridad |

### Sección XXI — Actas
- [ ] Un acta por reunión con Plantilla acta de reunión, en `docs/equipo/actas/`.

---

## 🧭 Relacionado con el caso (Recreo Chispa)

- **AS-IS real del recreo:** dibújalo con lo que cuente la entrevista, paso por paso: el cliente llega → espera al mozo → el mozo anota (¿papel? ¿de memoria?) → lleva la comanda a cocina → sirve → el cliente pide la cuenta → el mozo va a caja → cobra. **Marca en rojo las esperas** (ahí está el problema).
- **TO-BE:** el mismo recreo con ChispaQR; que se vea que el mozo ya no toma pedidos, solo entrega.
- **Supuestos propios de un recreo campestre:**
  - La señal de datos en el local puede ser débil → el recreo ofrece Wi-Fi para clientes (confirmar en la entrevista).
  - Hay clientes mayores o sin celular → siguen pidiendo en caja o el mozo les ayuda.
  - El personal puede tener poca experiencia con sistemas → capacitación corta.
- **Requerimientos que salen del caso** (confírmalos con la entrevista):
  - Métodos de pago que **de verdad** usa el recreo (si no aceptan tarjeta, no va `TARJETA`) → avisa a Iván.
  - Platos que **se acaban** en el día → refuerza RF-10 (agotado).
  - Si la carta tiene porciones (media / entera) o combos, agrégalo como RF nuevo.
  - Si el recreo tiene zonas (salón, jardín, terraza), dilo: afecta a mesas y QR.
- **RNF con el caso:** funcionar en celulares de gama baja y con 4G débil (páginas livianas), letra grande y español sencillo.

---

## ❌ Qué NO hacer

- No inventar actores nuevos ("Supervisor", "Cliente VIP", "Repartidor"). Son los 5 del contrato.
- No escribir requerimientos de cosas que están en *Limitaciones* (pago en línea, reservas, delivery).
- No describir **cómo** se implementa (tablas, endpoints, Docker): un requerimiento dice **qué** debe hacer el sistema, no con qué.
- No renumerar RF ya publicados; si uno sobra, se marca "Descartado" con su motivo, pero el código no se reutiliza.
- No dibujar en el BPMN pasos que el sistema no hace (por ejemplo "el cliente paga con tarjeta en la web").
- No usar estados distintos a los del contrato en el BPMN.

## Depende de / entrega a
- **Necesitas de Nicolás:** entrevista y `OE` (Hito 1) para el AS-IS y la trazabilidad.
- **Entregas a Triztan e Iván:** RF con códigos (Hito 1).
- **Entregas a Nicolás:** referencias (por ejemplo, de BPMN o de ingeniería de requerimientos) y 1–2 líneas para conclusiones (Hito 2).

## En la exposición (≈ 4 min)
1. Alcance y lo que **no** entra (y por qué).
2. AS-IS vs. TO-BE: dónde se ahorra tiempo de mozo.
3. RF priorizados y su trazabilidad a los objetivos.

Preguntas probables: ¿por qué RF-07 es de prioridad alta?, ¿cuál es la diferencia entre RF y RNF?, ¿qué pasa con el cliente sin celular?
