import { getCollection, type CollectionEntry } from 'astro:content';
import { defaultLang, type Lang } from '../i18n/ui';

export type Project = CollectionEntry<'projects'>;

/**
 * Projects live in one folder per language (src/content/projects/es, /en), so
 * an entry id is "<lang>/<slug>". The slug is shared by both versions.
 */
export const projectSlug = (project: Project) => project.id.slice(project.id.indexOf('/') + 1);
const projectLang = (project: Project) => project.id.slice(0, project.id.indexOf('/'));

/**
 * All projects in the given language, sorted by `order`. A project not yet
 * translated falls back to its Spanish version, so it never disappears.
 */
export async function getProjects(lang: Lang): Promise<Project[]> {
  const all = await getCollection('projects');
  const bySlug = new Map<string, Project>();
  for (const project of all) {
    const entryLang = projectLang(project);
    if (entryLang !== lang && entryLang !== defaultLang) continue;
    const slug = projectSlug(project);
    if (entryLang === lang || !bySlug.has(slug)) bySlug.set(slug, project);
  }
  return [...bySlug.values()].sort((a, b) => a.data.order - b.data.order);
}

/**
 * Confidential (client) projects have no detail page: without images or names
 * there is too little to show, so they live only as a compact list on the landing.
 */
export const hasDetailPage = (project: Project) => !project.data.confidential;

/** Detail pages for one language, with the previous and next project. */
export async function getProjectPaths(lang: Lang) {
  const projects = (await getProjects(lang)).filter(hasDetailPage);
  return projects.map((project, i) => ({
    params: { slug: projectSlug(project) },
    props: {
      project,
      prev: projects[i - 1] ?? null,
      next: projects[i + 1] ?? null,
    },
  }));
}
