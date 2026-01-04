import { Role } from '../constants/roles';

/**
 * Role hierarchy (higher number = higher privilege)
 * Matches backend hierarchy.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 5,
    [Role.ORG_ADMIN]: 4,
    [Role.HR_ADMIN]: 3,
    [Role.MANAGER]: 2,
    [Role.EMPLOYEE]: 1,
};

/**
 * Check if userRole has strictly higher privilege than targetRole
 * (Used for adding/removing members - cannot remove someone of same rank)
 */
export const canManageRole = (userRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Check if userRole can modify targetRole to newRole
 * Users can only modify roles strictly lower than their own.
 * Users cannot assign a role equal to or higher than their own.
 */
export const canModifyRole = (userRole: Role, targetRole: Role, newRole: Role): boolean => {
    const canModifyTarget = ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
    const canAssignNewRole = ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[newRole];
    return canModifyTarget && canAssignNewRole;
};

/**
 * Get roles that a user can assign to others.
 * Can only assign roles strictly lower than their own.
 */
export const getAssignableRoles = (userRole: Role): Role[] => {
    const userLevel = ROLE_HIERARCHY[userRole];
    return (Object.keys(ROLE_HIERARCHY) as Role[])
        .filter(role => ROLE_HIERARCHY[role] < userLevel);
};
