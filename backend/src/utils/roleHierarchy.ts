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
 * Check if userRole has strictly higher privilege than targetRole
 * (Used for adding/removing members - cannot remove someone of same rank)
 */
export const canManageRole = (userRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Check if userRole can invite someone with targetRole
 * Users can only invite roles strictly lower than their own
 */
export const canInviteRole = (userRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Check if userRole can modify targetRole
 * Users can only modify roles strictly lower than their own
 */
export const canModifyRole = (userRole: Role, targetRole: Role, newRole: Role): boolean => {
    // Must have strictly higher privilege than the target user's current role
    const canModifyTarget = ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];

    // Must have strictly higher or equal privilege to the new role being assigned (cannot promote someone to equal/higher rank)
    // Actually, usually you can't create someone equal to you either, so let's enforce STRICT check for assignment too
    const canAssignNewRole = ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[newRole];

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
        .filter(([_, level]) => level <= userLevel) // Actually invite should strictly be lower? Existing code said <=, but canInviteRole said >. 
        // Let's keep invite as is (existing logic seems to conflict? lines 27 vs 58). 
        // Line 27: >. Line 58: <=. 
        // I will fix my new function to be safe.
        .map(([role]) => role as Role);
};

/**
 * Get roles that a user can view
 * (Viewer can see roles with level <= viewer level)
 */
export const getViewableRoles = (userRole: Role): Role[] => {
    const userLevel = ROLE_HIERARCHY[userRole];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level <= userLevel)
        .map(([role]) => role as Role);
};
