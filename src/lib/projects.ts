import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

export const contextLabel: Record<Project['data']['context'], string> = {
  tfg: 'TFG',
  prácticas: 'Prácticas',
  académico: 'Académico',
};

/** All projects sorted by `order`. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Confidential (client) projects have no detail page: without images or names
 * there is too little to show, so they live only as a compact list on the landing.
 */
export const hasDetailPage = (project: Project) => !project.data.confidential;
