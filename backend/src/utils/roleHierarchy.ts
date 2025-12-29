import { Role } from '@prisma/client';

/**
 * Role hierarchy (higher number = higher privilege)
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 5,
    [Role.ORG_ADMIN]: 4,
    [Role.HR_ADMIN]: 3,
    [Role.MANAGER]: 2,
    [Role.EMPLOYEE]: 1,
};

/**
 * Check if userRole has higher or equal privilege than targetRole
 */
export const canManageRole = (userRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};

/**
 * Check if userRole can invite someone with targetRole
 * Users can only invite roles equal to or lower than their own
 */
export const canInviteRole = (userRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};

/**
 * Check if userRole can modify targetRole
 * Users can only modify roles lower than their own (not equal)
 */
export const canModifyRole = (userRole: Role, targetRole: Role, newRole: Role): boolean => {
    // Must have higher privilege than the target user's current role
    const canModifyTarget = ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];

    // Must have higher or equal privilege to the new role being assigned
    const canAssignNewRole = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[newRole];

    return canModifyTarget && canAssignNewRole;
};

/**
 * Get the role hierarchy level
 */
export const getRoleLevel = (role: Role): number => {
    return ROLE_HIERARCHY[role];
};

/**
 * Get roles that a user can invite
 */
export const getInvitableRoles = (userRole: Role): Role[] => {
    const userLevel = ROLE_HIERARCHY[userRole];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level <= userLevel)
        .map(([role]) => role as Role);
};
