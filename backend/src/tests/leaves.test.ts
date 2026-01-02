import request from 'supertest';
import app from '../app';
import { cleanDatabase } from './helpers/db.helper';
import { createTestUser, createTestEmployee } from './helpers/auth.helper';
import { Role, LeaveType } from '@prisma/client';
import { prisma } from './setup';

describe('Leaves Module', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    const setupEmployee = async () => {
        const { user: employeeUser, token: employeeToken, employee } = await createTestEmployee(undefined, Role.EMPLOYEE);
        return { employeeUser, employeeToken, companyId: employee.companyId, employee };
    };

    const setupAdmin = async (companyId: string) => {
        const { user: adminUser, token: adminToken } = await createTestUser(Role.ORG_ADMIN, companyId);
        return { adminUser, adminToken };
    };

    describe('Allocations', () => {
        it('should allow admin to allocate leaves', async () => {
            const { employee, companyId } = await setupEmployee();
            const { adminToken } = await setupAdmin(companyId!);

            const res = await request(app)
                .post(`/api/v1/employees/${employee.id}/allocations`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    year: 2024,
                    leaveType: LeaveType.ANNUAL,
                    allocated: 20
                });

            expect(res.body.status).toBe('success');
            expect(res.body.data.data.allocated).toBe(20);
        });
    });
});
