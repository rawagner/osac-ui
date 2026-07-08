import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { BareMetalInstance } from '@osac/types';
import { BareMetalInstanceState } from '@osac/types';

import BareMetalDeleteConfirmModal from './BareMetalDeleteConfirmModal';
import { usePatchBareMetalInstance } from '../../api/v1/baremetal-instance';
import { useTranslation } from '../../hooks/useTranslation';

interface BareMetalActionsMenuProps {
  instance: BareMetalInstance;
  onDeleted?: () => void;
}

export const BareMetalActionsMenu = ({ instance, onDeleted }: BareMetalActionsMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const patch = usePatchBareMetalInstance();

  const state = instance.status?.state;
  const canStart = state === BareMetalInstanceState.STOPPED;
  const canStop = state === BareMetalInstanceState.RUNNING;
  const canRestart = state === BareMetalInstanceState.RUNNING;
  const canDelete = state !== BareMetalInstanceState.DELETING;

  return (
    <>
      {deleteOpen && (
        <BareMetalDeleteConfirmModal
          instance={instance}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            setDeleteOpen(false);
            onDeleted?.();
          }}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((o) => !o)}
            aria-label={t('Actions for {{name}}', { name: instance.metadata?.name ?? instance.id })}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem
            isDisabled={!canStart}
            onClick={() => {
              if (canStart) {
                patch.mutate({ id: instance.id, action: 'start' });
                setOpen(false);
              }
            }}
          >
            {t('Start')}
          </DropdownItem>
          <DropdownItem
            isDisabled={!canStop}
            onClick={() => {
              if (canStop) {
                patch.mutate({ id: instance.id, action: 'stop' });
                setOpen(false);
              }
            }}
          >
            {t('Stop')}
          </DropdownItem>
          <DropdownItem
            isDisabled={!canRestart}
            onClick={() => {
              if (canRestart) {
                patch.mutate({
                  id: instance.id,
                  action: 'restart',
                  currentTrigger: instance.spec?.restartTrigger ?? 0n,
                });
                setOpen(false);
              }
            }}
          >
            {t('Restart')}
          </DropdownItem>
          <DropdownItem
            isDisabled={!canDelete}
            onClick={() => {
              if (canDelete) {
                setDeleteOpen(true);
                setOpen(false);
              }
            }}
          >
            {t('Delete')}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};
