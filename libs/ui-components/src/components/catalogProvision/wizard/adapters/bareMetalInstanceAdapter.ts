import { useMemo } from 'react';
import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';
import * as yup from 'yup';

import { BareMetalInstanceCatalogItem, BareMetalInstanceRunStrategy } from '@osac/types';

import { useBareMetalInstanceCatalogItems } from '../../../../api/v1/baremetal-instance';
import type { MessageInitShape } from '@bufbuild/protobuf';
import { BareMetalInstanceSchema } from '@osac/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  type ReviewSection,
  formatReviewScalar,
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
  reviewRow,
} from '../catalogOverlay';
import type { WizardStepId } from '../stepIds';
import BareMetalConfigurationStep from './bareMetalInstance/BareMetalConfigurationStep';
import {
  type BareMetalInstanceWizardValues,
  createEmptyBareMetalInstanceValues,
} from './bareMetalInstance/fields';
import type { CatalogProvisionAdapter, GeneralFieldDescriptor } from './types';

const BM_SSH_KEY_WIRE_PATH = 'spec.ssh_public_key';
const BM_SSH_KEY_FORM_PATH = 'spec.sshKey';

/**
 * Matches the OpenSSH public key format.
 * Accepts: ssh-rsa, ssh-dss, ssh-ed25519, ecdsa-sha2-*, sk-ssh-ed25519, sk-ecdsa-sha2-*
 */
const OPENSSH_PUBLIC_KEY_REGEX =
  /^(ssh-(rsa|dss|ed25519)|ecdsa-sha2-\S+|sk-(ssh-ed25519|ecdsa-sha2-\S+))\s+\S+(\s+\S+)?$/;

const USER_DATA_MAX_BYTES = 64000;

const buildBmGeneralFields = (
  catalogItem: BareMetalInstanceCatalogItem | null,
  t: TFunction,
): GeneralFieldDescriptor[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    BM_SSH_KEY_WIRE_PATH,
    definitions,
    t('SSH public key'),
  );

  return [
    {
      name: 'metadata.name',
      labelKey: 'Name',
      isRequired: true,
    },
    {
      name: BM_SSH_KEY_FORM_PATH,
      labelKey: 'SSH public key',
      label: sshKeyOverlay.label,
      multiline: true,
      isRequired: false,
      isDisabled: !sshKeyOverlay.editable,
    },
  ];
};

const buildBmStepSchema = (
  catalogItem: BareMetalInstanceCatalogItem | null,
  stepId: WizardStepId,
  t: TFunction,
): yup.AnyObjectSchema | undefined => {
  if (stepId === 'review') {
    return undefined;
  }

  switch (stepId) {
    case 'catalog':
      return yup.object({
        catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
      });
    case 'general':
      return yup.object({
        metadata: yup.object({
          name: yup.string().trim().required(t('catalogProvision.validation.nameRequired')),
        }),
        spec: yup.object({
          sshKey: yup
            .string()
            .test(
              'openssh-public-key',
              t(
                'Must be a valid OpenSSH public key (ssh-rsa, ssh-ed25519, ecdsa-sha2-*, or sk-* prefixed).',
              ),
              (value) => !value?.trim() || OPENSSH_PUBLIC_KEY_REGEX.test(value.trim()),
            ),
        }),
      });
    case 'configuration': {
      const definitions = readCatalogFieldDefinitions(catalogItem);
      const userDataOverlay = getCatalogFieldOverlay('spec.user_data', definitions, t('User data'));
      return yup.object({
        spec: yup.object({
          userData: yup
            .string()
            .test('user-data-max-bytes', t('User data must not exceed 64 KB.'), (value) => {
              if (!value) {
                return true;
              }
              return new TextEncoder().encode(value).byteLength <= USER_DATA_MAX_BYTES;
            })
            .test(
              'user-data-immutable',
              t('catalogProvision.validation.required'),
              (value) => userDataOverlay.editable || Boolean(value?.trim()),
            ),
          image: yup.object({
            sourceRef: yup.string(),
          }),
        }),
      });
    }
    default:
      return undefined;
  }
};

const buildBmReviewSections = (
  values: BareMetalInstanceWizardValues,
  _catalogItem: BareMetalInstanceCatalogItem,
  t: TFunction,
): ReviewSection[] => [
  {
    title: t('catalogProvision.steps.general.title'),
    rows: [
      reviewRow(t('Name'), formatReviewScalar(values.metadata.name)),
      reviewRow(t('SSH public key'), formatReviewScalar(values.spec.sshKey, true)),
    ],
  },
  {
    title: t('catalogProvision.steps.configuration.title'),
    rows: [
      reviewRow(t('OS image'), formatReviewScalar(values.spec.image.sourceRef)),
      reviewRow(t('User data'), formatReviewScalar(values.spec.userData, true)),
    ],
  },
];

const applyBmCatalogDefaults = (
  catalogItem: BareMetalInstanceCatalogItem,
  helpers: FormikHelpers<BareMetalInstanceWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);

  const sshKeyOverlay = getCatalogFieldOverlay(
    BM_SSH_KEY_WIRE_PATH,
    definitions,
    t('SSH public key'),
  );
  const imageOverlay = getCatalogFieldOverlay('spec.image.source_ref', definitions, t('OS image'));
  const userDataOverlay = getCatalogFieldOverlay('spec.user_data', definitions, t('User data'));

  const sshDefault = overlayDefaultToFormValue(sshKeyOverlay);
  if (sshDefault !== undefined) {
    void helpers.setFieldValue(BM_SSH_KEY_FORM_PATH, sshDefault);
  }

  const imageDefault = overlayDefaultToFormValue(imageOverlay);
  if (imageDefault !== undefined) {
    void helpers.setFieldValue('spec.image.sourceRef', imageDefault);
  }

  const userDataDefault = overlayDefaultToFormValue(userDataOverlay);
  if (userDataDefault !== undefined) {
    void helpers.setFieldValue('spec.userData', userDataDefault);
  }
};

const buildBmCreatePayload = (
  values: BareMetalInstanceWizardValues,
  _catalogItem: BareMetalInstanceCatalogItem,
): MessageInitShape<typeof BareMetalInstanceSchema> => {
  const spec: Record<string, unknown> = {
    catalog_item: values.catalogItemId,
    run_strategy: BareMetalInstanceRunStrategy.ALWAYS,
  };

  const sshKey = values.spec.sshKey.trim();
  if (sshKey) {
    spec.ssh_public_key = sshKey;
  }

  const userData = values.spec.userData.trim();
  if (userData) {
    spec.user_data = userData;
  }

  const imageRef = values.spec.image.sourceRef.trim();
  if (imageRef) {
    spec.image = { source_type: 'registry', source_ref: imageRef };
  }

  return {
    metadata: { name: values.metadata.name.trim() },
    spec,
  };
};

export const useBareMetalInstanceAdapter = (): CatalogProvisionAdapter<
  BareMetalInstanceCatalogItem,
  BareMetalInstanceWizardValues,
  MessageInitShape<typeof BareMetalInstanceSchema>
> => {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      kind: 'bare_metal_instance' as const,
      useCatalogItems: () => {
        const query = useBareMetalInstanceCatalogItems();
        return {
          data: query.data ?? [],
          isPending: query.isPending,
          isError: query.isError,
          refetch: () => {
            void query.refetch();
          },
        };
      },
      getInitialValues: (_catalogItem) => createEmptyBareMetalInstanceValues(),
      buildCreatePayload: buildBmCreatePayload,
      ConfigurationStep: BareMetalConfigurationStep,
      NetworkingStep: () => null,
      resolveGeneralFields: (catalogItem) => buildBmGeneralFields(catalogItem, t),
      getStepValidationSchema: (catalogItem, stepId) => buildBmStepSchema(catalogItem, stepId, t),
      getReviewSections: (values, catalogItem) => buildBmReviewSections(values, catalogItem, t),
      onCatalogItemSelected: (item, helpers) => {
        helpers.resetForm({
          values: {
            ...createEmptyBareMetalInstanceValues(),
            catalogItemId: item.id,
          },
        });
        applyBmCatalogDefaults(item, helpers, t);
      },
      wizardTitleKey: 'Provision bare metal',
      wizardDescriptionKey: 'Provision a bare metal instance from a catalog item.',
      breadcrumbCreateLabelKey: 'Provision bare metal',
      ariaLabelKey: 'Bare metal provisioning wizard',
    }),
    [t],
  );
};
