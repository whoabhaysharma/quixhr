import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Admin Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/admin/dashboard', () => {
        it('should get platform dashboard for Super Admin', async () => {
            const { token } = await createTestUser(Role.SUPER_ADMIN);

            const res = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

         it('should fail for other roles', async () => {
            const { token } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .get('/api/v1/admin/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });
});
