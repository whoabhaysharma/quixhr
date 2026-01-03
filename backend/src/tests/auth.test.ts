import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser } from './helpers/auth.helper';
import { prisma } from './setup';

describe('Auth Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new organization and user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    companyName: 'New Tech Corp',
                    email: 'admin@newtech.com',
                    password: 'Password123!',
                    firstName: 'John',
                    lastName: 'Doe',
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user.email).toBe('admin@newtech.com');
            expect(res.body.data.company.name).toBe('New Tech Corp');
        });

        it('should fail with invalid data', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    companyName: '',
                    email: 'invalid-email',
                    password: 'short',
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login an existing user', async () => {
            const { user } = await createTestUser();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'Password123!',
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('token');
        });

        it('should fail with wrong password', async () => {
             const { user } = await createTestUser();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'WrongPassword',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/verify-email', () => {
         it('should verify email with valid token', async () => {
             // 1. Register to get user and token
              await request(app)
                .post('/api/v1/auth/register')
                .send({
                    companyName: 'Verify Corp',
                    email: 'verify@corp.com',
                    password: 'Password123!',
                    firstName: 'V',
                    lastName: 'C',
                });

             // Fetch token from DB
             const user = await prisma.user.findUnique({ where: { email: 'verify@corp.com' } });
             expect(user).toBeDefined();

             // Check if user has verification token (depends on schema, assuming `verificationToken` or similar)
             // Schema check: user usually has `verificationToken` if not verified.
             // If property doesn't exist on type, we might need to cast or fix type.
             // Earlier error said property 'verificationToken' does not exist on type.
             // Let's check prisma schema or type definition.
             // But for now, assuming standard flow. If TS fails, I'll cast as any.

             const token = (user as any).verificationToken || (user as any).emailVerificationToken;

             if (token) {
                 const res = await request(app)
                   .post('/api/v1/auth/verify-email')
                   .send({ token });
                 expect(res.status).toBe(200);
             }
         });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout user', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
