import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser } from './helpers/auth.helper';
import { Role, LeaveType } from '@prisma/client';
import { prisma } from './setup';

describe('Leave Grades Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    const setupAdmin = async () => {
        const { user: adminUser, token: adminToken, organizationId } = await createTestUser(Role.ORG_ADMIN);
        return { adminUser, adminToken, organizationId: organizationId! };
    };

    describe('Leave Grades Management', () => {
        it('should allow admin to create a leave grade', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const res = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Full Time Staff'
                });

            expect(res.body.status).toBe('success');
            // Assuming sendResponse wraps result in data.data? 
            // Controller: sendResponse(res, 201, grade, ...)
            // Grade is the prisma object.
            // So res.body.data.data.name
            expect(res.body.data.name).toBe('Full Time Staff');
            expect(res.body.data.organizationId).toBe(organizationId);
        });

        it('should list leave grades for the organization', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            // Create one
            await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Grade A' });

            const res = await request(app)
                .get('/api/v1/leaves/grades')
                .set('Authorization', `Bearer ${adminToken}`);

            if (res.body.status !== 'success') {
                console.log('List Grades Failed:', JSON.stringify(res.body, null, 2));
            }
            expect(res.body.status).toBe('success');
            expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.data[0].name).toBe('Grade A');
        });

        it('should get a leave grade by ID', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Grade B' });

            const gradeId = createRes.body.data.id;

            const res = await request(app)
                .get(`/api/v1/leaves/grades/${gradeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.id).toBe(gradeId);
            expect(res.body.data.name).toBe('Grade B');
        });

        it('should update a leave grade', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Old Name' });

            const gradeId = createRes.body.data.id;

            const res = await request(app)
                .patch(`/api/v1/leaves/grades/${gradeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Name' });

            expect(res.body.status).toBe('success');
            expect(res.body.data.name).toBe('New Name');
        });

        it('should delete a leave grade', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'To Delete' });

            const gradeId = createRes.body.data.id;

            const res = await request(app)
                .delete(`/api/v1/leaves/grades/${gradeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(204);
            // If backend sends 204, typically there is NO body.
            // If sendResponse(res, 204, null, ...) is used:
            // res.status(204).json(...) works in Express but 204 implies no content.
            // If it returns body, status is likely 200.
            // Controller: sendResponse(res, 204, null, ...)
            // Let's check if 204 allows body. RFC says no. Express might strip it.
            // If stripped, body is empty.
            // If so, we expect status 204.
            // But if sendResponse sets status 204 and calls .json(), Express might downgrade to 200 or send empty.
            // Let's assume standard 204 NO CONTENT behavior first.
        });
    });

    describe('Leave Policies Management', () => {
        it('should add a policy to a leave grade', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const gradeRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Policy Grade' });

            const gradeId = gradeRes.body.data.id;

            const res = await request(app)
                .post(`/api/v1/leaves/grades/${gradeId}/policies`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    leaveType: LeaveType.ANNUAL,
                    totalDays: 20,
                    carryForward: true,
                    maxCarryAmount: 5
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.leaveType).toBe('ANNUAL');
            expect(res.body.data.totalDays).toBe(20);
            expect(res.body.data.leaveGradeId).toBe(gradeId);
        });

        it('should list policies for a grade', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const gradeRes = await request(app)
                .post(`/api/v1/org/${organizationId}/leave-grades`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Policy List Grade' });

            const gradeId = gradeRes.body.data.id;

            await request(app)
                .post(`/api/v1/leaves/grades/${gradeId}/policies`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    leaveType: LeaveType.SICK,
                    totalDays: 10
                });

            const res = await request(app)
                .get(`/api/v1/leaves/grades/${gradeId}/policies`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            // Service.findPolicies returns array directly or wrapped?
            // Controller: sendResponse(res, 200, policies, ...)
            // policies is likely an array.
            // So res.body.data.data is array of policies.
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0].leaveType).toBe('SICK');
        });
    });
});
