import request from 'supertest';
import app from '../../app';
import { cleanDatabase } from '../../tests/helpers/db.helper';
import { createTestUser, generateToken, getAuthHeader } from '../../tests/helpers/auth.helper';
import { Role } from '@prisma/client';

describe('Auth Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user with company', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'admin@test.com',
                    password: 'Password123!',
                    companyName: 'Test Company',
                    name: 'Super Admin',
                    timezone: 'Asia/Kolkata',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            // Registration now requires verification, so no token returned immediately
            expect(response.body.data).not.toHaveProperty('token');
            expect(response.body.data).toHaveProperty('userId');
            expect(response.body.data).toHaveProperty('message');

        });

        it('should fail with duplicate email', async () => {
            await createTestUser('existing@test.com', 'Password123!', Role.EMPLOYEE);

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'existing@test.com',
                    password: 'Password123!',
                    companyName: 'Test Company',
                    timezone: 'Asia/Kolkata',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail with invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'Password123!',
                    companyName: 'Test Company',
                    timezone: 'Asia/Kolkata',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            await createTestUser('user@test.com', 'Password123!', Role.EMPLOYEE);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'user@test.com',
                    password: 'Password123!',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user).toHaveProperty('email', 'user@test.com');
        });

        it('should fail with invalid password', async () => {
            await createTestUser('user@test.com', 'Password123!', Role.EMPLOYEE);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'user@test.com',
                    password: 'WrongPassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'Password123!',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('should return current user with valid token', async () => {
            const user = await createTestUser('user@test.com', 'Password123!', Role.EMPLOYEE);
            const token = generateToken(user.id, user.email, user.role);

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('email', 'user@test.com');
        });

        it('should fail without token', async () => {
            const response = await request(app).get('/api/v1/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set({ Authorization: 'Bearer invalid-token' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('End-to-End Flow', () => {
        it('should complete full registration, verification, and login flow (Real Flow)', async () => {
            // Spy on the email queue to capture token
            // Note: Use path relative to this test file
            const notificationProducer = require('../notification/notification.producer');
            const emailSpy = jest.spyOn(notificationProducer, 'queueVerificationEmail');

            // 1. Register
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'realflow@test.com',
                    password: 'Password123!',
                    companyName: 'Real Flow Co',
                    name: 'Real User',
                    timezone: 'UTC',
                });

            expect(registerRes.status).toBe(201);
            expect(registerRes.body.success).toBe(true);

            // 2. Capture token from spy
            expect(emailSpy).toHaveBeenCalled();
            // Find the call for this specific email
            const call = emailSpy.mock.calls.find((args: any[]) => args[0] === 'realflow@test.com');
            expect(call).toBeDefined();
            const verificationToken = call![2]; // 3rd arg is token
            expect(verificationToken).toBeDefined();

            // 3. Verify Email
            const verifyRes = await request(app)
                .get(`/api/v1/auth/verify-email/${verificationToken}`);

            expect(verifyRes.status).toBe(200);
            expect(verifyRes.body.success).toBe(true);

            // 4. Login
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'realflow@test.com',
                    password: 'Password123!',
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
            expect(loginRes.body.data).toHaveProperty('token');
            expect(loginRes.body.data.user).toHaveProperty('email', 'realflow@test.com');

            emailSpy.mockRestore();
        });
    });
});
