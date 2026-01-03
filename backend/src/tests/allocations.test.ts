import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';
import { prisma } from './setup';

describe('Allocations Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/org/:organizationId/allocations', () => {
        it('should create an allocation', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            const { employee } = await createTestEmployee(organizationId);

            const res = await request(app)
                .post(`/api/v1/org/${organizationId}/allocations`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    employeeId: employee.id,
                    leaveType: 'ANNUAL',
                    daysAllocated: 10,
                    year: 2025
                });

            expect(res.status).toBe(201);
            expect(res.body.data.daysAllocated).toBe(10);
        });
    });

    describe('GET /api/v1/allocations', () => {
        it('should list allocations', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/allocations')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/v1/allocations/bulk', () => {
         it('should bulk allocate', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
             // Create multiple employees
             const { employee: emp1 } = await createTestEmployee(organizationId);
             const { employee: emp2 } = await createTestEmployee(organizationId);

             const res = await request(app)
                .post(`/api/v1/org/${organizationId}/allocations/bulk`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    employeeIds: [emp1.id, emp2.id],
                    leaveType: 'SICK',
                    days: 5,
                    year: 2025
                });

             expect(res.status).toBe(201);
             expect(res.body.data.count).toBe(2);
         });
    });
});
