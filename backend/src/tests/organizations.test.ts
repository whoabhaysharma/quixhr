import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Organizations Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/org', () => {
        it('should create a new organization (Super Admin only)', async () => {
            const { token } = await createTestUser(Role.SUPER_ADMIN);

            const res = await request(app)
                .post('/api/v1/org')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Org',
                    timezone: 'UTC',
                    currency: 'USD',
                    dateFormat: 'YYYY-MM-DD'
                });

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('New Org');
        });

        it('should fail for non-super admin', async () => {
             const { token } = await createTestUser(Role.ORG_ADMIN);

             const res = await request(app)
                .post('/api/v1/org')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Org',
                });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/v1/org', () => {
        it('should list organizations for Super Admin', async () => {
            const { token } = await createTestUser(Role.SUPER_ADMIN);

            const res = await request(app)
                .get('/api/v1/org')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data.organizations)).toBe(true);
        });
    });

    describe('GET /api/v1/org/:organizationId', () => {
        it('should get organization details', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            // ORG_ADMIN can access their own org
            const res = await request(app)
                .get(`/api/v1/org/${organizationId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.id).toBe(organizationId);
        });

        it('should fail if accessing another organization', async () => {
            const { token } = await createTestUser(Role.ORG_ADMIN);
            const { organizationId: otherOrgId } = await createTestUser(Role.ORG_ADMIN); // Creates another org

            const res = await request(app)
                .get(`/api/v1/org/${otherOrgId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403); // Middleware usually restricts this
        });
    });

    describe('PATCH /api/v1/org/:organizationId', () => {
         it('should update organization details', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .patch(`/api/v1/org/${organizationId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Name'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated Name');
         });
    });

    describe('GET /api/v1/org/:organizationId/dashboard', () => {
        it('should get dashboard stats', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

             const res = await request(app)
                .get(`/api/v1/org/${organizationId}/dashboard`)
                .set('Authorization', `Bearer ${token}`);

             expect(res.status).toBe(200);
        });
    });
});
