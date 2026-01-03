import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Dashboard Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/dashboard/stats', () => {
        it('should get dashboard stats', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/dashboard/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
