# Leave Allocation API - Refactored Structure

## Overview
Leave allocations have been moved from company-level to employee-level routes, following the same pattern as leave requests. This makes more semantic sense as allocations belong to specific employees.

## Changes Made

### 1. Removed from Companies Router
- ❌ Removed `GET /api/v1/companies/:companyId/allocations`
- ❌ Removed `POST /api/v1/companies/:companyId/allocations`
- ❌ Removed `POST /api/v1/companies/:companyId/allocations/bulk`

### 2. Added to Employees Router
- ✅ Added `GET /api/v1/companies/:companyId/employees/:employeeId/allocations`
- ✅ Added `POST /api/v1/companies/:companyId/employees/:employeeId/allocations`

### 3. Flat Routes (Unchanged)
- ✅ `GET /api/v1/allocations/:allocationId` - Get by ID
- ✅ `PATCH /api/v1/allocations/:allocationId` - Update
- ✅ `DELETE /api/v1/allocations/:allocationId` - Delete

## API Endpoints

### Nested Routes (Employee Context)
**Base Path:** `/api/v1/companies/:companyId/employees/:employeeId/allocations`

#### 1. Get Employee Allocations
- **Method:** GET
- **Path:** `/api/v1/companies/:companyId/employees/:employeeId/allocations`
- **Access:** HR_ADMIN, ORG_ADMIN, MANAGER, EMPLOYEE, SUPER_ADMIN
- **Query Params:**
  - `year` (optional) - Filter by year
  - `leaveType` (optional) - Filter by leave type
  - `page` (optional) - Page number (default: 1)
  - `limit` (optional) - Items per page (default: 20)
- **Authorization:**
  - SUPER_ADMIN: Can view any employee's allocations
  - HR_ADMIN/ORG_ADMIN/MANAGER: Can view allocations for employees in their company
  - EMPLOYEE: Can only view their own allocations
- **Response:**
  ```json
  {
    "success": true,
    "message": "Employee allocations retrieved successfully",
    "data": {
      "allocations": [
        {
          "id": "uuid",
          "employeeId": "uuid",
          "year": 2024,
          "leaveType": "ANNUAL",
          "allocated": 20,
          "used": 5,
          "remaining": 15,
          "employee": {
            "id": "uuid",
            "firstName": "John",
            "lastName": "Doe",
            "code": "EMP001"
          }
        }
      ],
      "pagination": {
        "total": 10,
        "page": 1,
        "limit": 20,
        "totalPages": 1
      }
    }
  }
  ```

#### 2. Create Employee Allocation
- **Method:** POST
- **Path:** `/api/v1/companies/:companyId/employees/:employeeId/allocations`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Body:**
  ```json
  {
    "year": 2024,
    "leaveType": "ANNUAL",
    "allocated": 20
  }
  ```
- **Note:** `employeeId` is taken from URL parameter, not body
- **Validations:**
  - Employee must belong to the company
  - No duplicate allocation for same employee/year/type
  - Year must be between 2000-2100
  - Allocated must be >= 0

### Flat Routes (Resource Management)
**Base Path:** `/api/v1/allocations`

#### 3. Get Allocation by ID
- **Method:** GET
- **Path:** `/api/v1/allocations/:allocationId`
- **Access:** HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN
- **Authorization:** Validates company access via allocation's employee

#### 4. Update Allocation
- **Method:** PATCH
- **Path:** `/api/v1/allocations/:allocationId`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Body:**
  ```json
  {
    "allocated": 25,  // Optional
    "used": 10        // Optional
  }
  ```
- **Validations:**
  - Used cannot exceed allocated
  - Company access validation

#### 5. Delete Allocation
- **Method:** DELETE
- **Path:** `/api/v1/allocations/:allocationId`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Validations:**
  - Cannot delete if allocation has been used (used > 0)
  - Company access validation

## Key Features

### Authorization Logic
1. **SUPER_ADMIN:** Full access to all allocations across all companies
2. **HR_ADMIN/ORG_ADMIN:** Can manage allocations for employees in their company
3. **MANAGER:** Can view allocations for employees in their company
4. **EMPLOYEE:** Can only view their own allocations

### Service Layer
- **`getEmployeeAllocations()`** - New method for employee-specific allocation retrieval
  - Validates employee exists
  - Enforces company-level access control
  - Enforces employee-level access control for EMPLOYEE role
  - Supports filtering by year and leave type
  - Includes pagination

- **`createAllocation()`** - Updated to handle employee context
  - Validates employee belongs to company
  - Prevents duplicate allocations
  - Sets initial used to 0

### Schema Updates
- `employeeId` is now optional in `createLeaveAllocationSchema`
- When creating via employee route, employeeId comes from URL parameter
- Controller overrides body employeeId with URL parameter for security

## Migration Notes

### Before (Company-level)
```
POST /api/v1/companies/company-uuid/allocations
{
  "employeeId": "emp-uuid",
  "year": 2024,
  "leaveType": "ANNUAL",
  "allocated": 20
}
```

### After (Employee-level)
```
POST /api/v1/companies/company-uuid/employees/emp-uuid/allocations
{
  "year": 2024,
  "leaveType": "ANNUAL",
  "allocated": 20
}
```

## Benefits

1. **Better Semantics:** Allocations are naturally associated with employees
2. **Consistent Pattern:** Matches leave requests structure
3. **Clearer URLs:** Employee context is explicit in the URL
4. **Better Security:** EmployeeId from URL prevents tampering
5. **Employee Access:** Employees can view their own allocations

## Files Modified

1. **`companies.routes.ts`** - Removed allocation routes
2. **`employees.routes.ts`** - Added allocation routes
3. **`allocations.controller.ts`** - Added employee-specific methods
4. **`allocations.service.ts`** - Added `getEmployeeAllocations()` method
5. **`allocations.schema.ts`** - Made employeeId optional in create schema

## TypeScript Compilation
✅ All files compile successfully (exit code 0)
✅ Full type safety maintained
✅ Proper error handling with AppError
