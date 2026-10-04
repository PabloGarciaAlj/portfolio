// Interface strings and localized routes. Spanish lives at the root, English
// under /en/ (astro.config.mjs). Content (profile, projects) is translated in
// src/data/profile.ts and src/content/projects/{es,en}/.

export const languages = ['es', 'en'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'es';

/** Locale of the page being rendered, from `Astro.currentLocale`. */
export function getLang(locale: string | undefined): Lang {
  return locale === 'en' ? 'en' : defaultLang;
}

/** Section anchors and the folder of the project pages, per language. */
const routes = {
  es: {
    projects: 'proyectos',
    experience: 'experiencia',
    skills: 'habilidades',
    education: 'formacion',
    contact: 'contacto',
    content: 'contenido',
    projectsFolder: 'proyectos',
  },
  en: {
    projects: 'projects',
    experience: 'experience',
    skills: 'skills',
    education: 'education',
    contact: 'contact',
    content: 'content',
    projectsFolder: 'projects',
  },
} as const;

export type Section = Exclude<keyof (typeof routes)['es'], 'projectsFolder'>;

const prefix = (lang: Lang) => (lang === defaultLang ? '' : `/${lang}`);

/** Id of a landing section in the given language. */
export const sectionId = (section: Section, lang: Lang) => routes[lang][section];

export const homePath = (lang: Lang) => `${prefix(lang)}/`;

/** Link to a landing section from any page. */
export const sectionPath = (section: Section, lang: Lang) =>
  `${homePath(lang)}#${sectionId(section, lang)}`;

export const projectPath = (slug: string, lang: Lang) =>
  `${prefix(lang)}/${routes[lang].projectsFolder}/${slug}/`;

/**
 * The same page in the other language, for the language link and hreflang.
 * Project slugs are shared; only the folder name changes.
 */
export function translatePath(pathname: string, to: Lang): string {
  const path = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const project = path.match(/^\/(?:proyectos|projects)\/([^/]+)\/?$/);
  if (project) return projectPath(project[1], to);
  return homePath(to);
}

const es = {
  meta: {
    homeTitle: 'Ingeniero Multimedia y desarrollador full-stack',
    ogLocale: 'es_ES',
    skipToContent: 'Saltar al contenido',
  },
  nav: {
    label: 'Principal',
    home: 'inicio',
    projects: 'Proyectos',
    experience: 'Experiencia',
    skills: 'Habilidades',
    contact: 'Contacto',
    newTab: 'se abre en una pestaña nueva',
  },
  language: {
    // The link points to the other language, so it is written in it.
    switchLabel: 'EN',
    switchName: 'English',
    switchTitle: 'Read in English',
  },
  theme: { dark: 'Modo oscuro' },
  hero: {
    portraitAlt: 'Retrato de Pablo García Aljibe',
    viewProjects: 'Ver proyectos',
    downloadCv: 'Descargar CV',
    // The CV only exists in Spanish: no note needed on the Spanish site.
    cvLanguage: null as { label: string; name: string } | null,
  },
  projects: {
    title: 'Proyectos',
    internshipTitle: 'Prácticas en 1MillionBot',
    internshipIntro: 'Proyectos para clientes de la empresa, descritos sin nombres ni capturas.',
    others: 'Otros proyectos',
    stack: 'Tecnologías',
    modelPending: 'Visor 3D del personaje (pendiente)',
    imagePending: 'Imagen principal (pendiente)',
    screenshotPending: (title: string) => `Captura de ${title} (pendiente)`,
    screenshotOf: (title: string) => `Captura de ${title}`,
    placeholder: (label: string) => `Espacio reservado: ${label}`,
  },
  context: { tfg: 'TFG', prácticas: 'Prácticas', académico: 'Académico' },
  experience: {
    title: 'Experiencia',
    role: 'Puesto',
    period: 'Periodo',
    location: 'Ubicación',
    stack: 'Tecnologías',
  },
  skills: { title: 'Habilidades' },
  education: {
    title: 'Formación',
    competencies: 'Competencias',
    thesisLink: 'TFG: personaje 3D para videojuego de acción',
    languages: 'Idiomas',
  },
  contact: {
    title: 'Contacto',
    writeTo: 'Escríbeme a:',
    sendEmail: 'Enviar email',
  },
  project: {
    back: 'Todos los proyectos',
    role: 'Rol',
    context: 'Contexto',
    stack: 'Tecnologías',
    gallery: 'Galería',
    demo: 'Ver en producción',
    repo: 'Repositorio',
    others: 'Otros proyectos',
    prev: 'Anterior',
    next: 'Siguiente',
  },
  viewer: {
    load: 'Ver en 3D',
    loading: 'Cargando modelo',
    error: 'No se ha podido cargar el visor 3D en este navegador.',
    hint: 'Arrastra para girar · Rueda o pellizco para acercar',
    movement: 'Movimiento',
    attacks: 'Ataques',
    toolbar: 'Controles del visor 3D',
    rotateLeft: 'Girar a la izquierda',
    rotateRight: 'Girar a la derecha',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    reset: 'Restablecer vista',
  },
};

// Typed as the Spanish strings, so a missing translation fails the type check.
const en: typeof es = {
  meta: {
    homeTitle: 'Multimedia Engineer and full-stack developer',
    ogLocale: 'en_GB',
    skipToContent: 'Skip to content',
  },
  nav: {
    label: 'Main',
    home: 'home',
    projects: 'Projects',
    experience: 'Experience',
    skills: 'Skills',
    contact: 'Contact',
    newTab: 'opens in a new tab',
  },
  language: {
    switchLabel: 'ES',
    switchName: 'Español',
    switchTitle: 'Leer en español',
  },
  theme: { dark: 'Dark mode' },
  hero: {
    portraitAlt: 'Portrait of Pablo García Aljibe',
    viewProjects: 'View projects',
    downloadCv: 'Download CV',
    cvLanguage: { label: 'ES', name: 'in Spanish' },
  },
  projects: {
    title: 'Projects',
    internshipTitle: 'Internship at 1MillionBot',
    internshipIntro: "Projects for the company's clients, described without names or screenshots.",
    others: 'Other projects',
    stack: 'Technologies',
    modelPending: '3D character viewer (coming soon)',
    imagePending: 'Main image (coming soon)',
    screenshotPending: (title: string) => `Screenshot of ${title} (coming soon)`,
    screenshotOf: (title: string) => `Screenshot of ${title}`,
    placeholder: (label: string) => `Placeholder: ${label}`,
  },
  context: { tfg: "Bachelor's thesis", prácticas: 'Internship', académico: 'Academic' },
  experience: {
    title: 'Experience',
    role: 'Position',
    period: 'Period',
    location: 'Location',
    stack: 'Technologies',
  },
  skills: { title: 'Skills' },
  education: {
    title: 'Education',
    competencies: 'Key areas',
    thesisLink: "Bachelor's thesis: 3D character for an action game",
    languages: 'Languages',
  },
  contact: {
    title: 'Contact',
    writeTo: 'Email me at:',
    sendEmail: 'Send email',
  },
  project: {
    back: 'All projects',
    role: 'Role',
    context: 'Context',
    stack: 'Technologies',
    gallery: 'Gallery',
    demo: 'View live site',
    repo: 'Repository',
    others: 'Other projects',
    prev: 'Previous',
    next: 'Next',
  },
  viewer: {
    load: 'View in 3D',
    loading: 'Loading model',
    error: "The 3D viewer couldn't load in this browser.",
    hint: 'Drag to rotate · Scroll or pinch to zoom',
    movement: 'Movement',
    attacks: 'Attacks',
    toolbar: '3D viewer controls',
    rotateLeft: 'Rotate left',
    rotateRight: 'Rotate right',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    reset: 'Reset view',
  },
};

export const ui: Record<Lang, typeof es> = { es, en };

export type ViewerLabels = (typeof es)['viewer'];

/** Interface strings for the page being rendered. */
export const useTranslations = (lang: Lang) => ui[lang];
