import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser } from './helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Auth Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new organization and super admin', async () => {
            const res = await request(app).post('/api/v1/auth/register').send({
                companyName: 'Acme Corp',
                email: 'admin@acme.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                industry: 'Tech',
                size: '1-10',
            });

            if (res.status !== 201) {
                console.log('Register failed:', JSON.stringify(res.body, null, 2));
            }
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.email).toBe('admin@acme.com');
            // Organization object is not returned in the new DTO structure
            // expect(res.body.data.company.name).toBe('Acme Corp');

            // Verify DB
            const user = await prisma.user.findUnique({ where: { email: 'admin@acme.com' } });
            expect(user).toBeDefined();
            // Role should be ORG_ADMIN as per updated controller logic for registration
            expect(user?.role).toBe(Role.ORG_ADMIN);
        });

        it('should fail if email already exists', async () => {
            // Register first user manually to control email
            await request(app).post('/api/v1/auth/register').send({
                companyName: 'Acme Corp',
                email: 'duplicate@test.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'John',
                lastName: 'Doe',
                industry: 'Tech',
                size: '1-10',
            });

            // Try again
            const res = await request(app).post('/api/v1/auth/register').send({
                companyName: 'Other Corp',
                email: 'duplicate@test.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Jane',
                lastName: 'Doe',
                industry: 'Tech',
                size: '1-10',
            });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            // We need to create a user first via helper, but helper assigns random email.
            // We'll trust the token logic or use the helper's return.
            const { user } = await createTestUser(Role.SUPER_ADMIN);

            // We know the password for test user is 'Password123!' from helper
            const res = await request(app).post('/api/v1/auth/login').send({
                email: user.email,
                password: 'Password123!'
            });

            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should fail with invalid password', async () => {
            const { user } = await createTestUser(Role.SUPER_ADMIN);

            const res = await request(app).post('/api/v1/auth/login').send({
                email: user.email,
                password: 'wrongpassword'
            });

            expect(res.status).toBe(401);
        });
    });
});
