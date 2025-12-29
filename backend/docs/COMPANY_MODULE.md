# Company & User Management Module

## Overview

The Company module provides endpoints for managing company settings, user invitations, and user role management. It follows the same multi-tenant authorization pattern as the Employee module.

## Files Created

- `company.types.ts` - TypeScript interfaces
- `company.schema.ts` - Zod validation schemas
- `company.service.ts` - Business logic
- `company.controller.ts` - Request handlers
- `company.routes.ts` - Company-related routes
- `user/user.routes.ts` - User management routes

## API Endpoints

### Company Settings

#### GET `/api/v1/company/settings`
**Access**: Org Admin

Get company settings including timezone, currency, logo, and date format.

**Response**:
```json
{
  "status": "success",
  "data": {
    "company": {
      "id": "uuid",
      "name": "Company Name",
      "timezone": "Asia/Kolkata",
      "currency": "INR",
      "dateFormat": "DD/MM/YYYY",
      "logoUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PATCH `/api/v1/company/settings`
**Access**: Org Admin

Update company settings.

**Request Body**:
```json
{
  "timezone": "America/New_York",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "logoUrl": "https://..."
}
```

### Invitations

#### POST `/api/v1/company/invite`
**Access**: HR Admin

Invite a new user by email and role.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "role": "EMPLOYEE"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "invitation": {
      "id": "uuid",
      "email": "newuser@example.com",
      "role": "EMPLOYEE",
      "status": "PENDING",
      "expiresAt": "2024-01-08T00:00:00.000Z",
      "token": "abc123...",
      "company": {
        "id": "uuid",
        "name": "Company Name"
      }
    }
  }
}
```

**Note**: The invitation token is logged to console for development. In production, this should be sent via email.

#### GET `/api/v1/company/invites`
**Access**: HR Admin

List all invitations with optional status filter.

**Query Params**:
- `status` (optional): `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`

**Response**:
```json
{
  "status": "success",
  "data": {
    "invitations": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "EMPLOYEE",
        "status": "PENDING",
        "expiresAt": "2024-01-08T00:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### DELETE `/api/v1/company/invites/:id`
**Access**: HR Admin

Revoke a pending invitation.

**Response**:
```json
{
  "status": "success",
  "data": {
    "invitation": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "status": "REVOKED"
    }
  }
}
```

### User Management

#### GET `/api/v1/users`
**Access**: HR Admin

List all users in the company.

**Query Params**:
- `role` (optional): Filter by role (`EMPLOYEE`, `MANAGER`, `HR_ADMIN`, `ORG_ADMIN`)

**Response**:
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "EMPLOYEE",
        "isEmailVerified": true,
        "employee": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "status": "ACTIVE",
          "joiningDate": "2024-01-01T00:00:00.000Z"
        }
      }
    ],
    "count": 1
  }
}
```

#### PATCH `/api/v1/users/:id/role`
**Access**: Org Admin

Promote or demote a user (e.g., MANAGER → HR_ADMIN).

**Request Body**:
```json
{
  "role": "HR_ADMIN"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "HR_ADMIN",
      "employee": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  }
}
```

**Security**: Cannot modify SUPER_ADMIN role.

## Invitation Flow

### 1. HR Admin Invites User
```bash
POST /api/v1/company/invite
{
  "email": "newuser@example.com",
  "role": "EMPLOYEE"
}
```

### 2. System Generates Token
- Creates invitation record with unique token
- Token expires in 7 days
- Status: `PENDING`

### 3. User Accepts Invitation
```bash
POST /api/v1/auth/accept-invitation
{
  "token": "abc123...",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 4. System Creates User Account
- Creates User record
- Creates Employee record
- Links to company
- Updates invitation status to `ACCEPTED`

## Authorization

All endpoints use the same multi-tenant pattern:

```typescript
router.use(protect);        // Verify JWT
router.use(resolveTenant);  // Set req.targetCompanyId
router.use(restrictTo());   // Check role
```

### Access Levels

| Endpoint | SUPER_ADMIN | ORG_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|----------|-------------|-----------|----------|---------|----------|
| GET /company/settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| PATCH /company/settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /company/invite | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /company/invites | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE /company/invites/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /users | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /users/:id/role | ✅ | ✅ | ❌ | ❌ | ❌ |

## Validation

All endpoints have comprehensive Zod validation:

- **Email**: Valid email format
- **Role**: Must be valid enum value
- **UUID**: Valid UUID format for IDs
- **Settings**: At least one field required for updates

## Error Handling

Common errors:

- `400` - Validation error or business rule violation
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found

## Integration with Auth Module

The invitation flow integrates with the existing auth module:

- `POST /api/v1/auth/accept-invitation` (already exists)
- Creates user account and employee profile
- Marks invitation as `ACCEPTED`

## TODO

- [ ] Send invitation emails (currently logged to console)
- [ ] Add invitation expiry check
- [ ] Add rate limiting for invitations
- [ ] Add audit logging for role changes
- [ ] Add pagination for user list

## Summary

✅ **Company settings management**  
✅ **User invitation system**  
✅ **Role management (promote/demote)**  
✅ **Multi-tenant authorization**  
✅ **Comprehensive validation**  
✅ **Security by default**
