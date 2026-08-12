import { Project } from '@osac/types';

export const getProjectName = (project: Project): string => {
  if (project.metadata?.name === '') {
    return 'default';
  }
  return project.spec?.title || project.metadata?.name || project.id;
};
