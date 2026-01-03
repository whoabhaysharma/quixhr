import { Organization } from '@prisma/client';

export type UpdateOrganizationInput = Partial<Pick<Organization, 'name' | 'timezone' | 'currency' | 'dateFormat' | 'logoUrl'>>;
