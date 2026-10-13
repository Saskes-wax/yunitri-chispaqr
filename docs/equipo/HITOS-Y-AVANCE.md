# Tablero de avance


## Hitos

| Hito | Fecha | Qué debe estar listo |
|---|---|---|
| **Hito 0** — Arranque | ____ | Reunión 1: contrato leído y confirmado (✅). Repo creado con carpetas. Documento compartido con las 21 secciones. |
| **Hito 1** — Base | ____ | Entrevista hecha y compartida. OE (Nicolás). RF con códigos (Yuri). `01_esquema.sql` (Iván). Dockerfiles y lista de endpoints (Triztan). Primer borrador de Porter y cadena de valor (Nicolás). |
| **Hito 2** — Borradores | ____ | Todas las secciones I–XI en borrador. Trigger y datos de prueba (Iván). `docker-compose.yml` y RBAC (Yandel). BPMN AS-IS y TO-BE (Yuri). Flujo comensal → caja → cocina funcionando (Triztan). Filas del ADR y referencias entregadas a Nicolás. |
| **Hito 3** — Integración | ____ | Capturas de la XI. Resumen ejecutivo y conclusiones. Lista de coherencia pasada. Documento exportado. |
| **Hito 4** — Ensayo | ____ | Ensayo completo de la exposición con demo y video de respaldo. |
| **Entrega** | Semana 08 | Expediente 50 % + repo + exposición. |

Recordatorio: **al menos un commit por cada laboratorio del miércoles**.

## Avance por persona

### Nicolás
- [ ] Entrevista · [ ] I · [ ] IV Porter · [ ] IV Cadena de valor · [ ] IV Laudon · [ ] IV Objetivos · [ ] X ADR · [ ] XII–XVIII frase · [ ] XIX · [ ] XX · [ ] II Resumen · [ ] Integración

### Yuri
- [ ] III · [ ] V Actores · [ ] BPMN AS-IS · [ ] BPMN TO-BE · [ ] RF · [ ] RNF · [ ] Trazabilidad · [ ] Actas

### Iván
- [ ] ER · [ ] Normalización · [ ] Diccionario · [ ] `01_esquema.sql` · [ ] Trigger · [ ] Datos de prueba · [ ] Consultas de prueba · [ ] Filas ADR

### Yandel
- [ ] VI Contenedores · [ ] VI IaaS/PaaS/SaaS · [ ] VI Pública/privada · [ ] `docker-compose.yml` · [ ] Diagrama despliegue · [ ] IX Topología · [ ] IX VPN · [ ] IX Zero Trust · [ ] IX RBAC · [ ] Filas ADR

### Triztan
- [ ] Repo y carpetas · [ ] README · [ ] Pantalla QR + nombre · [ ] Carta + carrito · [ ] Confirmación + estado · [ ] Login · [ ] Caja · [ ] Cocina · [ ] VII · [ ] XI capturas · [ ] Filas ADR

## Lista de coherencia antes de entregar

Nicolás la pasa con el documento integrado. Cada "no" se devuelve a su dueño.

- [ ] ¿El nombre del sistema y del recreo es **el mismo** en todas las secciones?
- [ ] ¿Los actores de la V, los roles de la IX, la tabla `rol` de la VIII y los roles del JWT en la VII son **los mismos**?
- [ ] ¿Los estados del pedido son idénticos en el BPMN (V), el diccionario y el trigger (VIII), los endpoints (VII) y las capturas (XI)?
- [ ] ¿Cada `OE` tiene al menos un RF que lo cubra? ¿Cada RF de prioridad alta se ve en el prototipo o se dice que falta?
- [ ] ¿Todas las secciones dicen **PostgreSQL 16**, **Docker Compose**, **monolito modular**, **JWT**, **IaaS** y **nube pública**? (ni una que diga otra cosa)
- [ ] ¿La matriz RBAC (IX) coincide con la columna "Quién" de los endpoints (VII)?
- [ ] ¿Lo que dice el resumen (II) existe de verdad en la XI?
- [ ] ¿Las secciones VI, VII, VIII, IX y XI tienen **justificación gerencial** (en soles, minutos o clientes)?
- [ ] ¿Las secciones XII–XVIII tienen la frase de pendiente con su semana?
- [ ] ¿Toda cita del texto está en la XX y toda referencia de la XX se cita en el texto?
- [ ] ¿Los datos del recreo salen todos de la entrevista?
- [ ] ¿La carátula tiene versión del documento, fecha y enlace al repo?
