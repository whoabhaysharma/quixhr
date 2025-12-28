import request from 'supertest';
import app from '../../app';
import { cleanDatabase, prisma } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Invitation Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/invitations/invite', () => {
        it('should allow SUPER_ADMIN to create invitation', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .post('/api/v1/invitations/invite')
                .set(getAuthHeader(token))
                .send({
                    email: 'newuser@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email', 'newuser@test.com');
        });

        it('should allow HR_ADMIN to create invitation', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .post('/api/v1/invitations/invite')
                .set(getAuthHeader(token))
                .send({
                    email: 'newemployee@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from creating invitation', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .post('/api/v1/invitations/invite')
                .set(getAuthHeader(token))
                .send({
                    email: 'newuser@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from creating invitation', async () => {
            const { token, company } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .post('/api/v1/invitations/invite')
                .set(getAuthHeader(token))
                .send({
                    email: 'newuser@test.com',
                    role: 'EMPLOYEE',
                    companyId: company.id,
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/invitations', () => {
        it('should allow SUPER_ADMIN to get all invitations', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .get('/api/v1/invitations')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should allow HR_ADMIN to get all invitations', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .get('/api/v1/invitations')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from getting all invitations', async () => {
            const { token } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .get('/api/v1/invitations')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from getting all invitations', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get('/api/v1/invitations')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/invitations/validate', () => {
        it('should allow public access to validate invitation token', async () => {
            const { company, user } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const invitation = await prisma.invitation.create({
                data: {
                    email: 'invited@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'test-token-123',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    invitedBy: user.id,
                },
            });

            const response = await request(app)
                .get('/api/v1/invitations/validate')
                .query({ token: invitation.token });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/invitations/validate')
                .query({ token: 'invalid-token' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/v1/invitations/:id', () => {
        it('should allow SUPER_ADMIN to delete invitation', async () => {
            const { token, company, user } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const invitation = await prisma.invitation.create({
                data: {
                    email: 'invited@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'test-token-123',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    invitedBy: user.id,
                },
            });

            const response = await request(app)
                .delete(`/api/v1/invitations/${invitation.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to delete invitation', async () => {
            const { token, company, user } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const invitation = await prisma.invitation.create({
                data: {
                    email: 'invited@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'test-token-123',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    invitedBy: user.id,
                },
            });

            const response = await request(app)
                .delete(`/api/v1/invitations/${invitation.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from deleting invitation', async () => {
            const { token, company, user } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const invitation = await prisma.invitation.create({
                data: {
                    email: 'invited@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'test-token-123',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    invitedBy: user.id,
                },
            });

            const response = await request(app)
                .delete(`/api/v1/invitations/${invitation.id}`)
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Invitation Business Logic Scenarios', () => {
        it('should handle expired invitations (Business Logic)', async () => {
            const { company, user } = await createCompleteTestUser(
                'hradmin_logic@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Logic Company',
                'HR Admin'
            );

            // Create expired invitation
            const invitation = await prisma.invitation.create({
                data: {
                    email: 'expired@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'expired-token-123',
                    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                    invitedBy: user.id,
                },
            });

            // Try to validate
            const response = await request(app)
                .get('/api/v1/invitations/validate')
                .query({ token: invitation.token });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toMatch(/Invitation has expired/i);

            // Verify status in DB updated to EXPIRED
            const updated = await prisma.invitation.findUnique({ where: { id: invitation.id } });
            expect(updated?.status).toBe('EXPIRED');
        });

        it('should prevent double acceptance of invitation', async () => {
            const { company, user } = await createCompleteTestUser(
                'hradmin_double@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Double Company',
                'HR Admin'
            );

            const invitation = await prisma.invitation.create({
                data: {
                    email: 'double@test.com',
                    role: Role.EMPLOYEE,
                    companyId: company.id,
                    token: 'double-token-123',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    invitedBy: user.id,
                    status: 'PENDING'
                },
            });

            // 1. Accept first time
            const acceptRes1 = await request(app)
                .post('/api/v1/invitations/accept')
                .send({
                    token: invitation.token,
                    name: 'New Employee',
                    password: 'Password123!',
                });

            expect(acceptRes1.status).toBe(201);
            expect(acceptRes1.body.success).toBe(true);

            // 2. Accept second time
            const acceptRes2 = await request(app)
                .post('/api/v1/invitations/accept')
                .send({
                    token: invitation.token,
                    name: 'New Employee Again',
                    password: 'Password123!',
                });

            expect(acceptRes2.status).toBe(400); // Should fail
            expect(acceptRes2.body.success).toBe(false);
            expect(acceptRes2.body.error).toMatch(/invitation is no longer valid|invalid invitation token/i);
        });
    });
});
