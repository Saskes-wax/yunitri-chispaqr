# Git, Docker y entrega

## Git
- Nunca trabajar directo en `main`. Ramas: `feat/<modulo>`, `fix/<modulo>-<problema>`, `docs/<seccion>-<nombre>`, `refactor/<tema>`, `test/<tema>`.
- Mensajes (convención del equipo): `tipo(módulo o sección): qué se hizo` → `feat(M4): registrar pago con método`, `fix(M5): cocina mostraba pedidos no pagados`, `test(M3): total calculado en servidor`.
- Commits **pequeños y atómicos** (un cambio lógico, el proyecto compila y pasa pruebas en cada commit). Mínimo uno por laboratorio.
- Antes de commit: `npm run lint`, `npm test`, revisar `git diff` (sin secretos, sin `console.log` de depuración, sin archivos ajenos).
- PR con: qué cambia, RF que cubre, cómo probarlo, capturas si es pantalla. Otro integrante revisa antes de juntar.
- `.gitignore` desde el primer commit: `node_modules/`, `.env`, `*.log`, `dist/`, `coverage/`, `.DS_Store`.

## Dockerfile de la API (multi-etapa, sin root)
```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 CMD wget -qO- http://localhost:3000/api/v1/health || exit 1
CMD ["node", "src/server.js"]
```
- Versión de imagen fija; `.dockerignore` con `node_modules`, `.env`, `.git`, `test`.
- `CMD` con `node` directo (no `npm start`) para recibir `SIGTERM` y apagar ordenado.

## docker-compose.yml (servicios fijos: `db`, `api`, `web`)
- `db`: `postgres:16-alpine`, volumen con nombre, scripts de `database/` montados en `/docker-entrypoint-initdb.d`, `healthcheck` con `pg_isready`, **sin** `ports` publicados en producción.
- `api`: `depends_on: db: condition: service_healthy`, `env_file: .env`, `restart: unless-stopped`.
- `web`: Nginx sirve estáticos y hace proxy de `/api/` → `api:3000` (mismo origen, sin CORS); es el único con puerto publicado (80/443).
- Ninguna contraseña escrita en el compose: todo por `${VARIABLE}` desde `.env`.

## README mínimo
Qué es · requisitos (Docker) · `cp .env.example .env` · `docker compose up -d --build` · URLs de cada pantalla · usuarios de prueba · cómo correr pruebas · estructura de carpetas · enlace a `docs/api/endpoints.md`.

## Documentar cambios
- Endpoint nuevo o cambiado → `docs/api/endpoints.md` (verbo, ruta, rol, body, respuestas, errores).
- Variable nueva → `.env.example` con comentario.
- Decisión técnica nueva o desvío del contrato → fila en el ADR.
