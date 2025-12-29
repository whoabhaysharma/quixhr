# Multi-Tenant Authorization System

## Overview

This document explains how the multi-tenant authorization system works in the QuixHR backend. The system ensures that users can only access data they're authorized to see based on their role and company affiliation.

## Architecture

### 1. **Role-Based Access Control (RBAC)**

We have 5 roles with hierarchical permissions:

```typescript
enum Role {
  SUPER_ADMIN    // Can access ALL data across ALL companies
  ORG_ADMIN      // Can access all data within their company
  HR_ADMIN       // Can access all data within their company
  MANAGER        // Can access employee data within their company
  EMPLOYEE       // Can only access their own data
}
```

### 2. **Multi-Tenant Data Isolation**

#### Company Scoping Rules:

- **SUPER_ADMIN**: Can query across ALL companies
  - Without `?companyId` filter → sees ALL data
  - With `?companyId=xxx` filter → sees only that company's data

- **ORG_ADMIN / HR_ADMIN / MANAGER**: Automatically scoped to their company
  - Always filtered by their `companyId`
  - Cannot access other companies' data

- **EMPLOYEE**: Can only access their own resources
  - Filtered by both `companyId` AND `userId`

## Implementation

### Middleware Stack

Every protected route goes through this middleware chain:

```typescript
router.use(protect);              // 1. Verify JWT token
router.use(attachAuthContext);    // 2. Attach authorization context
router.use(ensureCompanyAccess);  // 3. Ensure company access
router.use(restrictTo(...roles)); // 4. Check role permissions
```

### Authorization Context

The `attachAuthContext` middleware creates an authorization context:

```typescript
interface AuthContext {
    userId: string;
    role: Role;
    companyId?: string;
    isSuperAdmin: boolean;
    canAccessAllCompanies: boolean;
}
```

This context is attached to `req.authContext` and used throughout the request lifecycle.

### Service Layer Data Scoping

Services accept an optional `companyId` parameter:

```typescript
// SUPER_ADMIN: companyId is undefined → query all companies
// Others: companyId is their company → query only their company
export const listEmployees = async (
    companyId: string | undefined,
    filters: EmployeeFilters
) => {
    const where: any = {};
    
    // Only filter by company if companyId is provided
    if (companyId) {
        where.companyId = companyId;
    }
    
    // ... rest of query
};
```

### Controller Layer

Controllers use the `getEffectiveCompanyId()` helper:

```typescript
export const listEmployees = catchAsync(async (req: Request, res: Response) => {
    // SUPER_ADMIN: Gets companyId from ?companyId query param (or undefined)
    // Others: Gets their own companyId from authContext
    const companyId = getEffectiveCompanyId(req);
    
    const employees = await EmployeeService.listEmployees(companyId, filters);
    
    sendResponse(res, 200, { employees });
});
```

## Usage Examples

### Example 1: SUPER_ADMIN Queries All Employees

```bash
GET /api/v1/employees
Authorization: Bearer <super_admin_token>

# Returns employees from ALL companies
```

### Example 2: SUPER_ADMIN Filters by Company

```bash
GET /api/v1/employees?companyId=abc-123
Authorization: Bearer <super_admin_token>

# Returns employees only from company abc-123
```

### Example 3: HR_ADMIN Queries Employees

```bash
GET /api/v1/employees
Authorization: Bearer <hr_admin_token>

# Returns employees only from HR_ADMIN's company
# Even if ?companyId is provided, it's ignored for non-SUPER_ADMIN
```

### Example 4: Employee Gets Own Profile

```bash
GET /api/v1/employees/my-profile
Authorization: Bearer <employee_token>

# Returns only the authenticated employee's profile
```

## Security Guarantees

1. **Data Isolation**: Non-SUPER_ADMIN users CANNOT access other companies' data
2. **Role Enforcement**: Middleware enforces role-based permissions at route level
3. **Service-Level Filtering**: Even if middleware is bypassed, services filter by company
4. **Type Safety**: TypeScript ensures companyId is handled correctly

## Best Practices

### When Creating New Endpoints:

1. **Always use the middleware stack**:
   ```typescript
   router.use(protect);
   router.use(attachAuthContext);
   router.use(ensureCompanyAccess);
   ```

2. **Use `getEffectiveCompanyId()` in controllers**:
   ```typescript
   const companyId = getEffectiveCompanyId(req);
   ```

3. **Make `companyId` optional in services**:
   ```typescript
   export const myService = async (
       companyId: string | undefined,
       ...
   ) => {
       const where: any = {};
       if (companyId) {
           where.companyId = companyId;
       }
       // ...
   };
   ```

4. **Document SUPER_ADMIN behavior**:
   ```typescript
   /**
    * @note SUPER_ADMIN can filter by ?companyId=xxx
    */
   ```

## Testing

### Test Cases to Cover:

1. ✅ SUPER_ADMIN can query all companies
2. ✅ SUPER_ADMIN can filter by specific company
3. ✅ ORG_ADMIN can only see their company
4. ✅ HR_ADMIN cannot access other companies
5. ✅ MANAGER cannot access other companies
6. ✅ EMPLOYEE can only access own data
7. ✅ Unauthorized users are rejected
8. ✅ Invalid companyId returns 404

## Migration Guide

If you have existing endpoints that need to be updated:

1. Add authorization middleware to routes
2. Update controllers to use `getEffectiveCompanyId()`
3. Update services to accept optional `companyId`
4. Add company filtering logic in services
5. Test with different roles

## Common Pitfalls

❌ **Don't do this**:
```typescript
// Bad: Hardcoding companyId from req.user
const companyId = req.user.companyId;
```

✅ **Do this instead**:
```typescript
// Good: Use helper function
const companyId = getEffectiveCompanyId(req);
```

❌ **Don't do this**:
```typescript
// Bad: Assuming companyId is always present
const where = { companyId };
```

✅ **Do this instead**:
```typescript
// Good: Conditionally add companyId
const where: any = {};
if (companyId) {
    where.companyId = companyId;
}
```

## Summary

This authorization system provides:
- ✅ **Multi-tenancy**: Complete data isolation between companies
- ✅ **Role-based access**: Hierarchical permissions
- ✅ **SUPER_ADMIN flexibility**: Cross-company queries when needed
- ✅ **Security by default**: Automatic filtering for non-admin users
- ✅ **Maintainability**: Centralized authorization logic
- ✅ **Scalability**: Easy to extend to new resources

The system follows industry best practices and ensures that your application is secure, scalable, and maintainable.
