import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Me Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/me', () => {
        it('should get current user profile', async () => {
            const { token, user } = await createTestUser();

            const res = await request(app)
                .get('/api/v1/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            // Response structure is { data: { user: { email: ... }, employee: ..., organization: ... } }
            expect(res.body.data.user.email).toBe(user.email);
        });
    });

    describe('GET /api/v1/me/dashboard', () => {
        it('should get my dashboard', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/v1/me/dashboard')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
