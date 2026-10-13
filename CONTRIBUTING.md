# Cómo trabajar en el repositorio

Regla principal: **nadie sube directo a `main`**. Cada uno trabaja en su propia rama y abre un *pull request* (PR); Triztan lo revisa y lo junta. Así nadie pisa lo de otro y se ven los commits de cada uno (la rúbrica los mira por persona).

## 1. Primera vez

1. Crea tu cuenta en GitHub (si no tienes) y pásale tu **usuario** a Triztan.
2. Te llegará una invitación por correo o en <https://github.com/notifications>. **Acéptala** (vence en 7 días).
3. Lee el [contrato](docs/equipo/CONTRATO.md) y tu archivo en [`docs/equipo/tareas/`](docs/equipo/tareas/).

## 2. Nombre de tu rama

| Tipo | Formato | Ejemplo |
|---|---|---|
| Documentación / diagramas / SQL | `docs/<seccion>-<nombre>` | `docs/viii-ivan`, `docs/v-yuri`, `docs/ix-yandel`, `docs/iv-nicolas` |
| Código de la app | `feat/<modulo>` | `feat/caja`, `feat/m3-carrito` |
| Corrección | `fix/<algo>` | `fix/caja-mesa-10` |

## 3. Mensaje de commit

`tipo(seccion o módulo): qué hiciste`

- `docs(VIII): diccionario de datos v1`
- `docs(V): BPMN AS-IS`
- `feat(M3): carrito del comensal`
- `fix(M4): caja no mostraba pedidos de la mesa 10`

Commits **pequeños y seguidos**: mínimo uno por cada laboratorio del miércoles. Subir todo el último día se nota y baja puntos.

## 4A. Si nunca usaste Git — desde la web de GitHub

1. Entra al repositorio. Arriba a la izquierda, en el botón que dice **`main`**, escribe el nombre de tu rama (ej. `docs/viii-ivan`) y elige **"Create branch: docs/viii-ivan from main"**.
2. Con tu rama seleccionada, entra a tu carpeta (ej. `database/`) → **Add file → Upload files** → arrastra tus archivos.
3. Abajo, en *Commit changes*, escribe el mensaje (ej. `docs(VIII): diagrama ER v1`) y deja marcado **"Commit directly to the docs/viii-ivan branch"**. Clic en **Commit changes**.
4. Aparecerá un aviso amarillo **"Compare & pull request"** → clic → revisa el título → **Create pull request**.
5. Listo. Triztan lo revisa y lo junta a `main`. Para tu siguiente avance, vuelve a usar **tu misma rama** (paso 2) si el PR sigue abierto, o crea una nueva si ya se juntó.

## 4B. Con Git en tu computadora

```bash
git clone https://github.com/Saskes-wax/yunitri-chispaqr.git
cd yunitri-chispaqr
git switch -c docs/viii-ivan          # tu rama
# ... agregas o editas tus archivos ...
git add database/01_esquema.sql
git commit -m "docs(VIII): esquema inicial"
git push -u origin docs/viii-ivan
```

Luego abre el PR desde GitHub. Antes de empezar algo nuevo, actualiza:

```bash
git switch main && git pull
git switch -c feat/otra-cosa
```

## 5. Qué NO se sube nunca

- Contraseñas, el archivo `.env` real, claves o tokens (solo `.env.example`).
- `node_modules/`.
- El expediente en Word como trabajo principal (el repo guarda lo técnico; el expediente lo enlaza).
- Archivos de otros integrantes: si ves un error en lo de otro, avísale o abre un Issue.

## 6. Diagramas

Hechos en **draw.io**. Se suben **dos archivos**: el `.png` exportado y el `.drawio` editable, a `docs/diagramas/`. Nombres: `bpmn-as-is.png`, `bpmn-to-be.png`, `er-chispaqr.png`, `infra-despliegue.png`, `red-topologia.png`, `arquitectura-software.png`.

## 7. ¿Hay que cambiar algo del contrato?

Se avisa en el grupo → se agrega una fila en [`docs/equipo/ADR.md`](docs/equipo/ADR.md) → Nicolás y Triztan lo aprueban → se actualiza `docs/equipo/CONTRATO.md`. Hasta entonces vale lo que dice el contrato.
