# Cómo crear un agente (explicado con los de PidoHora)

Esta guía es para entender **cómo se hace** un agente, no solo usarlo. Los ejemplos son los dos agentes reales del repositorio: `.claude/agents/disenador-figma.md` y `.claude/agents/figma-a-codigo.md`. Ábrelos al lado mientras lees.

## 1. La idea en una frase

Un agente es **un archivo de texto** con dos partes: una ficha corta (quién es y cuándo llamarlo) y un brief largo (cómo tiene que trabajar). No hay código. Escribir un agente se parece mucho más a escribir el brief para un diseñador freelance que a programar.

Analogía de diseño: el agente es como un **componente maestro** en Figma.

| En Figma | En un agente |
| --- | --- |
| Nombre del componente | `name` |
| Descripción del componente (para que otros sepan cuándo usarlo) | `description` |
| Propiedades que se pueden o no cambiar | `tools` / `disallowedTools` (qué puede tocar) |
| Las capas y reglas internas | Las instrucciones (el brief) |
| Instancias en distintas pantallas | Cada vez que lo llamas, es una "instancia" nueva que empieza de cero |

## 2. Dónde vive

Claude Code busca los agentes en una carpeta fija:

```
pidohora/
└── .claude/
    ├── agents/                 ← aquí van los agentes
    │   ├── disenador-figma.md
    │   └── figma-a-codigo.md
    └── skills/
        └── disenar/SKILL.md    ← el "director" que los coordina
```

- `.claude/agents/` dentro del proyecto: el agente es del proyecto y lo usa cualquiera que trabaje en el repositorio.
- `~/.claude/agents/` (en tu computador): el agente es tuyo y sirve en cualquier proyecto.

El nombre del archivo no importa tanto; lo que manda es el campo `name` de adentro.

## 3. Anatomía del archivo

```markdown
---
name: disenador-figma
description: Diseñador visual de PidoHora. Crea pantallas… Úsalo cuando haya que diseñar…
---

Eres el diseñador visual de PidoHora…
(las instrucciones)
```

### La ficha (entre las dos líneas `---`)

Se llama *frontmatter*. Son datos cortos que Claude lee **antes** de decidir si llama al agente.

- **`name`**: identificador, en minúsculas y con guiones. Es como lo llamas: "usa el agente `disenador-figma`".
- **`description`**: lo más importante de la ficha. Claude la lee para decidir **cuándo** delegarle trabajo. Tiene que decir qué hace y cuándo usarlo. Fíjate que la del diseñador termina con "No escribe código": eso evita que Claude le pida programar.
- **`tools`** (opcional): la lista de herramientas que puede usar, por ejemplo `tools: Read, Grep, Glob`. Si no lo pones, hereda todas las de la sesión, incluidas las de Figma. En nuestros dos agentes no lo pusimos porque necesitan las herramientas de Figma y su nombre exacto cambia según cómo conectaste Figma.
- **`disallowedTools`** (opcional): lo contrario, lo que **no** puede usar. Por ejemplo, un revisor que solo debe opinar llevaría `disallowedTools: Write, Edit`. Es la forma de poner un permiso "de verdad" y no solo pedirlo por favor en el texto.
- **`model`** (opcional): qué modelo usa. Si no lo pones, usa el mismo de tu sesión.

### Las instrucciones (todo lo de abajo)

Es el *system prompt*: lo primero que el agente lee cada vez que nace. Ojo con esto: **el agente no ve tu conversación**. Solo sabe lo que dice este archivo y lo que le pasen al llamarlo. Por eso todo lo importante tiene que estar escrito.

## 4. Las 6 piezas de un buen brief

Todo agente bueno responde estas seis preguntas. Mira cómo lo hace `disenador-figma.md`:

| Pieza | Pregunta | En el diseñador |
| --- | --- | --- |
| 1. Rol | ¿Quién eres y para quién trabajas? | "Eres el diseñador visual de PidoHora… Charles decide, tú propones" |
| 2. Contexto | ¿Qué tienes que saber del producto y dónde están las cosas? | Enlace al Figma, dónde están los tokens y los componentes |
| 3. Proceso | ¿Qué pasos sigues, en qué orden? | Los 7 pasos: entender, cargar guías, abrir sesión, buscar, diseñar, revisar, entregar |
| 4. Criterios de calidad | ¿Cómo sabes que quedó bien? | "Reglas de diseño": nada de valores sueltos, contraste AA, Auto Layout, estados |
| 5. Límites | ¿Qué no puedes hacer nunca? | "No modificas ni borras páginas o componentes existentes", "no escribes código" |
| 6. Entrega | ¿Qué devuelves y en qué formato? | Enlace al frame, 3 a 5 decisiones, supuestos, pendientes |

Si te falta una de las seis, el agente la va a improvisar. Y un agente improvisando es como un freelance sin brief: puede salir bien, pero no lo controlas.

## 5. Por qué escribimos lo que escribimos

Algunas decisiones de nuestros agentes, para que veas que cada línea tiene un motivo:

- **"Trabaja solo en la página 🤖 Propuestas"**: un agente que escribe en Figma puede romper tu sistema oficial. Darle un espacio propio es como darle a un practicante su propia página para explorar.
- **"Una búsqueda agrupada, una captura final"**: Figma limita las lecturas por mes en el plan Starter. Si no se lo dices, el agente lee el archivo nodo por nodo y se gasta el cupo en una tarde.
- **"Si te falta algo, asume y escríbelo"**: los agentes trabajan sin ti mirando. Si se detienen por cada duda, nunca terminan.
- **"Si un color no pasa el contraste, no lo apliques"** (en `figma-a-codigo`): convertimos una regla de calidad en un paso verificable, porque el repositorio tiene una prueba automática de contraste.
- **Dos agentes y no uno**: diseñar y programar piden mentalidades distintas y herramientas distintas. Separarlos también nos permite poner la aprobación de Charles justo en medio.

## 6. De agente a multiagente

Un agente solo es un especialista. Varios necesitan a alguien que los coordine. Eso es `.claude/skills/disenar/SKILL.md`: una **skill**, que es parecida a un agente pero se usa como comando (`/disenar …`) y corre en tu conversación principal.

El director hace tres cosas que los agentes no pueden:

1. **Arma el brief** a partir de lo que escribiste.
2. **Llama a cada agente** en orden y le pasa lo que necesita (recuerda: ellos no ven la conversación).
3. **Te pone en el medio**: entre diseñar y programar, espera tu aprobación.

Agente o skill, ¿cuándo cada uno?

- **Agente**: un especialista que trabaja aparte, con su propia "mesa" limpia, y te devuelve un resultado. Sirve para tareas largas o que ensucian el contexto (leer mucho Figma, cambiar muchos archivos).
- **Skill**: una receta que sigue tu conversación principal. Sirve para flujos donde tú participas, como `/disenar`.

## 7. Hazlo tú: tu primer agente en 15 minutos

Ejercicio: crear un `critico-ux` que revise un diseño y solo opine.

1. **Crea el archivo** `.claude/agents/critico-ux.md`. Puedes hacerlo desde VS Code o directamente en GitHub (botón "Add file" → "Create new file", escribiendo la ruta completa en el nombre).
2. **Escribe la ficha:**
   ```markdown
   ---
   name: critico-ux
   description: Revisa una pantalla de PidoHora en Figma y devuelve una crítica priorizada de UX y accesibilidad. Solo opina, nunca modifica nada.
   disallowedTools: Write, Edit
   ---
   ```
3. **Escribe el brief** respondiendo las 6 piezas de la sección 4. Tú ya sabes hacer una crítica de diseño: escribe cómo la harías tú (qué miras primero, qué es grave, qué es detalle).
4. **Pruébalo**: abre Claude Code en el repositorio, escribe `/agents` para ver que aparece en la lista, y luego "usa el agente critico-ux para revisar este frame: <enlace de Figma>".
5. **Itera**: si la crítica sale genérica, el brief está genérico. Agrega ejemplos concretos de PidoHora ("una clienta que reserva desde Instagram") y vuelve a probar.

Atajo: en Claude Code, `/agents` → "Create new agent" te guía y puede escribir un primer borrador. Úsalo, pero luego **lee y edita** el borrador con las 6 piezas en mente: el borrador automático casi nunca sabe lo que tú sabes de tu producto.

## 8. Errores típicos

- **Descripción vaga** ("ayuda con diseño"): Claude no sabrá cuándo llamarlo, o lo llamará para todo.
- **Agente que hace de todo**: si su descripción necesita la palabra "y" tres veces, probablemente son dos agentes.
- **Suponer que recuerda**: cada llamada empieza de cero. Lo que no está en el archivo o en el pedido, no existe.
- **Permisos solo por texto**: "por favor no edites" funciona casi siempre; `disallowedTools` funciona siempre. Para lo crítico, usa lo segundo.
- **Crear agentes antes de tener el problema**: un agente es mantenimiento. Créalo cuando repitas la misma tarea varias veces, no antes.
