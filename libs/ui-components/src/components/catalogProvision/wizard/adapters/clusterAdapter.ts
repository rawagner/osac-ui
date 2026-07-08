import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';

import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import { createEmptyComputeInstanceValues } from './computeInstance/payload';
import type { CatalogProvisionAdapter } from './types';
import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';

/** Placeholder until cluster catalog provisioning is implemented. */
export const clusterAdapter: CatalogProvisionAdapter<
  CatalogItem,
  ComputeInstanceWizardValues,
  Record<string, never>
> = {
  kind: 'cluster',
  useCatalogItems: () => {
    const query = useClusterCatalogItems();
    return {
      data: query.data ?? [],
      isPending: query.isPending,
      isError: query.isError,
      refetch: () => {
        void query.refetch();
      },
    };
  },
  getInitialValues: () => createEmptyComputeInstanceValues(),
  buildCreatePayload: () => ({}),
  ConfigurationStep: () => null,
  NetworkingStep: () => null,
  resolveGeneralFields: () => [],
  getStepValidationSchema: () => undefined,
  getReviewSections: () => [],
  wizardTitleKey: 'catalogProvision.cluster.wizardTitle',
  wizardDescriptionKey: 'catalogProvision.cluster.wizardDescription',
  breadcrumbCreateLabelKey: 'catalogProvision.cluster.breadcrumbCreate',
  ariaLabelKey: 'catalogProvision.cluster.ariaLabel',
};
