import { Role } from '@prisma/client';

export const ROLES = {
  ADMIN: Role.ADMIN,
  HR: Role.HR,
  EMPLOYEE: Role.EMPLOYEE,
} as const;

export const ROLE_VALUES = Object.values(ROLES);

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
