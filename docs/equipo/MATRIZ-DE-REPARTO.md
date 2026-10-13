# Matriz de reparto


## Quién hace qué

| Integrante | Rol | Secciones del expediente | En el repo | Expone |
|---|---|---|---|---|
| **Nicolás** | Líder y analista de negocio | I, II, IV, X (consolida), XII–XVIII (frase "Pendiente"), XIX, XX | `docs/equipo/` (contrato al día) | El problema, el recreo, Porter, cadena de valor, Laudon y objetivos |
| **Yuri** | Analista de requerimientos y procesos | III, V, XXI (actas) | `docs/diagramas/bpmn-*`, `docs/equipo/actas/` | Alcance, actores, proceso BPMN y requerimientos |
| **Iván** | Responsable de base de datos | VIII + sus filas del ADR | `database/` completo, `docs/diagramas/er-*` | Modelo ER, normalización, diccionario y trigger |
| **Yandel** | Responsable de infraestructura y seguridad | VI, IX + sus filas del ADR | `docker-compose.yml` (documentado), `docs/diagramas/infra-*`, `docs/diagramas/red-*` | Docker, nube, red, VPN, Zero Trust y RBAC |
| **Triztan** | Desarrollo y repositorio | VII, XI, XXI (enlace y capturas) + sus filas del ADR | Dueño del repo: `api/`, `web/`, `README.md`, `docs/api/` | Arquitectura de software, API y **demo del prototipo** |

Tareas detalladas (qué hacer y qué NO hacer):
- Nicolas - Caso empresarial y coordinación
- Yuri - Alcance y requerimientos
- Ivan - Base de datos
- Yandel - Infraestructura y seguridad
- Triztan - Repositorio y aplicación

## Quién le entrega qué a quién (las costuras donde se suele romper todo)

| De | Para | Qué | Para cuándo |
|---|---|---|---|
| Nicolás | Todos | Respuestas de la entrevista (mesas, personal, horas punta, pagos, internet) | Hito 1 |
| Yuri | Triztan, Iván | Lista de RF con códigos (base ya en el contrato) | Hito 1 |
| Iván | Triztan | `01_esquema.sql` + `02_triggers.sql` + `03_datos_prueba.sql` que corran en PostgreSQL 16 | Hito 1 (esquema) / Hito 2 (trigger y datos) |
| Triztan | Yandel | `Dockerfile` de `api` y `web` funcionando | Hito 1 |
| Yandel | Triztan | `docker-compose.yml` final + `.env.example` | Hito 2 |
| Triztan | Yuri, Yandel, Iván | Lista de endpoints con roles (para RBAC, RF y pruebas) | Hito 1 |
| Yandel | Triztan | Matriz RBAC final (qué rol puede qué endpoint) | Hito 2 |
| Todos | Nicolás | Filas del ADR + referencias APA + 1–2 líneas para conclusiones | Hito 2 |
| Triztan | Nicolás | Capturas y enlace al commit para la XI y la XXI | Hito 3 |

## Reparto equitativo — por qué es justo

- Cada uno tiene **una parte técnica y una parte escrita** y **expone lo suyo**.
- Triztan carga más código; Nicolás carga más redacción e integración; Yuri, Iván y Yandel tienen cada uno 2 secciones fuertes.
- Todos aportan **commits** al repo (la rúbrica del laboratorio lo mira por persona).
