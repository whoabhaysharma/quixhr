import request from 'supertest';
import app from '../../app';
import { cleanDatabase, prisma } from '../../tests/helpers/db.helper';
import {
    createCompleteTestUser,
    createTestCalendar,
    getAuthHeader,
} from '../../tests/helpers/auth.helper';
import { Role, LeaveType } from '@prisma/client';

describe('Leave Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('POST /api/v1/leaves', () => {
        it('should allow authenticated users to apply for leave', async () => {
            const { token, company, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            // Create calendar and assign to employee
            const calendar = await createTestCalendar(company.id, 'Test Calendar');
            await prisma.employee.update({
                where: { id: employee.id },
                data: { calendarId: calendar.id },
            });

            // Create leave balance
            await prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    type: LeaveType.ANNUAL,
                    allocated: 12,
                    used: 0,
                    year: new Date().getFullYear(),
                },
            });

            const response = await request(app)
                .post('/api/v1/leaves')
                .set(getAuthHeader(token))
                .send({
                    startDate: '2025-02-01',
                    endDate: '2025-02-03',
                    type: 'ANNUAL',
                    reason: 'Vacation',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('type', 'ANNUAL');
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .post('/api/v1/leaves')
                .send({
                    startDate: '2025-02-01',
                    endDate: '2025-02-03',
                    type: 'ANNUAL',
                    reason: 'Vacation',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/leaves/assign-balance', () => {
        it('should allow SUPER_ADMIN to assign leave balance', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Admin Company',
                'Employee',
                company.id
            );

            const response = await request(app)
                .post('/api/v1/leaves/assign-balance')
                .set(getAuthHeader(token))
                .send({
                    employeeId: employee.id,
                    type: 'ANNUAL',
                    allocated: 15,
                    year: new Date().getFullYear(),
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to assign leave balance', async () => {
            const { token, company, employee: hrEmployee } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee',
                company.id
            );

            const response = await request(app)
                .post('/api/v1/leaves/assign-balance')
                .set(getAuthHeader(token))
                .send({
                    employeeId: employee.id,
                    type: 'SICK',
                    allocated: 10,
                    year: new Date().getFullYear(),
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny MANAGER from assigning leave balance', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee',
                company.id
            );

            const response = await request(app)
                .post('/api/v1/leaves/assign-balance')
                .set(getAuthHeader(token))
                .send({
                    employeeId: employee.id,
                    type: 'ANNUAL',
                    allocated: 12,
                    year: new Date().getFullYear(),
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should deny EMPLOYEE from assigning leave balance', async () => {
            const { token, employee: emp1 } = await createCompleteTestUser(
                'employee1@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee 1'
            );

            const { employee: emp2 } = await createCompleteTestUser(
                'employee2@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee 2'
            );

            const response = await request(app)
                .post('/api/v1/leaves/assign-balance')
                .set(getAuthHeader(token))
                .send({
                    employeeId: emp2.id,
                    type: 'ANNUAL',
                    allocated: 12,
                    year: new Date().getFullYear(),
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/leaves/my-balances', () => {
        it('should allow authenticated users to get their balances', async () => {
            const { token, employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            await prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    type: LeaveType.ANNUAL,
                    allocated: 12,
                    used: 2,
                    year: new Date().getFullYear(),
                },
            });

            const response = await request(app)
                .get('/api/v1/leaves/my-balances')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/v1/leaves/my-leaves', () => {
        it('should allow authenticated users to get their leaves', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get('/api/v1/leaves/my-leaves')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/v1/leaves', () => {
        it('should allow SUPER_ADMIN to get all leaves', async () => {
            const { token } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const response = await request(app)
                .get('/api/v1/leaves')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to get all leaves', async () => {
            const { token } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const response = await request(app)
                .get('/api/v1/leaves')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow MANAGER to get all leaves', async () => {
            const { token } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const response = await request(app)
                .get('/api/v1/leaves')
                .set(getAuthHeader(token));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny EMPLOYEE from getting all leaves', async () => {
            const { token } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee'
            );

            const response = await request(app)
                .get('/api/v1/leaves')
                .set(getAuthHeader(token));

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/v1/leaves/:id/status', () => {
        it('should allow SUPER_ADMIN to update leave status', async () => {
            const { token, company } = await createCompleteTestUser(
                'superadmin@test.com',
                'Password123!',
                Role.SUPER_ADMIN,
                'Admin Company',
                'Super Admin'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Admin Company',
                'Employee',
                company.id
            );

            const leave = await prisma.leaveRequest.create({
                data: {
                    employeeId: employee.id,
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-03'),
                    totalDays: 3,
                    type: LeaveType.ANNUAL,
                    status: 'PENDING',
                },
            });

            const response = await request(app)
                .patch(`/api/v1/leaves/${leave.id}/status`)
                .set(getAuthHeader(token))
                .send({
                    status: 'APPROVED',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow HR_ADMIN to update leave status', async () => {
            const { token, company } = await createCompleteTestUser(
                'hradmin@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Test Company',
                'HR Admin'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee',
                company.id
            );

            const leave = await prisma.leaveRequest.create({
                data: {
                    employeeId: employee.id,
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-03'),
                    totalDays: 3,
                    type: LeaveType.ANNUAL,
                    status: 'PENDING',
                },
            });

            const response = await request(app)
                .patch(`/api/v1/leaves/${leave.id}/status`)
                .set(getAuthHeader(token))
                .send({
                    status: 'APPROVED',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow MANAGER to update leave status', async () => {
            const { token, company } = await createCompleteTestUser(
                'manager@test.com',
                'Password123!',
                Role.MANAGER,
                'Test Company',
                'Manager'
            );

            const { employee } = await createCompleteTestUser(
                'employee@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee',
                company.id
            );

            const leave = await prisma.leaveRequest.create({
                data: {
                    employeeId: employee.id,
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-03'),
                    totalDays: 3,
                    type: LeaveType.ANNUAL,
                    status: 'PENDING',
                },
            });

            const response = await request(app)
                .patch(`/api/v1/leaves/${leave.id}/status`)
                .set(getAuthHeader(token))
                .send({
                    status: 'APPROVED',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should deny EMPLOYEE from updating leave status', async () => {
            const { token, employee: emp1 } = await createCompleteTestUser(
                'employee1@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee 1'
            );

            const { employee: emp2 } = await createCompleteTestUser(
                'employee2@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Test Company',
                'Employee 2'
            );

            const leave = await prisma.leaveRequest.create({
                data: {
                    employeeId: emp2.id,
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-02-03'),
                    totalDays: 3,
                    type: LeaveType.ANNUAL,
                    status: 'PENDING',
                },
            });

            const response = await request(app)
                .patch(`/api/v1/leaves/${leave.id}/status`)
                .set(getAuthHeader(token))
                .send({
                    status: 'APPROVED',
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Company Leave Workflow Scenarios', () => {
        it('should handle full leave approval flow with balance deduction (Business Logic)', async () => {
            // 1. Setup HR and Employee in same company
            const { token: hrToken, company, employee: hrEmployee } = await createCompleteTestUser(
                'hr_workflow@test.com',
                'Password123!',
                Role.HR_ADMIN,
                'Workflow Co',
                'HR Admin'
            );

            const { token: empToken, employee } = await createCompleteTestUser(
                'emp_workflow@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Workflow Co',
                'Employee',
                company.id
            );

            // 2. Assign Balance (10 Days Annual)
            await prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    type: LeaveType.ANNUAL,
                    allocated: 10,
                    used: 0,
                    year: new Date().getFullYear(),
                },
            });

            // 3. Employee Applies for 3 Days (2025-03-01 to 2025-03-03)
            const applyRes = await request(app)
                .post('/api/v1/leaves')
                .set(getAuthHeader(empToken))
                .send({
                    startDate: '2025-03-01',
                    endDate: '2025-03-03',
                    type: 'ANNUAL',
                    reason: 'Business Trip',
                    duration: 'FULL',
                });

            expect(applyRes.status).toBe(201);
            const leaveId = applyRes.body.data.id;
            expect(applyRes.body.data.status).toBe('PENDING');

            // 4. Verify Balance remains unused (but pending counts? DB stores 'used')
            let balance = await prisma.leaveBalance.findFirst({
                where: { employeeId: employee.id, type: LeaveType.ANNUAL }
            });
            expect(balance?.used).toBe(0);

            // 5. HR Approves Leave
            const approveRes = await request(app)
                .patch(`/api/v1/leaves/${leaveId}/status`)
                .set(getAuthHeader(hrToken))
                .send({ status: 'APPROVED' });

            expect(approveRes.status).toBe(200);
            expect(approveRes.body.data.status).toBe('APPROVED');

            // 6. Verify Balance is updated (Used should be 3 now)
            balance = await prisma.leaveBalance.findFirst({
                where: { employeeId: employee.id, type: LeaveType.ANNUAL }
            });
            expect(balance?.used).toBe(3);
        });

        it('should prevent overlapping leave requests', async () => {
            const { token, employee } = await createCompleteTestUser(
                'overlap_emp@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Overlap Co',
                'Employee'
            );

            await prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    type: LeaveType.ANNUAL,
                    allocated: 20,
                    used: 0,
                    year: new Date().getFullYear(),
                },
            });

            // Apply for March 1-5
            await request(app)
                .post('/api/v1/leaves')
                .set(getAuthHeader(token))
                .send({
                    startDate: '2025-03-01',
                    endDate: '2025-03-05',
                    type: 'ANNUAL',
                    reason: 'First Leave',
                    duration: 'FULL',
                });

            // Apply for March 4-8 (Overlap)
            const response = await request(app)
                .post('/api/v1/leaves')
                .set(getAuthHeader(token))
                .send({
                    startDate: '2025-03-04',
                    endDate: '2025-03-08',
                    type: 'ANNUAL',
                    reason: 'Overlap Leave',
                    duration: 'FULL',
                });

            expect(response.status).toBe(400); // Should fail
            expect(response.body.success).toBe(false);
            expect(response.body.error).toMatch(/already have a leave request/i);
        });

        it('should prevent applying for more leaves than allocated', async () => {
            const { token, employee } = await createCompleteTestUser(
                'limit_emp@test.com',
                'Password123!',
                Role.EMPLOYEE,
                'Limit Co',
                'Employee'
            );

            await prisma.leaveBalance.create({
                data: {
                    employeeId: employee.id,
                    type: LeaveType.ANNUAL,
                    allocated: 5,
                    used: 0,
                    year: new Date().getFullYear(),
                },
            });

            // Apply for 6 days
            const response = await request(app)
                .post('/api/v1/leaves')
                .set(getAuthHeader(token))
                .send({
                    startDate: '2025-04-01',
                    endDate: '2025-04-06',
                    type: 'ANNUAL',
                    reason: 'Too Long',
                    duration: 'FULL',
                });

            expect(response.status).toBe(400); // Should fail
            expect(response.body.success).toBe(false);
            expect(response.body.error).toMatch(/Insufficient leave balance/i);
        });
    });
});
