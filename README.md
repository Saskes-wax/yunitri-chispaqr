# ChispaQR — pedidos por QR para el Recreo "Chispa"

Proyecto Formativo Integrador (Expediente Técnico) del curso **Sistemas de Información** — Ciclo V — 2026-II
Universidad Nacional José María Arguedas · Escuela Profesional de Ingeniería de Sistemas
Docente: Mtro. Rojas Silva Jhamer Anderson · Equipo **Yunitri**

> **Problema:** en horas punta el recreo tiene más clientes de los que sus mozos pueden atender; los clientes esperan para pedir, se equivocan pedidos y algunos se van.
>
> **Propuesta:** ChispaQR es un sistema web en el que el cliente escanea el código QR de su mesa, ve la carta, registra su pedido con su nombre y lo paga en caja; solo los pedidos pagados pasan a cocina.

Estado: **Avance 50 % (Semana 08)** — en construcción.

## Integrantes y roles

| Integrante | Rol | Carpeta que sube |
|---|---|---|
| Meza Rodas, Nicolás Yuliño | Líder del equipo y analista de negocio | `docs/equipo/` (contrato, entrevista) |
| Huamán Pultay, Yury Kevin | Analista de requerimientos y procesos | `docs/diagramas/bpmn-*`, `docs/equipo/actas/` |
| Lara Flores, Iván | Responsable de base de datos | `database/`, `docs/diagramas/er-*` |
| Allccahuamán Rupailla, Lenin Yandel | Responsable de infraestructura y seguridad | `docker-compose.yml`, `docs/diagramas/infra-*`, `red-*` |
| Miranda Ochoa, Triztan Yandel | Desarrollo (backend/frontend) y repositorio | `api/`, `web/`, `docs/api/`, `README.md` |

El detalle de qué hace cada uno está en [`docs/equipo/tareas/`](docs/equipo/tareas/).

## Antes de empezar (todo el equipo)

1. Lee el **[contrato del equipo](docs/equipo/CONTRATO.md)**: nombres de tablas, estados, roles, módulos y rutas se copian de ahí, letra por letra.
2. Lee **[CONTRIBUTING.md](CONTRIBUTING.md)**: cómo subir tu parte (con Git o desde la web) sin tocar `main`.
3. Revisa tus tareas en la pestaña **Issues** (filtra por tu nombre) y en el tablero del proyecto.

## Stack

Node.js 20 + Express · PostgreSQL 16 · HTML/CSS/JS · Docker + Docker Compose (servicios `db`, `api`, `web`) · JWT para el personal + token de mesa en el QR para el comensal.

## Estructura

```
yunitri-chispaqr/
├── README.md
├── CONTRIBUTING.md          ← cómo trabajar en el repo
├── docker-compose.yml       ← db, api, web (Yandel / Triztan)
├── .env.example             ← variables sin contraseñas reales
├── api/                     ← backend Node.js + Express (Triztan)
├── web/                     ← comensal, caja, cocina, admin (Triztan)
├── database/                ← esquema, triggers, datos y consultas de prueba (Iván)
└── docs/
    ├── equipo/              ← CONTRATO, reglas, reparto, hitos, ADR, tareas, actas
    ├── api/endpoints.md     ← lista de endpoints (Triztan)
    ├── diagramas/           ← BPMN (Yuri), ER (Iván), infraestructura y red (Yandel), arquitectura (Triztan)
    └── evidencias/          ← capturas para las secciones XI y XXI
```

## Cómo levantarlo

> Se completa cuando estén listos `database/01_esquema.sql`, los `Dockerfile` y el `docker-compose.yml` final (Hito 2).

```bash
git clone https://github.com/Saskes-wax/yunitri-chispaqr.git
cd yunitri-chispaqr
cp .env.example .env      # y cambia las contraseñas
docker compose up -d
```

- Web: http://localhost:8080
- API: http://localhost:3000/api/v1/health
