import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Users Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('GET /api/v1/users', () => {
        it('should list users for Super Admin', async () => {
            const { token } = await createTestUser(Role.SUPER_ADMIN);

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });

        it('should fail for normal user', async () => {
             const { token } = await createTestUser(Role.EMPLOYEE);

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });
});
