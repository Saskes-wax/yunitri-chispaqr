# Plantilla ADR (Registro de decisiones técnicas — sección X)

Cada uno manda sus filas a Nicolás; él las numera.

| Código | Decisión | Alternativas consideradas | Justificación (técnica + para el recreo) | Semana | Responsable |
|---|---|---|---|---|---|
| ADR-01 | Contenedores con Docker Compose | Máquinas virtuales; instalación directa en el servidor | … | 0_ | Yandel |
| ADR-02 | Monolito modular con API REST | Microservicios | … | 0_ | Triztan |
| ADR-03 | PostgreSQL 16 (relacional, OLTP) | MySQL; MongoDB (NoSQL) | … | 0_ | Iván |
| ADR-04 | JWT para personal + token en el QR para comensal | OAuth 2.0; API Key; sesiones en servidor | … | 0_ | Triztan |
| ADR-05 | IaaS (VPS) en nube pública | PaaS; servidor propio en el recreo | … | 0_ | Yandel |
| ADR-06 | VPN WireGuard solo para administración + HTTPS | OpenVPN; sin VPN | … | 0_ | Yandel |
| ADR-07 | Trigger de transición de estados en la BD | Validar solo en la API | … | 0_ | Iván |
| ADR-08 | Pago en caja antes de enviar a cocina | Pagar al final; pago en línea | … | 0_ | Nicolás |

**Cambios al contrato** también se registran aquí (ej. "ADR-09 — Se cambia IaaS por PaaS porque…").
