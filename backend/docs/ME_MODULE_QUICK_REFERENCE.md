# ME Module - Quick Reference Guide

## Module Overview
The `/me` module is a comprehensive personal dashboard API for authenticated employees. All endpoints are scoped to the authenticated user and provide access to personal profile, leaves, attendance, notifications, and audit logs.

---

## Quick Links
- **Full Documentation**: [ME_MODULE.md](./ME_MODULE.md)
- **Route Reference**: [ME_MODULE_ROUTES.txt](./ME_MODULE_ROUTES.txt)
- **Controller**: `src/modules/me/me.controller.ts`
- **Routes**: `src/modules/me/me.routes.ts`
- **Schemas**: `src/modules/me/me.schema.ts`

---

## Base URL & Auth
```
Base: /api/v1/me
Auth: Authorization: Bearer <token> (required for all endpoints)
```

---

## Endpoints at a Glance

### Profile (3)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | Get my profile |
| PATCH | / | Update my profile |
| DELETE | / | Delete my account |

### Leaves (5)
| Method | Path | Description |
|--------|------|-------------|
| GET | /leaves/policies | Get my leave policies |
| GET | /leaves/balance | Get my leave balance |
| GET | /leaves/ledger | Get leave transaction history |
| GET | /leaves/requests | Get my leave requests |
| POST | /leaves/requests | Create leave request |

### Attendance (3)
| Method | Path | Description |
|--------|------|-------------|
| GET | /attendance | Get attendance records |
| POST | /attendance/check-in | Check in |
| POST | /attendance/check-out | Check out |

### Notifications (2)
| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications | Get notifications |
| PATCH | /notifications/:id | Mark as read |

### Audit (1)
| Method | Path | Description |
|--------|------|-------------|
| GET | /audit-logs | Get activity history |

---

## Common Use Cases

### Get My Leave Balance
```bash
curl -X GET https://api.example.com/api/v1/me/leaves/balance \
  -H "Authorization: Bearer <token>"
```

### Submit Leave Request
```bash
curl -X POST https://api.example.com/api/v1/me/leaves/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2025-02-05T23:59:59Z",
    "type": "ANNUAL",
    "reason": "Vacation"
  }'
```

### Check In
```bash
curl -X POST https://api.example.com/api/v1/me/attendance/check-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "WEB",
    "gpsCoords": {
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }'
```

### Get My Leave Requests
```bash
curl -X GET "https://api.example.com/api/v1/me/leaves/requests?status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

## Key Features

✅ **Leave Management**
- View leave policies per grade
- Track remaining leaves
- Submit leave requests
- View transaction history

✅ **Attendance**
- Check in/out with GPS
- Track work hours
- View attendance history

✅ **Notifications**
- Receive system notifications
- Mark as read

✅ **Audit Logs**
- View activity history
- Filter by action/resource

---

## Response Format

All responses follow this format:
```json
{
  "status": "success|error",
  "message": "Human readable message",
  "data": {...}
}
```

**Status Codes:**
- `200` - Success (GET, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found

---

## Pagination

List endpoints support pagination:
```
?page=1&limit=20
```

Response includes:
```json
{
  "records": [...],
  "total": 100
}
```

---

## Filtering

Some endpoints support filtering:

**Leave Requests:**
```
?status=PENDING|APPROVED|REJECTED|CANCELLED
```

**Audit Logs:**
```
?action=LOGIN&resource=User
```

---

## Key Helpers (Internal)

### `getAuthContext(req)`
Extracts JWT payload from request

### `getEmployeeContext(userId)`
Fetches employee record and validates ownership

### `buildCompleteProfileResponse(userId)`
Builds aggregated profile (user + employee + company)

---

## Database Tables Used

- User
- Employee
- Company
- LeaveGrade
- LeavePolicy
- LeaveAllocation
- LeaveLedger
- LeaveRequest
- Attendance
- AttendanceLog
- Notification
- AuditLog

---

## Common Errors

| Code | Error | Solution |
|------|-------|----------|
| 401 | User not authenticated | Provide valid token |
| 403 | Not authorized | Check permissions |
| 404 | Employee profile not found | Employee not assigned |
| 404 | Leave grade not assigned | Admin must assign grade |
| 400 | Email already in use | Use unique email |
| 400 | No check-in found for today | Check in first before checkout |

---

## Testing Checklist

- [ ] GET / - Get profile
- [ ] PATCH / - Update profile
- [ ] GET /leaves/policies
- [ ] GET /leaves/balance
- [ ] POST /leaves/requests - Create request
- [ ] GET /leaves/requests
- [ ] POST /attendance/check-in
- [ ] POST /attendance/check-out
- [ ] GET /attendance
- [ ] GET /notifications
- [ ] PATCH /notifications/:id
- [ ] GET /audit-logs

---

## Controller Functions

All exported from `me.controller.ts`:

**Profile:**
- `getProfile()` - GET /
- `updateProfile()` - PATCH /
- `deleteAccount()` - DELETE /

**Leaves:**
- `getMyLeaves()` - GET /leaves/policies
- `getMyLeaveBalance()` - GET /leaves/balance
- `getMyLeaveLedger()` - GET /leaves/ledger
- `getMyLeaveRequests()` - GET /leaves/requests
- `createLeaveRequest()` - POST /leaves/requests

**Attendance:**
- `getMyAttendance()` - GET /attendance
- `checkIn()` - POST /attendance/check-in
- `checkOut()` - POST /attendance/check-out

**Notifications:**
- `getNotifications()` - GET /notifications
- `markNotificationAsRead()` - PATCH /notifications/:id

**Audit:**
- `getAuditLogs()` - GET /audit-logs

---

## Module Structure

```
src/modules/me/
├── me.controller.ts      # 14 controller functions
├── me.routes.ts          # Route definitions
├── me.schema.ts          # Zod schemas + DTOs
├── me.types.ts           # Internal types
└── index.ts             # (not provided, should export router)
```

---

## Next Steps

1. Mount router in main app:
   ```typescript
   import meRouter from './modules/me/me.routes';
   app.use('/api/v1/me', meRouter);
   ```

2. Test all endpoints with Postman

3. Create company module for shared resources

4. Implement leave approval workflow

5. Add attendance rules engine

---

## Support

For detailed documentation, see:
- [Full API Documentation](./ME_MODULE.md)
- [Route Structure Reference](./ME_MODULE_ROUTES.txt)
