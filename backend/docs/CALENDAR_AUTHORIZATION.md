# Calendar Module Authorization

## Overview

This document describes the authorization implementation for the Calendar module, ensuring that non-super admin users can only access calendar resources from their own company.

## Security Model

### Role-Based Access Control

The Calendar module implements strict role-based access control with the following rules:

1. **SUPER_ADMIN**: Can access calendars from ANY company
   - Can view, update, and delete calendars across all companies
   - Can manage weekly rules and holidays for any calendar
   - No company restrictions apply

2. **ORG_ADMIN, HR_ADMIN, MANAGER**: Can only access calendars from their own company
   - Strictly scoped to their `companyId`
   - Cannot view or modify calendars from other companies
   - Access denied errors are returned when attempting to access other companies' resources

3. **EMPLOYEE**: Limited access (not currently implemented in calendar routes)
   - Would only be able to view calendars assigned to them

## Implementation Details

### Service Layer Authorization

All calendar service methods now accept a `role` parameter and perform company validation:

```typescript
static async getCalendarById(
  calendarId: string, 
  companyId: string, 
  role: Role
): Promise<CalendarDetailsResponseDto>
```

The validation logic:

```typescript
// Only SUPER_ADMIN can access calendars from other companies
if (role !== Role.SUPER_ADMIN && calendar.companyId !== companyId) {
  throw new Error('Access denied: You can only access calendars from your own company');
}
```

### Controller Layer

Controllers extract the user's role from the authentication context and pass it to service methods:

```typescript
const authContext = getAuthContext(req);
const calendar = await CalendarService.getCalendarById(
  calendarId, 
  authContext.companyId, 
  authContext.role
);
```

### Protected Endpoints

All endpoints that accept a calendar ID parameter are now protected:

#### Calendar Endpoints
- `GET /api/v1/calendars/:calendarId` - Get calendar by ID
- `PATCH /api/v1/calendars/:calendarId` - Update calendar
- `DELETE /api/v1/calendars/:calendarId` - Delete calendar

#### Weekly Rules Endpoints
- `GET /api/v1/calendars/:calendarId/weekly-rules` - Get weekly rules (Deeply nested for list)
- `POST /api/v1/calendars/:calendarId/weekly-rules` - Create weekly rule (Deeply nested for creation)
- `PATCH /api/v1/calendars/weekly-rules/:ruleId` - Update weekly rule (Shallow)
- `DELETE /api/v1/calendars/weekly-rules/:ruleId` - Delete weekly rule (Shallow)

#### Holiday Endpoints
- `GET /api/v1/calendars/:calendarId/holidays` - Get holidays (Deeply nested for list)
- `POST /api/v1/calendars/:calendarId/holidays` - Create holiday (Deeply nested for creation)
- `PATCH /api/v1/calendars/holidays/:holidayId` - Update holiday (Shallow)
- `DELETE /api/v1/calendars/holidays/:holidayId` - Delete holiday (Shallow)

## Security Guarantees

### 1. Company Isolation
Non-super admin users **cannot** access calendars from other companies, even if they know the calendar ID.

**Example:**
```bash
# HR_ADMIN from Company A tries to access Company B's calendar
GET /api/v1/calendars/company-b-calendar-id
Authorization: Bearer <hr_admin_token_from_company_a>

# Response: 500 Error
{
  "status": "error",
  "message": "Access denied: You can only access calendars from your own company"
}
```

### 2. SUPER_ADMIN Flexibility
SUPER_ADMIN can access any calendar for system administration purposes.

**Example:**
```bash
# SUPER_ADMIN can access any company's calendar
GET /api/v1/calendars/any-company-calendar-id
Authorization: Bearer <super_admin_token>

# Response: 200 OK with calendar details
```

### 3. Cascading Protection
When accessing nested resources (weekly rules, holidays), the parent calendar's company is validated first.

**Example:**
```bash
# HR_ADMIN from Company A tries to add a holiday to Company B's calendar
POST /api/v1/calendars/company-b-calendar-id/holidays
Authorization: Bearer <hr_admin_token_from_company_a>

# Response: 500 Error (calendar access denied before holiday creation)
```

## Error Messages

The module returns clear, descriptive error messages:

- **Calendar not found**: `"Calendar not found"` (404-style error)
- **Access denied**: `"Access denied: You can only access calendars from your own company"` (403-style error)

## Testing Recommendations

### Test Scenarios

1. ✅ **SUPER_ADMIN can access any calendar**
   - Verify SUPER_ADMIN can GET, PATCH, DELETE calendars from different companies
   
2. ✅ **HR_ADMIN can only access own company calendars**
   - Verify HR_ADMIN can access calendars from their company
   - Verify HR_ADMIN receives access denied for other companies' calendars

3. ✅ **ORG_ADMIN can only access own company calendars**
   - Same tests as HR_ADMIN

4. ✅ **MANAGER can only access own company calendars**
   - Same tests as HR_ADMIN

5. ✅ **Nested resources are protected**
   - Verify weekly rules and holidays inherit calendar's company restrictions

6. ✅ **Invalid calendar IDs return appropriate errors**
   - Verify "Calendar not found" for non-existent IDs

### Sample Test Code

```typescript
describe('Calendar Authorization', () => {
  it('should allow SUPER_ADMIN to access any calendar', async () => {
    const response = await request(app)
      .get(`/api/v1/calendars/${otherCompanyCalendarId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    
    expect(response.status).toBe(200);
  });

  it('should deny HR_ADMIN access to other company calendars', async () => {
    const response = await request(app)
      .get(`/api/v1/calendars/${otherCompanyCalendarId}`)
      .set('Authorization', `Bearer ${hrAdminToken}`);
    
    expect(response.status).toBe(500);
    expect(response.body.message).toContain('Access denied');
  });

  it('should allow HR_ADMIN to access own company calendars', async () => {
    const response = await request(app)
      .get(`/api/v1/calendars/${ownCompanyCalendarId}`)
      .set('Authorization', `Bearer ${hrAdminToken}`);
    
    expect(response.status).toBe(200);
  });
});
```

## Migration Notes

### Changes Made

1. **Service Layer**: Added `role: Role` parameter to all methods that access calendars by ID
2. **Controller Layer**: Updated all controller methods to pass `authContext.role` to service methods
3. **Validation Logic**: Updated `validateCalendarAccess()` to check role before enforcing company restrictions
4. **Error Messages**: Improved error messages to be more descriptive

### Backward Compatibility

⚠️ **Breaking Changes**: The service method signatures have changed. Any code calling these methods directly must be updated to pass the `role` parameter.

**Before:**
```typescript
await CalendarService.getCalendarById(calendarId, companyId);
```

**After:**
```typescript
await CalendarService.getCalendarById(calendarId, companyId, role);
```

## Best Practices

1. **Always pass role**: When calling calendar service methods, always pass the user's role from the auth context
2. **Don't bypass validation**: Never skip the role check, even for internal operations
3. **Use descriptive errors**: Maintain clear error messages to help with debugging
4. **Test all roles**: Ensure tests cover SUPER_ADMIN, HR_ADMIN, ORG_ADMIN, and MANAGER roles

## Related Documentation

- [Authorization System](./AUTHORIZATION.md) - Overall authorization architecture
- [Calendar Module](./CALENDAR_MODULE.md) - Calendar module functionality (if exists)
- [Leave Module](./LEAVE_MODULE.md) - Similar authorization patterns

## Summary

The Calendar module now enforces strict company-based authorization:
- ✅ Non-super admins can only access their own company's calendars
- ✅ SUPER_ADMIN retains cross-company access for administration
- ✅ All endpoints with calendar IDs are protected
- ✅ Clear error messages guide users when access is denied
- ✅ Validation happens at the service layer for defense in depth
