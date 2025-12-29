# Role Hierarchy System

## Overview

The role hierarchy system ensures that users can only invite or modify roles that are equal to or lower than their own role. This prevents privilege escalation and maintains proper authorization boundaries.

## Role Hierarchy

```
SUPER_ADMIN (Level 5) - Highest privilege
    ↓
ORG_ADMIN (Level 4)
    ↓
HR_ADMIN (Level 3)
    ↓
MANAGER (Level 2)
    ↓
EMPLOYEE (Level 1) - Lowest privilege
```

## Rules

### 1. **Invitation Rules** (`canInviteRole`)

Users can invite roles **equal to or lower** than their own:

| User Role | Can Invite |
|-----------|------------|
| SUPER_ADMIN | All roles |
| ORG_ADMIN | ORG_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE |
| HR_ADMIN | HR_ADMIN, MANAGER, EMPLOYEE |
| MANAGER | MANAGER, EMPLOYEE |
| EMPLOYEE | EMPLOYEE only |

**Examples**:
- ✅ HR_ADMIN can invite EMPLOYEE
- ✅ HR_ADMIN can invite MANAGER
- ✅ HR_ADMIN can invite HR_ADMIN
- ❌ HR_ADMIN **cannot** invite ORG_ADMIN
- ❌ MANAGER **cannot** invite HR_ADMIN

### 2. **Role Modification Rules** (`canModifyRole`)

Users can modify roles **lower** than their own and assign roles **equal to or lower** than their own:

| User Role | Can Modify | Can Assign To |
|-----------|------------|---------------|
| SUPER_ADMIN | All roles | All roles |
| ORG_ADMIN | HR_ADMIN, MANAGER, EMPLOYEE | ORG_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE |
| HR_ADMIN | MANAGER, EMPLOYEE | HR_ADMIN, MANAGER, EMPLOYEE |
| MANAGER | EMPLOYEE | MANAGER, EMPLOYEE |
| EMPLOYEE | None | None |

**Examples**:
- ✅ ORG_ADMIN can promote MANAGER → HR_ADMIN
- ✅ ORG_ADMIN can demote HR_ADMIN → MANAGER
- ✅ HR_ADMIN can promote EMPLOYEE → MANAGER
- ❌ HR_ADMIN **cannot** modify ORG_ADMIN's role
- ❌ HR_ADMIN **cannot** promote MANAGER → ORG_ADMIN
- ❌ MANAGER **cannot** modify another MANAGER's role

### 3. **SUPER_ADMIN Protection**

- SUPER_ADMIN role **cannot be modified** by anyone
- No one can invite a SUPER_ADMIN
- No one can promote/demote to/from SUPER_ADMIN

## Implementation

### Utility Functions

Located in `/utils/roleHierarchy.ts`:

```typescript
// Check if user can invite a role
canInviteRole(userRole: Role, targetRole: Role): boolean

// Check if user can modify a role
canModifyRole(userRole: Role, currentRole: Role, newRole: Role): boolean

// Get roles that a user can invite
getInvitableRoles(userRole: Role): Role[]
```

### Service Layer

**Invite User**:
```typescript
export const inviteUser = async (
    companyId: string,
    inviterRole: Role,  // ← Inviter's role
    data: InviteUserDTO
) => {
    // Check if inviter can invite this role
    if (!canInviteRole(inviterRole, data.role)) {
        throw new AppError('Cannot invite higher roles', 403);
    }
    // ...
};
```

**Update User Role**:
```typescript
export const updateUserRole = async (
    userId: string,
    companyId: string,
    updaterRole: Role,  // ← Updater's role
    data: UpdateUserRoleDTO
) => {
    // Check if updater can modify this role
    if (!canModifyRole(updaterRole, user.role, data.role)) {
        throw new AppError('Cannot modify role', 403);
    }
    // ...
};
```

### Controller Layer

Controllers extract the user's role from `req.user`:

```typescript
export const inviteUser = catchAsync(async (req, res) => {
    const inviterRole = req.user?.role;
    
    const invitation = await CompanyService.inviteUser(
        companyId,
        inviterRole,  // ← Pass inviter's role
        req.body
    );
});
```

## Error Messages

### Invitation Errors

```json
{
  "status": "fail",
  "message": "You cannot invite users with role ORG_ADMIN. You can only invite roles equal to or lower than your own."
}
```

### Role Modification Errors

```json
{
  "status": "fail",
  "message": "You cannot modify this user's role. You can only modify roles lower than your own and assign roles equal to or lower than your own."
}
```

### SUPER_ADMIN Protection

```json
{
  "status": "fail",
  "message": "Cannot modify SUPER_ADMIN role"
}
```

## Testing Scenarios

### Scenario 1: HR_ADMIN invites EMPLOYEE ✅
```bash
POST /api/v1/company/invite
Authorization: Bearer <hr_admin_token>
{
  "email": "newemployee@example.com",
  "role": "EMPLOYEE"
}
# Result: Success
```

### Scenario 2: HR_ADMIN invites ORG_ADMIN ❌
```bash
POST /api/v1/company/invite
Authorization: Bearer <hr_admin_token>
{
  "email": "newadmin@example.com",
  "role": "ORG_ADMIN"
}
# Result: 403 Forbidden
```

### Scenario 3: ORG_ADMIN promotes MANAGER to HR_ADMIN ✅
```bash
PATCH /api/v1/users/user-id/role
Authorization: Bearer <org_admin_token>
{
  "role": "HR_ADMIN"
}
# Result: Success
```

### Scenario 4: MANAGER tries to promote EMPLOYEE to HR_ADMIN ❌
```bash
PATCH /api/v1/users/user-id/role
Authorization: Bearer <manager_token>
{
  "role": "HR_ADMIN"
}
# Result: 403 Forbidden
```

### Scenario 5: HR_ADMIN tries to modify ORG_ADMIN ❌
```bash
PATCH /api/v1/users/org-admin-id/role
Authorization: Bearer <hr_admin_token>
{
  "role": "MANAGER"
}
# Result: 403 Forbidden
```

## Security Benefits

✅ **Prevents privilege escalation**: Users cannot grant themselves higher privileges  
✅ **Maintains hierarchy**: Ensures organizational structure is respected  
✅ **Protects SUPER_ADMIN**: Highest role cannot be compromised  
✅ **Clear error messages**: Users understand why actions are forbidden  
✅ **Consistent enforcement**: Applied to both invitations and role changes

## Summary

The role hierarchy system provides a robust, secure way to manage user permissions:

- **Invitation**: Can only invite equal or lower roles
- **Modification**: Can only modify lower roles, assign equal or lower roles
- **Protection**: SUPER_ADMIN is fully protected
- **Transparency**: Clear error messages guide users

This ensures that the authorization system is both secure and user-friendly.
