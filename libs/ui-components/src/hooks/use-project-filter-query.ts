import { useSession } from './use-session';
import { cel } from '../api/cel';

export const useProjectFilterQuery = () => {
  const { projects } = useSession();
  return projects.length
    ? cel<{ metadata: { project: string } }>((filter) =>
        filter.field('metadata.project').isIn(projects),
      )
    : undefined;
};
