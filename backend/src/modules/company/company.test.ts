import request from 'supertest';
import app from '../../app';
import { cleanDatabase } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    createTestCompany,
    generateToken,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Company Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/companies', () => {
        it('should allow SUPER_ADMIN to create company', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .post('/api/v1/companies')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Company',
                    timezone: 'America/New_York',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'New Company');
        });

        it('should deny HR_ADMIN from creating company', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .post('/api/v1/companies')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Company',
                    timezone: 'America/New_York',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny MANAGER from creating company', async () => {
            const { token } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .post('/api/v1/companies')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Company',
                    timezone: 'America/New_York',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from creating company', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .post('/api/v1/companies')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Company',
                    timezone: 'America/New_York',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/companies', () => {
        it('should allow SUPER_ADMIN to get all companies', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            await createTestCompany('Company 1');
            await createTestCompany('Company 2');

            const response = await request(app)
                .get('/api/v1/companies')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should deny HR_ADMIN from getting all companies', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .get('/api/v1/companies')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/companies/:id', () => {
        it('should allow authenticated users to get single company', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', company.id);
        });
    });

    describe('PATCH /api/v1/companies/:id', () => {
        it('should allow SUPER_ADMIN to update company', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const company = await createTestCompany('Test Company');

            const response = await request(app)
                .patch(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Company Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'Updated Company Name');
        });

        it('should allow HR_ADMIN to update company', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .patch(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Company Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from updating company', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .patch(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Company Name',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/companies/:id', () => {
        it('should allow SUPER_ADMIN to delete company', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const company = await createTestCompany('Company to Delete');

            const response = await request(app)
                .delete(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny HR_ADMIN from deleting company', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .delete(`/api/v1/companies/${company.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
});
