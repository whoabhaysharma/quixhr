# ME Module - Personal User Dashboard API

The `/me` module provides a comprehensive set of endpoints for authenticated users to manage their personal profile, attendance, leaves, notifications, and audit logs. All endpoints are scoped to the authenticated user/employee and return only their personal data.

## Base URL
```
/api/v1/me
```

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints Overview

### Profile Management (3 endpoints)
- GET /me - Get complete profile
- PATCH /me - Update profile
- DELETE /me - Delete account

### Leave Management (5 endpoints)
- GET /me/leaves/policies - Get my leave policies
- GET /me/leaves/balance - Get my leave balance
- GET /me/leaves/ledger - Get my leave transaction history
- GET /me/leaves/requests - Get my leave requests
- POST /me/leaves/requests - Create leave request

### Attendance Management (3 endpoints)
- GET /me/attendance - Get my attendance records
- POST /me/attendance/check-in - Check in for today
- POST /me/attendance/check-out - Check out for today

### Notifications (2 endpoints)
- GET /me/notifications - Get my notifications
- PATCH /me/notifications/:notificationId - Mark notification as read

### Audit Logs (1 endpoint)
- GET /me/audit-logs - Get my activity history

---

## Profile Endpoints

### 1. Get My Complete Profile
**GET** `/api/v1/me`

Returns the authenticated user's complete profile including user info, employee details, and company info.

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "role": "EMPLOYEE",
      "isEmailVerified": true,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    "employee": {
      "id": "uuid",
      "companyId": "uuid",
      "userId": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "code": "EMP-001",
      "status": "ACTIVE",
      "joiningDate": "2025-01-01T00:00:00Z",
      "calendarId": "uuid",
      "leaveGradeId": "uuid"
    },
    "company": {
      "id": "uuid",
      "name": "Acme Corp",
      "timezone": "Asia/Kolkata",
      "currency": "INR",
      "dateFormat": "DD/MM/YYYY",
      "logoUrl": "https://...",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

---

### 2. Update My Profile
**PATCH** `/api/v1/me`

Update user profile information (email, verification status).

**Request Body**
```json
{
  "email": "newemail@company.com",
  "isEmailVerified": true
}
```

**Response (200 OK)**
Returns updated complete profile (same as GET /me)

---

### 3. Delete My Account
**DELETE** `/api/v1/me`

Permanently delete the authenticated user's account and all associated data. This action is irreversible.

**Request Body**
```json
{
  "password": "user_password"
}
```

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Account deleted successfully",
  "data": {
    "message": "Account deleted successfully",
    "deletedAt": "2025-01-02T10:30:00Z"
  }
}
```

---

## Leave Management Endpoints

### 4. Get My Leave Policies
**GET** `/api/v1/me/leaves/policies`

Get all leave policies applicable to the authenticated employee based on their leave grade.

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Leave policies retrieved successfully",
  "data": {
    "gradeId": "uuid",
    "gradeName": "Full Time Staff",
    "policies": [
      {
        "id": "uuid",
        "leaveType": "ANNUAL",
        "totalDays": 20,
        "carryForward": true,
        "maxCarryAmount": 5
      },
      {
        "id": "uuid",
        "leaveType": "SICK",
        "totalDays": 10,
        "carryForward": false,
        "maxCarryAmount": 0
      }
    ]
  }
}
```

---

### 5. Get My Leave Balance
**GET** `/api/v1/me/leaves/balance`

Get the authenticated employee's leave allocation and usage for the current year.

**Query Parameters**
- `year` (optional): Year to fetch (defaults to current year)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Leave balance retrieved successfully",
  "data": {
    "year": 2025,
    "allocations": [
      {
        "id": "uuid",
        "year": 2025,
        "leaveType": "ANNUAL",
        "allocated": 20,
        "used": 5,
        "remaining": 15
      },
      {
        "id": "uuid",
        "year": 2025,
        "leaveType": "SICK",
        "allocated": 10,
        "used": 2,
        "remaining": 8
      }
    ],
    "total": 2
  }
}
```

---

### 6. Get My Leave Ledger
**GET** `/api/v1/me/leaves/ledger`

Get detailed transaction history of all leave accruals, consumptions, and adjustments.

**Query Parameters**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Leave ledger retrieved successfully",
  "data": {
    "entries": [
      {
        "id": "uuid",
        "createdAt": "2025-01-15T10:00:00Z",
        "event": "ACCRUAL",
        "amount": 1.67,
        "remarks": "Monthly accrual",
        "leaveRequestId": null
      },
      {
        "id": "uuid",
        "createdAt": "2025-01-20T09:00:00Z",
        "event": "CONSUMPTION",
        "amount": -3,
        "remarks": "Leave request approval",
        "leaveRequestId": "uuid"
      }
    ],
    "total": 2
  }
}
```

---

### 7. Get My Leave Requests
**GET** `/api/v1/me/leaves/requests`

Get all leave requests submitted by the authenticated employee.

**Query Parameters**
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED, CANCELLED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Leave requests retrieved successfully",
  "data": {
    "requests": [
      {
        "id": "uuid",
        "startDate": "2025-02-01T00:00:00Z",
        "endDate": "2025-02-05T23:59:59Z",
        "daysTaken": 5,
        "type": "ANNUAL",
        "status": "PENDING",
        "reason": "Personal work",
        "dayDetails": null,
        "approvedBy": null,
        "createdAt": "2025-01-25T14:30:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### 8. Create Leave Request
**POST** `/api/v1/me/leaves/requests`

Submit a new leave request.

**Request Body**
```json
{
  "startDate": "2025-02-01T00:00:00Z",
  "endDate": "2025-02-05T23:59:59Z",
  "type": "ANNUAL",
  "reason": "Vacation",
  "dayDetails": null
}
```

**Response (201 Created)**
```json
{
  "status": "success",
  "message": "Leave request created successfully",
  "data": {
    "id": "uuid",
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2025-02-05T23:59:59Z",
    "daysTaken": 5,
    "type": "ANNUAL",
    "status": "PENDING",
    "reason": "Vacation",
    "dayDetails": null,
    "approvedBy": null,
    "createdAt": "2025-01-25T15:00:00Z"
  }
}
```

---

## Attendance Endpoints

### 9. Get My Attendance Records
**GET** `/api/v1/me/attendance`

Get all attendance records for the authenticated employee.

**Query Parameters**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Attendance records retrieved successfully",
  "data": {
    "records": [
      {
        "id": "uuid",
        "date": "2025-01-27T00:00:00Z",
        "status": "PRESENT",
        "checkIn": "2025-01-27T09:00:00Z",
        "checkOut": "2025-01-27T17:30:00Z",
        "workMinutes": 510,
        "overtimeMins": 30,
        "isLate": false,
        "isEarlyOut": false
      }
    ],
    "total": 1
  }
}
```

---

### 10. Check In
**POST** `/api/v1/me/attendance/check-in`

Record check-in for today.

**Request Body**
```json
{
  "method": "WEB",
  "gpsCoords": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Checked in successfully",
  "data": {
    "id": "uuid",
    "date": "2025-01-27T00:00:00Z",
    "status": "PRESENT",
    "checkIn": "2025-01-27T09:00:00Z",
    "checkOut": null,
    "workMinutes": 0,
    "isLate": false
  }
}
```

---

### 11. Check Out
**POST** `/api/v1/me/attendance/check-out`

Record check-out for today.

**Request Body**
```json
{
  "method": "WEB",
  "gpsCoords": {
    "latitude": 28.6139,
    "longitude": 77.2090
  }
}
```

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Checked out successfully",
  "data": {
    "id": "uuid",
    "date": "2025-01-27T00:00:00Z",
    "status": "PRESENT",
    "checkIn": "2025-01-27T09:00:00Z",
    "checkOut": "2025-01-27T17:30:00Z",
    "workMinutes": 510,
    "isLate": false
  }
}
```

---

## Notification Endpoints

### 12. Get My Notifications
**GET** `/api/v1/me/notifications`

Get all notifications for the authenticated user.

**Query Parameters**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "userId": "uuid",
        "title": "Leave Approved",
        "message": "Your leave request has been approved",
        "isRead": false,
        "createdAt": "2025-01-25T14:00:00Z"
      }
    ],
    "total": 1,
    "unreadCount": 1
  }
}
```

---

### 13. Mark Notification as Read
**PATCH** `/api/v1/me/notifications/:notificationId`

Mark a specific notification as read.

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Notification marked as read",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Leave Approved",
    "message": "Your leave request has been approved",
    "isRead": true,
    "createdAt": "2025-01-25T14:00:00Z"
  }
}
```

---

## Audit Log Endpoints

### 14. Get My Audit Logs
**GET** `/api/v1/me/audit-logs`

Get activity history (audit logs) for the authenticated user.

**Query Parameters**
- `action` (optional): Filter by action (e.g., "LOGIN", "DELETE", "UPDATE")
- `resource` (optional): Filter by resource (e.g., "User", "LeaveRequest")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)

**Response (200 OK)**
```json
{
  "status": "success",
  "message": "Audit logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "uuid",
        "action": "LOGIN",
        "resource": "User",
        "resourceId": "uuid",
        "details": {
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0..."
        },
        "ipAddress": "192.168.1.1",
        "createdAt": "2025-01-27T09:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

## Error Responses

### 401 Unauthorized
**When:** Token is missing, expired, or invalid
```json
{
  "status": "error",
  "message": "User not authenticated",
  "statusCode": 401
}
```

### 403 Forbidden
**When:** User lacks permission for the action
```json
{
  "status": "error",
  "message": "Not authorized to update this notification",
  "statusCode": 403
}
```

### 404 Not Found
**When:** Resource doesn't exist
```json
{
  "status": "error",
  "message": "Employee profile not found",
  "statusCode": 404
}
```

### 400 Bad Request
**When:** Invalid request parameters
```json
{
  "status": "error",
  "message": "Email already in use",
  "statusCode": 400
}
```

---

## Key Features

### Scope: Personal Data Only
- All endpoints are automatically scoped to the authenticated user/employee
- Users can only access their own data
- No cross-user data visibility

### Leave Management
- View personal leave policies based on employee grade
- Track leave balance and remaining days
- Submit leave requests
- View leave transaction history

### Attendance Tracking
- Check in/out with optional GPS coordinates
- Track work hours and overtime
- View attendance history

### Notifications
- Receive system notifications
- Mark notifications as read
- Unread count tracking

### Activity Tracking
- View personal audit logs
- Filter by action or resource
- Complete activity history

---

## Module Structure

```typescript
// Exports from me.controller.ts
export {
  // Profile
  getProfile,
  updateProfile,
  deleteAccount,
  
  // Leaves
  getMyLeaves,
  getMyLeaveBalance,
  getMyLeaveLedger,
  getMyLeaveRequests,
  createLeaveRequest,
  
  // Attendance
  getMyAttendance,
  checkIn,
  checkOut,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  
  // Audit
  getAuditLogs,
}
```
