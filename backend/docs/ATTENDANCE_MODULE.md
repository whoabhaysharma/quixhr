# Attendance Module

## Overview

The Attendance module provides comprehensive time tracking functionality including clock in/out, attendance reports, regularization, and biometric system integration.

## Files Created

- `attendance.types.ts` - TypeScript interfaces
- `attendance.schema.ts` - Zod validation schemas
- `attendance.service.ts` - Business logic
- `attendance.controller.ts` - Request handlers
- `attendance.routes.ts` - Route definitions

## API Endpoints

### 1. Clock In / Clock Out

#### POST `/api/v1/attendance/punch`
**Access**: Employee (any authenticated user)

Clock in or clock out for the current day.

**Request Body**:
```json
{
  "type": "IN",  // or "OUT"
  "method": "WEB",  // Optional: "WEB", "MOBILE", "BIOMETRIC"
  "gpsCoords": {  // Optional
    "latitude": 28.7041,
    "longitude": 77.1025
  }
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Clocked in successfully",
  "data": {
    "attendance": {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2024-01-15T00:00:00.000Z",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": null,
      "status": "PRESENT",
      "isLate": false,
      "workMinutes": null
    }
  }
}
```

**Business Logic**:
- **Clock In**:
  - Creates or updates today's attendance record
  - Sets `checkIn` timestamp
  - Creates punch log entry
  - Checks if late (> 15 min after expected start time)
  - Prevents duplicate clock-ins

- **Clock Out**:
  - Updates attendance record with `checkOut` timestamp
  - Calculates `workMinutes`
  - Creates punch log entry
  - Checks if early out (> 15 min before expected end time)
  - Requires prior clock-in

**Validations**:
- Cannot clock in twice
- Cannot clock out without clocking in
- Cannot clock out twice

### 2. Monthly Summary

#### GET `/api/v1/attendance/my-summary`
**Access**: Employee (any authenticated user)

Get monthly attendance summary for the authenticated user.

**Query Params**:
- `month` (optional): 1-12 (defaults to current month)
- `year` (optional): YYYY (defaults to current year)

**Response**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "month": 1,
      "year": 2024,
      "totalDays": 22,
      "presentDays": 20,
      "absentDays": 1,
      "lateDays": 3,
      "halfDays": 1,
      "onLeaveDays": 1,
      "holidayDays": 0
    }
  }
}
```

### 3. Daily Report

#### GET `/api/v1/attendance/report`
**Access**: HR/Manager

Get daily attendance report showing who is present/absent.

**Query Params**:
- `date` (optional): YYYY-MM-DD (defaults to today)
- `status` (optional): `PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE`, `HOLIDAY`
- `companyId` (SUPER_ADMIN only): Filter by specific company

**Response**:
```json
{
  "status": "success",
  "data": {
    "date": "2024-01-15",
    "total": 50,
    "attendances": [
      {
        "id": "uuid",
        "employeeId": "uuid",
        "date": "2024-01-15T00:00:00.000Z",
        "checkIn": "2024-01-15T09:00:00.000Z",
        "checkOut": "2024-01-15T18:00:00.000Z",
        "status": "PRESENT",
        "isLate": false,
        "workMinutes": 540,
        "employee": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "code": "EMP-001",
          "user": {
            "email": "john@example.com"
          }
        }
      }
    ]
  }
}
```

**Use Cases**:
- "Who is absent today?"
- "Who came late today?"
- "Show me all present employees"

### 4. Attendance Logs (Biometric Audit)

#### GET `/api/v1/attendance/logs/:id`
**Access**: Admin (HR_ADMIN, ORG_ADMIN, SUPER_ADMIN)

View raw punch logs for an attendance record (for audit purposes).

**Response**:
```json
{
  "status": "success",
  "data": {
    "attendance": {
      "id": "uuid",
      "date": "2024-01-15T00:00:00.000Z",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": "2024-01-15T18:00:00.000Z",
      "employee": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "code": "EMP-001"
      },
      "logs": [
        {
          "id": "uuid",
          "timestamp": "2024-01-15T09:00:00.000Z",
          "type": "IN",
          "method": "BIOMETRIC:DEVICE-001",
          "gpsCoords": null
        },
        {
          "id": "uuid",
          "timestamp": "2024-01-15T18:00:00.000Z",
          "type": "OUT",
          "method": "WEB",
          "gpsCoords": {
            "latitude": 28.7041,
            "longitude": 77.1025
          }
        }
      ]
    }
  }
}
```

### 5. Regularize Attendance

#### PATCH `/api/v1/attendance/regularize`
**Access**: Manager

Fix a user's attendance (e.g., "Forgot to punch").

**Request Body**:
```json
{
  "employeeId": "uuid",
  "date": "2024-01-15",
  "status": "PRESENT",
  "checkIn": "2024-01-15T09:00:00.000Z",
  "checkOut": "2024-01-15T18:00:00.000Z",
  "reason": "Employee forgot to punch in due to system issue"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Attendance regularized successfully",
  "data": {
    "attendance": {
      "id": "uuid",
      "employeeId": "uuid",
      "date": "2024-01-15T00:00:00.000Z",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": "2024-01-15T18:00:00.000Z",
      "status": "PRESENT",
      "workMinutes": 540
    }
  }
}
```

**Business Logic**:
- Creates or updates attendance record
- Calculates work minutes if both times provided
- Creates audit log with reason
- Requires company-level authorization

**Use Cases**:
- Employee forgot to punch
- System was down
- Manual correction needed

### 6. Bulk Sync (Biometric Integration)

#### POST `/api/v1/attendance/bulk-sync`
**Access**: System (SUPER_ADMIN for now)

Webhook endpoint for biometric machines to push attendance data.

**Request Body**:
```json
{
  "records": [
    {
      "employeeCode": "EMP-001",
      "timestamp": "2024-01-15T09:00:00.000Z",
      "type": "IN",
      "deviceId": "DEVICE-001"
    },
    {
      "employeeCode": "EMP-002",
      "timestamp": "2024-01-15T09:05:00.000Z",
      "type": "IN",
      "deviceId": "DEVICE-001"
    }
  ]
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Bulk sync completed. Success: 2, Failed: 0",
  "data": {
    "success": [
      {
        "employeeCode": "EMP-001",
        "timestamp": "2024-01-15T09:00:00.000Z"
      },
      {
        "employeeCode": "EMP-002",
        "timestamp": "2024-01-15T09:05:00.000Z"
      }
    ],
    "failed": []
  }
}
```

**Business Logic**:
- Finds employee by code
- Creates or updates attendance record
- Updates check-in or check-out based on type
- Calculates work minutes
- Creates log entry with device ID
- Returns success/failure for each record

**Future Enhancement**: Use API key authentication instead of SUPER_ADMIN role.

## Authorization

### Access Levels

| Endpoint | SUPER_ADMIN | ORG_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|----------|-------------|-----------|----------|---------|----------|
| POST /punch | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /my-summary | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /report | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /logs/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /regularize | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /bulk-sync | ✅ | ❌ | ❌ | ❌ | ❌ |

### Multi-Tenant Support

- **SUPER_ADMIN**: Can view reports across all companies using `?companyId=xxx`
- **Others**: Automatically scoped to their company

## Business Rules

### Late Detection
- Grace period: 15 minutes after expected start time
- Based on employee's assigned calendar
- Marked with `isLate: true`

### Early Out Detection
- Grace period: 15 minutes before expected end time
- Based on employee's assigned calendar
- Marked with `isEarlyOut: true`

### Work Minutes Calculation
- Calculated on clock out
- `workMinutes = checkOut - checkIn` (in minutes)

### Attendance Status
- `PRESENT`: Clocked in
- `ABSENT`: No clock in
- `HALF_DAY`: Partial day
- `ON_LEAVE`: Approved leave
- `HOLIDAY`: Company holiday

## Data Models

### Attendance
```typescript
{
  id: string
  employeeId: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: AttendanceStatus
  isLate: boolean
  isEarlyOut: boolean
  workMinutes?: number
  logs: AttendanceLog[]
}
```

### AttendanceLog
```typescript
{
  id: string
  attendanceId: string
  timestamp: Date
  type: 'IN' | 'OUT'
  method: string  // 'WEB', 'MOBILE', 'BIOMETRIC:DEVICE-ID', 'REGULARIZED: reason'
  gpsCoords?: { latitude: number, longitude: number }
}
```

## Error Handling

Common errors:

- `400` - Already clocked in/out, validation error
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Employee/Attendance not found

## Integration Examples

### Frontend Clock In/Out
```javascript
// Clock In
const response = await fetch('/api/v1/attendance/punch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'IN',
    method: 'WEB'
  })
});
```

### Biometric Machine Integration
```javascript
// From biometric device
const response = await fetch('/api/v1/attendance/bulk-sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${systemToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    records: [
      {
        employeeCode: 'EMP-001',
        timestamp: new Date().toISOString(),
        type: 'IN',
        deviceId: 'DEVICE-001'
      }
    ]
  })
});
```

## TODO

- [ ] Implement API key authentication for bulk-sync
- [ ] Add geofencing validation for GPS coordinates
- [ ] Add overtime calculation
- [ ] Add break time tracking
- [ ] Add shift-based attendance
- [ ] Add notification for late arrivals
- [ ] Add attendance approval workflow

## Summary

✅ **Clock in/out functionality**  
✅ **Monthly summary reports**  
✅ **Daily attendance reports**  
✅ **Biometric audit logs**  
✅ **Attendance regularization**  
✅ **Biometric system integration**  
✅ **Multi-tenant support**  
✅ **Role-based authorization**  
✅ **Late/early detection**  
✅ **Work minutes calculation**
