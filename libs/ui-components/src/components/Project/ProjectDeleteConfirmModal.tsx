import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Project } from '@osac/types';

import { getProjectName } from './utils';
import { useDeleteProject } from '../../api/v1/project';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface ProjectDeleteConfirmModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

const ProjectDeleteConfirmModal = ({
  project,
  onClose,
  onSuccess,
}: ProjectDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const { mutate, isPending, error } = useDeleteProject();

  const projectName = getProjectName(project);

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="project-delete-confirm-title"
    >
      <ModalHeader
        title={t('Delete {{name}}?', { name: projectName })}
        titleIconVariant="warning"
        labelId="project-delete-confirm-title"
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            {t(
              'This permanently deletes the project and all its resources. This action cannot be undone.',
            )}
          </StackItem>
          {error && (
            <StackItem>
              <Alert variant="danger" title={t('Failed to delete project')} isInline>
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={() => mutate(project.id, { onSuccess })}
          isDisabled={isPending}
          isLoading={isPending}
        >
          {t('Delete')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ProjectDeleteConfirmModal;
