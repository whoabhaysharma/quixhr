import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Role } from '@prisma/client';
import {
    registerCompany,
    login,
    acceptInvitation,
    forgotPassword,
    resetPassword,
    updatePassword,
    getUserById
} from './auth.service';

describe('Auth Service Full Integration', () => {

    // CLEANUP: Reset DB before each test
    beforeEach(async () => {
        await prisma.employee.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.company.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // 1. REGISTER & LOGIN
    describe('Registration & Login', () => {
        it('should complete the full registration and login flow', async () => {
            const data = {
                email: 'owner@gyms24.com',
                password: 'password123',
                companyName: 'Elite Fitness',
                firstName: 'Admin',
                lastName: 'User'
            };

            const reg = await registerCompany(data);
            expect(reg.user.email).toBe(data.email);
            expect(reg.company.name).toBe(data.companyName);

            const log = await login({ email: data.email, password: data.password });
            expect(log.token).toBeDefined();
            expect(log.user.id).toBe(reg.user.id);
        });
    });

    // 2. INVITATIONS
    describe('acceptInvitation', () => {
        it('should onboard a new employee via invitation', async () => {
            const company = await prisma.company.create({ data: { name: 'Gyms24' } });
            const inv = await prisma.invitation.create({
                data: {
                    email: 'trainer@gyms24.com',
                    companyId: company.id,
                    role: Role.EMPLOYEE,
                    token: 'secret-invite-token',
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour
                }
            });

            const result = await acceptInvitation({
                token: inv.token,
                password: 'new-secure-pass',
                firstName: 'Trainer',
                lastName: 'One'
            });

            expect(result.user.email).toBe(inv.email);

            const updatedInv = await prisma.invitation.findUnique({ where: { token: inv.token } });
            expect(updatedInv?.status).toBe('ACCEPTED');
        });
    });

    // 3. PASSWORD RECOVERY (FORGOT/RESET)
    describe('Password Recovery', () => {
        it('should verify the reset token logic', async () => {
            const email = 'lost@gyms24.com';
            await prisma.user.create({
                data: { email, password: await bcrypt.hash('old-pass', 12), role: Role.EMPLOYEE }
            });

            // Trigger forgot password
            await forgotPassword(email);

            // Manual simulation of token for testing
            const rawToken = 'test-reset-token';
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            await prisma.user.update({
                where: { email },
                data: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: new Date(Date.now() + 600000)
                }
            });

            await resetPassword(rawToken, 'brand-new-pass');

            // Verify new password works
            const updatedUser = await prisma.user.findUnique({ where: { email } });
            const match = await bcrypt.compare('brand-new-pass', updatedUser!.password);
            expect(match).toBe(true);
            expect(updatedUser?.passwordResetToken).toBeNull();
        });
    });

    // 4. USER MANAGEMENT
    describe('User Profile & Security', () => {
        it('should fetch user details by ID', async () => {
            const user = await prisma.user.create({
                data: { email: 'profile@gyms24.com', password: 'hash', role: Role.MANAGER }
            });

            const fetched = await getUserById(user.id);
            expect(fetched.email).toBe(user.email);
        });

        it('should update password for authenticated user', async () => {
            const user = await prisma.user.create({
                data: { email: 'upd@gyms24.com', password: await bcrypt.hash('p1', 12), role: Role.EMPLOYEE }
            });

            await updatePassword(user.id, 'p1', 'new-p2');

            const updated = await prisma.user.findUnique({ where: { id: user.id } });
            expect(await bcrypt.compare('new-p2', updated!.password)).toBe(true);
        });
    });
});