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

    const setupAdmin = async () => {
        const { user: adminUser, token: adminToken, organizationId } = await createTestUser(Role.ORG_ADMIN);
        return { adminUser, adminToken, organizationId: organizationId! };
    };

    describe('Invitation Lifecycle', () => {
        it('should allow admin to create an invitation', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const res = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'newhire@example.com',
                    role: Role.EMPLOYEE
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.email).toBe('newhire@example.com');
            expect(res.body.data.data.status).toBe('PENDING');
        });

        it('should list invitations for the organization', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            // Create one
            await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'listtest@example.com', role: Role.EMPLOYEE });

            const res = await request(app)
                .get('/api/v1/invitations')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.body.status).toBe('success');
            // Assuming res.body.data.invitations based on controller logic
            expect(res.body.data.data.invitations.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.data.invitations[0].email).toBe('listtest@example.com');
        });

        it('should verify an invitation token', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'verify@example.com', role: Role.EMPLOYEE });

            const invitationId = createRes.body.data.data.id;

            // Get token from DB
            const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
            expect(invitation).toBeDefined();

            const res = await request(app)
                .get(`/api/v1/invitations/verify/${invitation!.token}`);

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.email).toBe('verify@example.com');
        });

        it('should accept an invitation', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'accept@example.com', role: Role.EMPLOYEE });

            const invitationId = createRes.body.data.data.id;
            const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });

            const res = await request(app)
                .post('/api/v1/invitations/accept')
                .send({
                    token: invitation!.token,
                    firstName: 'John',
                    lastName: 'Doe',
                    password: 'Password123!'
                });

            expect(res.body.status).toBe('success');

            // Verify status changed to ACCEPTED in DB
            const updatedInvitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
            expect(updatedInvitation!.status).toBe('ACCEPTED');

            // Verify user created
            const user = await prisma.user.findUnique({ where: { email: 'accept@example.com' } });
            expect(user).toBeDefined();
            // expect(user!.employee).toBeDefined(); // Removed due to TS error (not included in query)

            // Check employee directly
            const employee = await prisma.employee.findFirst({ where: { userId: user!.id } });
            expect(employee).toBeDefined();
            expect(employee!.organizationId).toBe(organizationId);
        });

        it('should cancel an invitation', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'cancel@example.com', role: Role.EMPLOYEE });

            const invitationId = createRes.body.data.data.id;

            const res = await request(app)
                .patch(`/api/v1/invitations/${invitationId}/cancel`)
                .set('Authorization', `Bearer ${adminToken}`);

            if (res.body.status !== 'success') {
                console.log('CANCEL Invitation failed:', JSON.stringify(res.body, null, 2));
            }
            expect(res.body.status).toBe('success');
            expect(res.body.data.data.status).toBe('CANCELLED');
        });

        it('should delete an invitation', async () => {
            const { adminToken, organizationId } = await setupAdmin();

            const createRes = await request(app)
                .post(`/api/v1/org/${organizationId}/invitations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'delete@example.com', role: Role.EMPLOYEE });

            const invitationId = createRes.body.data.data.id;

            const res = await request(app)
                .delete(`/api/v1/invitations/${invitationId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            if (res.body.status !== 'success') {
                console.log('DELETE Invitation failed:', JSON.stringify(res.body, null, 2));
            }
            expect(res.body.status).toBe('success'); // or 204 no content status?
            // checking inv controller: sendResponse(res, 200, responseData) for delete. Ok. 
            // Usually delete is 204 but here it seems to return 200 with success: true.

            const deleted = await prisma.invitation.findUnique({ where: { id: invitationId } });
            expect(deleted).toBeNull();
        });
    });
});
