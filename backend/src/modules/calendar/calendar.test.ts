import request from 'supertest';
import app from '../../app';
import { cleanDatabase } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    createTestCalendar,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Calendar Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/calendars', () => {
        it('should allow SUPER_ADMIN to create calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .post('/api/v1/calendars')
                .set(getAuthHeader(token))
                .send({
                    companyId: company.id,
                    name: 'General Shift',
                    dayStartTime: '09:00',
                    dayEndTime: '18:00',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'General Shift');
        });

        it('should allow HR_ADMIN to create calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .post('/api/v1/calendars')
                .set(getAuthHeader(token))
                .send({
                    companyId: company.id,
                    name: 'Night Shift',
                    dayStartTime: '22:00',
                    dayEndTime: '06:00',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from creating calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .post('/api/v1/calendars')
                .set(getAuthHeader(token))
                .send({
                    companyId: company.id,
                    name: 'Test Calendar',
                    dayStartTime: '09:00',
                    dayEndTime: '18:00',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from creating calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .post('/api/v1/calendars')
                .set(getAuthHeader(token))
                .send({
                    companyId: company.id,
                    name: 'Test Calendar',
                    dayStartTime: '09:00',
                    dayEndTime: '18:00',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/calendars', () => {
        it('should allow all authenticated users to get calendars', async () => {
            const roles = [Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE];

            for (const role of roles) {
                await cleanDatabase();
                const { token, company } = await createCompleteTestUser(
                    `${role.toLowerCase()}@test.com`,
                    'Password123!',
                    role,
                    'Test Company',
                    `${role} User`
                );

                const url = role === Role.SUPER_ADMIN
                    ? `/api/v1/calendars?companyId=${company.id}`
                    : '/api/v1/calendars';

                const response = await request(app)
                    .get(url)
                    .set(getAuthHeader(token));

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(Array.isArray(response.body.data)).toBe(true);
            }
        });
    });

    describe('GET /api/v1/calendars/:id', () => {
        it('should allow authenticated users to get single calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .get(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', calendar.id);
        });
    });

    describe('PATCH /api/v1/calendars/:id', () => {
        it('should allow SUPER_ADMIN to update calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .patch(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Calendar Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'Updated Calendar Name');
        });

        it('should allow HR_ADMIN to update calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .patch(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Calendar Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from updating calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .patch(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Calendar Name',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/calendars/:id/rules', () => {
        it('should allow HR_ADMIN to update weekly rule with alternate saturdays', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .put(`/api/v1/calendars/${calendar.id}/rules`)
                .set(getAuthHeader(token))
                .send({
                    dayOfWeek: 6, // Saturday
                    rule: 'OFF',
                    weekNumbers: [1, 3]
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from updating weekly rule', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .put(`/api/v1/calendars/${calendar.id}/rules`)
                .set(getAuthHeader(token))
                .send({
                    dayOfWeek: 6,
                    rule: 'OFF'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/calendars/:id/holidays', () => {
        it('should list holidays for calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            // Add a holiday
            await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token)) // THIS MIGHT FAIL IF EMPLOYEE CANNOT ADD HOLIDAY. Need separate user to add.
            // Wait, test helper creates user. I need to add holiday via setup or as admin.

            // Let's create admin token for setup
            const admin = await createCompleteTestUser(
                'admin@setup.com',
                'Pass123!',
                Role.HR_ADMIN,
                'Existing Co',
                'Admin',
                company.id
            );

            await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(admin.token))
                .send({
                    name: 'Test Holiday',
                    startDate: '2025-01-01',
                    endDate: '2025-01-01'
                });

            const response = await request(app)
                .get(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token)); // Employee reading

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('Test Holiday');
        });
    });

    describe('DELETE /api/v1/calendars/:id/holidays/:holidayId', () => {
        it('should allow HR_ADMIN to delete holiday', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            // Create holiday
            const createRes = await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Holiday to Delete',
                    startDate: '2025-01-01',
                    endDate: '2025-01-01'
                });

            const holidayId = createRes.body.data.id;

            const response = await request(app)
                .delete(`/api/v1/calendars/${calendar.id}/holidays/${holidayId}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
    describe('POST /api/v1/calendars/:id/holidays', () => {
        it('should allow SUPER_ADMIN to add holiday', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token))
                .send({
                    name: 'New Year',
                    startDate: '2025-01-01',
                    endDate: '2025-01-01',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'New Year');
        });

        it('should allow HR_ADMIN to add holiday', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Christmas',
                    startDate: '2025-12-25',
                    endDate: '2025-12-25',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from adding holiday', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const calendar = await createTestCalendar(company.id, 'Test Calendar');

            const response = await request(app)
                .post(`/api/v1/calendars/${calendar.id}/holidays`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Test Holiday',
                    startDate: '2025-06-01',
                    endDate: '2025-06-01',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/calendars/:id', () => {
        it('should allow SUPER_ADMIN to delete calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Calendar to Delete');

            const response = await request(app)
                .delete(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to delete calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const calendar = await createTestCalendar(company.id, 'Calendar to Delete');

            const response = await request(app)
                .delete(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from deleting calendar', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const calendar = await createTestCalendar(company.id, 'Calendar to Delete');

            const response = await request(app)
                .delete(`/api/v1/calendars/${calendar.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
});
