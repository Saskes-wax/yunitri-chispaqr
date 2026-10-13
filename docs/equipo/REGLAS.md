# Reglas de trabajo y del repositorio

Para que al juntar todo **no se contradiga nada**.

## Las 7 reglas para no desencaminarse

1. **El contrato manda.** Nombres de tablas, actores, estados, módulos, tecnologías y rutas de la API se copian de ahí, letra por letra.
2. **Cada uno escribe solo su sección.** Si necesitas algo de otra sección, **lo citas por su código** (RF-03, ADR-02, `pedido.estado`), no lo vuelves a explicar con tus palabras.
3. **Si ves una contradicción, no la arreglas tú en tu sección:** la avisas en el grupo y se resuelve en el contrato.
4. **No se inventan datos del recreo.** Todo número sale de la entrevista; si no está, "por confirmar".
5. **Nada de tecnologías extra** que no estén en el contrato (ni MongoDB, ni microservicios, ni Firebase, ni "también podría ser…"). Las alternativas se mencionan **solo** en la columna "Alternativas consideradas" del ADR.
6. **Cada uno entrega en la fecha del hito**, aunque sea un borrador. Es mejor un borrador a tiempo que algo perfecto el último día (el docente evalúa constancia).
7. **Cada uno hace commits reales** al repo con lo suyo (diagramas, SQL, documentación). La rúbrica mira los commits.

## Repositorio de GitHub (lo administra Triztan)

- Nombre: `yunitri-chispaqr`. Triztan es dueño; los otros cuatro, colaboradores.
- Rama `main` protegida: **nadie sube directo a `main`**. Se trabaja en una rama y se abre un *pull request*; Triztan lo revisa y lo junta.
- Nombre de ramas: `docs/<seccion>-<nombre>` (ej. `docs/viii-ivan`) o `feat/<modulo>` (ej. `feat/caja`).
- Mensaje de commit: `tipo(seccion o módulo): qué hiciste`
  - `docs(VIII): diccionario de datos v1`
  - `feat(M3): carrito del comensal`
  - `fix(M4): caja no mostraba pedidos de la mesa 10`

### Estructura de carpetas (fija)

```
yunitri-chispaqr/
├── README.md                ← qué es, cómo levantarlo (Triztan)
├── docker-compose.yml       ← Yandel escribe la versión documentada; Triztan la mantiene funcionando
├── .env.example             ← variables sin contraseñas reales
├── api/                     ← backend Node.js + Express (Triztan)
├── web/                     ← frontend: comensal, caja, cocina, admin (Triztan)
├── database/
│   ├── 01_esquema.sql       ← tablas (Iván)
│   ├── 02_triggers.sql      ← trigger(s) (Iván)
│   ├── 03_datos_prueba.sql  ← carta real del recreo, mesas, usuarios de prueba (Iván)
│   └── consultas_prueba.sql ← consultas que demuestran que funciona (Iván)
└── docs/
    ├── equipo/              ← CONTRATO.md + el archivo de tareas de cada uno + actas
    ├── api/endpoints.md     ← (Triztan)
    ├── diagramas/           ← BPMN (Yuri), ER (Iván), arquitectura e infraestructura y red (Yandel), arquitectura de software (Triztan)
    └── evidencias/          ← capturas para la sección XI y anexos
```

## Cómo se arma el documento final (sin pisarse)

1. Nicolás crea **un solo documento compartido** (Google Docs u OneDrive) con las 21 secciones ya puestas y el formato del docente.
2. Cada uno escribe **solo dentro de sus secciones**.
3. Al final de cada sección, cada uno pega sus referencias APA en una lista aparte, "Referencias de [nombre]"; Nicolás las une en la XX.
4. Nicolás hace la **revisión de coherencia** con la lista de coherencia y numera figuras y tablas.
5. Recién después se exporta a Word/PDF.

## Reuniones

- **Reunión 1 (ya):** se lee el contrato, se confirma o corrige, se marca ✅. Acta → Yuri.
- **Una reunión corta por semana**, después del laboratorio del miércoles: cada uno dice qué terminó, qué sigue y qué le falta de otro. Acta → Yuri (Plantilla acta de reunión).
