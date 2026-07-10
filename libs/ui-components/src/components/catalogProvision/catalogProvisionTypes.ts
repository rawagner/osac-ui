import type { MessageInitShape } from '@bufbuild/protobuf';

import type { BareMetalInstanceSchema } from '@osac/types';

import type { BuildComputeInstanceCreateBodyInput } from '../../api/v1/compute-instance-wire';
import type { BareMetalInstanceWizardValues } from './wizard/adapters/bareMetalInstance/fields';
import type { ComputeInstanceWizardValues } from './wizard/adapters/computeInstance/fields';

/**
 * The union of all possible create-payload types produced by the provisioning
 * wizard. Add a new member here whenever a new resource kind is wired into the
 * wizard so that page-level `onProvision` handlers are typed against the full
 * set.
 */
export type CatalogProvisionPayload =
  | BuildComputeInstanceCreateBodyInput
  | MessageInitShape<typeof BareMetalInstanceSchema>;

/**
 * The union of all form-values shapes used inside the wizard. Add a new member
 * here whenever a new resource kind is wired in.
 */
export type CatalogProvisionWizardValues = ComputeInstanceWizardValues | BareMetalInstanceWizardValues;
