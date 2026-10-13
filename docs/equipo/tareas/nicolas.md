# Nicolás — Caso empresarial y coordinación

**Rol:** Líder del equipo y analista de negocio
**Secciones:** I (Carátula), II (Resumen ejecutivo), IV (Caso empresarial y objetivos), X (ADR — consolida), XII–XVIII (frase de pendiente), XIX (Conclusiones preliminares), XX (Referencias)
**Expone:** el problema, el recreo, Porter, cadena de valor, Laudon y objetivos

Antes de empezar: Contrato del equipo (fuente única de verdad) · Formato del expediente - 21 secciones

---

## ✅ Qué debes hacer

### Entrevista al recreo (una sola, para todos)
Hazla en el Hito 1 y comparte las respuestas en `docs/equipo/entrevista.md`. Así **nadie inventa números distintos**.

- [ ] Nombre exacto, dirección, años de funcionamiento, rubro (recreo campestre, comida típica, etc.).
- [ ] ¿Cuántas mesas? ¿Capacidad aproximada? *(Iván y Triztan lo necesitan para los datos de prueba)*
- [ ] ¿Cuántos mozos, cajeros y cocineros hay en un día normal y en uno de alta demanda?
- [ ] ¿Qué días y horas se llena? ¿Cuántos clientes en esas horas?
- [ ] ¿Cuánto espera un cliente para que le tomen el pedido en hora punta? ¿Se han ido clientes por esperar?
- [ ] ¿Cómo se toma y se pasa hoy el pedido a cocina? (papel, de memoria…) ¿Hay errores?
- [ ] ¿Cómo cobran? (efectivo, Yape, Plin, POS) ¿Emiten boleta?
- [ ] ¿Tienen Wi-Fi? ¿Llega bien la señal de datos móviles? ¿Tienen computadora en caja? ¿Una tablet o TV para cocina? *(Yandel lo necesita para la red)*
- [ ] ¿Cuál es su carta y sus precios? (foto de la carta) *(Iván la carga como datos de prueba)*
- [ ] ¿Quiénes son su competencia cercana? *(para Porter)*
- [ ] Permiso para usar el nombre del recreo en el trabajo.

### Sección I — Carátula y datos generales
- [ ] Curso, docente, ciclo, semestre; equipo **Yunitri**; integrantes con rol (tabla 2 del contrato); organización; enlace al repo (te lo da Triztan); **versión del documento y fecha**.

### Sección IV — Caso empresarial y objetivos
- [ ] Descripción del recreo (sector, tamaño, contexto en Andahuaylas) con datos de la entrevista.
- [ ] **Cinco fuerzas de Porter** aplicadas al recreo (competidores, nuevos entrantes, sustitutos, poder de clientes, poder de proveedores). Cierra cada fuerza con "cómo influye ChispaQR".
- [ ] **Cadena de valor** del recreo: marca dónde aporta más el sistema → **operaciones (tomar pedido y cocina)** y **marketing y ventas/servicio** (atención más rápida, menos clientes perdidos).
- [ ] **Estrategia competitiva de TI según Laudon:** propuesta → **intimidad/enfoque en el cliente + excelencia operativa** (atender más rápido con el mismo personal). Elige una principal y justifícala.
- [ ] **Objetivo general** y **objetivos específicos** en infinitivo, numerados `OE-1`, `OE-2`… Propuesta:
  - OG: *Desarrollar un sistema web de pedidos mediante código QR para reducir el tiempo de atención en el Recreo Chispa en horas de alta demanda.*
  - OE-1: Identificar la mesa y al comensal a partir del código QR.
  - OE-2: Permitir que el comensal registre su pedido desde la carta digital.
  - OE-3: Asegurar que solo los pedidos pagados en caja pasen a cocina.
  - OE-4: Controlar el acceso del personal según su rol.
  - OE-5: Desplegar el sistema en contenedores para facilitar su puesta en marcha.

### Sección X — ADR (consolidas)
- [ ] Usar Plantilla ADR: Decisión | Alternativas consideradas | Justificación | Semana.
- [ ] Mínimo: infraestructura (Yandel), arquitectura de software (Triztan), base de datos (Iván), seguridad de red (Yandel). Numeras `ADR-01`…

### Secciones XII a XVIII
- [ ] Solo la frase exacta: *"Pendiente — corresponde a la Unidad 2 (Semana N.° 09)"* con su semana (XII=09, XIII=10, XIV=11, XV=12, XVI=13, XVII=14, XVIII=15). Nada más.

### Sección II — Resumen ejecutivo (lo escribes **al final**, Hito 3)
- [ ] Una página: problema, organización, solución, qué ya funciona (lo que diga la XI de Triztan, ni más ni menos).

### Sección XIX — Conclusiones preliminares
- [ ] Logros y dificultades hasta la Semana 08, relacionados con cada `OE`. Pide 1–2 líneas a cada uno.

### Sección XX — Referencias
- [ ] Unir las referencias de todos, **APA 7**, orden alfabético, sangría francesa, **solo las citadas** en el cuerpo.

### Integración final
- [ ] Crear el documento compartido con las 21 secciones desde el inicio.
- [ ] Pasar la lista de coherencia antes de entregar.
- [ ] Numerar figuras y tablas; armar el índice.

---

## 🧭 Relacionado con el caso (Recreo Chispa)

Todo lo que escribas debe sonar a **este recreo**, no a "una empresa cualquiera". Guía para aterrizarlo (los datos concretos los confirma la entrevista):

- **Descripción:** recreo campestre de Andahuaylas; qué vende (platos típicos, bebidas), qué días se llena (fines de semana, feriados, fiestas), cuántas mesas y cuánto personal tiene **en un día normal y en uno lleno**. Ese contraste es el corazón del problema.
- **El problema con números:** "En un domingo lleno hay __ mesas ocupadas y __ mozos; un cliente espera __ minutos para que le tomen el pedido." Sin esos números la IV queda débil.
- **Porter aterrizado:**
  - *Competidores:* otros recreos y restaurantes campestres de la zona (Andahuaylas, San Jerónimo, Talavera, Pacucha) — nómbralos según la entrevista.
  - *Nuevos entrantes:* abrir un recreo es relativamente fácil → hay que diferenciarse.
  - *Sustitutos:* pollerías, delivery, comer en casa.
  - *Poder de los clientes:* alto — si demoran en atenderlo, se va al recreo de al lado.
  - *Poder de los proveedores:* productores locales (insumos) y distribuidoras de bebidas.
  - Cierra cada fuerza con "ChispaQR ayuda porque…".
- **Cadena de valor del recreo:** compra de insumos → cocina → servir → atención y venta → cobro. Señala que el cuello de botella está en **atención y venta (tomar el pedido)** y en **operaciones (la comanda que llega a cocina)**.
- **Laudon aplicado:** compara las 4 estrategias (liderazgo en costos, diferenciación, enfoque en nicho, intimidad con el cliente). Opciones fuertes para el recreo: **diferenciación** (ser de los primeros recreos de la zona con pedido por QR) o **liderazgo en costos** (no tener que contratar mozos extra en temporada alta). Elige una principal y defiéndela.
- **Objetivos medibles con el caso:** que se pueda decir "antes el cliente esperaba X min para pedir; con ChispaQR, Y min".
- En la entrevista pide también: **foto de una comanda en papel** (Iván la usa para la normalización) y cómo cambia el personal en **temporada alta** (Yandel la usa para roles y cuentas temporales).

---

## ❌ Qué NO hacer

- No describir tecnologías (Docker, JWT, PostgreSQL) en la sección IV: ahí se habla del **negocio**. Lo técnico solo se nombra y se cita la sección que lo explica.
- No inventar cifras del recreo; si falta un dato, "por confirmar".
- No poner en el resumen funciones que el prototipo todavía no tiene.
- No reescribir las secciones de otros al integrar: si ves un error, se lo devuelves al dueño.
- No escribir objetivos que nadie va a cumplir en el proyecto (cada OE debe tener al menos un RF de Yuri que lo cubra).
- No borrar las secciones XII–XVIII.

## Depende de / entrega a
- **Entregas a todos:** entrevista (Hito 1), los `OE` (Hito 1).
- **Necesitas de todos:** filas del ADR, referencias, líneas para conclusiones (Hito 2); de Triztan, enlace y estado del prototipo (Hito 3).

## En la exposición (≈ 4–5 min, abres)
1. El recreo y el problema con los datos de la entrevista.
2. Porter y cadena de valor en una lámina cada uno.
3. Estrategia de Laudon y objetivos.
4. Presentas a cada compañero y su parte.

Preguntas probables: ¿por qué esta estrategia de Laudon y no otra?, ¿en qué eslabón de la cadena de valor aporta más?, ¿cómo medirán si el objetivo se cumplió?
