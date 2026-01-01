import { Company } from '@prisma/client';

export type UpdateCompanyInput = Partial<Pick<Company, 'name' | 'timezone' | 'currency' | 'dateFormat' | 'logoUrl'>>;
