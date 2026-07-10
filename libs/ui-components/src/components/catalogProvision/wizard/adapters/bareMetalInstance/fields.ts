export interface BareMetalInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
  };
  spec: {
    sshKey: string;
    image: {
      sourceRef: string;
    };
    userData: string;
  };
}

export const createEmptyBareMetalInstanceValues = (): BareMetalInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshKey: '',
    image: { sourceRef: '' },
    userData: '',
  },
});
