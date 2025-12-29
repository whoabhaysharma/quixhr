# Employee Module - Multi-Tenant Authorization

## Overview

The Employee module implements a **multi-tenant authorization system** using the existing `tenantContext` middleware. This ensures proper data isolation between companies while allowing SUPER_ADMIN to access data across all companies.

## How It Works

### 1. Middleware Chain

Every employee route goes through this middleware chain:

```typescript
router.use(protect);        // 1. Verify JWT token & attach req.user
router.use(resolveTenant);  // 2. Resolve targetCompanyId based on role
router.use(restrictTo(...)); // 3. Check role permissions
```

### 2. Tenant Resolution (`resolveTenant` middleware)

The `resolveTenant` middleware sets `req.targetCompanyId`:

- **SUPER_ADMIN**: 
  - Can pass `?companyId=xxx` to filter by specific company
  - Without query param → `targetCompanyId = undefined` (sees ALL companies)
  
- **ORG_ADMIN / HR_ADMIN / MANAGER / EMPLOYEE**:
  - Always uses their own `companyId` from JWT
  - `targetCompanyId = user.companyId`

### 3. Service Layer

Services accept optional `companyId`:

```typescript
export const listEmployees = async (
    companyId: string | undefined,  // undefined = all companies (SUPER_ADMIN only)
    filters: EmployeeFilters
) => {
    const where: any = {};
    
    // Only filter by company if companyId is provided
    if (companyId) {
        where.companyId = companyId;
    }
    
    // Query employees...
};
```

### 4. Controller Layer

Controllers simply pass `req.targetCompanyId` to services:

```typescript
export const listEmployees = catchAsync(async (req: Request, res: Response) => {
    const companyId = req.targetCompanyId;  // Resolved by middleware
    const employees = await EmployeeService.listEmployees(companyId, filters);
    sendResponse(res, 200, { employees });
});
```

## API Endpoints

### GET `/api/v1/employees`
**Access**: Manager+

**Examples**:

```bash
# SUPER_ADMIN - Get all employees from all companies
GET /api/v1/employees
Authorization: Bearer <super_admin_token>

# SUPER_ADMIN - Get employees from specific company
GET /api/v1/employees?companyId=abc-123
Authorization: Bearer <super_admin_token>

# HR_ADMIN - Get employees from their company only
GET /api/v1/employees
Authorization: Bearer <hr_admin_token>
# Even if ?companyId is passed, it's ignored for non-SUPER_ADMIN
```

### POST `/api/v1/employees`
**Access**: HR Admin

Create a new employee (manual entry, no user account).

### GET `/api/v1/employees/:id`
**Access**: Manager+

Get full employee profile with calendar, leave grade, and allocations.

### PATCH `/api/v1/employees/:id`
**Access**: HR Admin

Update employee profile (name, code, status, joining date).

### PATCH `/api/v1/employees/:id/assign`
**Access**: HR Admin

**Crucial endpoint** - Assign calendar (shift) and/or leave grade (policy) to employee.

```json
{
  "calendarId": "uuid",
  "leaveGradeId": "uuid"
}
```

### PATCH `/api/v1/employees/:id/status`
**Access**: HR Admin

Update employee status for offboarding.

```json
{
  "status": "INACTIVE"
}
```

### GET `/api/v1/employees/my-profile`
**Access**: Employee (any authenticated user)

Get current user's own employee profile (read-only).

### POST `/api/v1/employees/import`
**Access**: HR Admin

Bulk import employees via CSV/JSON.

```json
{
  "employees": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "code": "EMP-001",
      "joiningDate": "2024-01-15",
      "status": "ACTIVE"
    }
  ]
}
```

## Security Model

### Data Isolation

| Role | Can Access |
|------|-----------|
| **SUPER_ADMIN** | ALL companies (with optional filtering) |
| **ORG_ADMIN** | Only their company |
| **HR_ADMIN** | Only their company |
| **MANAGER** | Only their company (read-only for employees) |
| **EMPLOYEE** | Only their own profile |

### Validation Layers

1. **Route Level**: `restrictTo()` middleware checks role
2. **Middleware Level**: `resolveTenant()` sets correct companyId
3. **Service Level**: Filters data by companyId
4. **Database Level**: Prisma queries enforce company scoping

## Implementation Pattern

This pattern can be reused for other modules:

```typescript
// 1. Routes
router.use(protect);
router.use(resolveTenant);
router.get('/', restrictTo(...roles), controller.list);

// 2. Controller
export const list = catchAsync(async (req, res) => {
    const companyId = req.targetCompanyId;
    const data = await Service.list(companyId, filters);
    sendResponse(res, 200, { data });
});

// 3. Service
export const list = async (companyId: string | undefined, filters: any) => {
    const where: any = {};
    if (companyId) {
        where.companyId = companyId;
    }
    return await prisma.model.findMany({ where });
};
```

## Testing Checklist

- [ ] SUPER_ADMIN can list all employees
- [ ] SUPER_ADMIN can filter by specific company
- [ ] HR_ADMIN can only see their company
- [ ] MANAGER can only see their company
- [ ] EMPLOYEE can only see own profile
- [ ] Non-SUPER_ADMIN cannot bypass company filter
- [ ] Invalid companyId returns 404
- [ ] Unauthorized users are rejected

## Summary

✅ **Multi-tenancy**: Complete data isolation between companies  
✅ **Role-based access**: Hierarchical permissions  
✅ **SUPER_ADMIN flexibility**: Cross-company queries  
✅ **Security by default**: Automatic filtering  
✅ **Maintainability**: Reusable pattern  
✅ **Scalability**: Easy to extend to new modules
