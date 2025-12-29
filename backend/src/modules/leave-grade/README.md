# Leave Grade Module - Implementation Summary

## Overview
Successfully created a complete Leave Grade module for managing leave policies and employee leave entitlements through a grade-based system.

## Files Created

### 1. **leave-grade.types.ts**
- TypeScript interfaces for all DTOs
- Types for creating/updating grades and policies
- LeaveGradeWithPolicies interface with employee count

### 2. **leave-grade.schema.ts**
- Zod validation schemas for all endpoints
- Complex validation for carry forward rules:
  - maxCarryAmount must be 0 when carryForward is false
  - maxCarryAmount cannot exceed totalDays
- Range validation for totalDays (0-365)

### 3. **leave-grade.service.ts**
- **Core Business Logic:**
  - `listLeaveGrades()` - Get all grades with policies and employee counts
  - `getLeaveGrade()` - Get single grade with full details
  - `createLeaveGrade()` - Create new grade with duplicate name check
  - `updateLeaveGrade()` - Update grade name
  - `deleteLeaveGrade()` - Delete grade (prevents if employees assigned)
  - `createLeavePolicy()` - Add policy to grade
  - `updateLeavePolicy()` - Update policy quota/rules
  - `deleteLeavePolicy()` - Remove policy from grade

- **Business Rules:**
  - Grade names must be unique per company
  - Cannot delete grade if employees are assigned
  - One policy per leave type per grade (enforced by unique constraint)
  - Auto-reset maxCarryAmount to 0 when disabling carry forward

### 4. **leave-grade.controller.ts**
- Express request handlers for all endpoints
- Proper error handling and response formatting
- Company context validation

### 5. **leave-grade.routes.ts**
- Express router configuration
- Middleware chain:
  - `protect` - Authentication (all routes)
  - `resolveTenant` - Company context resolution
  - `restrictTo` - HR Admin authorization
  - `validate` - Request validation

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/leave-grades` | HR Admin | List all grades |
| POST | `/leave-grades` | HR Admin | Create new grade |
| GET | `/leave-grades/:id` | HR Admin | View grade with policies |
| PATCH | `/leave-grades/:id` | HR Admin | Update grade name |
| DELETE | `/leave-grades/:id` | HR Admin | Delete grade |
| POST | `/leave-grades/:id/policy` | HR Admin | Add policy to grade |
| PATCH | `/leave-grades/:id/policy/:pid` | HR Admin | Update policy |
| DELETE | `/leave-grades/:id/policy/:pid` | HR Admin | Delete policy |

## Usage Examples

### Create a Leave Grade
```json
POST /api/v1/leave-grades
{
  "name": "Full Time Staff"
}
```

### Add a Leave Policy
```json
POST /api/v1/leave-grades/{gradeId}/policy
{
  "leaveType": "SICK",
  "totalDays": 12,
  "carryForward": true,
  "maxCarryAmount": 5
}
```

### Update a Policy
```json
PATCH /api/v1/leave-grades/{gradeId}/policy/{policyId}
{
  "totalDays": 15,
  "maxCarryAmount": 7
}
```

## Leave Types (from Prisma Schema)
- `ANNUAL` - Annual/Vacation leave
- `SICK` - Sick leave
- `CASUAL` - Casual leave
- `MATERNITY` - Maternity leave
- `PATERNITY` - Paternity leave
- `UNPAID` - Unpaid leave
- `OTHER` - Other types

## Business Logic Details

### Carry Forward Rules
1. **When `carryForward = false`:**
   - `maxCarryAmount` is automatically set to 0
   - Employees cannot carry forward unused days

2. **When `carryForward = true`:**
   - `maxCarryAmount` can be set (must be ≤ totalDays)
   - Employees can carry forward up to maxCarryAmount days to next year

### Grade Deletion Protection
- Cannot delete a grade if any employees are assigned to it
- Returns error with employee count
- Must reassign employees to another grade first

### Policy Uniqueness
- Each grade can have only ONE policy per leave type
- Enforced by database unique constraint: `[leaveGradeId, leaveType]`
- Attempting to create duplicate returns clear error message

## Database Schema

### LeaveGrade
```prisma
model LeaveGrade {
  id          String        @id @default(uuid())
  companyId   String
  name        String
  
  policies    LeavePolicy[]
  employees   Employee[]
  company     Company       @relation(fields: [companyId], references: [id])
}
```

### LeavePolicy
```prisma
model LeavePolicy {
  id             String     @id @default(uuid())
  leaveGradeId   String
  leaveType      LeaveType
  
  totalDays      Float
  carryForward   Boolean    @default(false)
  maxCarryAmount Float      @default(0)

  grade          LeaveGrade @relation(fields: [leaveGradeId], references: [id])
  @@unique([leaveGradeId, leaveType])
}
```

## Integration Notes

1. **Add to main app.ts:**
```typescript
import leaveGradeRoutes from '@/modules/leave-grade/leave-grade.routes';
app.use('/api/v1/leave-grades', leaveGradeRoutes);
```

2. **Database Schema:**
   - Uses existing Prisma schema (LeaveGrade, LeavePolicy)
   - No migrations needed

3. **Dependencies:**
   - Existing middleware (protect, restrictTo, resolveTenant, validate)
   - Existing utilities (catchAsync, sendResponse, AppError)

## Testing Recommendations

1. **Grade Management:**
   - Test duplicate name prevention
   - Test deletion with assigned employees
   - Test grade listing with employee counts

2. **Policy Management:**
   - Test one policy per leave type constraint
   - Test carry forward validation rules
   - Test totalDays range validation

3. **Security:**
   - Test company isolation (users can't access other companies' grades)
   - Test role-based access (only HR Admin can manage)

## Status
✅ All files created
✅ TypeScript compilation successful
✅ Follows project patterns and conventions
✅ Ready for integration and testing
