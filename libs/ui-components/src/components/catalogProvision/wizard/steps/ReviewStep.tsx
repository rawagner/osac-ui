import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { useTranslation } from '../../../../hooks/useTranslation';
import type { CatalogProvisionPayload } from '../../catalogProvisionTypes';
import type { CatalogProvisionWizardValues } from '../../catalogProvisionTypes';
import type { CatalogProvisionAdapter } from '../adapters/types';

interface Props {
  adapter: CatalogProvisionAdapter<
    ComputeInstanceCatalogItem,
    CatalogProvisionWizardValues,
    CatalogProvisionPayload
  >;
  catalogItem: ComputeInstanceCatalogItem | null;
  values: CatalogProvisionWizardValues;
}

export const ReviewStep = ({ adapter, catalogItem, values }: Props) => {
  const { t } = useTranslation();
  const sections = catalogItem ? adapter.getReviewSections(values, catalogItem) : [];
  const rows = sections.flatMap((section) => section.rows);

  return (
    <DescriptionList isHorizontal isCompact aria-label={t('catalogProvision.steps.review.title')}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('catalogProvision.review.catalogItem')}</DescriptionListTerm>
        <DescriptionListDescription>{catalogItem?.title ?? '—'}</DescriptionListDescription>
      </DescriptionListGroup>
      {rows.map((row) => (
        <DescriptionListGroup key={row.label}>
          <DescriptionListTerm>{row.label}</DescriptionListTerm>
          <DescriptionListDescription>{row.value}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};
