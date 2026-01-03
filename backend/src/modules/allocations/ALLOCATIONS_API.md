# Leave Allocation API Documentation

## Overview
Complete implementation of Leave Allocation APIs following shallow routing pattern.

## Files Created

### Core Files
1. **allocations.types.ts** - TypeScript interfaces for allocation data structures
2. **allocations.schema.ts** - Zod validation schemas and response DTOs
3. **allocations.service.ts** - Business logic for allocation management
4. **allocations.controller.ts** - Request handlers with authorization
5. **allocations.routes.ts** - Flat routes for allocation management

## API Endpoints

### Nested Routes (Organization Context)
**Base Path:** `/api/v1/org/:organizationId/allocations`

#### 1. List Allocations
- **Method:** GET
- **Path:** `/api/v1/org/:organizationId/allocations`
- **Access:** HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN
- **Query Params:**
  - `employeeId` (optional) - Filter by employee
  - `year` (optional) - Filter by year
  - `leaveType` (optional) - Filter by leave type
  - `page` (optional) - Page number (default: 1)
  - `limit` (optional) - Items per page (default: 20)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Allocations retrieved successfully",
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
        "total": 100,
        "page": 1,
        "limit": 20,
        "totalPages": 5
      }
    }
  }
  ```

#### 2. Create Allocation
- **Method:** POST
- **Path:** `/api/v1/org/:organizationId/allocations`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Body:**
  ```json
  {
    "employeeId": "uuid",
    "year": 2024,
    "leaveType": "ANNUAL",
    "allocated": 20
  }
  ```
- **Validations:**
  - Employee must belong to the organization
  - No duplicate allocation for same employee/year/type
  - Year must be between 2000-2100
  - Allocated must be >= 0

#### 3. Bulk Allocate
- **Method:** POST
- **Path:** `/api/v1/org/:organizationId/allocations/bulk`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Body:**
  ```json
  {
    "year": 2024,
    "leaveGradeId": "uuid",  // Optional - filter by leave grade
    "employeeIds": ["uuid1", "uuid2"]  // Optional - specific employees
  }
  ```
- **Description:** Automatically creates allocations based on leave grade policies
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully allocated leaves to 25 employees",
    "data": {
      "allocated": 75,  // Total allocations created
      "employees": ["uuid1", "uuid2", ...]
    }
  }
  ```

### Flat Routes (Resource Management)
**Base Path:** `/api/v1/allocations`

#### 4. Get Allocation by ID
- **Method:** GET
- **Path:** `/api/v1/allocations/:allocationId`
- **Access:** HR_ADMIN, ORG_ADMIN, MANAGER, SUPER_ADMIN
- **Authorization:** Validates organization access via allocation's employee

#### 5. Update Allocation
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
  - Organization access validation

#### 6. Delete Allocation
- **Method:** DELETE
- **Path:** `/api/v1/allocations/:allocationId`
- **Access:** HR_ADMIN, ORG_ADMIN, SUPER_ADMIN
- **Validations:**
  - Cannot delete if allocation has been used (used > 0)
  - Organization access validation

## Features

### Authorization
- **Organization Isolation:** Users can only manage allocations for their organization
- **SUPER_ADMIN Override:** Can manage allocations across all organizations
- **Role-based Access:** Different permissions for different roles

### Business Logic
1. **Automatic Calculation:** Remaining leave = allocated - used
2. **Bulk Allocation:** Creates allocations based on leave grade policies
3. **Upsert Logic:** Bulk allocation updates existing allocations if found
4. **Validation:** Prevents invalid states (used > allocated)
5. **Employee Verification:** Ensures employee belongs to organization

### Data Integrity
- Unique constraint: `employeeId + year + leaveType`
- Prevents duplicate allocations
- Validates employee-organization relationship
- Protects against deleting used allocations

## Integration

### Organizations Router
Added nested routes for:
- Listing allocations (with filters)
- Creating individual allocations
- Bulk allocation

### App.ts
Registered flat routes at `/api/v1/allocations`

## Usage Examples

### Create Allocation for Employee
```bash
POST /api/v1/org/org-uuid/allocations
{
  "employeeId": "emp-uuid",
  "year": 2024,
  "leaveType": "ANNUAL",
  "allocated": 20
}
```

### Bulk Allocate by Leave Grade
```bash
POST /api/v1/org/org-uuid/allocations/bulk
{
  "year": 2024,
  "leaveGradeId": "grade-uuid"
}
```

### Update Allocation
```bash
PATCH /api/v1/allocations/allocation-uuid
{
  "allocated": 25
}
```

### List All Allocations for 2024
```bash
GET /api/v1/org/org-uuid/allocations?year=2024&page=1&limit=50
```

## TypeScript Compilation
✅ All files compile successfully (exit code 0)
✅ Full type safety with Zod schemas
✅ Proper error handling with AppError

## Notes
- Follows the same shallow routing pattern as invitations
- Service layer handles all authorization logic
- Supports pagination for large datasets
- Includes employee details in responses for convenience
