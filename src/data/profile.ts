// Single source for personal data shown on the site (CLAUDE.md, section 7).
// Missing data stays as `null` and is rendered as a visible TODO.
// Text is kept per language; the English version is typed as the Spanish one,
// so a missing translation fails the type check.

import type { Lang } from '../i18n/ui';

const contact = {
  name: 'Pablo García Aljibe',
  email: 'pablogarcialjibe04@gmail.com',
  // Percent-encoded "í" so the URL is valid everywhere it is used.
  linkedin: 'https://www.linkedin.com/in/pablo-garc%C3%ADa-aljibe/',
  github: 'https://github.com/PabloGarciaAlj',
  // Only in Spanish for now, on both versions of the site.
  cv: '/cv/CV_Pablo_Garcia_Aljibe.pdf',
};

const experienceStack = [
  'Node.js',
  'TypeScript',
  'Fastify',
  'Prisma',
  'PostgreSQL',
  'Redis',
  'React',
  'Angular',
  'Docker',
  'MinIO',
  'LLMs',
];

const es = {
  profile: {
    ...contact,
    role: 'Ingeniero Multimedia · Desarrollo Full-Stack',
    availability: 'Disponible para incorporación inmediata',
    location: 'Elche, España',
    positioning:
      'Desarrollo aplicaciones web completas, de la base de datos a la interfaz, con integración de IA y producción 3D.',
  },
  experience: [
    {
      company: '1MillionBot',
      companyDescription: 'Empresa de inteligencia artificial conversacional',
      role: 'Desarrollador Full-Stack (prácticas)',
      location: 'Alicante, España',
      period: 'Mayo - Septiembre 2026',
      highlights: [
        'Migré plataformas web con IA, creadas con Lovable y Supabase, a una arquitectura on-premise propia sin cambiar la experiencia de usuario.',
        'Desarrollé APIs REST con Node.js, TypeScript, Fastify y Prisma sobre PostgreSQL, sustituyendo autenticación, almacenamiento de ficheros y lógica de servidor.',
        'Diseñé una arquitectura multi-tenant con una base de datos aislada por cliente.',
        'Integré modelos de lenguaje en procesos de negocio: generación de documentos, búsqueda semántica con embeddings (RAG) y asistentes conversacionales.',
        'Desarrollé interfaces en React y Angular, corregí vulnerabilidades de autorización y desplegué con Docker en Google Cloud.',
      ],
      stack: experienceStack,
    },
  ],
  skills: [
    { group: 'Lenguajes', items: ['TypeScript', 'JavaScript', 'SQL', 'HTML5', 'CSS3'] },
    { group: 'Frontend', items: ['Angular', 'React', 'Vite', 'Tailwind CSS'] },
    { group: 'Backend', items: ['Node.js', 'Fastify', 'Express', 'APIs REST', 'Prisma ORM'] },
    { group: 'Datos', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'] },
    {
      group: 'IA',
      items: ['Integración de LLMs (OpenAI, Gemini, Anthropic, Mistral)', 'RAG y embeddings'],
    },
    { group: 'DevOps', items: ['Docker', 'MinIO', 'Apache', 'Linux/SSH'] },
    { group: '3D', items: ['Blender', 'Substance 3D Painter', 'Rigify', 'Mixamo', 'Unity'] },
    {
      group: 'Herramientas',
      items: ['Git/GitHub', 'Claude Code', 'Codex', 'Lovable', 'Supabase', 'Asana'],
    },
  ],
  education: {
    degree: 'Grado en Ingeniería Multimedia',
    school: 'Universidad de Alicante, Escuela Politécnica Superior',
    period: '2022 - 2026',
    track: 'Itinerario de Gestión de Contenidos',
    competencies: [
      'desarrollo web',
      'usabilidad y accesibilidad (WCAG)',
      'bases de datos',
      'sistemas distribuidos',
      'servicios multimedia',
    ],
    thesisSlug: 'personaje-3d-videojuego',
  },
  languages: [
    { name: 'Español', level: 'Nativo' },
    { name: 'Inglés', level: 'C1 Advanced' },
    { name: 'Valenciano', level: 'C1' },
  ],
};

const en: typeof es = {
  profile: {
    ...contact,
    role: 'Multimedia Engineer · Full-Stack Developer',
    availability: 'Available to start immediately',
    location: 'Elche, Spain',
    positioning:
      'I build complete web applications, from the database to the interface, with AI integration and 3D production.',
  },
  experience: [
    {
      company: '1MillionBot',
      companyDescription: 'Conversational AI company',
      role: 'Full-Stack Developer (internship)',
      location: 'Alicante, Spain',
      period: 'May - September 2026',
      highlights: [
        'Migrated AI web platforms built with Lovable and Supabase to an in-house on-premise architecture, keeping the user experience unchanged.',
        'Built REST APIs with Node.js, TypeScript, Fastify and Prisma on PostgreSQL, replacing authentication, file storage and server-side logic.',
        'Designed a multi-tenant architecture with an isolated database per client.',
        'Integrated language models into business processes: document generation, semantic search with embeddings (RAG) and conversational assistants.',
        'Built interfaces in React and Angular, fixed authorization vulnerabilities and deployed with Docker on Google Cloud.',
      ],
      stack: experienceStack,
    },
  ],
  skills: [
    { group: 'Languages', items: ['TypeScript', 'JavaScript', 'SQL', 'HTML5', 'CSS3'] },
    { group: 'Frontend', items: ['Angular', 'React', 'Vite', 'Tailwind CSS'] },
    { group: 'Backend', items: ['Node.js', 'Fastify', 'Express', 'REST APIs', 'Prisma ORM'] },
    { group: 'Data', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'] },
    {
      group: 'AI',
      items: ['LLM integration (OpenAI, Gemini, Anthropic, Mistral)', 'RAG and embeddings'],
    },
    { group: 'DevOps', items: ['Docker', 'MinIO', 'Apache', 'Linux/SSH'] },
    { group: '3D', items: ['Blender', 'Substance 3D Painter', 'Rigify', 'Mixamo', 'Unity'] },
    {
      group: 'Tools',
      items: ['Git/GitHub', 'Claude Code', 'Codex', 'Lovable', 'Supabase', 'Asana'],
    },
  ],
  education: {
    degree: "Bachelor's Degree in Multimedia Engineering",
    school: 'University of Alicante, Higher Polytechnic School',
    period: '2022 - 2026',
    track: 'Content Management track',
    competencies: [
      'web development',
      'usability and accessibility (WCAG)',
      'databases',
      'distributed systems',
      'multimedia services',
    ],
    thesisSlug: 'personaje-3d-videojuego',
  },
  languages: [
    { name: 'Spanish', level: 'Native' },
    { name: 'English', level: 'C1 Advanced' },
    { name: 'Valencian', level: 'C1' },
  ],
};

const content: Record<Lang, typeof es> = { es, en };

/** Profile, experience, skills, education and languages in the given language. */
export const getContent = (lang: Lang) => content[lang];
