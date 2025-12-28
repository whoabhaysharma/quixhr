import request from 'supertest';
import app from '../../app';
import { cleanDatabase, prisma } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Audit Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/audit', () => {
        it('should allow SUPER_ADMIN to get audit logs', async () => {
            const { token, user } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            // Create some audit logs
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'TEST_ACTION',
                    resource: 'TestResource',
                    resourceId: 'test-id',
                    ipAddress: '127.0.0.1',
                },
            });

            const response = await request(app)
                .get('/api/v1/audit')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should allow HR_ADMIN to get audit logs', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .get('/api/v1/audit')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from getting audit logs', async () => {
            const { token } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .get('/api/v1/audit')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from getting audit logs', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get('/api/v1/audit')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should support filtering by action', async () => {
            const { token, user } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            await prisma.auditLog.createMany({
                data: [
                    {
                        userId: user.id,
                        action: 'CREATE',
                        resource: 'User',
                        resourceId: 'user-1',
                        ipAddress: '127.0.0.1',
                    },
                    {
                        userId: user.id,
                        action: 'UPDATE',
                        resource: 'User',
                        resourceId: 'user-2',
                        ipAddress: '127.0.0.1',
                    },
                ],
            });

            const response = await request(app)
                .get('/api/v1/audit')
                .query({ action: 'CREATE' })
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should support filtering by resource', async () => {
            const { token, user } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            await prisma.auditLog.createMany({
                data: [
                    {
                        userId: user.id,
                        action: 'CREATE',
                        resource: 'Company',
                        resourceId: 'company-1',
                        ipAddress: '127.0.0.1',
                    },
                    {
                        userId: user.id,
                        action: 'CREATE',
                        resource: 'Employee',
                        resourceId: 'employee-1',
                        ipAddress: '127.0.0.1',
                    },
                ],
            });

            const response = await request(app)
                .get('/api/v1/audit')
                .query({ resource: 'Company' })
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should support pagination', async () => {
            const { token, user } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            // Create multiple audit logs
            const logs = Array.from({ length: 15 }, (_, i) => ({
                userId: user.id,
                action: 'TEST_ACTION',
                resource: 'TestResource',
                resourceId: `test-${i}`,
                ipAddress: '127.0.0.1',
            }));

            await prisma.auditLog.createMany({ data: logs });

            const response = await request(app)
                .get('/api/v1/audit')
                .query({ page: 1, limit: 10 })
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
