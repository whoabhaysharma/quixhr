# Leave Management Module

## ⚠️ IMPORTANT NOTE

The leave module has been created but requires **Prisma schema adjustments** to match the implementation. The current schema uses a different structure than what this module expects.

### Expected Schema Structure

The module expects these models:

```prisma
model LeaveType {
  id          String   @id @default(uuid())
  name        String
  // ... other fields
}

model LeaveAllocation {
  id           String   @id @default(uuid())
  employeeId   String
  leaveTypeId  String
  allocated    Float
  used         Float
  
  employee     Employee  @relation(fields: [employeeId], references: [id])
  leaveType    LeaveType @relation(fields: [leaveTypeId], references: [id])
  
  @@unique([employeeId, leaveTypeId])
}

model LeaveRequest {
  id           String            @id @default(uuid())
  employeeId   String
  leaveTypeId  String
  startDate    DateTime
  endDate      DateTime
  days         Float
  reason       String
  status       LeaveRequestStatus @default(PENDING)
  approvedBy   String?
  approvedAt   DateTime?
  createdAt    DateTime          @default(now())
  
  employee     Employee   @relation(fields: [employeeId], references: [id])
  leaveType    LeaveType  @relation(fields: [leaveTypeId], references: [id])
}

model LeaveLedger {
  id              String    @id @default(uuid())
  employeeId      String
  leaveTypeId     String
  leaveRequestId  String?
  type            String    // 'CREDIT' or 'DEBIT'
  amount          Float
  reason          String
  date            DateTime
  
  employee        Employee      @relation(fields: [employeeId], references: [id])
  leaveType       LeaveType     @relation(fields: [leaveTypeId], references: [id])
  leaveRequest    LeaveRequest? @relation(fields: [leaveRequestId], references: [id])
}

enum LeaveRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

## Files Created

- `leave.types.ts` - TypeScript interfaces
- `leave.schema.ts` - Zod validation schemas
- `leave.service.ts` - Business logic (**needs schema fixes**)
- `leave.controller.ts` - Request handlers
- `leave.routes.ts` - Route definitions

## API Endpoints

### 1. Get Leave Balances

#### GET `/api/v1/leaves/my-balances`
**Access**: Employee

Returns allocation vs used vs balance for all leave types.

**Response**:
```json
{
  "status": "success",
  "data": {
    "balances": [
      {
        "leaveTypeId": "uuid",
        "leaveTypeName": "Annual Leave",
        "allocated": 20,
        "used": 5,
        "balance": 15
      },
      {
        "leaveTypeId": "uuid",
        "leaveTypeName": "Sick Leave",
        "allocated": 10,
        "used": 2,
        "balance": 8
      }
    ]
  }
}
```

### 2. Apply for Leave

#### POST `/api/v1/leaves/apply`
**Access**: Employee

Create a leave request.

**Request Body**:
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Family vacation planned in advance",
  "isHalfDay": false
}
```

**Business Logic**:
- Calculates days (full days or 0.5 for half day)
- Checks leave balance
- Prevents overlapping requests
- Creates PENDING request

**Validations**:
- End date >= start date
- Sufficient balance
- No overlapping requests
- Reason minimum 10 characters

### 3. List Leave Requests

#### GET `/api/v1/leaves/requests`
**Access**: All (filtered by role)

**Role-Based Filtering**:
- **EMPLOYEE**: Sees only own requests
- **MANAGER/HR_ADMIN**: Sees company requests
- **SUPER_ADMIN**: Sees all (or filter by `?companyId=xxx`)

**Query Params**:
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- `employeeId`: Filter by specific employee
- `startDate`: Filter from date
- `endDate`: Filter to date

### 4. Approve/Reject Request

#### PATCH `/api/v1/leaves/requests/:id`
**Access**: Manager

**Request Body**:
```json
{
  "status": "APPROVED",  // or "REJECTED"
  "remarks": "Approved for the specified dates"
}
```

**Business Logic**:
- Only PENDING requests can be approved/rejected
- If APPROVED: Deducts from allocation + creates ledger entry
- If REJECTED: No balance deduction

### 5. Cancel Request

#### PATCH `/api/v1/leaves/requests/:id/cancel`
**Access**: Employee (own requests only)

**Triggers Refund**:
- If request was APPROVED: Refunds days to balance
- Creates CREDIT ledger entry
- Updates status to CANCELLED

**Restrictions**:
- Cannot cancel REJECTED requests
- Cannot cancel already CANCELLED requests

### 6. View Leave Ledger

#### GET `/api/v1/leaves/ledger/:employeeId`
**Access**: HR/User (user can see own ledger)

View audit trail of all leave transactions.

**Query Params**:
- `leaveTypeId` (optional): Filter by leave type

**Response**:
```json
{
  "status": "success",
  "data": {
    "employee": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "ledger": [
      {
        "id": "uuid",
        "date": "2024-01-01T00:00:00.000Z",
        "type": "CREDIT",
        "amount": 20,
        "reason": "Annual allocation",
        "leaveType": {
          "id": "uuid",
          "name": "Annual Leave"
        },
        "leaveRequest": null
      },
      {
        "id": "uuid",
        "date": "2024-01-15T00:00:00.000Z",
        "type": "DEBIT",
        "amount": 3,
        "reason": "Leave approved: Family vacation",
        "leaveRequest": {
          "id": "uuid",
          "startDate": "2024-01-15",
          "endDate": "2024-01-17",
          "status": "APPROVED"
        }
      }
    ]
  }
}
```

### 7. Manual Leave Adjustment

#### POST `/api/v1/leaves/adjust`
**Access**: HR Admin

Fix errors or add bonus leaves.

**Request Body**:
```json
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "amount": 5,  // Positive for credit, negative for debit
  "reason": "Bonus leave for exceptional performance",
  "effectiveDate": "2024-01-01"  // Optional
}
```

**Use Cases**:
- Fix incorrect balances
- Award bonus leaves
- Correct errors
- Manual adjustments

### 8. Bulk Import

#### POST `/api/v1/leaves/import`
**Access**: HR Admin

Migration - bulk upload balances from CSV.

**Request Body**:
```json
{
  "records": [
    {
      "employeeCode": "EMP-001",
      "leaveTypeId": "uuid",
      "allocated": 20,
      "used": 5
    },
    {
      "employeeCode": "EMP-002",
      "leaveTypeId": "uuid",
      "allocated": 20,
      "used": 0
    }
  ]
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Import completed. Success: 2, Failed: 0",
  "data": {
    "success": [...],
    "failed": []
  }
}
```

## Authorization

### Access Levels

| Endpoint | SUPER_ADMIN | ORG_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|----------|-------------|-----------|----------|---------|----------|
| GET /my-balances | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /apply | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /requests | ✅ (all) | ✅ (company) | ✅ (company) | ✅ (company) | ✅ (own) |
| PATCH /requests/:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| PATCH /requests/:id/cancel | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| GET /ledger/:employeeId | ✅ | ✅ | ✅ | ✅ | ✅ (own) |
| POST /adjust | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /import | ✅ | ✅ | ✅ | ❌ | ❌ |

## Business Rules

### Leave Calculation
- Full day: `differenceInDays(endDate, startDate) + 1`
- Half day: `0.5`

### Balance Check
- `balance = allocated - used`
- Request rejected if `balance < requested days`

### Overlapping Prevention
- Checks for PENDING or APPROVED requests
- Prevents overlapping date ranges

### Refund on Cancellation
- Only APPROVED requests trigger refund
- PENDING cancellations don't affect balance

### Ledger Entries
- **CREDIT**: Allocation, refund, bonus
- **DEBIT**: Approved leave, manual deduction

## Data Flow

### Apply Leave Flow
```
1. Employee applies
2. System checks balance
3. Creates PENDING request
4. Manager reviews
5. If APPROVED:
   - Deduct from allocation
   - Create DEBIT ledger entry
6. If REJECTED:
   - No balance change
```

### Cancel Leave Flow
```
1. Employee cancels
2. If was APPROVED:
   - Refund to allocation
   - Create CREDIT ledger entry
3. Update status to CANCELLED
```

## TODO - Schema Migration Required

Before this module can be used, the Prisma schema needs to be updated to match the expected structure. The current schema appears to use:
- `Leave` model instead of `LeaveRequest`
- Different field names and relationships
- Missing `LeaveLedger` model

**Action Required**: Review and update `prisma/schema.prisma` to match the expected structure documented above.

## Summary

✅ **Leave balance tracking**  
✅ **Leave request workflow**  
✅ **Approval/rejection system**  
✅ **Cancellation with refund**  
✅ **Audit trail (ledger)**  
✅ **Manual adjustments**  
✅ **Bulk import**  
✅ **Role-based authorization**  
✅ **Multi-tenant support**  
⚠️ **Requires schema migration**
