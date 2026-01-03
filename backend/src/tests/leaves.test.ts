import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Leaves Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/leaves/grades', () => {
        it('should list leave grades', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/leaves/grades')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    describe('POST /api/v1/org/:organizationId/leave-grades', () => {
         it('should create a leave grade via nested route', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

             const res = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Grade A',
                    description: 'Senior Level'
                });

             expect(res.status).toBe(201);
         });
    });

    // Policies
    describe('POST /api/v1/leaves/grades/:gradeId/policies', () => {
        it('should create a leave policy', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
             // 1. Create Grade
             const gradeRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Grade B' });
             const gradeId = gradeRes.body.data.id;

             // 2. Create Policy
             const res = await request(app)
                .post(`/api/v1/leaves/grades/${gradeId}/policies`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    leaveType: 'ANNUAL',
                    entitlement: 20,
                    carryForwardLimit: 5
                });

            expect(res.status).toBe(201);
            expect(res.body.data.leaveType).toBe('ANNUAL');
        });
    });

    // Requests
    describe('POST /api/v1/me/leaves/requests', () => {
        it('should create a leave request for self', async () => {
            const { token, employee } = await createTestEmployee();

            const res = await request(app)
                .post('/api/v1/me/leaves/requests')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    type: 'ANNUAL',
                    reason: 'Vacation'
                });

            expect(res.status).toBe(201);
        });
    });

    describe('PATCH /api/v1/leaves/requests/:requestId/status', () => {
        it('should approve a leave request', async () => {
             // 1. Employee creates request
             const { token: empToken, employee, organizationId } = await createTestEmployee();
             const reqRes = await request(app)
                .post('/api/v1/me/leaves/requests')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    type: 'ANNUAL',
                    reason: 'Vacation'
                });
             const requestId = reqRes.body.data.id;

             // 2. Admin approves
             // Need admin token for same org. createTestEmployee creates a new org.
             // We need to create an admin in the SAME org.
             // Helper doesn't support adding user to existing org easily except createTestUser logic.
             // Let's assume we can use createTestUser with the orgId.
             const { token: adminToken } = await createTestUser(Role.ORG_ADMIN, organizationId);

             const res = await request(app)
                .patch(`/api/v1/leaves/requests/${requestId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'APPROVED'
                });

             expect(res.status).toBe(200);
             expect(res.body.data.status).toBe('APPROVED');
        });
    });
});
