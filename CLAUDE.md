# Portfolio de Pablo García Aljibe

Este archivo es el contexto principal para Claude Code en este repositorio. Léelo entero
antes de tocar nada. Si algo de aquí entra en conflicto con lo que pida Pablo en la
conversación, manda lo que diga Pablo. Si un cambio suyo contradice este archivo de forma
duradera, propón actualizar este archivo.

---

## 1. Qué es este proyecto

La web personal de Pablo: un portfolio para buscar su primer empleo como desarrollador
tras terminar Ingeniería Multimedia (Universidad de Alicante, 2026) y 5 meses de prácticas
en 1MillionBot.

**Qué debe ser:**

- **Una landing principal vistosa**, con todo lo importante en un solo scroll.
- **Una página de detalle por proyecto**, a la que se llega al hacer clic en su tarjeta.
- **Pocas páginas.** No hay blog, ni "sobre mí" separado, ni panel de administración.
- **Sencilla de mantener:** añadir un proyecto es añadir un archivo de contenido, no tocar componentes.

**A quién va dirigida:** responsables de selección y equipos técnicos de empresas de
desarrollo web, IA y producto. Tienen poco tiempo. En 10 segundos deben entender quién es
Pablo, qué sabe hacer y cómo contactarle.

**Qué debe transmitir:** un perfil full-stack sólido (Node.js, TypeScript, React, Angular,
PostgreSQL, Docker), experiencia real con IA aplicada y algo que la mayoría de portfolios
de desarrolladores no tiene: formación y trabajo en producción 3D. La propia web es una
muestra de su criterio de diseño y de su nivel técnico.

---

## 2. Reglas de trabajo

1. **No inventes datos.** Fechas, métricas, cargos, clientes, enlaces y tecnologías salen
   de la sección 7 de este archivo o de Pablo. Si falta algo, deja un `TODO:` visible en el
   contenido y avísalo. Nunca rellenes con texto plausible.
2. **Confidencialidad de 1MillionBot.** Los proyectos de las prácticas son de clientes de la
   empresa. Por defecto se describen de forma genérica (ver 7.3), sin capturas, código,
   nombres de clientes, URLs internas ni datos de los repos. Solo se cambia si Pablo
   confirma que tiene permiso.
3. **Alcance cerrado.** Nada de páginas, secciones, dependencias o integraciones que no
   estén aquí sin preguntar antes.
4. **Diseño antes que código.** Para la dirección visual de la landing, presenta 2–3
   propuestas (descritas o como maqueta rápida) y espera a que Pablo elija antes de
   construirla entera.
5. **Idioma.** El contenido de la web va en español. El código (nombres de componentes,
   variables, commits) va en inglés. Habla con Pablo en español.
6. **Commits pequeños** y con mensajes claros en inglés. No hagas push sin que lo pida.

---

## 3. Stack

| Capa | Elección | Por qué |
| --- | --- | --- |
| Framework | **Astro** (última versión estable) | Web casi estática: HTML sin JS por defecto, carga muy rápida, rutas por archivo y colecciones de contenido para los proyectos. |
| Interactividad | **React** en islas (`@astrojs/react`) | Solo los componentes animados o interactivos cargan JS. Las skills de diseño instaladas están pensadas para React. |
| Estilos | **Tailwind CSS v4** con el plugin de Vite (`@tailwindcss/vite`) | Pablo ya lo usa y es lo que esperan las skills. Configuración CSS-first con `@theme` en `src/styles/global.css`. **No** se usa `tailwind.config.js` ni el plugin de PostCSS. |
| Animación | **CSS** primero; **Motion** (`motion/react`) para springs, layout y salidas | Criterio de las skills de Emil Kowalski: CSS para hover, estados y entradas simples; Motion solo cuando haga falta. |
| Navegación | **View Transitions** de Astro (`<ClientRouter />`) | Transición continua de la tarjeta de un proyecto a su página de detalle. |
| Contenido | **Content Collections** + MDX (`@astrojs/mdx`) con esquema Zod | Cada proyecto es un archivo `.mdx` validado. |
| 3D | **React Three Fiber** + **drei** (three.js) con un `.glb` exportado de Blender | Un solo motor para el visor del TFG y para el futuro personaje animado con el scroll en la landing. La escena es una isla React cargada bajo demanda (`React.lazy`), así three.js no pesa en la carga inicial. |
| Imágenes | `astro:assets` (`<Image />`, `<Picture />`) | AVIF/WebP y tamaños responsive automáticos. |
| Fuentes | Autoalojadas (`@font-face` + `font-display: swap`) o la API de fuentes de Astro si es estable | No enlazar Google Fonts con `<link>` en producción. |
| Iconos | Un único set ligero y coherente (p. ej. Phosphor) | Ver anti-patrones en la sección 8. |
| Calidad | TypeScript estricto, ESLint, Prettier (`prettier-plugin-astro`, `prettier-plugin-tailwindcss`) | |
| Despliegue | **Vercel** (adaptador estático, sin SSR) | Previews por rama y dominio propio. |

**Antes de instalar algo, comprueba en la documentación oficial la versión y la forma de
integrarlo**, sobre todo Astro, Tailwind v4 y Motion, que cambian a menudo. No te fíes de
APIs recordadas.

### Comandos

```bash
npm create astro@latest .        # solo la primera vez (plantilla mínima, TypeScript estricto)
npx astro add react mdx          # integraciones
npm install tailwindcss @tailwindcss/vite motion
npm run dev                      # http://localhost:4321
npm run dev -- --force           # tras cambiar el esquema de content.config.ts (vacía la caché de contenido)
npm run build && npm run preview # comprobar la build de producción
npx astro check                  # tipos y contenido
```

### Adaptaciones respecto a las skills

`design-taste-frontend` asume **Next.js con Server Components** y `next/font`. Aquí no hay
Next. Equivalencias:

- **Server Component → componente `.astro`.** Todo lo estático se escribe en `.astro`.
- **Client Component (`"use client"`) → componente React con directiva de hidratación.**
  Usa `client:visible` por defecto y `client:load` solo si debe funcionar al instante.
- **`next/font` → fuentes autoalojadas** (ver tabla).
- **`next/image` → `astro:assets`.**

Cualquier componente con Motion, listeners de scroll o física de puntero es una isla React
pequeña y aislada. El layout nunca se hidrata entero.

### Servidores MCP de Claude Code

Instalados el 2026-10-03. Úsalos en lugar de recordar APIs o estimar métricas:

| Servidor | Ámbito | Para qué |
| --- | --- | --- |
| `astro-docs` (`https://mcp.docs.astro.build/mcp`) | Local (solo Pablo, en `~/.claude.json`) | Documentación oficial y al día de Astro. **Consúltalo antes de usar cualquier API de Astro** (Content Collections, `astro:assets`, fuentes, `ClientRouter` y sus eventos, integraciones). |
| `chrome-devtools` (`chrome-devtools-mcp`) | Proyecto (`.mcp.json`, en el repo) | Auditorías de Lighthouse, trazas de rendimiento (Core Web Vitals), consola y red sobre la build o el servidor de desarrollo. Es la forma de comprobar el criterio de Lighthouse de la sección 11. |

- En Windows, `chrome-devtools` se lanza con `cmd /c npx …`: `npx` no arranca directamente
  como servidor stdio.
- Los nombres de servidor no admiten espacios (`astro-docs`, no `"Astro docs"`).
- Si `claude` no está en el PATH, el CLI que trae la app de escritorio está en
  `%APPDATA%\Claude\claude-code\<versión>\…\claude.exe`.

---

## 4. Estructura del repositorio

```text
/
├── CLAUDE.md
├── .mcp.json                             # servidores MCP del proyecto (chrome-devtools)
├── astro.config.mjs
├── public/
│   ├── cv/CV_Pablo_Garcia_Aljibe.pdf     # CV descargable (lo exporta Pablo desde Word)
│   ├── models/character.glb              # personaje del TFG (optimizado, ver sección 10)
│   └── favicon.svg
└── src/
    ├── content.config.ts                 # esquema Zod de la colección `projects`
    ├── content/projects/*.mdx            # un archivo por proyecto
    ├── data/profile.ts                   # perfil, experiencia, habilidades, idiomas, contacto
    ├── layouts/BaseLayout.astro          # <head>, SEO, fuentes, ClientRouter
    ├── components/                       # .astro (estáticos) y .tsx (islas)
    ├── pages/
    │   ├── index.astro                   # landing
    │   ├── proyectos/[slug].astro        # detalle de proyecto
    │   └── 404.astro
    └── styles/global.css                 # @import "tailwindcss"; @theme { ... }
```

Los datos personales viven en `src/data/profile.ts` y los proyectos en
`src/content/projects/`. Los componentes no llevan texto de contenido escrito a mano.

---

## 5. Páginas

### 5.1 Landing (`/`)

Orden orientativo. La dirección visual concreta se decide con Pablo (regla 4).

1. **Hero:** nombre, rol ("Ingeniero Multimedia · Desarrollo Full-Stack"), una frase de
   posicionamiento y dos llamadas a la acción: *Ver proyectos* y *Descargar CV*. Indicar
   "Disponible para incorporación inmediata".
2. **Proyectos destacados:** tarjetas que enlazan a `/proyectos/[slug]`. Es la sección más
   importante. Orden según `order` del esquema.
3. **Experiencia:** 1MillionBot, resumida (ver 7.2).
4. **Habilidades:** agrupadas como en el CV. Nada de barras de porcentaje ni "niveles".
5. **Formación:** grado y TFG en una línea, enlazando al proyecto del TFG.
6. **Contacto:** email, LinkedIn, GitHub y botón de descarga del CV. Sin formulario.

Navegación: enlaces ancla a las secciones. Debe funcionar perfectamente sin JS.

### 5.2 Detalle de proyecto (`/proyectos/[slug]`)

**Excepción (decidido con Pablo el 2026-10-03):** los proyectos con `confidential: true`
(prácticas en 1MillionBot) **no tienen página de detalle**. En la landing aparecen como
una lista compacta, sin tarjetas ni enlaces: título, resumen y las 5 primeras tecnologías.
Su MDX se conserva como fuente de datos. Lo controla `hasDetailPage` en `src/lib/projects.ts`.

Plantilla común para los demás proyectos:

- Cabecera: título, resumen de una línea, año, contexto (prácticas / académico / TFG),
  rol de Pablo y tecnologías.
- Imagen o medio principal (en el TFG, el visor 3D).
- Cuerpo MDX: problema → qué hizo Pablo → decisiones técnicas → resultado.
- Enlaces (demo, repo) solo si existen.
- Navegación a proyecto anterior/siguiente y vuelta a la landing.

La tarjeta de la landing y la cabecera del detalle comparten `transition:name` para que la
transición entre ambas sea continua.

---

## 6. Modelo de contenido (`src/content.config.ts`)

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(160),          // una línea para la tarjeta
      context: z.enum(['prácticas', 'académico', 'tfg']),
      year: z.string(),                      // "2026", "2025 – 2026"
      role: z.string(),
      stack: z.array(z.string()),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() })).optional(),
      // visor 3D: .glb en /public/models, póster (render del encuadre inicial) y alt
      model: z.object({ src: z.string(), poster: image(), alt: z.string() }).optional(),
      links: z.object({ demo: z.string().url().optional(), repo: z.string().url().optional() }).optional(),
      confidential: z.boolean().default(false), // true = sin capturas ni nombres de cliente
      featured: z.boolean().default(true),
      order: z.number(),
    }),
});

export const collections = { projects };
```

Comprueba la API vigente de Content Collections en la documentación de Astro antes de
usar este esquema tal cual.

---

## 7. Contenido (fuente de verdad: el CV de Pablo)

### 7.1 Perfil

- **Nombre:** Pablo García Aljibe
- **Rol:** Ingeniero Multimedia · Desarrollo Full-Stack
- **Ubicación:** Elche, España
- **Estado:** disponible para incorporación inmediata
- **Email:** pablogarcialjibe04@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/pablo-garcía-aljibe/ (en el código, con la «í» codificada)
- **GitHub:** https://github.com/PabloGarciaAlj
- **Teléfono:** no se publica.

**Resumen:**
Ingeniero Multimedia con experiencia en desarrollo full-stack, integración de inteligencia
artificial y producción 3D. Orientado al desarrollo de aplicaciones web completas: APIs
REST, bases de datos, interfaces en React y Angular e infraestructura con Docker.
Experiencia llevando plataformas creadas con herramientas de IA a arquitecturas propias
on-premise, cuidando la seguridad y el aislamiento de los datos.

### 7.2 Experiencia

**1MillionBot** · Desarrollador Full-Stack (prácticas) · Alicante · Mayo 2026 – Septiembre 2026
(empresa de inteligencia artificial conversacional)

- Migración de plataformas web con IA, desarrolladas inicialmente con Lovable y Supabase,
  hacia una arquitectura on-premise propia, manteniendo intacta la experiencia de usuario.
- Desarrollo de APIs REST con Node.js, TypeScript, Fastify y Prisma sobre PostgreSQL,
  sustituyendo autenticación, almacenamiento de ficheros y lógica de servidor.
- Diseño de una arquitectura multi-tenant con una base de datos aislada por cliente.
- Integración de modelos de lenguaje en procesos de negocio: generación de documentos,
  búsqueda semántica con embeddings (RAG) y asistentes conversacionales.
- Desarrollo de interfaces en React y Angular, corrección de vulnerabilidades de
  autorización y despliegue con Docker en Google Cloud.

Tecnologías: Node.js · TypeScript · Fastify · Prisma · PostgreSQL · Redis · React ·
Angular · Docker · MinIO · LLMs

### 7.3 Proyectos

Los cuatro primeros son de las prácticas: `confidential: true` y descripción genérica.
Los nombres internos van entre paréntesis **solo como referencia para ti**. No se publican
salvo que Pablo lo confirme.

| slug | Título público | Contexto | Qué destacar | Stack |
| --- | --- | --- | --- | --- |
| `personaje-3d-videojuego` | Personaje 3D para videojuego de acción | TFG, 2026 | Proceso completo: siluetas y referencias → modelado → UVs → texturizado PBR → rig → animación → integración en motor. Estética japonesa con fantasía oscura / soulslike. Prototipo jugable para Windows. **Es el proyecto más diferencial: visor 3D en la página.** | Blender, Substance 3D Painter, Rigify, Mixamo, Rokoko Studio Live, Unity |
| `riesgos-ia-multitenant` | Plataforma de gestión de riesgos de la IA (AI Risk) | Prácticas, 2026 | Migración de Lovable/Supabase a on-premise. Arquitectura multi-tenant con una base de datos PostgreSQL por empresa; el tenant se resuelve en servidor a partir del JWT y el cliente nunca elige la base de datos. Almacenamiento S3 con MinIO. | Fastify, Prisma, PostgreSQL, Redis, MinIO, JWT, TanStack Start/Router/Query, Tailwind, shadcn/ui |
| `contratacion-publica-ia` | Gestión de expedientes de contratación pública con IA (AUREA) | Prácticas, 2026 | Generación asistida de documentos con LLMs, biblioteca de ejemplos con búsqueda semántica (RAG, embeddings, pgvector), colas de trabajo con BullMQ, corrección de vulnerabilidades de autorización tras una auditoría de seguridad. | Fastify, Prisma, PostgreSQL + pgvector, Redis, BullMQ, MinIO, React, Vite |
| `asistente-voz-mayores` | Asistente conversacional y de voz para personas mayores (IBH · Amy) | Prácticas, 2026 | Panel de control y dashboard de valores biométricos en Angular 19 + Tailwind, con componentes accesibles, sobre una API Fastify integrada con OpenAI y Gemini. | Angular 19, Tailwind, Fastify, Prisma, PostgreSQL |
| `legaltech-reclamaciones` | Plataforma legal-tech de reclamaciones aéreas (Juridocraft) | Prácticas, 2026 | Migración del frontend React a la API propia; procesamiento de PDF/DOCX con OCR. | React, Vite, Fastify, Prisma, PostgreSQL, Tesseract.js |
| `crowdcompass` | CrowdCompass | Académico, 2025 – 2026 | Web de gestión de eventos con modelo 3D interactivo y chatbot, en producción en crowdcompass.ovh. Despliegue propio con Apache y SSH; metodología ABP. Equipo de cinco. **Parte de Pablo (confirmada):** landing, `/home` de usuario y login; interfaz del chatbot y su conexión frontend → backend → Dialogflow (el agente y sus intents no son suyos); servidor OVH completo (Apache, HTTPS con Let's Encrypt, cabeceras de seguridad y CSP, despliegues). 158 de 463 commits. | Angular, TypeScript, Node.js, MySQL, Apache |

`TODO (Pablo):` confirmar el rol exacto en cada proyecto de prácticas, qué se puede
nombrar públicamente y qué imágenes hay disponibles (capturas propias, renders del TFG,
vídeo del prototipo).

### 7.4 Habilidades

- **Lenguajes:** TypeScript · JavaScript · SQL · HTML5 · CSS3
- **Frontend:** Angular · React · Vite · Tailwind CSS
- **Backend:** Node.js · Fastify · Express · APIs REST · Prisma ORM
- **Datos:** PostgreSQL · MySQL · MongoDB · Redis
- **IA:** integración de LLMs (OpenAI, Gemini, Anthropic, Mistral) · RAG y embeddings
- **DevOps:** Docker · MinIO · Apache · Linux/SSH
- **3D:** Blender · Substance 3D Painter · Rigify · Mixamo · Unity
- **Herramientas:** Git/GitHub · Claude Code · Codex · Lovable · Supabase · Asana

### 7.5 Formación e idiomas

- **Grado en Ingeniería Multimedia**, Universidad de Alicante (Escuela Politécnica
  Superior), septiembre 2022 – septiembre 2026. Itinerario: Gestión de Contenidos.
  Competencias: desarrollo web, usabilidad y accesibilidad (WCAG), bases de datos,
  sistemas distribuidos, servicios multimedia.
- **Idiomas:** español (nativo), inglés (C1 Advanced), valenciano (C1).

### 7.6 Tono de los textos

Frases cortas, concretas y en primera persona cuando hable Pablo ("Desarrollo APIs…",
"Migré…"). Verbos de acción y resultados, no adjetivos. Prohibido: "apasionado",
"elevar", "sin fisuras", "soluciones innovadoras", "next-gen", emojis.

---

## 8. Diseño y skills

### 8.1 Skills instaladas

Pablo tiene cuatro paquetes de skills de diseño. Úsalos activamente: son la referencia de
calidad visual de este proyecto.

| Paquete | Origen | Skills relevantes | Para qué |
| --- | --- | --- | --- |
| **taste-skill** | `Leonxlnx/taste-skill` | `design-taste-frontend` (principal), `high-end-visual-design`, `minimalist-ui`, `redesign-existing-projects` | Dirección estética, tipografía, layout, color y anti-patrones de "web hecha por IA". |
| **emilkowalski** | `emilkowalski/skill` | `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `pick-ui-library` | Criterio de animación e interacción: qué animar, con qué easing y duración, y cómo revisarlo. |
| **impeccable** | ya instalada en `~/.claude/skills/impeccable` | auditoría y pulido | Revisión de calidad de la UI tras cada cambio (tiene hooks configurados). |
| **vercel** | `vercel-labs/agent-skills` | solo `web-design-guidelines` | Revisión de código de UI contra las Web Interface Guidelines de Vercel (accesibilidad, foco, formularios, interacción). Descarga las reglas al día en cada revisión. No opina sobre estética, así que no choca con taste-skill. |

**Instalación** (si Claude Code no las ve en este repo). Las de taste-skill y emilkowalski
están en `Documents/CLAUDE SKILLS/*/.agents/skills/`. Para que Claude Code las cargue deben
estar en `~/.claude/skills/` (globales) o en `.claude/skills/` de este repo. Copia ahí las
carpetas de cada skill (cada una con su `SKILL.md`) o reinstálalas con el CLI de skills
apuntando a Claude Code. La de Vercel se instaló con el CLI, copiada (sin symlinks) y solo
esa skill; el CLI deja un `skills-lock.json` en la raíz:

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent claude-code --copy --yes
```

**No uses (no aplican aquí):** `animate-expo`, `mobile-native`, `write-swift`,
`imagegen-frontend-mobile`, `industrial-brutalist-ui` (salvo que Pablo elija esa estética),
`ask-sonner` (no hay toasts), `design-taste-frontend-v1` (versión antigua). Del repo de
Vercel, ninguna otra: son para Next.js (`react-best-practices`, `react-view-transitions`),
React Native o despliegues con token. Tampoco `frontend-design` de Anthropic ni otros
paquetes de estética genéricos: se solapan con `design-taste-frontend` y sus reglas chocan.

### 8.2 Cómo combinarlas

1. **Dirección:** `design-taste-frontend` es la base. De `high-end-visual-design` y
   `minimalist-ui` se usa **una sola**, la que encaje con la dirección que elija Pablo. Sus
   reglas se contradicen entre sí (por ejemplo, sombras o iconos).
2. **Movimiento:** `emil-design-eng` y `animate` deciden *si* algo se anima y *cómo*. Si
   chocan con `design-taste-frontend` en algo de animación, gana Emil.
3. **Revisión:** al terminar cada sección, pasa `review-animations` (si hay movimiento),
   `impeccable` y `web-design-guidelines` sobre los archivos tocados, y corrige antes de
   seguir. Comprueba siempre los dos temas, claro y oscuro.
4. **Librerías:** si hace falta algo nuevo (contador animado, resaltado de código…),
   consulta `pick-ui-library` y pregunta a Pablo antes de añadir la dependencia.

### 8.3 Dirección visual

Por decidir con Pablo (regla 4). Restricciones que ya están claras:

- **Bonita pero sobria:** una landing vistosa por su tipografía, composición y detalle,
  no por efectos acumulados.
- **Nada genérico:** debe notarse que hay criterio de diseño detrás.
- **El 3D es un recurso de identidad**, no decoración: aparece donde aporta (TFG y, si
  Pablo quiere, un guiño en el hero) y nunca bloquea la carga.
- **Modo claro y oscuro** (decidido con Pablo el 2026-10-03):
  - Por defecto sigue `prefers-color-scheme`. Un switch en el header, a la derecha
    (`ThemeToggle.astro`), permite elegir; la elección se guarda en `localStorage` y pone
    `<html data-theme="light|dark">`. Sin JS el switch se oculta y manda el sistema.
  - El script del tema va inline en el `<head>` de `BaseLayout.astro` para que no haya
    destello del tema equivocado, y pasa el tema a la página nueva en `astro:before-swap`
    (el `ClientRouter` sustituye los atributos de `<html>`).
  - **Modo claro en tonos de papel cálido, nunca blanco puro** (fondo `#f1ece3`), para no
    cansar la vista. Texto en casi negro cálido. Todos los tokens de texto cumplen AA
    (≥ 4,5:1) sobre `canvas`, `surface` y `sunken` en los dos temas: si se cambia un
    color, se vuelve a medir.
  - **Cambio de tema con fundido cruzado de 450 ms** (`document.startViewTransition`),
    por fotosensibilidad: nunca un salto de luminancia de golpe. No usar transiciones CSS
    de color en todos los elementos: con la herencia se desincronizan y el texto queda
    medio fundido. Al ser un fundido y no un movimiento, se mantiene con movimiento
    reducido (la bolita del switch, en cambio, no se desliza).
  - Las imágenes deben verse bien sobre los dos fondos (ver la portada del TFG, pendiente
    de exportar con fondo transparente).

### 8.4 Anti-patrones (no hacer)

- Fuentes por defecto (Inter, Roboto, Arial, Open Sans) sin una razón.
- Hero con gradiente morado/azul y blobs, tarjetas de cristal sin motivo, sombras
  `shadow-lg` duras.
- Rejillas simétricas de 3 columnas idénticas para todo.
- Barras de habilidad con porcentajes, iconos de cada tecnología en mosaico, contadores
  de "años de experiencia".
- `transition: all`, easing `linear` o `ease-in` en la UI, animaciones de entrada en
  cada elemento al hacer scroll.
- `window.addEventListener('scroll', …)`: usa IntersectionObserver, scroll-driven
  animations de CSS o `useScroll` de Motion.
- Texto de relleno, nombres ficticios, emojis.

---

## 9. Animación

- Hover, focus, pulsación y cambios de estado: **transiciones CSS** de propiedades
  concretas (`transform`, `opacity`), 150–250 ms, `ease-out` o una curva personalizada.
- Entradas al montar: `@starting-style` o Motion (`initial`/`animate`), sin escalar desde 0.
- Transición tarjeta → detalle: View Transitions de Astro con `transition:name`.
- Botones con respuesta al pulsar (`:active { transform: scale(0.97) }`).
- **`prefers-reduced-motion` siempre respetado**: sin movimiento, solo fundidos o nada.
- Cada animación debe poder justificarse en una frase (jerarquía, feedback, cambio de
  estado o narrativa). Si no, se quita.

---

## 10. 3D (personaje del TFG)

**Motor:** React Three Fiber + drei (decidido con Pablo el 2026-10-02, en lugar de
`<model-viewer>`). Componentes: `CharacterViewer.tsx` (isla ligera: póster, botón y
controles) y `CharacterStage.tsx` (escena; se descarga con `React.lazy` al pulsar
"Ver en 3D").

**Visor en la página del TFG (hecho):**

- Cámara orbital alrededor del personaje, zoom hacia el cursor y sin desplazamiento
  lateral. En vertical llega casi a la vista cenital y baja un poco por debajo del suelo
  (para ver las suelas). Botones de girar, acercar, alejar y restablecer para teclado y
  lectores de pantalla.
- Animaciones (datos en `model.idle` y `model.animations` del MDX):
  - **Idle** (`Stay_Idle_Retarget`) en bucle como pose por defecto, en lugar de la pose T.
    Con `prefers-reduced-motion` se queda quieto en su primer fotograma.
  - **Movimiento** (bucles, interruptor ▶/⏸): «Andar» (`Walking_Hurt`) y «Agachado»
    (`Crouched_Sneaking`).
  - **Ataques** (`loop: false`, se reproducen una vez y vuelven solos al idle): «Ataque
    básico» (`Slash_Basico`) y «Ataque complejo» (`Slack_Complejo`).
  - Fundido de 0,3 s entre clips. La cámara no se toca: todo se reproduce en el sitio.
  - En escritorio los controles flotan sobre el visor (animaciones arriba a la derecha,
    cámara abajo a la derecha). En móvil van debajo, para no tapar al personaje, y
    aparecen desactivados al pulsar «Ver en 3D» para que la página no salte al cargar.
- Póster: render del primer fotograma del idle (generado con movimiento reducido).
- **Nunca transformar la escena que devuelve `useGLTF`:** está en caché entre visitas
  (también al navegar con View Transitions). El encuadre se mide una vez y se aplica a un
  grupo que la envuelve; al desmontar, el mezclador se para para dejarla en reposo.
- Iluminación: hemisférica suave, luz principal y de contorno, y un entorno con
  `Lightformer` (sin descargar HDRI de un CDN) para que los metales reflejen algo.
- El póster tiene fondo transparente y el encuadre inicial. Es lo que ve quien no tiene JS
  ni WebGL, y lo que se ve antes de pulsar el botón.
- El tamaño de descarga que muestra el botón se calcula al compilar a partir del archivo.

**Personaje en la landing (pendiente):** al llegar a la sección del TFG, el personaje
entra en pantalla con una animación (caminar) que avanza con el scroll (`useScroll` de
Motion; sin GSAP ni Lenis). Con `prefers-reduced-motion` o sin JS, imagen estática. De
momento la tarjeta del TFG usa como portada un render de poses.

**Optimización del modelo.** El `.glb` original de Blender (523 MB) no se sube al repo. Se
procesa con `gltf-transform` desde un script aparte, sin añadirlo al proyecto:

- Conservar solo los 5 clips del visor (por defecto en el script) y borrar el resto **con
  sus samplers** (si no, sus datos quedan huérfanos en el archivo). De los 39 clips del
  original, las versiones sin `Retarget` están vacías y el resto son duplicados.
- **Solo pistas de huesos que deforman:** de los 412 huesos del rig se conservan los 126
  con peso en algún vértice, los que sostienen piezas rígidas (máscara, pelo, katana) y sus
  antecesores. El resto son controles de Rigify.
- **Animaciones en el sitio** (equivalente al script de Unity): el avance de la cadera
  (`DEF-spine`) fotograma a fotograma se resta de todos los huesos que cuelgan de la raíz
  y avanzan con ella. El cuerpo se queda en el sitio; los pies y las manos conservan su
  movimiento relativo (pasos, estocadas) y se mantienen el balanceo y la altura.
- Materiales: Blender los exportó todos como `BLEND`. Pasan a `OPAQUE` (el pelo a `MASK`),
  **manteniendo la doble cara** (el kimono caído es un plano sin grosor).
- Simplificar con meshoptimizer, más fuerte en las cuerdas de sandalias y cinturón y en el
  pelo. Resultado actual: unos 193.000 triángulos.
- Texturas a WebP: color base de piel y kimono a 2K, el resto a 1K, metal/rugosidad a 512.
- `resample` de las animaciones y compresión meshopt. Resultado actual: **7,6 MB** con los
  5 clips.

`TODO (Pablo):` el material `Iris` llega sin textura (ojos blancos): revisarlo en Blender.

---

## 11. Criterios de calidad (definición de "hecho")

- **Lighthouse ≥ 95** en Rendimiento, Accesibilidad, Buenas prácticas y SEO (móvil).
  Se mide con `lighthouse_audit` del MCP `chrome-devtools` sobre `npm run build && npm run
  preview`, no sobre el servidor de desarrollo.
- **Responsive:** de 360 px a pantallas anchas, sin scroll horizontal. Comprobar en móvil
  de verdad o en el emulador.
- **Accesibilidad:** HTML semántico, un solo `h1` por página, foco visible, contraste AA
  **en los dos temas**, navegación completa por teclado y `alt` en todas las imágenes.
- **SEO:** `<title>` y `description` por página, Open Graph con imagen, `sitemap`
  (`@astrojs/sitemap`), `robots.txt` y `lang="es"`.
- **Sin JS innecesario:** la landing debe funcionar y verse bien con JS desactivado,
  salvo las islas interactivas.
- `npx astro check` y `npm run build` sin errores ni avisos.

---

## 12. Despliegue

- **Vercel**, conectado al repositorio de GitHub. Salida estática.
- Rama `main` → producción. Las demás ramas → previews.
- Dominio propio: `TODO (Pablo):` decidir y comprar el dominio.
- El PDF del CV en `public/cv/` se actualiza a mano cuando cambie el CV.

---

## 13. Decisiones abiertas

| Decisión | Estado |
| --- | --- |
| Dirección visual (paleta, tipografía, layout del hero) | Pendiente: proponer 2–3 opciones |
| Qué proyectos de prácticas se pueden nombrar y con qué material | Pendiente: Pablo |
| ¿Versión en inglés? | De momento solo español. Si se añade, usar el i18n nativo de Astro (`/en/`). |
| URL de LinkedIn y GitHub | Hecho (sección 7.1) |
| Dominio | Pendiente: Pablo |
| 3D en la web | Decidido: React Three Fiber. Visor en la página del TFG (hecho). Personaje animado con el scroll en la sección del TFG de la landing (pendiente de reexportar el modelo con animaciones). |
