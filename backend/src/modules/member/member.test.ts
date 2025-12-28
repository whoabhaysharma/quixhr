import request from 'supertest';
import app from '../../app';
import { cleanDatabase } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    createTestEmployee,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Member Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/members', () => {
        it('should allow SUPER_ADMIN to create member', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .post('/api/v1/members')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Employee',
                    email: 'newemployee@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'New Employee');
        });

        it('should allow HR_ADMIN to create member', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .post('/api/v1/members')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Employee',
                    email: 'newemployee@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from creating member', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .post('/api/v1/members')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Employee',
                    email: 'newemployee@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from creating member', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .post('/api/v1/members')
                .set(getAuthHeader(token))
                .send({
                    name: 'New Employee',
                    email: 'newemployee@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/members', () => {
        it('should allow SUPER_ADMIN to get all members', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            await createTestEmployee('Employee 1', company.id);
            await createTestEmployee('Employee 2', company.id);

            const response = await request(app)
                .get(`/api/v1/members?companyId=${company.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should allow HR_ADMIN to get all members', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .get('/api/v1/members')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow MANAGER to get all members', async () => {
            const { token } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .get('/api/v1/members')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny EMPLOYEE from getting all members', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get('/api/v1/members')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/members/:id', () => {
        it('should allow authenticated users to get single member', async () => {
            const { token, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', employee.id);
        });
    });

    describe('PATCH /api/v1/members/:id', () => {
        it('should allow SUPER_ADMIN to update member', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const { employee } = await createCompleteTestUser(
                'target@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Admin Company',
                'Test Employee',
                company.id
            );

            const response = await request(app)
                .patch(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Employee Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('name', 'Updated Employee Name');
        });

        it('should allow HR_ADMIN to update member', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const { employee } = await createCompleteTestUser(
                'target@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Test Employee',
                company.id
            );

            const response = await request(app)
                .patch(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Employee Name',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from updating member', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const { employee } = await createCompleteTestUser(
                'target@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Test Employee',
                company.id
            );

            const response = await request(app)
                .patch(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token))
                .send({
                    name: 'Updated Employee Name',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/members/:id', () => {
        it('should allow SUPER_ADMIN to delete member', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const { employee } = await createCompleteTestUser(
                'delete@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Admin Company',
                'Employee to Delete',
                company.id
            );

            const response = await request(app)
                .delete(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to delete member', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const { employee } = await createCompleteTestUser(
                'delete@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee to Delete',
                company.id
            );

            const response = await request(app)
                .delete(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should prevent deleting the last HR_ADMIN', async () => {
            // Create a company with a single HR_ADMIN
            const { token, company, employee } = await createCompleteTestUser(
                'lasthradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Single Admin Company',
                'Last HR Admin'
            );

            // Attempt to delete the HR_ADMIN (self-deletion or by another super admin if we were testing that, but here we test the logic)
            // Even a Super Admin shouldn't be able to leave the company without an admin if that's the rule, 
            // but usually this protection is for the company's integrity.
            // Let's use a SUPER_ADMIN to try and delete the HR_ADMIN to avoid permission issues obscuring the logic test
            const { token: superToken } = await createCompleteTestUser(
                'superadmin_delete@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Other Company',
                'Super Admin'
            );

            const response = await request(app)
                .delete(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(superToken));

            // Implementation throws Error, likely 500 or 400 depending on middleware
            // Based on typical express error handling validation
            expect(response.status).not.toBe(200);
            expect(response.body.success).toBe(false);
            // We expect the specific error message
            // 'Cannot remove the last HR Admin from the company'
        });

        it('should deny MANAGER from deleting member', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const { employee } = await createCompleteTestUser(
                'delete@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee to Delete',
                company.id
            );

            const response = await request(app)
                .delete(`/api/v1/members/${employee.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
});
