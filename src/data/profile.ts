// Single source for personal data shown on the site (CLAUDE.md, section 7).
// Missing data stays as `null` and is rendered as a visible TODO.

export const profile = {
  name: 'Pablo García Aljibe',
  role: 'Ingeniero Multimedia · Desarrollo Full-Stack',
  availability: 'Disponible para incorporación inmediata',
  location: 'Elche, España',
  positioning:
    'Desarrollo aplicaciones web completas, de la base de datos a la interfaz, con integración de IA y producción 3D.',
  email: 'pablogarcialjibe04@gmail.com',
  // Percent-encoded "í" so the URL is valid everywhere it is used.
  linkedin: 'https://www.linkedin.com/in/pablo-garc%C3%ADa-aljibe/',
  github: 'https://github.com/PabloGarciaAlj',
  cv: '/cv/CV_Pablo_Garcia_Aljibe.pdf',
};

export const experience = [
  {
    company: '1MillionBot',
    companyDescription: 'Empresa de inteligencia artificial conversacional',
    role: 'Desarrollador Full-Stack (prácticas)',
    location: 'Alicante',
    period: 'Mayo - Septiembre 2026',
    highlights: [
      'Migré plataformas web con IA, creadas con Lovable y Supabase, a una arquitectura on-premise propia sin cambiar la experiencia de usuario.',
      'Desarrollé APIs REST con Node.js, TypeScript, Fastify y Prisma sobre PostgreSQL, sustituyendo autenticación, almacenamiento de ficheros y lógica de servidor.',
      'Diseñé una arquitectura multi-tenant con una base de datos aislada por cliente.',
      'Integré modelos de lenguaje en procesos de negocio: generación de documentos, búsqueda semántica con embeddings (RAG) y asistentes conversacionales.',
      'Desarrollé interfaces en React y Angular, corregí vulnerabilidades de autorización y desplegué con Docker en Google Cloud.',
    ],
    stack: [
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
    ],
  },
];

export const skills = [
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
];

export const education = {
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
};

export const languages = [
  { name: 'Español', level: 'Nativo' },
  { name: 'Inglés', level: 'C1 Advanced' },
  { name: 'Valenciano', level: 'C1' },
];
