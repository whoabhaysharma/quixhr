import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser } from './helpers/auth.helper';
import { Role } from '@prisma/client';
import { prisma } from './setup';

describe('Invitations Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/org/:organizationId/invitations', () => {
        it('should send an invitation', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);

            const res = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'invitee@example.com',
                    role: Role.EMPLOYEE
                });

            expect(res.status).toBe(201);
            expect(res.body.data.email).toBe('invitee@example.com');
        });
    });

    describe('GET /api/v1/invitations/verify/:token', () => {
         it('should verify valid token', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
             // 1. Create invitation
             await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'verify@example.com',
                    role: Role.EMPLOYEE
                });

             // Query DB for token
             const invite = await prisma.invitation.findFirst({ where: { email: 'verify@example.com' } });
             expect(invite).toBeDefined();

             const res = await request(app).get(`/api/v1/invitations/verify/${invite!.token}`);
             expect(res.status).toBe(200);
             expect(res.body.data.email).toBe('verify@example.com');
         });
    });

    describe('POST /api/v1/invitations/accept', () => {
        it('should accept invitation', async () => {
             const { token: adminToken, organizationId } = await createTestUser(Role.ORG_ADMIN);
             // 1. Create invitation
             await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'accept@example.com',
                    role: Role.EMPLOYEE
                });

             const invite = await prisma.invitation.findFirst({ where: { email: 'accept@example.com' } });
             expect(invite).toBeDefined();

             const res = await request(app)
                .post('/api/v1/invitations/accept')
                .send({
                    token: invite!.token,
                    firstName: 'New',
                    lastName: 'User',
                    password: 'Password123!'
                });

             expect(res.status).toBe(200);
             expect(res.body.data).toHaveProperty('token');
        });
    });

    describe('GET /api/v1/invitations', () => {
        it('should list invitations', async () => {
            const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
            await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'list@example.com', role: Role.EMPLOYEE });

            const res = await request(app)
                .get('/api/v1/invitations')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.invitations.length).toBeGreaterThan(0);
        });
    });

    describe('DELETE /api/v1/invitations/:invitationId', () => {
        it('should cancel/delete invitation', async () => {
             const { token, organizationId } = await createTestUser(Role.ORG_ADMIN);
             const inviteRes = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'delete@example.com', role: Role.EMPLOYEE });
             const invitationId = inviteRes.body.data.id;

             const res = await request(app)
                .delete(`/api/v1/invitations/${invitationId}`)
                .set('Authorization', `Bearer ${token}`);

             expect(res.status).toBe(204);
        });
    });
});
